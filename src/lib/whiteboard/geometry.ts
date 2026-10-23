import type { El } from "./types";

export type Viewport = { x: number; y: number; s: number };
export const MIN_SCALE = 0.15;
export const MAX_SCALE = 4;

export const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/** Screen point (relative to the canvas) → world point. */
export const toWorld = (v: Viewport, sx: number, sy: number) => ({ x: (sx - v.x) / v.s, y: (sy - v.y) / v.s });
export const toScreen = (v: Viewport, wx: number, wy: number) => ({ x: wx * v.s + v.x, y: wy * v.s + v.y });

/** Zoom by `factor` keeping the world point under the screen point (sx, sy) where it is. */
export function zoomAt(v: Viewport, sx: number, sy: number, factor: number): Viewport {
  const s = clampScale(v.s * factor);
  const k = s / v.s;
  return { s, x: sx - (sx - v.x) * k, y: sy - (sy - v.y) * k };
}

/**
 * Pinch: given where the two fingers started and where they are now, the viewport that keeps the drawing under the fingers
 * (so it follows both the spreading and the movement of the pair).
 */
export function pinch(start: Viewport, a0: { x: number; y: number }, b0: { x: number; y: number }, a1: { x: number; y: number }, b1: { x: number; y: number }): Viewport {
  const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1;
  const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y) || 1;
  const s = clampScale(start.s * (d1 / d0));
  const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
  const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
  const world = toWorld(start, m0.x, m0.y);
  return { s, x: m1.x - world.x * s, y: m1.y - world.y * s };
}

/** The viewport that fits a world rectangle inside a screen box with padding. */
export function fitRect(rect: { x: number; y: number; w: number; h: number }, width: number, height: number, pad = 24): Viewport {
  const s = clampScale(Math.min((width - pad * 2) / rect.w, (height - pad * 2) / rect.h));
  return { s, x: (width - rect.w * s) / 2 - rect.x * s, y: (height - rect.h * s) / 2 - rect.y * s };
}

/* ── Hit testing, in world units ─────────────────────────────────────────────────────────── */

const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

type Measurable = { x: number; y: number; s: string; size: number; bold?: boolean };
let measureText: ((el: Measurable) => { w: number; h: number }) | null = null;
/** The renderer registers a real text measurer (canvas) so hit testing and selection boxes match what is drawn. */
export function setTextMeasure(fn: (el: Measurable) => { w: number; h: number }) {
  measureText = fn;
}

/** Size of a text element in world units. */
export function textBox(el: Measurable) {
  if (measureText) {
    const m = measureText(el);
    return { x: el.x, y: el.y, w: m.w, h: m.h };
  }
  const lines = (el.s || " ").split("\n");
  const longest = Math.max(...lines.map((line) => line.length), 1);
  return { x: el.x, y: el.y, w: longest * el.size * 0.56 + 8, h: lines.length * el.size * 1.28 };
}

export function bounds(el: El): { x: number; y: number; w: number; h: number } {
  switch (el.t) {
    case "stroke": {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < el.pts.length; i += 2) {
        minX = Math.min(minX, el.pts[i]);
        maxX = Math.max(maxX, el.pts[i]);
        minY = Math.min(minY, el.pts[i + 1]);
        maxY = Math.max(maxY, el.pts[i + 1]);
      }
      if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
      return { x: minX - el.w, y: minY - el.w, w: maxX - minX + el.w * 2, h: maxY - minY + el.w * 2 };
    }
    case "shape":
      return { x: Math.min(el.x1, el.x2) - el.w, y: Math.min(el.y1, el.y2) - el.w, w: Math.abs(el.x2 - el.x1) + el.w * 2, h: Math.abs(el.y2 - el.y1) + el.w * 2 };
    case "text":
      return textBox(el);
    case "note":
      return { x: el.x, y: el.y, w: el.w, h: el.h };
  }
}

/** Is world point (px, py) on or inside `el`, give or take `slop` world units? */
export function hits(el: El, px: number, py: number, slop: number): boolean {
  switch (el.t) {
    case "stroke": {
      const reach = el.w / 2 + slop;
      if (el.pts.length === 2) return Math.hypot(px - el.pts[0], py - el.pts[1]) <= reach;
      for (let i = 0; i + 3 < el.pts.length; i += 2) {
        if (distToSegment(px, py, el.pts[i], el.pts[i + 1], el.pts[i + 2], el.pts[i + 3]) <= reach) return true;
      }
      return false;
    }
    case "shape": {
      const reach = el.w / 2 + slop;
      if (el.k === "line" || el.k === "arrow") return distToSegment(px, py, el.x1, el.y1, el.x2, el.y2) <= reach;
      const x1 = Math.min(el.x1, el.x2);
      const x2 = Math.max(el.x1, el.x2);
      const y1 = Math.min(el.y1, el.y2);
      const y2 = Math.max(el.y1, el.y2);
      if (el.k === "rect") {
        const inside = px >= x1 - reach && px <= x2 + reach && py >= y1 - reach && py <= y2 + reach;
        const deep = px > x1 + reach && px < x2 - reach && py > y1 + reach && py < y2 - reach;
        return inside && !deep;
      }
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const rx = Math.max((x2 - x1) / 2, 1);
      const ry = Math.max((y2 - y1) / 2, 1);
      const d = Math.hypot((px - cx) / rx, (py - cy) / ry);
      return Math.abs(d - 1) * Math.min(rx, ry) <= reach;
    }
    case "text":
    case "note": {
      const b = bounds(el);
      return px >= b.x - slop && px <= b.x + b.w + slop && py >= b.y - slop && py <= b.y + b.h + slop;
    }
  }
}

/** Moves an element by (dx, dy). Returns a new element. */
export function moved(el: El, dx: number, dy: number): El {
  switch (el.t) {
    case "stroke":
      return { ...el, pts: el.pts.map((value, index) => value + (index % 2 === 0 ? dx : dy)) };
    case "shape":
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
    case "text":
    case "note":
      return { ...el, x: el.x + dx, y: el.y + dy };
  }
}

/** Rectangle covering the slide and every element (with a margin), for export. */
export function exportBounds(els: El[], slide: { w: number; h: number }) {
  let minX = 0;
  let minY = 0;
  let maxX = slide.w;
  let maxY = slide.h;
  for (const el of els) {
    const b = bounds(el);
    if (b.w === 0 && b.h === 0) continue;
    minX = Math.min(minX, b.x - 32);
    minY = Math.min(minY, b.y - 32);
    maxX = Math.max(maxX, b.x + b.w + 32);
    maxY = Math.max(maxY, b.y + b.h + 32);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
