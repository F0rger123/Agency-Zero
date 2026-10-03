"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasLoop } from "./use-canvas-loop";

/**
 * Ambient particle drift for the closing section. Deliberately sparse (≈ 1 per
 * 18k px²), slow, with gentle pointer repulsion — atmosphere, not a tech demo.
 * Paused off-screen; one static frame under reduced motion.
 */
type P = { x: number; y: number; vx: number; vy: number; r: number; a: number };

/** Physics step, kept outside the component body (mutates the particle objects in place). */
function stepParticles(list: P[], w: number, h: number, pointer: { x: number; y: number }) {
  for (const p of list) {
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const d = Math.hypot(dx, dy);
    if (d < 120 && d > 0) {
      p.vx += (dx / d) * 0.02;
      p.vy += (dy / d) * 0.02;
    }
    p.vx *= 0.985;
    p.vy = p.vy * 0.985 - 0.0008;
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -4) p.y = h + 4;
    if (p.x < -4) p.x = w + 4;
    if (p.x > w + 4) p.x = -4;
  }
}

export function Particles({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useRef<{ w: number; h: number; dpr: number; list: P[] }>({ w: 0, h: 0, dpr: 1, list: [] });
  const pointer = useRef({ x: -9999, y: -9999 });

  const build = useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const { width: w, height: h } = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const count = Math.min(90, Math.max(18, Math.round((w * h) / 18000)));
    world.current = {
      w,
      h,
      dpr,
      list: Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.14,
        r: 0.6 + Math.random() * 1.3,
        a: 0.12 + Math.random() * 0.4,
      })),
    };
  }, []);

  const draw = useCallback((advance: boolean) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { w, h, dpr, list } = world.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (advance) stepParticles(list, w, h, pointer.current);
    for (const p of list) {
      ctx.fillStyle = `rgba(244,244,242,${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x * dpr, p.y * dpr, p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    build();
    draw(false);
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      build();
      draw(false);
    });
    ro.observe(host);
    const parent = host.parentElement ?? host;
    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    parent.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      ro.disconnect();
      parent.removeEventListener("pointermove", onMove);
    };
  }, [build, draw]);

  useCanvasLoop(hostRef, () => draw(true), { fps: 30, onStatic: () => draw(false) });

  return (
    <div ref={hostRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
