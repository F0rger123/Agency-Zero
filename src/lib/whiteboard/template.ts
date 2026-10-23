import { newId } from "./ids";
import { SLIDE, type BoardData, type El, type Frame } from "./types";

const GRAY = "#6b7280";
const INK = "#111827";

export const FRAME_TITLES = ["Their problem", "What they need", "How I help", "The path forward"] as const;
const PROMPTS = [
  "What is getting in the way right now?",
  "What would a good outcome look like?",
  "How we get them there.",
  "What happens next, and when.",
] as const;

/** The default four-frame meeting template: a quiet header on each frame, plus a simple timeline on the last one. */
export function defaultBoard(): BoardData {
  let ts = 1;
  const text = (x: number, y: number, s: string, size: number, c: string, bold = false): El => ({ id: newId(), ts: ts++, t: "text", x, y, s, size, c, bold, tpl: true });
  const frames: Frame[] = FRAME_TITLES.map((title, index) => {
    const els: El[] = [
      text(96, 72, `${index + 1} / 4`, 22, GRAY),
      text(96, 108, title, 60, INK, true),
      text(96, 186, PROMPTS[index], 28, GRAY),
      { id: newId(), ts: ts++, t: "shape", k: "line", x1: 96, y1: 248, x2: 360, y2: 248, c: INK, w: 4, tpl: true },
    ];
    if (index === 3) {
      const y = 560;
      els.push({ id: newId(), ts: ts++, t: "shape", k: "line", x1: 240, y1: y, x2: 1360, y2: y, c: "#d1d5db", w: 4, tpl: true });
      ["Today", "This week", "Launch"].forEach((label, i) => {
        const x = 240 + i * 560;
        els.push({ id: newId(), ts: ts++, t: "shape", k: "ellipse", x1: x - 18, y1: y - 18, x2: x + 18, y2: y + 18, c: INK, w: 5, tpl: true });
        els.push(text(x - label.length * 8.5, y + 44, label, 30, INK, true));
      });
    }
    return { id: newId(), title, els: Object.fromEntries(els.map((el) => [el.id, el])) };
  });
  return { v: 1, frames };
}

export { SLIDE };
