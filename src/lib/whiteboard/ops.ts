import type { BoardData, El, Frame, Op, StrokeEl } from "./types";

/** Applies one operation to a board, in place, and returns whether anything changed. Safe to apply twice. */
export function applyOp(data: BoardData, op: Op): boolean {
  const frame = data.frames[op.f];
  if (!frame) return false;
  switch (op.k) {
    case "put": {
      frame.els[op.el.id] = op.el;
      return true;
    }
    case "ext": {
      const el = frame.els[op.id];
      if (!el || el.t !== "stroke") return false;
      el.pts = el.pts.concat(op.pts);
      return true;
    }
    case "del": {
      let changed = false;
      for (const id of op.ids) {
        if (id in frame.els) {
          delete frame.els[id];
          changed = true;
        }
      }
      return changed;
    }
    case "clr": {
      let changed = false;
      for (const id of Object.keys(frame.els)) {
        if (!frame.els[id].tpl) {
          delete frame.els[id];
          changed = true;
        }
      }
      return changed;
    }
  }
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * The operations that exactly reverse `op` as the board is right now. Call it BEFORE applying the op.
 * (put of a new element → delete it; put over an existing one → put the old one back; delete → put them back; clear → put them back.)
 */
export function inverseOf(data: BoardData, op: Op): Op[] {
  const frame = data.frames[op.f];
  if (!frame) return [];
  switch (op.k) {
    case "put": {
      const old = frame.els[op.el.id];
      return old ? [{ k: "put", f: op.f, el: clone(old) }] : [{ k: "del", f: op.f, ids: [op.el.id] }];
    }
    case "ext":
      return [];
    case "del":
      return op.ids.filter((id) => id in frame.els).map((id): Op => ({ k: "put", f: op.f, el: clone(frame.els[id]) }));
    case "clr":
      return Object.values(frame.els)
        .filter((el) => !el.tpl)
        .map((el): Op => ({ k: "put", f: op.f, el: clone(el) }));
  }
}

/** Elements in drawing order (oldest first). */
export function ordered(frame: Frame): El[] {
  return Object.values(frame.els).sort((a, b) => a.ts - b.ts || (a.id < b.id ? -1 : 1));
}

/** Merge a received board into ours without removing anything we have (used when joining a call). */
export function mergeBoards(into: BoardData, from: BoardData): boolean {
  let changed = false;
  from.frames.forEach((frame, index) => {
    const target = into.frames[index];
    if (!target) return;
    for (const el of Object.values(frame.els)) {
      if (!(el.id in target.els)) {
        target.els[el.id] = el;
        changed = true;
      }
    }
  });
  return changed;
}

/** Reads stored json defensively: a missing, empty or malformed board becomes null so the caller can start from the template. */
export function parseBoard(value: unknown): BoardData | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { v?: unknown; frames?: unknown };
  if (raw.v !== 1 || !Array.isArray(raw.frames) || raw.frames.length === 0 || raw.frames.length > 12) return null;
  const frames: Frame[] = [];
  for (const frame of raw.frames) {
    if (!frame || typeof frame !== "object") return null;
    const f = frame as { id?: unknown; title?: unknown; els?: unknown };
    if (typeof f.id !== "string" || typeof f.title !== "string" || !f.els || typeof f.els !== "object") return null;
    const els: Record<string, El> = {};
    for (const [id, el] of Object.entries(f.els as Record<string, unknown>)) {
      if (el && typeof el === "object" && (el as { id?: unknown }).id === id && typeof (el as { t?: unknown }).t === "string") els[id] = el as El;
    }
    frames.push({ id: f.id, title: f.title.slice(0, 80), els });
  }
  return { v: 1, frames };
}

export const strokeOf = (el: El | undefined): StrokeEl | null => (el && el.t === "stroke" ? el : null);
