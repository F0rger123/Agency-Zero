import { describe, expect, it } from "vitest";
import { checklistSummary, clampMinutes, clock, finish, parseSession, pause, progress, remainingMs, resume, startSession, tick } from "./lock-in";

const T0 = 1_000_000;

describe("lock in timing", () => {
  it("counts down from wall-clock time", () => {
    const s = startSession(25, [], "", T0);
    expect(remainingMs(s, T0)).toBe(25 * 60_000);
    expect(remainingMs(s, T0 + 5 * 60_000)).toBe(20 * 60_000);
    expect(progress(s, T0 + 5 * 60_000)).toBeCloseTo(0.2);
    expect(progress(s, T0 + 99 * 60_000)).toBe(1);
  });

  it("pauses and resumes without losing time", () => {
    const running = startSession(10, [], "", T0);
    const paused = pause(running, T0 + 4 * 60_000);
    expect(paused.status).toBe("paused");
    expect(remainingMs(paused, T0 + 60 * 60_000)).toBe(6 * 60_000);
    const again = resume(paused, T0 + 60 * 60_000);
    expect(remainingMs(again, T0 + 61 * 60_000)).toBe(5 * 60_000);
  });

  it("finishes when the time is up and leaves a running session alone otherwise", () => {
    const s = startSession(1, [], "", T0);
    expect(tick(s, T0 + 1000)).toBe(s);
    expect(tick(s, T0 + 61_000).status).toBe("done");
    expect(remainingMs(finish(s), T0), "done has nothing left").toBe(0);
  });

  it("clamps durations", () => {
    expect(clampMinutes(0)).toBe(1);
    expect(clampMinutes(9999)).toBe(480);
    expect(clampMinutes(Number.NaN)).toBe(25);
  });

  it("formats the clock", () => {
    expect(clock(25 * 60_000)).toBe("25:00");
    expect(clock(59_100)).toBe("01:00");
    expect(clock(3_725_000)).toBe("1:02:05");
    expect(clock(0)).toBe("00:00");
  });
});

describe("lock in storage", () => {
  it("summarises the checklist", () => {
    expect(checklistSummary([{ id: "a", text: "x", done: true, kind: "custom" }, { id: "b", text: "y", done: false, kind: "task", refId: "t" }])).toEqual({ done: 1, total: 2 });
  });

  it("discards malformed data and keeps good data", () => {
    expect(parseSession("nope")).toBeNull();
    expect(parseSession(JSON.stringify({ status: "weird" }))).toBeNull();
    const good = parseSession(JSON.stringify({ status: "running", durationMs: 60000, startedAt: 1, endsAt: 61000, remainingMs: 60000, notes: "hi", items: [{ id: "a", text: "t", done: true, kind: "task", refId: "r" }, 5] }));
    expect(good?.items).toHaveLength(1);
    expect(good?.notes).toBe("hi");
  });
});
