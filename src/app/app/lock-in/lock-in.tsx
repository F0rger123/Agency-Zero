"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import {
  addItem,
  checklistSummary,
  clampMinutes,
  clock,
  elapsedMs,
  finish,
  goalReached,
  newSessionId,
  parseSession,
  pause,
  progress,
  reopen,
  resume,
  startSession,
  toRecord,
  type LockInItem,
  type LockInRecord,
  type LockInSession,
} from "@/lib/lock-in";
import { completeLockInTasksAction, getLockInOptionsAction, listLockInSessionsAction, saveLockInSessionAction, type LockInOptions, type SavedSession } from "./actions";
import { Hourglass } from "./hourglass";

/* ── Session store: localStorage, so a session survives navigation and reloads ───────────────── */

const KEY = "az-lock-in";
const HISTORY_KEY = "az-lock-in-history";
const listeners = new Set<() => void>();
let memoryRaw: string | null = null;
let memoryHistory: LockInRecord[] = [];
let cachedRaw: string | null | undefined;
let cachedSession: LockInSession | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memoryRaw;
  } catch {
    return memoryRaw;
  }
}

function writeSession(session: LockInSession | null) {
  memoryRaw = session ? JSON.stringify(session) : null;
  try {
    if (memoryRaw) window.localStorage.setItem(KEY, memoryRaw);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Private mode or storage blocked: the in-memory copy still keeps the session alive for this tab.
  }
  listeners.forEach((listener) => listener());
}

function subscribeSession(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSession(): LockInSession | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = parseSession(raw);
  }
  return cachedSession;
}

/** Finished sessions are also kept on this device (newest first), so nothing is lost even if the database is unreachable. */
function readHistory(): LockInRecord[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? "null");
    if (Array.isArray(value)) return value.filter((row): row is LockInRecord => !!row && typeof row.id === "string");
  } catch {
    // Fall through to the in-memory copy.
  }
  return memoryHistory;
}

function rememberSession(record: LockInRecord) {
  const next = [record, ...readHistory().filter((row) => row.id !== record.id)].slice(0, 50);
  memoryHistory = next;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: memory copy only.
  }
}

/* ── Database sync: every change, every 30 s while running, and when it ends ─────────────────── */

type Sync = "saved" | "saving" | "device";
let syncState: Sync = "saved";
let tableMissing = false;
let syncSeq = 0;
const syncListeners = new Set<() => void>();
const setSync = (next: Sync) => {
  syncState = next;
  syncListeners.forEach((listener) => listener());
};
const useSyncState = () =>
  useSyncExternalStore(
    (callback) => {
      syncListeners.add(callback);
      return () => syncListeners.delete(callback);
    },
    () => syncState,
    () => "saved" as Sync,
  );

async function syncSession(session: LockInSession) {
  const seq = ++syncSeq;
  if (!navigator.onLine) return setSync("device");
  setSync("saving");
  try {
    const result = await saveLockInSessionAction(toRecord(session, Date.now()));
    if (seq !== syncSeq) return; // a newer save is already on its way
    tableMissing = Boolean(result.missing);
    setSync(result.ok ? "saved" : "device");
  } catch {
    if (seq === syncSeq) setSync("device");
  }
}

/* ── Clock store: one shared ticker, only runs while something is subscribed ───────────────── */

const clockListeners = new Set<() => void>();
let clockNow = 0;
let clockTimer: number | undefined;

function subscribeClock(callback: () => void) {
  clockListeners.add(callback);
  clockNow = Date.now();
  if (clockTimer === undefined) {
    clockTimer = window.setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((listener) => listener());
    }, 250);
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockTimer !== undefined) {
      window.clearInterval(clockTimer);
      clockTimer = undefined;
      clockNow = 0;
    }
  };
}

function getNow() {
  if (clockNow === 0) clockNow = Date.now();
  return clockNow;
}
const useNow = () => useSyncExternalStore(subscribeClock, getNow, () => 0);
const useStoredSession = () => useSyncExternalStore(subscribeSession, getSession, () => null);

function syncLabel(state: Sync): string {
  if (state === "saving") return "Saving…";
  if (state === "device") return tableMissing ? "Saved on this device (database update 0029 not applied yet)" : "Saved on this device. Will sync when online.";
  return "Saved";
}

/* ── Provider: keeps the session saved everywhere in the CRM ────────────────────────────────── */

const LockInContext = createContext<{ open: () => void; active: boolean } | null>(null);

export function useLockIn() {
  return useContext(LockInContext);
}

export function LockInProvider({ children }: { children: ReactNode }) {
  const session = useStoredSession();
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const status = session?.status;

  // Save shortly after every change (checklist, notes, pause, finish).
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => void syncSession(session), 1200);
    return () => window.clearTimeout(timer);
  }, [session]);

  // While it runs: refresh the saved time every 30 s, and save the moment the tab is hidden or the connection returns.
  useEffect(() => {
    if (!status) return;
    const save = () => {
      const current = getSession();
      if (current) void syncSession(current);
    };
    const beat = status === "running" ? window.setInterval(save, 30_000) : undefined;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", save);
    window.addEventListener("pagehide", save);
    return () => {
      if (beat !== undefined) window.clearInterval(beat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", save);
      window.removeEventListener("pagehide", save);
    };
  }, [status]);

  return (
    <LockInContext.Provider value={{ open, active: status === "running" || status === "paused" }}>
      {children}
      {session && !isOpen ? <MiniTimer session={session} onOpen={open} /> : null}
      {isOpen && typeof document !== "undefined" ? createPortal(<LockInScreen session={session} onClose={close} />, document.body) : null}
    </LockInContext.Provider>
  );
}

/** Top-bar button, left of Quick note. The hourglass flips on hover. */
export function LockInButton() {
  const ctx = useLockIn();
  const session = useStoredSession();
  const live = session && session.status !== "done";
  return (
    <button
      type="button"
      onClick={ctx?.open}
      className="press group relative inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-[background-color,border-color] hover:border-foreground hover:bg-muted"
    >
      <Hourglass progress={0.5} running={false} className="size-4 transition-transform duration-500 ease-[var(--ease-out)] group-hover:rotate-180" />
      <span className="max-sm:sr-only">Lock In</span>
      {live ? <span aria-label={session.status === "running" ? "Session running" : "Session paused"} className="size-2 rounded-full bg-foreground" /> : null}
    </button>
  );
}

function MiniTimer({ session, onOpen }: { session: LockInSession; onOpen: () => void }) {
  const now = useNow();
  const done = session.status === "done";
  const summary = checklistSummary(session.items);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Lock In session"
      className="press fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-full border-[1.5px] border-foreground bg-background px-4 py-2.5 shadow-lg transition-transform hover:-translate-y-0.5 max-sm:bottom-3 max-sm:right-3"
    >
      <Hourglass progress={progress(session, now)} running={session.status === "running"} className="size-6" />
      <span className="text-left leading-tight">
        <span className="block text-base font-semibold tabular-nums">{clock(elapsedMs(session, now))}{session.status === "paused" ? " · paused" : done ? " · done" : ""}</span>
        {summary.total > 0 ? <span className="block text-[11px] text-muted-foreground">{summary.done}/{summary.total} done</span> : null}
      </span>
    </button>
  );
}

/* ── Full-screen setup / session / summary ──────────────────────────────────────────────────── */

const GOALS = [25, 45, 60, 90, 120];
const field = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";

function LockInScreen({ session, onClose }: { session: LockInSession | null; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const live = session && session.status !== "done";
  return (
    <div role="dialog" aria-modal="true" aria-label="Lock In" className="modal-backdrop fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 pb-10 pt-4 sm:px-8">
        <div className="flex items-center justify-between py-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Lock In</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={live ? "Minimize, keep running" : "Close"}
            className="press flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            {live ? "Minimize" : "Close"}
            <Icon name="close" className="size-4" />
          </button>
        </div>
        {session ? <SessionView session={session} onExit={onClose} /> : <Setup />}
      </div>
    </div>
  );
}

function Setup() {
  const [goal, setGoal] = useState(0);
  const [custom, setCustom] = useState("");
  const [items, setItems] = useState<LockInItem[]>([]);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [options, setOptions] = useState<LockInOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const addCustom = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((current) => [...current, { id: newSessionId(), text: text.slice(0, 300), done: false, kind: "custom" }]);
    setDraft("");
  };
  const toggleRef = (kind: "task" | "project", refId: string, text: string) =>
    setItems((current) =>
      current.some((item) => item.refId === refId)
        ? current.filter((item) => item.refId !== refId)
        : [...current, { id: newSessionId(), text, done: false, kind, refId }],
    );
  const loadOptions = async () => {
    setLoading(true);
    setOptions(await getLockInOptionsAction());
    setLoading(false);
  };
  const selected = (refId: string) => items.some((item) => item.refId === refId);
  const start = () => {
    const pending = draft.trim();
    const all = pending ? [...items, { id: newSessionId(), text: pending.slice(0, 300), done: false, kind: "custom" as const }] : items;
    const session = startSession(goal, all, notes, Date.now());
    writeSession(session);
    void syncSession(session);
  };

  return (
    <div className="grid flex-1 gap-8 py-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-12">
      <div className="flex flex-col items-center text-center">
        <Hourglass progress={0} running={false} className="h-48 w-auto sm:h-64" />
        <p className="mt-4 text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">00:00</p>
        <p className="mt-1 text-sm text-muted-foreground">A timer that counts up. It only stops when you do.</p>
        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">Goal (optional)</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Goal">
          <button
            type="button"
            aria-pressed={goal === 0 && !custom}
            onClick={() => {
              setGoal(0);
              setCustom("");
            }}
            className={`press rounded-full border px-4 py-2 text-sm transition-colors ${goal === 0 && !custom ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            No goal
          </button>
          {GOALS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={goal === preset && !custom}
              onClick={() => {
                setGoal(preset);
                setCustom("");
              }}
              className={`press rounded-full border px-4 py-2 text-sm transition-colors ${goal === preset && !custom ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
            >
              {preset}m
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          Custom
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={720}
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value);
              setGoal(event.target.value ? clampMinutes(Number(event.target.value)) : 0);
            }}
            placeholder="minutes"
            className={`${field} w-28`}
          />
        </label>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold tracking-tight">What are you getting done?</h2>
          <p className="mt-1 text-sm text-muted-foreground">You can add more items any time during the session.</p>
          <div className="mt-3 flex gap-2">
            <label className="sr-only" htmlFor="lock-in-item">Checklist item</label>
            <input
              id="lock-in-item"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Add a checklist item and press Enter"
              className={field}
            />
            <button type="button" onClick={addCustom} className="press shrink-0 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">
              Add
            </button>
          </div>
          {items.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
                  <span className="min-w-0">
                    {item.kind !== "custom" ? <span className="mr-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.kind}</span> : null}
                    {item.text}
                  </span>
                  <button type="button" aria-label={`Remove ${item.text}`} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="press -mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Icon name="close" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Pull in tasks and projects</h2>
            {options ? null : (
              <button type="button" onClick={loadOptions} disabled={loading} className="press rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50">
                {loading ? "Loading…" : "Choose"}
              </button>
            )}
          </div>
          {options?.error ? <p role="alert" className="mt-3 text-sm font-medium">{options.error}</p> : null}
          {options && !options.error ? (
            <div className="mt-4 space-y-5">
              <PickList title="Tasks" empty="No open tasks." rows={options.tasks.map((task) => ({ id: task.id, label: task.title, sub: task.client }))} selected={selected} onToggle={(row) => toggleRef("task", row.id, row.label)} />
              <PickList title="Projects" empty="No active projects." rows={options.projects.map((project) => ({ id: project.id, label: project.name, sub: project.client }))} selected={selected} onToggle={(row) => toggleRef("project", row.id, row.label)} />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <label className="sr-only" htmlFor="lock-in-notes">Notes</label>
          <textarea id="lock-in-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Anything you want in front of you while you work." className={`${field} mt-3 resize-y leading-6`} />
        </section>

        <button type="button" onClick={start} className="press w-full rounded-xl bg-inverted px-6 py-4 text-base font-semibold text-inverted-foreground transition-opacity hover:opacity-85 sm:w-auto sm:min-w-56">
          Start timer
        </button>

        <PastSessions />
      </div>
    </div>
  );
}

/** Recent sessions: from the database when it is available, otherwise from this device. */
function PastSessions() {
  const [saved, setSaved] = useState<SavedSession[] | null>(null);
  useEffect(() => {
    let live = true;
    listLockInSessionsAction().then((rows) => {
      if (live) setSaved(rows);
    });
    return () => {
      live = false;
    };
  }, []);
  const local = readHistory().map<SavedSession>((row) => ({
    id: row.id,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    elapsedMs: row.elapsedMs,
    goalMs: row.goalMs,
    status: row.status,
    done: row.items.filter((item) => item.done).length,
    total: row.items.length,
  }));
  const rows = (saved && saved.length > 0 ? saved : local).slice(0, 6);
  if (rows.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">Past sessions</h2>
      <ul className="mt-3 divide-y divide-border border-y border-border text-sm">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.startedAt))}</span>
            <span className="text-muted-foreground">
              {clock(row.elapsedMs)}
              {row.total > 0 ? ` · ${row.done}/${row.total} done` : ""}
              {row.status !== "done" ? " · not finished" : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PickList({
  title,
  rows,
  empty,
  selected,
  onToggle,
}: {
  title: string;
  rows: { id: string; label: string; sub: string | null }[];
  empty: string;
  selected: (id: string) => boolean;
  onToggle: (row: { id: string; label: string }) => void;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li key={row.id}>
              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${selected(row.id) ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"}`}>
                <input type="checkbox" checked={selected(row.id)} onChange={() => onToggle(row)} className="mt-0.5 size-4 accent-foreground" />
                <span className="min-w-0">
                  {row.label}
                  {row.sub ? <span className="block text-xs text-muted-foreground">{row.sub}</span> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SessionView({ session, onExit }: { session: LockInSession; onExit: () => void }) {
  const now = useNow();
  const sync = useSyncState();
  const elapsed = elapsedMs(session, now);
  const frac = progress(session, now);
  const done = session.status === "done";
  const summary = checklistSummary(session.items);
  const reached = goalReached(session, now);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Keep the tab title useful while you work in another window.
  useEffect(() => {
    if (session.status !== "running") return;
    const title = document.title;
    const timer = window.setInterval(() => {
      const current = getSession();
      if (current) document.title = `${clock(elapsedMs(current, Date.now()))} · Lock In`;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.title = title;
    };
  }, [session.status]);

  const update = (patch: Partial<LockInSession>) => writeSession({ ...session, ...patch });
  const toggleItem = (id: string) => update({ items: session.items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)) });
  const removeItem = (id: string) => update({ items: session.items.filter((item) => item.id !== id) });
  const submitItem = () => {
    if (!draft.trim()) return;
    writeSession(addItem(session, draft));
    setDraft("");
  };
  const doneTaskIds = session.items.filter((item) => item.done && item.kind === "task" && item.refId).map((item) => item.refId as string);

  const finishNow = () => {
    const finished = finish(session, Date.now());
    writeSession(finished);
    rememberSession(toRecord(finished, Date.now()));
    void syncSession(finished);
  };
  const keepGoing = () => writeSession(reopen(session, Date.now()));
  const discard = () => {
    writeSession(null);
    onExit();
  };
  const startNew = () => {
    writeSession(null);
  };
  const completeTasks = async () => {
    setSaving(true);
    setResult(await completeLockInTasksAction(doneTaskIds));
    setSaving(false);
  };

  return (
    <div className="grid flex-1 gap-8 py-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-12">
      <div className="flex flex-col items-center text-center">
        <Hourglass progress={frac} running={session.status === "running"} className="h-56 w-auto sm:h-72" />
        <p aria-live="off" className="mt-4 text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
          {clock(elapsed)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {done
            ? "Finished."
            : session.status === "paused"
              ? "Paused."
              : reached
                ? `Goal of ${Math.round(session.goalMs / 60_000)} minutes reached. Keep going or finish when you are ready.`
                : session.goalMs > 0
                  ? `Goal: ${Math.round(session.goalMs / 60_000)} minutes`
                  : "Running"}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {session.status === "running" ? (
            <button type="button" onClick={() => writeSession(pause(session, Date.now()))} className="press rounded-full border-[1.5px] border-foreground px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
              Pause
            </button>
          ) : null}
          {session.status === "paused" ? (
            <button type="button" onClick={() => writeSession(resume(session, Date.now()))} className="press rounded-full bg-inverted px-5 py-2.5 text-sm font-medium text-inverted-foreground">
              Resume
            </button>
          ) : null}
          {!done ? (
            <button type="button" onClick={finishNow} className="press rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-muted">
              Finish
            </button>
          ) : (
            <>
              <button type="button" onClick={keepGoing} className="press rounded-full border-[1.5px] border-foreground px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
                Keep going
              </button>
              <button type="button" onClick={startNew} className="press rounded-full bg-inverted px-5 py-2.5 text-sm font-medium text-inverted-foreground">
                New session
              </button>
            </>
          )}
        </div>
        <p role="status" className="mt-4 text-xs text-muted-foreground">{syncLabel(sync)}</p>
        {done ? (
          <button
            type="button"
            onClick={() => (confirmDiscard ? discard() : setConfirmDiscard(true))}
            onBlur={() => setConfirmDiscard(false)}
            className="press mt-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {confirmDiscard ? "Tap again to discard this session" : "Discard session"}
          </button>
        ) : null}
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{done ? "How it went" : "Checklist"}</h2>
            {summary.total > 0 ? <span className="text-sm tabular-nums text-muted-foreground">{summary.done} of {summary.total} done</span> : null}
          </div>
          {summary.total > 0 ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full bg-foreground transition-[width] duration-500" style={{ width: `${(summary.done / summary.total) * 100}%` }} />
            </div>
          ) : null}
          {summary.total > 0 ? (
            <ul className="mt-4 space-y-2">
              {session.items.map((item) => (
                <li key={item.id} className={`flex items-start gap-1 rounded-xl border-[1.5px] pr-2 transition-colors ${item.done ? "border-border bg-muted/60 text-muted-foreground" : "border-foreground/30 hover:border-foreground"}`}>
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 px-4 py-3.5 text-base">
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} className="mt-1 size-5 accent-foreground" />
                    <span className={`min-w-0 ${item.done ? "line-through" : ""}`}>
                      {item.kind !== "custom" ? <span className="mr-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.kind}</span> : null}
                      {item.text}
                    </span>
                  </label>
                  {!done ? (
                    <button type="button" aria-label={`Remove ${item.text}`} onClick={() => removeItem(item.id)} className="press mt-2.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Icon name="close" className="size-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nothing on the list yet.</p>
          )}
          {!done ? (
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor="lock-in-session-item">Add a checklist item</label>
              <input
                id="lock-in-session-item"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitItem();
                  }
                }}
                maxLength={300}
                placeholder="Add an item and press Enter"
                className={field}
              />
              <button type="button" onClick={submitItem} className="press shrink-0 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">
                Add
              </button>
            </div>
          ) : null}
          {done && doneTaskIds.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={completeTasks} disabled={saving || Boolean(result?.success)} className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80 disabled:opacity-50">
                {saving ? "Saving…" : `Mark ${doneTaskIds.length} ticked task${doneTaskIds.length === 1 ? "" : "s"} done in the CRM`}
              </button>
              {result ? <span role="status" className="text-sm">{result.error ?? result.success}</span> : null}
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <label className="sr-only" htmlFor="lock-in-session-notes">Notes</label>
          <textarea
            id="lock-in-session-notes"
            value={session.notes}
            onChange={(event) => update({ notes: event.target.value })}
            rows={5}
            placeholder="Jot things down as you go."
            className={`${field} mt-3 resize-y leading-6`}
          />
        </section>
      </div>
    </div>
  );
}
