import { describe, expect, it } from "vitest";
import { bounds, exportBounds, fitRect, hits, moved, pinch, toScreen, toWorld, zoomAt } from "./geometry";
import { applyOp, inverseOf, mergeBoards, ordered, parseBoard } from "./ops";
import { buildPdf } from "./pdf";
import { defaultBoard } from "./template";
import type { BoardData, StrokeEl } from "./types";

const stroke = (id: string, pts: number[], ts = 1): StrokeEl => ({ id, ts, t: "stroke", pts, c: "#000", w: 6 });
const board = (): BoardData => ({ v: 1, frames: [{ id: "f", title: "F", els: {} }] });

describe("template", () => {
  it("has four frames in order with a title on each", () => {
    const data = defaultBoard();
    expect(data.frames.map((frame) => frame.title)).toEqual(["Their problem", "What they need", "How I help", "The path forward"]);
    for (const frame of data.frames) expect(Object.values(frame.els).some((el) => el.t === "text" && el.s === frame.title)).toBe(true);
    expect(parseBoard(JSON.parse(JSON.stringify(data)))).not.toBeNull();
  });
  it("clear keeps the template but removes drawings", () => {
    const data = defaultBoard();
    const before = Object.keys(data.frames[0].els).length;
    applyOp(data, { k: "put", f: 0, el: stroke("s1", [1, 1, 5, 5]) });
    expect(Object.keys(data.frames[0].els).length).toBe(before + 1);
    applyOp(data, { k: "clr", f: 0 });
    expect(Object.keys(data.frames[0].els).length).toBe(before);
  });
});

describe("ops and undo", () => {
  it("put, extend and delete a stroke", () => {
    const data = board();
    applyOp(data, { k: "put", f: 0, el: stroke("a", [0, 0]) });
    applyOp(data, { k: "ext", f: 0, id: "a", pts: [10, 10, 20, 20] });
    expect((data.frames[0].els.a as StrokeEl).pts).toEqual([0, 0, 10, 10, 20, 20]);
    applyOp(data, { k: "del", f: 0, ids: ["a"] });
    expect(data.frames[0].els.a).toBeUndefined();
    expect(applyOp(data, { k: "del", f: 0, ids: ["a"] })).toBe(false);
  });
  it("inverse operations restore the board exactly", () => {
    const data = board();
    const add = { k: "put", f: 0, el: stroke("a", [0, 0, 4, 4]) } as const;
    const undoAdd = inverseOf(data, add);
    applyOp(data, add);
    expect(Object.keys(data.frames[0].els)).toEqual(["a"]);
    undoAdd.forEach((op) => applyOp(data, op));
    expect(Object.keys(data.frames[0].els)).toEqual([]);

    applyOp(data, add);
    applyOp(data, { k: "put", f: 0, el: stroke("b", [9, 9]) });
    const clear = { k: "clr", f: 0 } as const;
    const undoClear = inverseOf(data, clear);
    applyOp(data, clear);
    expect(Object.keys(data.frames[0].els)).toEqual([]);
    undoClear.forEach((op) => applyOp(data, op));
    expect(Object.keys(data.frames[0].els).sort()).toEqual(["a", "b"]);

    const move = { k: "put", f: 0, el: moved(data.frames[0].els.a, 100, 0) } as const;
    const undoMove = inverseOf(data, move);
    applyOp(data, move);
    expect((data.frames[0].els.a as StrokeEl).pts[0]).toBe(100);
    undoMove.forEach((op) => applyOp(data, op));
    expect((data.frames[0].els.a as StrokeEl).pts[0]).toBe(0);
  });
  it("draws in creation order and merges without losing anything", () => {
    const data = board();
    applyOp(data, { k: "put", f: 0, el: stroke("late", [0, 0], 5) });
    applyOp(data, { k: "put", f: 0, el: stroke("early", [0, 0], 2) });
    expect(ordered(data.frames[0]).map((el) => el.id)).toEqual(["early", "late"]);
    const other = board();
    applyOp(other, { k: "put", f: 0, el: stroke("theirs", [1, 1], 3) });
    expect(mergeBoards(data, other)).toBe(true);
    expect(Object.keys(data.frames[0].els).sort()).toEqual(["early", "late", "theirs"]);
  });
  it("rejects malformed boards", () => {
    expect(parseBoard(null)).toBeNull();
    expect(parseBoard({ v: 2, frames: [] })).toBeNull();
    expect(parseBoard({ v: 1, frames: [{ id: "x", title: "t", els: { a: { id: "b", t: "stroke" } } }] })?.frames[0].els).toEqual({});
  });
});

describe("geometry", () => {
  it("maps screen and world exactly in both directions", () => {
    const v = { x: 37.5, y: -12, s: 1.75 };
    const w = toWorld(v, 211, 349);
    const back = toScreen(v, w.x, w.y);
    expect(back.x).toBeCloseTo(211, 9);
    expect(back.y).toBeCloseTo(349, 9);
  });
  it("zooms around the point under the cursor", () => {
    const v = { x: 10, y: 20, s: 1 };
    const next = zoomAt(v, 300, 200, 2);
    const before = toWorld(v, 300, 200);
    const after = toWorld(next, 300, 200);
    expect(after.x).toBeCloseTo(before.x, 9);
    expect(after.y).toBeCloseTo(before.y, 9);
  });
  it("pinch keeps the drawing under both fingers", () => {
    const start = { x: 0, y: 0, s: 1 };
    const a0 = { x: 100, y: 100 };
    const b0 = { x: 200, y: 100 };
    const a1 = { x: 80, y: 120 };
    const b1 = { x: 280, y: 120 };
    const next = pinch(start, a0, b0, a1, b1);
    expect(next.s).toBeCloseTo(2, 9);
    const wa = toWorld(start, a0.x, a0.y);
    const sa = toScreen(next, wa.x, wa.y);
    expect(sa.x).toBeCloseTo(a1.x, 6);
    expect(sa.y).toBeCloseTo(a1.y, 6);
  });
  it("fits a rectangle in the box", () => {
    const v = fitRect({ x: 0, y: 0, w: 1600, h: 900 }, 800, 600, 0);
    expect(v.s).toBeCloseTo(0.5, 9);
    expect(v.y).toBeCloseTo((600 - 450) / 2, 9);
  });
  it("hit tests strokes, shapes and notes", () => {
    expect(hits(stroke("a", [0, 0, 100, 0]), 50, 4, 2)).toBe(true);
    expect(hits(stroke("a", [0, 0, 100, 0]), 50, 30, 2)).toBe(false);
    const rect = { id: "r", ts: 1, t: "shape", k: "rect", x1: 0, y1: 0, x2: 100, y2: 100, c: "#000", w: 4 } as const;
    expect(hits(rect, 0, 50, 2)).toBe(true);
    expect(hits(rect, 50, 50, 2)).toBe(false);
    const note = { id: "n", ts: 1, t: "note", x: 10, y: 10, w: 200, h: 100, s: "", c: "#fde68a" } as const;
    expect(hits(note, 100, 60, 0)).toBe(true);
    expect(bounds(note)).toEqual({ x: 10, y: 10, w: 200, h: 100 });
  });
  it("export bounds cover the slide and anything outside it", () => {
    expect(exportBounds([], { w: 1600, h: 900 })).toEqual({ x: 0, y: 0, w: 1600, h: 900 });
    const wide = exportBounds([stroke("a", [1800, 400, 1900, 500])], { w: 1600, h: 900 });
    expect(wide.x).toBe(0);
    expect(wide.w).toBeGreaterThan(1900);
  });
});

describe("pdf", () => {
  it("writes a well-formed multi-page file", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const bytes = buildPdf([
      { jpeg, pxWidth: 2, pxHeight: 1, ptWidth: 800, ptHeight: 450 },
      { jpeg, pxWidth: 2, pxHeight: 1, ptWidth: 800, ptHeight: 450 },
    ]);
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Count 2");
    expect(text).toContain("%%EOF");
    expect(text.match(/\/Type \/Page /g)?.length).toBe(2);
  });
});

import { TEMPLATES, buildTemplate } from "./templates";

describe("templates", () => {
  it("every template is a valid board with every promised frame", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(10);
    for (const template of TEMPLATES) {
      const data = template.build();
      expect(parseBoard(JSON.parse(JSON.stringify(data)))).not.toBeNull();
      expect(data.frames.map((frame) => frame.title)).toEqual(template.frames);
      for (const frame of data.frames) for (const el of Object.values(frame.els)) expect(el.id).toBeTruthy();
    }
  });
  it("template text is plain editable text and survives clear", () => {
    const data = buildTemplate("discovery");
    const before = Object.keys(data.frames[0].els).length;
    applyOp(data, { k: "clr", f: 0 });
    expect(Object.keys(data.frames[0].els).length).toBe(before);
    expect(Object.values(data.frames[0].els).some((el) => el.t === "text" && el.s === "Where they are today")).toBe(true);
  });
  it("falls back to the sales template", () => {
    expect(buildTemplate("nope").frames[0].title).toBe("Their problem");
  });
});
