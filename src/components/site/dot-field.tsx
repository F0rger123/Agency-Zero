"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasLoop } from "./use-canvas-loop";

/**
 * Reactive dot lattice — a calm, tactile background. Dots swell and brighten
 * near the pointer (which is smoothed, so the response trails like liquid),
 * with a very slow idle wave so the surface is never dead. Original code;
 * ≤ ~2.5k dots, 30 fps, paused off-screen/hidden, one static frame under
 * reduced motion.
 */
export function DotField({ className = "", spacing = 30 }: { className?: string; spacing?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const pointer = useRef({ x: -9999, y: -9999, sx: -9999, sy: -9999 });

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const { w, h, dpr } = sizeRef.current;
      const p = pointer.current;
      p.sx += (p.x - p.sx) * 0.12;
      p.sy += (p.y - p.sy) * 0.12;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const radius = 150;
      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = spacing / 2; x < w; x += spacing) {
          const dx = x - p.sx;
          const dy = y - p.sy;
          const dist = Math.hypot(dx, dy);
          const influence = dist < radius ? 1 - dist / radius : 0;
          const idle = 0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.016 + time * 0.0006);
          const r = 0.9 + idle * 0.5 + influence * influence * 2.6;
          const push = influence * influence * 9;
          const ox = dist > 0 ? (dx / dist) * push : 0;
          const oy = dist > 0 ? (dy / dist) * push : 0;
          ctx.fillStyle = `rgba(244,244,242,${0.1 + idle * 0.06 + influence * 0.7})`;
          ctx.beginPath();
          ctx.arc((x + ox) * dpr, (y + oy) * dpr, r * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [spacing]
  );

  const resize = useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const { width, height } = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = { w: width, h: height, dpr };
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    draw(0);
  }, [draw]);

  useEffect(() => {
    resize();
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onMove = (event: PointerEvent) => {
      if (reduced) return;
      const rect = host.getBoundingClientRect();
      pointer.current.x = event.clientX - rect.left;
      pointer.current.y = event.clientY - rect.top;
    };
    const parent = host.parentElement ?? host;
    parent.addEventListener("pointermove", onMove, { passive: true });
    parent.addEventListener("pointerleave", () => {
      pointer.current.x = -9999;
      pointer.current.y = -9999;
    });
    return () => {
      ro.disconnect();
      parent.removeEventListener("pointermove", onMove);
    };
  }, [resize]);

  useCanvasLoop(hostRef, (_dt, now) => draw(now), { fps: 30, onStatic: () => draw(0) });

  return (
    <div ref={hostRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
