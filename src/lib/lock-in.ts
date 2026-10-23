/**
 * Lock In: a focus session with a running timer (it counts up, like a stopwatch) and a checklist.
 * Pure logic here; the browser store (localStorage) and the UI live in src/app/app/lock-in.
 *
 * Time is always derived from wall-clock timestamps, never counted tick by tick, so a throttled background tab
 * cannot drift. A session never ends by itself: only the owner pauses, finishes or ends it. An optional goal
 * ("90 minutes") only drives the hourglass and a gentle "goal reached" note.
 */

export type LockInItem = {
  id: string;
  text: string;
  done: boolean;
  kind: "custom" | "task" | "project";
  /** Task or project id when the item came from the CRM. */
  refId?: string;
};

export type LockInSession = {
  /** Client-generated id; also the row id when the session is saved to the database. */
  id: string;
  status: "running" | "paused" | "done";
  /** Optional target in ms; 0 means no goal. */
  goalMs: number;
  /** Time already worked, not counting the current running stretch. */
  accumulatedMs: number;
  /** Wall-clock start of the current running stretch; null while paused or done. */
  runningSince: number | null;
  startedAt: number;
  endedAt: number | null;
  items: LockInItem[];
  notes: string;
};

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 720;
/** Without a goal the hourglass completes one turn per hour, so it still moves. */
const HOURGLASS_CYCLE_MS = 60 * 60_000;

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return 25;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-a${hex().slice(1)}-${hex()}${hex()}${hex()}`;
}

/** `goalMinutes` of 0 (or less) means "no goal". */
export function startSession(goalMinutes: number, items: LockInItem[], notes: string, now: number, id: string = newSessionId()): LockInSession {
  return {
    id,
    status: "running",
    goalMs: goalMinutes > 0 ? clampMinutes(goalMinutes) * 60_000 : 0,
    accumulatedMs: 0,
    runningSince: now,
    startedAt: now,
    endedAt: null,
    items,
    notes,
  };
}

export function elapsedMs(session: LockInSession, now: number): number {
  const live = session.status === "running" && session.runningSince !== null ? Math.max(0, now - session.runningSince) : 0;
  return Math.max(0, session.accumulatedMs) + live;
}

export function goalReached(session: LockInSession, now: number): boolean {
  return session.goalMs > 0 && elapsedMs(session, now) >= session.goalMs;
}

/** 0 to 1: how far through the goal, or around the hourglass's hour when there is no goal. */
export function progress(session: LockInSession, now: number): number {
  const elapsed = elapsedMs(session, now);
  if (session.goalMs > 0) return Math.min(1, elapsed / session.goalMs);
  return (elapsed % HOURGLASS_CYCLE_MS) / HOURGLASS_CYCLE_MS;
}

export function pause(session: LockInSession, now: number): LockInSession {
  if (session.status !== "running") return session;
  return { ...session, status: "paused", accumulatedMs: elapsedMs(session, now), runningSince: null };
}

export function resume(session: LockInSession, now: number): LockInSession {
  if (session.status !== "paused") return session;
  return { ...session, status: "running", runningSince: now };
}

export function finish(session: LockInSession, now: number): LockInSession {
  if (session.status === "done") return session;
  return { ...session, status: "done", accumulatedMs: elapsedMs(session, now), runningSince: null, endedAt: now };
}

/** Undo for an accidental Finish: the clock carries on from where it stopped. */
export function reopen(session: LockInSession, now: number): LockInSession {
  if (session.status !== "done") return session;
  return { ...session, status: "running", runningSince: now, endedAt: null };
}

/** Elapsed time as 12:34 or 1:02:05 (never rounds up, so it never runs ahead of the real time). */
export function clock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}

export function checklistSummary(items: LockInItem[]): { done: number; total: number } {
  return { done: items.filter((item) => item.done).length, total: items.length };
}

export function addItem(session: LockInSession, text: string, id: string = newSessionId()): LockInSession {
  const clean = text.trim().slice(0, 300);
  if (!clean || session.items.length >= 100) return session;
  return { ...session, items: [...session.items, { id, text: clean, done: false, kind: "custom" }] };
}

const cleanItems = (raw: unknown): LockInItem[] =>
  Array.isArray(raw)
    ? raw
        .filter((item): item is LockInItem => !!item && typeof item.id === "string" && typeof item.text === "string")
        .slice(0, 100)
        .map((item) => ({
          id: item.id,
          text: item.text.slice(0, 300),
          done: Boolean(item.done),
          kind: item.kind === "task" || item.kind === "project" ? item.kind : "custom",
          ...(typeof item.refId === "string" ? { refId: item.refId } : {}),
        }))
    : [];

/**
 * Reads a stored session defensively; anything malformed is discarded. Sessions saved by the earlier countdown
 * version (durationMs / endsAt / remainingMs) are converted, so an in-progress session survives the update.
 */
export function parseSession(raw: string | null): LockInSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value || !["running", "paused", "done"].includes(String(value.status))) return null;
    const status = value.status as LockInSession["status"];
    const startedAt = typeof value.startedAt === "number" ? value.startedAt : null;
    if (startedAt === null) return null;
    const base = {
      status,
      startedAt,
      items: cleanItems(value.items),
      notes: typeof value.notes === "string" ? value.notes.slice(0, 5000) : "",
    };
    if (typeof value.accumulatedMs === "number") {
      return {
        ...base,
        id: typeof value.id === "string" ? value.id : newSessionId(),
        goalMs: typeof value.goalMs === "number" && value.goalMs > 0 ? value.goalMs : 0,
        accumulatedMs: value.accumulatedMs,
        runningSince: typeof value.runningSince === "number" ? value.runningSince : null,
        endedAt: typeof value.endedAt === "number" ? value.endedAt : null,
      };
    }
    if (typeof value.durationMs === "number") {
      // Old countdown session: the time used so far becomes the elapsed time, the old length becomes the goal.
      const left = status === "running" && typeof value.endsAt === "number" ? Math.max(0, value.endsAt - Date.now()) : Math.max(0, Number(value.remainingMs) || 0);
      const used = Math.max(0, value.durationMs - left);
      return {
        ...base,
        id: newSessionId(),
        goalMs: value.durationMs,
        accumulatedMs: used,
        runningSince: status === "running" ? Date.now() : null,
        endedAt: status === "done" ? startedAt + value.durationMs : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** A finished or in-flight session as stored in history and sent to the database. */
export type LockInRecord = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  elapsedMs: number;
  goalMs: number;
  status: LockInSession["status"];
  items: LockInItem[];
  notes: string;
};

export function toRecord(session: LockInSession, now: number): LockInRecord {
  return {
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    elapsedMs: elapsedMs(session, now),
    goalMs: session.goalMs,
    status: session.status,
    items: session.items,
    notes: session.notes,
  };
}
