/**
 * Lock In: a focus session with a countdown and a checklist. Pure logic here; the browser store
 * (localStorage) and the UI live in src/app/app/lock-in. Time is always derived from wall-clock
 * timestamps, never counted tick by tick, so a throttled background tab cannot drift.
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
  status: "running" | "paused" | "done";
  durationMs: number;
  /** Wall-clock end while running. */
  endsAt: number | null;
  /** Time left while paused (or 0 when done). */
  remainingMs: number;
  startedAt: number;
  items: LockInItem[];
  notes: string;
};

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 480;

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return 25;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

export function startSession(minutes: number, items: LockInItem[], notes: string, now: number): LockInSession {
  const durationMs = clampMinutes(minutes) * 60_000;
  return { status: "running", durationMs, endsAt: now + durationMs, remainingMs: durationMs, startedAt: now, items, notes };
}

export function remainingMs(session: LockInSession, now: number): number {
  if (session.status === "done") return 0;
  if (session.status === "paused") return Math.max(0, session.remainingMs);
  return Math.max(0, (session.endsAt ?? now) - now);
}

/** 0 at the start, 1 when the time is up. */
export function progress(session: LockInSession, now: number): number {
  if (session.durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingMs(session, now) / session.durationMs));
}

export function pause(session: LockInSession, now: number): LockInSession {
  if (session.status !== "running") return session;
  return { ...session, status: "paused", endsAt: null, remainingMs: remainingMs(session, now) };
}

export function resume(session: LockInSession, now: number): LockInSession {
  if (session.status !== "paused") return session;
  return { ...session, status: "running", endsAt: now + session.remainingMs };
}

export function finish(session: LockInSession): LockInSession {
  return { ...session, status: "done", endsAt: null, remainingMs: 0 };
}

/** Moves a running session to done once its time is up. Returns the same object when nothing changed. */
export function tick(session: LockInSession, now: number): LockInSession {
  if (session.status === "running" && remainingMs(session, now) <= 0) return finish(session);
  return session;
}

export function clock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}

export function checklistSummary(items: LockInItem[]): { done: number; total: number } {
  return { done: items.filter((item) => item.done).length, total: items.length };
}

/** Reads a stored session defensively; anything malformed is discarded. */
export function parseSession(raw: string | null): LockInSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LockInSession>;
    if (!value || !["running", "paused", "done"].includes(String(value.status))) return null;
    if (typeof value.durationMs !== "number" || typeof value.startedAt !== "number") return null;
    const items = Array.isArray(value.items)
      ? value.items
          .filter((item): item is LockInItem => !!item && typeof item.id === "string" && typeof item.text === "string")
          .slice(0, 100)
          .map((item) => ({ id: item.id, text: item.text.slice(0, 300), done: Boolean(item.done), kind: item.kind === "task" || item.kind === "project" ? item.kind : "custom", refId: typeof item.refId === "string" ? item.refId : undefined }) as LockInItem)
      : [];
    return {
      status: value.status as LockInSession["status"],
      durationMs: value.durationMs,
      endsAt: typeof value.endsAt === "number" ? value.endsAt : null,
      remainingMs: typeof value.remainingMs === "number" ? value.remainingMs : 0,
      startedAt: value.startedAt,
      items,
      notes: typeof value.notes === "string" ? value.notes.slice(0, 5000) : "",
    };
  } catch {
    return null;
  }
}
