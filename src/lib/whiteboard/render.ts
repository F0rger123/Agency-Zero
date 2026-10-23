import { exportBounds, textBox, type Viewport } from "./geometry";
import { ordered } from "./ops";
import { SLIDE, type El, type Frame, type NoteEl, type ShapeEl, type StrokeEl, type TextEl } from "./types";

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const BACKDROP = "#f4f4f5";

function drawStroke(ctx: CanvasRenderingContext2D, el: StrokeEl) {
  const { pts } = el;
  const n = pts.length / 2;
  ctx.strokeStyle = el.c;
  ctx.fillStyle = el.c;
  ctx.lineWidth = el.w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (n === 0) return;
  if (n === 1) {
    ctx.beginPath();
    ctx.arc(pts[0], pts[1], el.w / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  if (n === 2) {
    ctx.lineTo(pts[2], pts[3]);
  } else {
    // Smooth curve through the midpoints, which hides the jitter of raw pointer samples.
    for (let i = 1; i < n - 1; i += 1) {
      const mx = (pts[i * 2] + pts[i * 2 + 2]) / 2;
      const my = (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2;
      ctx.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], mx, my);
    }
    ctx.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
  }
  ctx.stroke();
}

function drawShape(ctx: CanvasRenderingContext2D, el: ShapeEl) {
  ctx.strokeStyle = el.c;
  ctx.fillStyle = el.c;
  ctx.lineWidth = el.w;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const x = Math.min(el.x1, el.x2);
  const y = Math.min(el.y1, el.y2);
  const w = Math.abs(el.x2 - el.x1);
  const h = Math.abs(el.y2 - el.y1);
  ctx.beginPath();
  if (el.k === "rect") {
    ctx.roundRect(x, y, w, h, Math.min(10, w / 4, h / 4));
    ctx.stroke();
  } else if (el.k === "ellipse") {
    ctx.ellipse(x + w / 2, y + h / 2, Math.max(w / 2, 0.5), Math.max(h / 2, 0.5), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
    if (el.k === "arrow") {
      const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
      const head = Math.max(16, el.w * 4);
      ctx.beginPath();
      ctx.moveTo(el.x2 - head * Math.cos(angle - 0.45), el.y2 - head * Math.sin(angle - 0.45));
      ctx.lineTo(el.x2, el.y2);
      ctx.lineTo(el.x2 - head * Math.cos(angle + 0.45), el.y2 - head * Math.sin(angle + 0.45));
      ctx.stroke();
    }
  }
}

function drawText(ctx: CanvasRenderingContext2D, el: TextEl) {
  ctx.fillStyle = el.c;
  ctx.font = `${el.bold ? 700 : 500} ${el.size}px ${FONT}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  el.s.split("\n").forEach((line, index) => ctx.fillText(line, el.x, el.y + index * el.size * 1.28));
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/(\s+)/)) {
      const test = line + word;
      if (ctx.measureText(test).width > maxWidth && line.trim()) {
        lines.push(line.trimEnd());
        line = word.trimStart();
      } else {
        line = test;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

export const NOTE_FONT = 24;

function drawNote(ctx: CanvasRenderingContext2D, el: NoteEl, shadow: boolean) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = "rgba(17, 24, 39, 0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
  }
  ctx.fillStyle = el.c;
  ctx.beginPath();
  ctx.roundRect(el.x, el.y, el.w, el.h, 14);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(el.x, el.y, el.w, el.h, 14);
  ctx.clip();
  ctx.fillStyle = "#1f2937";
  ctx.font = `500 ${NOTE_FONT}px ${FONT}`;
  ctx.textBaseline = "top";
  wrapLines(ctx, el.s, el.w - 36).forEach((line, index) => ctx.fillText(line, el.x + 18, el.y + 16 + index * NOTE_FONT * 1.3));
  ctx.restore();
}

export function drawElement(ctx: CanvasRenderingContext2D, el: El, shadows = true) {
  switch (el.t) {
    case "stroke":
      return drawStroke(ctx, el);
    case "shape":
      return drawShape(ctx, el);
    case "text":
      return drawText(ctx, el);
    case "note":
      return drawNote(ctx, el, shadows);
  }
}

export function drawSelection(ctx: CanvasRenderingContext2D, el: El, scale: number) {
  const b = el.t === "text" ? textBox(el) : el.t === "note" ? { x: el.x, y: el.y, w: el.w, h: el.h } : null;
  let box = b;
  if (!box) {
    if (el.t === "stroke") {
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
      box = { x: minX - el.w, y: minY - el.w, w: maxX - minX + el.w * 2, h: maxY - minY + el.w * 2 };
    } else if (el.t === "shape") {
      box = { x: Math.min(el.x1, el.x2) - el.w, y: Math.min(el.y1, el.y2) - el.w, w: Math.abs(el.x2 - el.x1) + el.w * 2, h: Math.abs(el.y2 - el.y1) + el.w * 2 };
    }
  }
  if (!box) return;
  ctx.save();
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1.5 / scale;
  ctx.setLineDash([6 / scale, 5 / scale]);
  ctx.strokeRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
  ctx.restore();
}

/** The white page with a soft shadow, on the grey backdrop. */
export function drawPage(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.shadowColor = "rgba(17, 24, 39, 0.10)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(0, 0, SLIDE.w, SLIDE.h, 20);
  ctx.fill();
  ctx.restore();
}

/** Faint dots on the backdrop so panning and zooming has something to move against. */
export function drawGrid(ctx: CanvasRenderingContext2D, view: Viewport, width: number, height: number) {
  if (view.s < 0.35) return;
  const spacing = 40;
  const x0 = Math.floor(-view.x / view.s / spacing) * spacing;
  const y0 = Math.floor(-view.y / view.s / spacing) * spacing;
  const x1 = (width - view.x) / view.s;
  const y1 = (height - view.y) / view.s;
  ctx.fillStyle = "rgba(17, 24, 39, 0.10)";
  const r = 1.4 / Math.sqrt(view.s);
  for (let x = x0; x <= x1; x += spacing) {
    for (let y = y0; y <= y1; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame, selectedId: string | null, scale: number) {
  for (const el of ordered(frame)) drawElement(ctx, el);
  const selected = selectedId ? frame.els[selectedId] : null;
  if (selected) drawSelection(ctx, selected, scale);
}

/** One frame as a finished picture (white background, page area plus anything drawn outside it). */
export function renderFrameCanvas(frame: Frame, scale = 2): HTMLCanvasElement {
  const els = ordered(frame);
  const box = exportBounds(els, SLIDE);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(box.w * scale);
  canvas.height = Math.round(box.h * scale);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, -box.x * scale, -box.y * scale);
  for (const el of els) drawElement(ctx, el, false);
  return canvas;
}
