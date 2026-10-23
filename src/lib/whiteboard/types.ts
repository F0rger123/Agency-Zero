/**
 * Whiteboard data model. A board is four frames; a frame is a set of drawn elements keyed by id. Everything is plain JSON so
 * it can be saved as one document and sent between people on a call as small operations.
 */

type Base = { id: string; ts: number; /** Part of the meeting template: kept by "Clear". */ tpl?: boolean };

export type StrokeEl = Base & { t: "stroke"; /** Flattened x,y,x,y… in world units. */ pts: number[]; c: string; w: number };
export type ShapeKind = "rect" | "ellipse" | "line" | "arrow";
export type ShapeEl = Base & { t: "shape"; k: ShapeKind; x1: number; y1: number; x2: number; y2: number; c: string; w: number };
export type TextEl = Base & { t: "text"; x: number; y: number; s: string; size: number; c: string; bold?: boolean };
export type NoteEl = Base & { t: "note"; x: number; y: number; w: number; h: number; s: string; c: string };
export type El = StrokeEl | ShapeEl | TextEl | NoteEl;

export type Frame = { id: string; title: string; els: Record<string, El> };
export type BoardData = { v: 1; frames: Frame[] };

/** Operations sent between people (and replayed for undo). `f` is the frame index. */
export type Op =
  | { k: "put"; f: number; el: El }
  | { k: "ext"; f: number; id: string; pts: number[] }
  | { k: "del"; f: number; ids: string[] }
  | { k: "clr"; f: number };

export type Message =
  | { k: "ops"; from: string; ops: Op[] }
  | { k: "frame"; from: string; f: number }
  | { k: "cur"; from: string; name: string; f: number; x: number; y: number; show: boolean }
  | { k: "hello"; from: string; name: string }
  | { k: "snap"; from: string; to: string; data: BoardData }
  | { k: "hb"; from: string; name: string };

export const SLIDE = { w: 1600, h: 900 } as const;
export const FRAME_COUNT = 4;

export const INK = ["#111827", "#6b7280", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7c3aed"] as const;
export const NOTE_COLORS = ["#fde68a", "#fbcfe8", "#bfdbfe", "#bbf7d0"] as const;
export const PEN_WIDTHS = [3, 6, 12] as const;
