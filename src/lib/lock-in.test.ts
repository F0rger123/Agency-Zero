import { describe, expect, it } from "vitest";
import { reopen, addItem, checklistSummary, clampMinutes, clock, elapsedMs, finish, goalReached, parseSession, pause, progress, resume, startSession, toRecord } from "./lock-in";

const T0 = 1_000_000;

describe("lock in timer (counts up)", () => {
  it("counts up from wall-clock time and never ends by itself", () => {
    const s = startSession(0, [], "", T0, "id-1");
    expect(elapsedMs(s, T0)).toBe(0);
    expect(elapsedMs(s, T0 + 5 * 60_000)).toBe(5 * 60_000);
    expect(elapsedMs(s, T0 + 9 * 3_600_000)).toBe(9 * 3_600_000);
    expect(s.status).toBe("running");
  });

  it("pauses and resumes without losing or gaining time", () => {
    const running = startSession(0, [], "", T0, "id");
    const paused = pause(running, T0 + 4 * 60_000);
    expect(paused.status).toBe("paused");
    expect(elapsedMs(paused, T0 + 60 * 60_000)).toBe(4 * 60_000);
    const again = resume(paused, T0 + 60 * 60_000);
    expect(elapsedMs(again, T0 + 61 * 60_000)).toBe(5 * 60_000);
  });

  it("finishes only when asked, and keeps the time worked", () => {
    const s = startSession(0, [], "", T0, "id");
    const done = finish(s, T0 + 90_000);
    expect(done.status).toBe("done");
    expect(done.endedAt).toBe(T0 + 90_000);
    expect(elapsedMs(done, T0 + 99_999_999)).toBe(90_000);
    expect(finish(done, T0 + 500_000)).toBe(done);
  });

  it("an accidental Finish can be undone and keeps the time already worked", () => {
    const s = startSession(0, [], "", T0, "id");
    const done = finish(s, T0 + 60_000);
    const back = reopen(done, T0 + 600_000);
    expect(back.status).toBe("running");
    expect(back.endedAt).toBeNull();
    expect(elapsedMs(back, T0 + 660_000)).toBe(120_000);
  });

  it("an optional goal drives the hourglass but does not stop the clock", () => {
    const s = startSession(25, [], "", T0, "id");
    expect(s.goalMs).toBe(25 * 60_000);
    expect(progress(s, T0 + 5 * 60_000)).toBeCloseTo(0.2);
    expect(goalReached(s, T0 + 24 * 60_000)).toBe(false);
    expect(goalReached(s, T0 + 26 * 60_000)).toBe(true);
    expect(progress(s, T0 + 99 * 60_000)).toBe(1);
    expect(s.status).toBe("running");
  });

  it("without a goal the hourglass turns once an hour", () => {
    const s = startSession(0, [], "", T0, "id");
    expect(progress(s, T0 + 30 * 60_000)).toBeCloseTo(0.5);
    expect(progress(s, T0 + 90 * 60_000)).toBeCloseTo(0.5);
  });

  it("formats elapsed time without running ahead", () => {
    expect(clock(0)).toBe("00:00");
    expect(clock(59_900)).toBe("00:59");
    expect(clock(25 * 60_000)).toBe("25:00");
    expect(clock(3_725_000)).toBe("1:02:05");
  });

  it("clamps goals", () => {
    expect(clampMinutes(0)).toBe(1);
    expect(clampMinutes(99999)).toBe(720);
    expect(clampMinutes(Number.NaN)).toBe(25);
  });
});

describe("lock in checklist and storage", () => {
  it("lets items be added during a session, ignoring blanks", () => {
    let s = startSession(0, [], "", T0, "id");
    s = addItem(s, "  Send invoice  ", "a");
    s = addItem(s, "   ", "b");
    expect(s.items).toEqual([{ id: "a", text: "Send invoice", done: false, kind: "custom" }]);
    expect(checklistSummary(s.items)).toEqual({ done: 0, total: 1 });
  });

  it("round-trips a session through storage", () => {
    const s = pause(startSession(30, [{ id: "a", text: "x", done: true, kind: "task", refId: "t1" }], "hi", T0, "id-9"), T0 + 60_000);
    const back = parseSession(JSON.stringify(s));
    expect(back).toMatchObject({ id: "id-9", status: "paused", goalMs: 30 * 60_000, accumulatedMs: 60_000, notes: "hi" });
    expect(back?.items[0]).toMatchObject({ refId: "t1", done: true });
  });

  it("discards malformed data", () => {
    expect(parseSession("nope")).toBeNull();
    expect(parseSession(JSON.stringify({ status: "weird" }))).toBeNull();
    expect(parseSession(JSON.stringify({ status: "running" }))).toBeNull();
  });

  it("converts a session saved by the old countdown version", () => {
    const old = { status: "paused", durationMs: 25 * 60_000, endsAt: null, remainingMs: 20 * 60_000, startedAt: T0, items: [], notes: "" };
    const back = parseSession(JSON.stringify(old));
    expect(back?.goalMs).toBe(25 * 60_000);
    expect(back?.accumulatedMs).toBe(5 * 60_000);
    expect(back?.status).toBe("paused");
  });

  it("builds a record for history and the database", () => {
    const s = startSession(10, [], "n", T0, "id-2");
    const record = toRecord(s, T0 + 120_000);
    expect(record).toMatchObject({ id: "id-2", elapsedMs: 120_000, goalMs: 10 * 60_000, status: "running", notes: "n" });
  });
});
