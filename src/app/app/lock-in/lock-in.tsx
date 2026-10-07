"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import {
  checklistSummary,
  clampMinutes,
  clock,
  finish,
  parseSession,
  pause,
  progress,
  remainingMs,
  resume,
  startSession,
  tick,
  type LockInItem,
  type LockInSession,
} from "@/lib/lock-in";
import { completeLockInTasksAction, getLockInOptionsAction, type LockInOptions } from "./actions";
import { Hourglass } from "./hourglass";

/* ── Session store: localStorage, so a session survives navigation and reloads ───────────────── */

const KEY = "az-lock-in";
const listeners = new Set<() => void>();
let memoryRaw: string | null = null;
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

function chime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      const audio = new Ctx();
      [0, 0.25, 0.5].forEach((offset, index) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = 660 + index * 110;
        gain.gain.setValueAtTime(0.0001, audio.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + offset + 0.22);
        osc.connect(gain).connect(audio.destination);
        osc.start(audio.currentTime + offset);
        osc.stop(audio.currentTime + offset + 0.25);
      });
    }
    navigator.vibrate?.([200, 100, 200]);
  } catch {
    // Sound is a nicety; the screen already shows the result.
  }
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/* ── Provider: keeps the session ticking everywhere in the CRM ──────────────────────────────── */

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

  // Finish the session when the time runs out, whichever page the owner is on.
  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => {
      const current = getSession();
      if (!current) return;
      const next = tick(current, Date.now());
      if (next !== current) {
        writeSession(next);
        chime();
      }
    }, 500);
    return () => window.clearInterval(timer);
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

/** The home-screen card. */
export function LockInWidget() {
  const ctx = useLockIn();
  const session = useStoredSession();
  const live = session && session.status !== "done";
  return (
    <button
      type="button"
      onClick={ctx?.open}
      className="press group flex h-full min-h-40 w-full flex-col justify-between rounded-2xl border-[1.5px] border-foreground/30 bg-background p-6 text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg"
    >
      <span className="flex items-start justify-between">
        <span className="flex size-12 items-center justify-center rounded-full border border-border transition-transform duration-300 group-hover:rotate-180">
          <Hourglass progress={0.5} running={false} className="size-6" />
        </span>
        {live ? <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">{session.status === "running" ? "Running" : "Paused"}</span> : null}
      </span>
      <span>
        <span className="block text-xl font-semibold tracking-tight">Lock In</span>
        <span className="mt-1 block text-sm text-muted-foreground">{live ? "Back to your session." : "Set a timer and a checklist. Get it done."}</span>
      </span>
    </button>
  );
}

function MiniTimer({ session, onOpen }: { session: LockInSession; onOpen: () => void }) {
  const now = useNow();
  const left = remainingMs(session, now);
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
        <span className="block text-base font-semibold tabular-nums">{done ? "Time's up" : clock(left)}</span>
        {summary.total > 0 ? <span className="block text-[11px] text-muted-foreground">{summary.done}/{summary.total} done</span> : null}
      </span>
    </button>
  );
}

/* ── Full-screen setup / session / summary ──────────────────────────────────────────────────── */

const PRESETS = [15, 25, 45, 60, 90, 120];
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

  return (
    <div role="dialog" aria-modal="true" aria-label="Lock In" className="modal-backdrop fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 pb-10 pt-4 sm:px-8">
        <div className="flex items-center justify-between py-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Lock In</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={session && session.status !== "done" ? "Minimize, keep running" : "Close"}
            className="press flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            {session && session.status !== "done" ? "Minimize" : "Close"}
            <Icon name="close" className="size-4" />
          </button>
        </div>
        {session ? <SessionView session={session} onExit={onClose} /> : <Setup />}
      </div>
    </div>
  );
}

function Setup() {
  const [minutes, setMinutes] = useState(25);
  const [custom, setCustom] = useState("");
  const [items, setItems] = useState<LockInItem[]>([]);
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [options, setOptions] = useState<LockInOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const addCustom = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((current) => [...current, { id: newId(), text: text.slice(0, 300), done: false, kind: "custom" }]);
    setDraft("");
  };
  const toggleRef = (kind: "task" | "project", refId: string, text: string) =>
    setItems((current) =>
      current.some((item) => item.refId === refId)
        ? current.filter((item) => item.refId !== refId)
        : [...current, { id: newId(), text, done: false, kind, refId }],
    );
  const loadOptions = async () => {
    setLoading(true);
    setOptions(await getLockInOptionsAction());
    setLoading(false);
  };
  const selected = (refId: string) => items.some((item) => item.refId === refId);
  const start = () => {
    const pending = draft.trim();
    const all = pending ? [...items, { id: newId(), text: pending.slice(0, 300), done: false, kind: "custom" as const }] : items;
    writeSession(startSession(minutes, all, notes, Date.now()));
  };

  return (
    <div className="grid flex-1 gap-8 py-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-12">
      <div className="flex flex-col items-center text-center">
        <Hourglass progress={0} running={false} className="h-48 w-auto sm:h-64" />
        <p className="mt-4 text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">{clock(minutes * 60_000)}</p>
        <p className="mt-1 text-sm text-muted-foreground">How long are you locking in for?</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Duration">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={minutes === preset && !custom}
              onClick={() => {
                setMinutes(preset);
                setCustom("");
              }}
              className={`press rounded-full border px-4 py-2 text-sm transition-colors ${minutes === preset && !custom ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
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
            max={480}
            value={custom}
            onChange={(event) => {
              setCustom(event.target.value);
              if (event.target.value) setMinutes(clampMinutes(Number(event.target.value)));
            }}
            placeholder="minutes"
            className={`${field} w-28`}
          />
        </label>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold tracking-tight">What are you getting done?</h2>
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
              <PickList
                title="Tasks"
                empty="No open tasks."
                rows={options.tasks.map((task) => ({ id: task.id, label: task.title, sub: task.client }))}
                selected={selected}
                onToggle={(row) => toggleRef("task", row.id, row.label)}
              />
              <PickList
                title="Projects"
                empty="No active projects."
                rows={options.projects.map((project) => ({ id: project.id, label: project.name, sub: project.client }))}
                selected={selected}
                onToggle={(row) => toggleRef("project", row.id, row.label)}
              />
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
          <label className="sr-only" htmlFor="lock-in-notes">Notes</label>
          <textarea id="lock-in-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Anything you want in front of you while you work." className={`${field} mt-3 resize-y leading-6`} />
        </section>

        <button type="button" onClick={start} className="press w-full rounded-xl bg-inverted px-6 py-4 text-base font-semibold text-inverted-foreground transition-opacity hover:opacity-85 sm:w-auto sm:min-w-56">
          Start {clock(minutes * 60_000)}
        </button>
      </div>
    </div>
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
  const left = remainingMs(session, now);
  const frac = progress(session, now);
  const done = session.status === "done";
  const summary = checklistSummary(session.items);
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Keep the tab title useful while you work in another window.
  useEffect(() => {
    if (session.status === "done") return;
    const title = document.title;
    const timer = window.setInterval(() => {
      const current = getSession();
      if (current) document.title = `${clock(remainingMs(current, Date.now()))} · Lock In`;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.title = title;
    };
  }, [session.status]);

  const update = (patch: Partial<LockInSession>) => writeSession({ ...session, ...patch });
  const toggleItem = (id: string) => update({ items: session.items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)) });
  const doneTaskIds = session.items.filter((item) => item.done && item.kind === "task" && item.refId).map((item) => item.refId as string);

  const completeTasks = async () => {
    setSaving(true);
    setResult(await completeLockInTasksAction(doneTaskIds));
    setSaving(false);
  };
  const end = () => {
    writeSession(null);
    onExit();
  };

  return (
    <div className="grid flex-1 gap-8 py-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:gap-12">
      <div className="flex flex-col items-center text-center">
        <Hourglass progress={frac} running={session.status === "running"} className="h-56 w-auto sm:h-72" />
        <p aria-live="off" className="mt-4 text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
          {done ? "00:00" : clock(left)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {done ? "Time's up." : session.status === "paused" ? "Paused." : `${Math.round(frac * 100)}% of ${Math.round(session.durationMs / 60_000)} minutes used`}
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
            <button type="button" onClick={() => writeSession(finish(session))} className="press rounded-full border border-border px-5 py-2.5 text-sm transition-colors hover:bg-muted">
              Finish now
            </button>
          ) : null}
          <button type="button" onClick={end} className="press rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            {done ? "Start over" : "End session"}
          </button>
        </div>
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
          {summary.total === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No checklist for this session.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {session.items.map((item) => (
                <li key={item.id}>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5 text-base transition-colors ${item.done ? "border-border bg-muted/60 text-muted-foreground" : "border-foreground/30 hover:border-foreground"}`}>
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} className="mt-1 size-5 accent-foreground" />
                    <span className={`min-w-0 ${item.done ? "line-through" : ""}`}>
                      {item.kind !== "custom" ? <span className="mr-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.kind}</span> : null}
                      {item.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
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
