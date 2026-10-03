"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasLoop } from "./use-canvas-loop";

/**
 * Gateway flow — problem → solution as motion.
 *
 * Thin particle streams enter from the left along tangled bezier paths,
 * converge on a single gateway at the centre, and leave on the right as
 * evenly spaced, parallel lines. Deliberately SLOW (a full traversal takes
 * ~40 s) so it reads as cinematic rather than busy. Original canvas
 * implementation of the idea (the reference uses WebGL/three.js; this adds no
 * dependency). Paused off-screen; static frame under reduced motion.
 */
type Particle = { path: number; u: number; speed: number; size: number };
type Path = { a: [number, number][]; b: [number, number][] };

const PATHS = 9;
const PARTICLES = 90;

/** Advance every particle along its path (plain function: keeps mutation out of the component body). */
function advance(particles: Particle[], dt: number) {
  for (const p of particles) {
    p.u += (p.speed * dt) / 1000;
    if (p.u >= 2) p.u -= 2;
  }
}

function bez(p: [number, number][], t: number): [number, number] {
  const mt = 1 - t;
  const x = mt ** 3 * p[0][0] + 3 * mt * mt * t * p[1][0] + 3 * mt * t * t * p[2][0] + t ** 3 * p[3][0];
  const y = mt ** 3 * p[0][1] + 3 * mt * mt * t * p[1][1] + 3 * mt * t * t * p[2][1] + t ** 3 * p[3][1];
  return [x, y];
}

export function GatewayFlow({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ w: number; h: number; dpr: number; paths: Path[]; particles: Particle[] }>({
    w: 0,
    h: 0,
    dpr: 1,
    paths: [],
    particles: [],
  });

  const build = useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const { width: w, height: h } = host.getBoundingClientRect();
    if (w < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const cx = w / 2;
    const cy = h / 2;
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const paths: Path[] = [];
    for (let i = 0; i < PATHS; i++) {
      const slot = i / (PATHS - 1) - 0.5; // -0.5 … 0.5
      const startY = h * (0.08 + rnd() * 0.84);
      const a: [number, number][] = [
        [0, startY],
        [w * (0.12 + rnd() * 0.18), h * (0.05 + rnd() * 0.9)],
        [w * (0.3 + rnd() * 0.12), cy + (rnd() - 0.5) * h * 0.6],
        [cx, cy],
      ];
      const endY = cy + slot * h * 0.62;
      const b: [number, number][] = [
        [cx, cy],
        [cx + w * 0.12, cy],
        [w * 0.72, endY],
        [w, endY],
      ];
      paths.push({ a, b });
    }
    const particles: Particle[] = Array.from({ length: PARTICLES }, () => ({
      path: Math.floor(rnd() * PATHS),
      u: rnd() * 2,
      speed: 0.022 + rnd() * 0.012,
      size: 0.8 + rnd() * 0.9,
    }));
    state.current = { w, h, dpr, paths, particles };
  }, []);

  const draw = useCallback((dt: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h, dpr, paths, particles } = state.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = dpr;

    // faint guide paths
    ctx.strokeStyle = "rgba(244,244,242,0.1)";
    for (const path of paths) {
      ctx.beginPath();
      for (const seg of [path.a, path.b]) {
        for (let t = 0; t <= 1.0001; t += 0.04) {
          const [x, y] = bez(seg, t);
          if (t === 0 && seg === path.a) ctx.moveTo(x * dpr, y * dpr);
          else ctx.lineTo(x * dpr, y * dpr);
        }
      }
      ctx.stroke();
    }

    // gateway: a hairline with a soft glow
    const cx = (w / 2) * dpr;
    const grad = ctx.createLinearGradient(0, 0, 0, h * dpr);
    grad.addColorStop(0, "rgba(244,244,242,0)");
    grad.addColorStop(0.5, "rgba(244,244,242,0.55)");
    grad.addColorStop(1, "rgba(244,244,242,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(cx - dpr / 2, 0, dpr, h * dpr);

    // particles
    advance(particles, dt);
    for (const p of particles) {
      const path = paths[p.path];
      const seg = p.u < 1 ? path.a : path.b;
      const t = p.u < 1 ? p.u : p.u - 1;
      const [x, y] = bez(seg, t);
      const [tx, ty] = bez(seg, Math.max(0, t - 0.018));
      const near = Math.exp(-(((x - w / 2) / (w * 0.14)) ** 2));
      ctx.strokeStyle = `rgba(244,244,242,${0.3 + near * 0.7})`;
      ctx.lineWidth = p.size * dpr;
      ctx.beginPath();
      ctx.moveTo(tx * dpr, ty * dpr);
      ctx.lineTo(x * dpr, y * dpr);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    build();
    draw(0);
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      build();
      draw(0);
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, [build, draw]);

  useCanvasLoop(hostRef, (dt) => draw(Math.min(dt, 80)), { fps: 30, onStatic: () => draw(0) });

  return (
    <div ref={hostRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
