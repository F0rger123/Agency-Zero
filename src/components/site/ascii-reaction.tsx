"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCanvasLoop } from "./use-canvas-loop";

/**
 * ASCII reaction-diffusion field (hero background).
 *
 * A live Gray–Scott reaction–diffusion simulation rendered as monochrome ASCII
 * on a <canvas>. The pointer injects "reagent", which nucleates new fronts that
 * crawl outward; a slow ambient seed keeps the field alive when untouched.
 * Original implementation (the 21st.dev reference needs an API key and has no
 * stated licence): ~150 lines, no dependencies.
 *
 * Performance contract: runs only while on screen and the tab is visible,
 * capped at 30 fps and ≤ ~14k cells; mobile uses coarser cells. Reduced motion
 * renders one settled frame. Decorative: aria-hidden.
 */

const DU = 0.2097;
const DV = 0.105;
const FEED = 0.0545;
const KILL = 0.062;
/** Only the reaction FRONT is drawn (a band of v), which reads as fine contour lines. */
const GLYPHS = [".", ":", "-", "=", "+"];
const LEVELS = GLYPHS.length;

type Field = {
  cols: number;
  rows: number;
  cw: number;
  ch: number;
  u: Float32Array;
  v: Float32Array;
  u2: Float32Array;
  v2: Float32Array;
};

/** A blob must be at least ~7×5 cells to survive at these feed/kill rates. */
function seedBlob(f: Field, cx: number, cy: number, rx = 3, ry = 2) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      const gx = cx + x;
      const gy = cy + y;
      if (gx < 0 || gy < 0 || gx >= f.cols || gy >= f.rows) continue;
      const i = gy * f.cols + gx;
      f.u[i] = 0.5;
      f.v[i] = 0.25;
    }
  }
}

function step(f: Field) {
  const { cols: W, rows: H } = f;
  const { u, v, u2, v2 } = f;
  for (let y = 0; y < H; y++) {
    const up = (y === 0 ? H - 1 : y - 1) * W;
    const dn = (y === H - 1 ? 0 : y + 1) * W;
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const l = x === 0 ? W - 1 : x - 1;
      const r = x === W - 1 ? 0 : x + 1;
      const i = row + x;
      const uu = u[i];
      const vv = v[i];
      const lapU = u[up + x] + u[dn + x] + u[row + l] + u[row + r] - 4 * uu;
      const lapV = v[up + x] + v[dn + x] + v[row + l] + v[row + r] - 4 * vv;
      const uvv = uu * vv * vv;
      const nu = uu + DU * lapU - uvv + FEED * (1 - uu);
      const nv = vv + DV * lapV + uvv - (FEED + KILL) * vv;
      u2[i] = nu < 0 ? 0 : nu > 1 ? 1 : nu;
      v2[i] = nv < 0 ? 0 : nv > 1 ? 1 : nv;
    }
  }
  f.u = u2;
  f.v = v2;
  f.u2 = u;
  f.v2 = v;
}

export function AsciiReaction({ className = "" }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<Field | null>(null);
  const dprRef = useRef(1);
  const lastSeedRef = useRef(0);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const f = fieldRef.current;
    if (!canvas || !f) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = dprRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${Math.round(f.ch * 0.92 * dpr)}px ui-monospace, "Geist Mono", Menlo, monospace`;
    ctx.textBaseline = "top";
    const buckets: number[][] = Array.from({ length: LEVELS }, () => []);
    for (let y = 0; y < f.rows; y++) {
      for (let x = 0; x < f.cols; x++) {
        const i = y * f.cols + x;
        // Triangle band centred on v≈0.17: brightest on the front itself.
        const t = 1 - Math.abs(f.v[i] - 0.17) / 0.12;
        if (t <= 0.12) continue;
        buckets[Math.min(LEVELS - 1, Math.floor(t * LEVELS))].push(i);
      }
    }
    for (let level = 0; level < LEVELS; level++) {
      ctx.fillStyle = `rgba(244,244,242,${0.1 + level * 0.09})`;
      const ch = GLYPHS[level];
      for (const i of buckets[level]) {
        const x = i % f.cols;
        const y = (i / f.cols) | 0;
        ctx.fillText(ch, x * f.cw * dpr, y * f.ch * dpr);
      }
    }
  }, []);

  const build = useCallback(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const { width, height } = host.getBoundingClientRect();
    if (width < 10 || height < 10) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    let cw = width < 700 ? 11 : 9;
    let ch = Math.round(cw * 1.85);
    while (Math.ceil(width / cw) * Math.ceil(height / ch) > 14000) {
      cw += 1;
      ch = Math.round(cw * 1.85);
    }
    const cols = Math.ceil(width / cw);
    const rows = Math.ceil(height / ch);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const size = cols * rows;
    const f: Field = {
      cols,
      rows,
      cw,
      ch,
      u: new Float32Array(size).fill(1),
      v: new Float32Array(size),
      u2: new Float32Array(size),
      v2: new Float32Array(size),
    };
    // Deterministic-ish seeding spread across the field.
    const blobs = Math.max(6, Math.round(size / 1300));
    let s = 12345;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let b = 0; b < blobs; b++) seedBlob(f, Math.floor(rnd() * cols), Math.floor(rnd() * rows));
    for (let n = 0; n < 320; n++) step(f);
    fieldRef.current = f;
    draw();
  }, [draw]);

  useEffect(() => {
    build();
    const host = hostRef.current;
    if (!host) return;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(build, 180);
    });
    ro.observe(host);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onMove = (event: PointerEvent) => {
      const f = fieldRef.current;
      if (!f || reduced) return;
      const rect = host.getBoundingClientRect();
      const gx = Math.floor(((event.clientX - rect.left) / rect.width) * f.cols);
      const gy = Math.floor(((event.clientY - rect.top) / rect.height) * f.rows);
      if (gx < 0 || gy < 0 || gx >= f.cols || gy >= f.rows) return;
      // Only re-inject once the pointer has travelled a few cells, so a slow
      // drag draws a trail of fronts instead of saturating one spot.
      const last = lastPointerRef.current;
      if (last && Math.hypot(gx - last.x, gy - last.y) < 5) return;
      lastPointerRef.current = { x: gx, y: gy };
      seedBlob(f, gx, gy);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [build]);

  useCanvasLoop(
    hostRef,
    (_dt, now) => {
      const f = fieldRef.current;
      if (!f) return;
      if (now - lastSeedRef.current > 3400) {
        lastSeedRef.current = now;
        seedBlob(f, Math.floor(Math.random() * f.cols), Math.floor(Math.random() * f.rows));
      }
      step(f);
      step(f);
      step(f);
      draw();
    },
    { fps: 30, onStatic: draw }
  );

  return (
    <div ref={hostRef} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
