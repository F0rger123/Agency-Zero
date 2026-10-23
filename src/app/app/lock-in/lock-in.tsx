"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatedCheck } from "@/components/animated-check";
import { Icon } from "@/components/icons";
import { DictationHint, MicButton } from "@/components/mic-button";
import { applyDictation } from "@/lib/dictation-text";
import { useDictation, useDictationTarget } from "@/lib/use-dictation";
import {
  addItem,
  changeMode,
  checklistSummary,
  clampMinutes,
  clock,
  displayClock,
  elapsedMs,
  extendGoal,
  finish,
  hasClock,
  goalReached,
  newSessionId,
  parseSession,
  pause,
  reopen,
  resume,
  startSession,
  toRecord,
  type LockInItem,
  type LockInMode,
  type LockInRecord,
  type LockInSession,
} from "@/lib/lock-in";
import { completeLockInTasksAction, getLockInOptionsAction, listLockInSessionsAction, saveLockInSessionAction, type LockInOptions, type SavedSession } from "./actions";
import { Hourglass } from "./hourglass";
import { BigClock, BreathRing, LiveBadge, MODE_INFO, ModeGlyph, TimerRing } from "./visuals";
import { listTodosAction, setTodoDoneAction, type Todo } from "../todos/actions";
import { TodoQuickAdd } from "../todos/todo-quick-add";

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
      {live ? <span aria-label={session.status === "running" ? "Session running" : "Session paused"} className={`size-2 rounded-full bg-foreground ${session.status === "running" ? "lock-in-dot" : ""}`} /> : null}
    </button>
  );
}

function MiniTimer({ session, onOpen }: { session: LockInSession; onOpen: () => void }) {
  const now = useNow();
  const done = session.status === "done";
  const summary = checklistSummary(session.items);
  const text = displayClock(session, now);
  const live = session.status === "running";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Lock In session"
      className={`press fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-full border-[1.5px] border-foreground bg-background px-4 py-2.5 shadow-lg transition-transform hover:-translate-y-0.5 max-sm:bottom-3 max-sm:right-3 ${live ? "lock-in-mini-live" : ""}`}
    >
      <span aria-hidden className={`lock-in-dot size-3 rounded-full bg-foreground ${live ? "" : "lock-in-dot-still"}`} />
      <span className="text-left leading-tight">
        <span className="block text-base font-semibold tabular-nums">
          {text ?? (session.mode === "checklist" ? `${summary.done}/${summary.total || 0} done` : "Locked in")}
          {session.status === "paused" ? " · paused" : done ? " · done" : ""}
        </span>
        {text !== null && summary.total > 0 ? <span className="block text-[11px] text-muted-foreground">{summary.done}/{summary.total} done</span> : null}
        {text === null && session.mode === "checklist" ? <span className="block text-[11px] text-muted-foreground">Working the list</span> : null}
      </span>
    </button>
  );
}

/* ── Full-screen setup / session: always fits the display, nothing scrolls except long lists inside a panel ─────── */

const GOALS = [15, 25, 45, 60, 90, 120];
const field = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";
const noopSubscribe = () => () => {};

const subscribeFullscreen = (callback: () => void) => {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
};
const useFullscreenState = () =>
  useSyncExternalStore(subscribeFullscreen, () => document.fullscreenElement != null, () => false);
/** Browsers on iPhone cannot make a page full screen; the screen still fills the whole display there. */
const useCanFullscreen = () => useSyncExternalStore(noopSubscribe, () => document.fullscreenEnabled === true, () => false);

function LockInScreen({ session, onClose }: { session: LockInSession | null; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreenState();
  const canFullscreen = useCanFullscreen();

  useEffect(() => {
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousBody;
      document.documentElement.style.overscrollBehavior = previousHtml;
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void root.current?.requestFullscreen().catch(() => {});
  };

  const live = session && session.status !== "done";
  return (
    <div ref={root} role="dialog" aria-modal="true" aria-label="Lock In" className="modal-backdrop fixed inset-0 z-[60] h-dvh touch-manipulation overflow-hidden overscroll-none bg-background pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 items-center justify-between gap-3 px-4 sm:px-8">
        <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Lock In</span>
        <div className="flex items-center gap-2">
          {canFullscreen ? (
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={fullscreen}
              className="press flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted"
            >
              <FullscreenIcon exit={fullscreen} />
              <span className="max-sm:sr-only">{fullscreen ? "Exit full screen" : "Full screen"}</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={live ? "Minimize, keep running" : "Close"}
            className="press flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            <span className="max-sm:sr-only">{live ? "Minimize" : "Close"}</span>
            <Icon name="close" className="size-4" />
          </button>
        </div>
      </header>
      <div key={session ? "session" : "setup"} className="h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] overflow-hidden">
        {session ? <SessionView session={session} onExit={onClose} /> : <Setup />}
      </div>
    </div>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden>
      {exit ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </svg>
  );
}

type SetupStep = "mode" | "time" | "list";
const PREVIEW_RING = "size-[min(70vw,30dvh)] landscape:size-[min(60dvh,30rem)]";

/** Step by step (mode → time → checklist) so every step fits the screen. */
function Setup() {
  const [mode, setMode] = useState<LockInMode>("stopwatch");
  const [goal, setGoal] = useState(0);
  const [custom, setCustom] = useState("");
  const [items, setItems] = useState<LockInItem[]>([]);
  const [draft, setDraft] = useState("");
  const [options, setOptions] = useState<LockInOptions | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const dictation = useDictation((phrase) => setDraft((current) => applyDictation(current, phrase)));

  const timed = mode === "stopwatch" || mode === "countdown";
  const steps: SetupStep[] = timed ? ["mode", "time", "list"] : ["mode", "list"];
  const current = steps[Math.min(step, steps.length - 1)];
  const last = current === "list";

  const addCustom = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((existing) => [...existing, { id: newSessionId(), text: text.slice(0, 300), done: false, kind: "custom" }]);
    setDraft("");
  };
  const toggleRef = (kind: "task" | "project" | "todo", refId: string, text: string) =>
    setItems((existing) =>
      existing.some((item) => item.refId === refId)
        ? existing.filter((item) => item.refId !== refId)
        : [...existing, { id: newSessionId(), text, done: false, kind, refId }],
    );
  const loadOptions = async () => {
    setLoading(true);
    const [loaded, todoResult] = await Promise.all([getLockInOptionsAction(), listTodosAction()]);
    setOptions(loaded);
    setTodos(todoResult.todos.filter((todo) => !todo.done));
    setLoading(false);
  };
  const selected = (refId: string) => items.some((item) => item.refId === refId);
  const start = () => {
    dictation.stop();
    const pending = draft.trim();
    const all = pending ? [...items, { id: newSessionId(), text: pending.slice(0, 300), done: false, kind: "custom" as const }] : items;
    const session = startSession(goal, all, "", Date.now(), undefined, mode);
    writeSession(session);
    void syncSession(session);
  };
  const chooseMode = (next: LockInMode) => {
    setMode(next);
    if (next === "countdown" && goal === 0) setGoal(25);
    if (next === "stopwatch" && custom === "" && goal === 25) setGoal(0);
  };

  const preview =
    mode === "stopwatch" || mode === "countdown" ? (
      <TimerRing getState={() => ({ fraction: mode === "countdown" ? 1 : null, orbit: mode === "stopwatch" && goal === 0 ? 0 : null })} running={false} className={PREVIEW_RING}>
        <span className="text-[clamp(2.25rem,9dvh,4.75rem)] font-extralight leading-none tabular-nums tracking-[-0.04em]">{mode === "countdown" ? clock((goal || 25) * 60_000) : "00:00"}</span>
        <span className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{mode === "countdown" ? "to go" : goal > 0 ? `goal ${goal} min` : "counting up"}</span>
      </TimerRing>
    ) : mode === "checklist" ? (
      <TimerRing getState={() => ({ fraction: 0, orbit: null })} running={false} className={PREVIEW_RING}>
        <span className="text-[clamp(2.25rem,9dvh,4.75rem)] font-extralight leading-none tabular-nums tracking-[-0.04em]">0<span className="text-muted-foreground">/{items.length}</span></span>
        <span className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">to do</span>
      </TimerRing>
    ) : (
      <BreathRing running className={PREVIEW_RING}>
        <span className="text-[clamp(1.5rem,5dvh,2.75rem)] font-light leading-tight tracking-tight">Locked in</span>
        <span className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">no timer</span>
      </BreathRing>
    );

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-3 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 landscape:grid landscape:grid-cols-[minmax(0,1fr)_minmax(380px,34rem)] landscape:gap-10">
      <div key={mode} className="lock-in-enter hidden items-center justify-center landscape:flex">{preview}</div>
      <div className="flex min-h-0 flex-1 flex-col">
        <ol className="mb-3 flex items-center gap-2" aria-label="Steps">
          {steps.map((name, index) => (
            <li key={name} aria-current={index === step ? "step" : undefined} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${index <= step ? "bg-foreground" : "bg-muted"}`} />
          ))}
        </ol>

        <div key={current} className="lock-in-enter lock-in-no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {current === "mode" ? (
            <section aria-label="Choose a mode">
              <h2 className="text-xl font-semibold tracking-tight">How do you want to lock in?</h2>
              <div role="radiogroup" aria-label="Lock In mode" className="mt-3 grid grid-cols-2 gap-3">
                {(Object.keys(MODE_INFO) as LockInMode[]).map((key) => {
                  const chosen = mode === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      onClick={() => chooseMode(key)}
                      className={`lock-in-mode-card press relative flex flex-col items-start gap-2.5 rounded-2xl border-[1.5px] p-4 text-left ${chosen ? "border-foreground bg-muted" : "border-border hover:border-foreground/60"}`}
                    >
                      <ModeGlyph mode={key} />
                      <span>
                        <span className="block text-base font-semibold tracking-tight">{MODE_INFO[key].title}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{MODE_INFO[key].blurb}</span>
                      </span>
                      {chosen ? (
                        <span aria-hidden className="az-check-pop absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-5"><PastSessions /></div>
            </section>
          ) : null}

          {current === "time" ? (
            <section aria-label="Set the time" className="flex flex-col items-center text-center">
              <h2 className="text-xl font-semibold tracking-tight">{mode === "countdown" ? "How long?" : "Set a goal?"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{mode === "countdown" ? "It counts down to zero and stops." : "Optional. The ring fills as you get closer."}</p>
              <div key={`${mode}-${goal}`} className="mt-4 landscape:hidden">{preview}</div>
              <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Length">
                {mode === "stopwatch" ? (
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
                ) : null}
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
                    setGoal(event.target.value ? clampMinutes(Number(event.target.value)) : mode === "countdown" ? 25 : 0);
                  }}
                  placeholder="minutes"
                  className={`${field} w-28`}
                />
              </label>
            </section>
          ) : null}

          {current === "list" ? (
            <section aria-label="Checklist">
              <h2 className="text-xl font-semibold tracking-tight">What are you getting done?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Type or talk. You can add more any time during the session.</p>
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
                  placeholder="Add an item and press Enter"
                  className={field}
                />
                <MicButton dictation={dictation} />
                <button type="button" onClick={addCustom} className="press shrink-0 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">
                  Add
                </button>
              </div>
              <DictationHint dictation={dictation} className="mt-2" />
              {items.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="az-item-in flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5 text-sm">
                      <span className="min-w-0">
                        {item.kind !== "custom" ? <span className="mr-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.kind === "todo" ? "to-do" : item.kind}</span> : null}
                        {item.text}
                      </span>
                      <button type="button" aria-label={`Remove ${item.text}`} onClick={() => setItems((existing) => existing.filter((entry) => entry.id !== item.id))} className="press -mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <Icon name="close" className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold tracking-tight">Pull in from your lists</h3>
                  {options ? null : (
                    <button type="button" onClick={loadOptions} disabled={loading} className="press rounded-md border border-border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50">
                      {loading ? "Loading…" : "Choose"}
                    </button>
                  )}
                </div>
                {options?.error ? <p role="alert" className="mt-3 text-sm font-medium">{options.error}</p> : null}
                {options && !options.error ? (
                  <div className="mt-3 space-y-4">
                    <PickList title="To-do list" empty="Nothing on your to-do list." rows={todos.map((todo) => ({ id: todo.id, label: todo.text, sub: null }))} selected={selected} onToggle={(row) => toggleRef("todo", row.id, row.label)} />
                    <PickList title="Tasks" empty="No open tasks." rows={options.tasks.map((task) => ({ id: task.id, label: task.title, sub: task.client }))} selected={selected} onToggle={(row) => toggleRef("task", row.id, row.label)} />
                    <PickList title="Projects" empty="No active projects." rows={options.projects.map((project) => ({ id: project.id, label: project.name, sub: project.client }))} selected={selected} onToggle={(row) => toggleRef("project", row.id, row.label)} />
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-3 pt-3">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} className="press rounded-xl border border-border px-5 py-3.5 text-base transition-colors hover:bg-muted">
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (last ? start() : setStep((value) => Math.min(value + 1, steps.length - 1)))}
            className={`press flex-1 rounded-xl bg-inverted px-6 py-3.5 text-base font-semibold text-inverted-foreground transition-opacity hover:opacity-85 ${last ? "lock-in-cta" : ""}`}
          >
            {last ? MODE_INFO[mode].start : "Next"}
          </button>
        </div>
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

type Tab = "checklist" | "todo" | "notes";

function SessionView({ session, onExit }: { session: LockInSession; onExit: () => void }) {
  const now = useNow();
  const sync = useSyncState();
  const elapsed = elapsedMs(session, now);
  const done = session.status === "done";
  const summary = checklistSummary(session.items);
  const reached = goalReached(session, now);
  const allDone = summary.total > 0 && summary.done === summary.total;
  const timed = hasClock(session.mode);
  const clockText = displayClock(session, now);
  const [tab, setTab] = useState<Tab>("checklist");
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [editingTimer, setEditingTimer] = useState(false);
  const { dictation, toggleFor, activeTarget } = useDictationTarget<"item" | "notes">((target, phrase) => {
    const current = getSession();
    if (!current) return;
    if (target === "item") setDraft((text) => applyDictation(text, phrase));
    else writeSession({ ...current, notes: applyDictation(current.notes, phrase) });
  });

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
  const toggleItem = (id: string, next: boolean) => {
    const item = session.items.find((entry) => entry.id === id);
    update({ items: session.items.map((entry) => (entry.id === id ? { ...entry, done: next } : entry)) });
    // A to-do ticked in the session is ticked in the to-do list too.
    if (item?.kind === "todo" && item.refId) void setTodoDoneAction(item.refId, next);
  };
  const removeItem = (id: string) => update({ items: session.items.filter((item) => item.id !== id) });
  const submitItem = () => {
    if (!draft.trim()) return;
    writeSession(addItem(session, draft));
    setDraft("");
  };
  const addTodoToSession = (todos: Todo[]) => {
    const current = getSession();
    if (!current) return;
    const fresh = todos.filter((todo) => !current.items.some((item) => item.refId === todo.id));
    if (fresh.length === 0) return;
    writeSession({
      ...current,
      items: [...current.items, ...fresh.map((todo): LockInItem => ({ id: newSessionId(), text: todo.text, done: false, kind: "todo", refId: todo.id }))],
    });
  };
  const doneTaskIds = session.items.filter((item) => item.done && item.kind === "task" && item.refId).map((item) => item.refId as string);

  const finishNow = () => {
    dictation.stop();
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

  const tabs: [Tab, string][] = [
    ["checklist", summary.total > 0 ? `Checklist ${summary.done}/${summary.total}` : "Checklist"],
    ["todo", "To-do list"],
    ["notes", "Notes"],
  ];

  const getRing = () => {
    const current = getSession() ?? session;
    const worked = elapsedMs(current, Date.now());
    if (current.mode === "countdown" && current.goalMs > 0) return { fraction: Math.max(0, 1 - worked / current.goalMs), orbit: null };
    if (current.mode === "stopwatch") return current.goalMs > 0 ? { fraction: Math.min(1, worked / current.goalMs), orbit: null } : { fraction: null, orbit: (worked % 60_000) / 60_000 };
    if (current.mode === "checklist") {
      const counts = checklistSummary(current.items);
      return { fraction: counts.total > 0 ? counts.done / counts.total : 0, orbit: null };
    }
    return { fraction: null, orbit: null };
  };
  const longClock = (clockText ?? "").length > 5;
  const clockClass = longClock
    ? "text-[clamp(2rem,min(10vw,5.5dvh),4rem)] landscape:text-[clamp(2.75rem,9dvh,5.5rem)]"
    : "text-[clamp(2.75rem,min(15vw,8dvh),6rem)] landscape:text-[clamp(3.5rem,13dvh,8rem)]";
  const caption = done
    ? "finished"
    : session.status === "paused"
      ? "paused"
      : session.mode === "countdown"
        ? reached
          ? "time is up"
          : "left"
        : session.goalMs > 0
          ? reached
            ? "goal reached"
            : `of ${Math.round(session.goalMs / 60_000)} min`
          : "elapsed";
  const ringSize = "size-[min(72vw,36dvh)] landscape:size-[min(64dvh,34rem)] shrink-0";
  const running = session.status === "running";

  return (
    <div className="lock-in-enter relative mx-auto grid h-full w-full max-w-[1500px] grid-rows-[auto_minmax(0,1fr)] gap-4 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 landscape:grid-cols-[minmax(0,1fr)_minmax(360px,30rem)] landscape:grid-rows-1 landscape:gap-12">
      <div className="relative flex flex-col items-center gap-4 text-center [justify-content:safe_center] landscape:min-h-0">
        <LiveBadge mode={session.mode} status={session.status} />
        {timed ? (
          <TimerRing getState={getRing} running={running} className={ringSize}>
            <BigClock text={clockText ?? "00:00"} paused={session.status === "paused"} className={clockClass} />
            <span className="mt-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{caption}</span>
          </TimerRing>
        ) : session.mode === "checklist" ? (
          <TimerRing getState={getRing} running={false} className={ringSize}>
            <span className={`font-extralight leading-none tabular-nums tracking-[-0.04em] ${clockClass}`}>
              {summary.done}
              <span className="text-muted-foreground/60">/{summary.total}</span>
            </span>
            <span className="mt-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{allDone ? "all done" : done ? clock(elapsed) : "done"}</span>
          </TimerRing>
        ) : (
          <BreathRing running={running} className={ringSize}>
            <span className="text-[clamp(1.75rem,6dvh,3.25rem)] font-light leading-tight tracking-tight">{done ? "Done" : "Locked in"}</span>
            <span className="mt-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{done ? `for ${clock(elapsed)}` : "no timer"}</span>
          </BreathRing>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {timed && !done ? (
            <button
              type="button"
              aria-label={running ? "Pause" : "Resume"}
              onClick={() => writeSession(running ? pause(session, Date.now()) : resume(session, Date.now()))}
              className="press grid size-16 place-items-center rounded-full bg-inverted text-inverted-foreground shadow-sm transition-transform active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
                {running ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
              </svg>
            </button>
          ) : null}
          {session.mode === "countdown" && !done && reached ? (
            <>
              <button type="button" onClick={() => writeSession(extendGoal(session, 5))} className="press h-11 rounded-full border border-foreground px-5 text-sm font-medium transition-colors hover:bg-muted">
                +5 min
              </button>
              <button type="button" onClick={() => writeSession(extendGoal(session, 15))} className="press h-11 rounded-full border border-border px-5 text-sm transition-colors hover:bg-muted">
                +15 min
              </button>
            </>
          ) : null}
          {!done ? (
            <button type="button" onClick={finishNow} className={`press h-11 rounded-full px-6 text-sm font-medium transition-colors ${timed ? "border border-border hover:bg-muted" : "bg-inverted text-inverted-foreground"}`}>
              Finish
            </button>
          ) : (
            <>
              <button type="button" onClick={keepGoing} className="press h-11 rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-muted">
                Keep going
              </button>
              <button type="button" onClick={startNew} className="press h-11 rounded-full bg-inverted px-6 text-sm font-medium text-inverted-foreground">
                New session
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {!done ? (
            <button type="button" onClick={() => setEditingTimer(true)} className="press hover:text-foreground">
              Edit timer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (confirmDiscard ? discard() : setConfirmDiscard(true))}
              onBlur={() => setConfirmDiscard(false)}
              className="press hover:text-foreground"
            >
              {confirmDiscard ? "Tap again to discard" : "Discard session"}
            </button>
          )}
          <span aria-hidden>·</span>
          <span role="status">{syncLabel(sync)}</span>
        </div>
        {editingTimer ? (
          <div className="lock-in-enter absolute inset-0 z-20 grid place-items-center bg-background/90 backdrop-blur-sm">
            <TimerEditor
              session={session}
              now={now}
              onCancel={() => setEditingTimer(false)}
              onApply={(mode, minutes) => {
                writeSession(changeMode(session, mode, minutes, Date.now()));
                setEditingTimer(false);
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-col landscape:border-l landscape:border-border landscape:pl-8">
        <div role="tablist" aria-label="Session panels" className="mb-2 flex shrink-0 gap-6 border-b border-border text-sm">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 py-2.5 transition-colors ${tab === key ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="lock-in-no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {tab === "checklist" ? (
            <section>
              {allDone ? <p className="py-2 text-sm text-muted-foreground">Everything is done. {done ? "Nice work." : "Add more, or finish when you are ready."}</p> : null}
              {summary.total > 0 ? (
                <ul className="divide-y divide-border">
                  {session.items.map((item) => (
                    <ChecklistRow key={item.id} item={item} locked={done} onToggle={(next) => toggleItem(item.id, next)} onRemove={() => removeItem(item.id)} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing on the list yet.</p>
              )}
              {!done ? (
                <>
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
                    <MicButton dictation={dictation} active={activeTarget === "item"} onClick={() => toggleFor("item")} />
                    <button type="button" onClick={submitItem} className="press shrink-0 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">
                      Add
                    </button>
                  </div>
                  <DictationHint dictation={dictation} className="mt-2" />
                </>
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
          ) : null}

          {tab === "todo" ? <SessionTodos session={session} disabled={done} onAdd={addTodoToSession} onToggleInSession={(refId, next) => {
            const current = getSession();
            const item = current?.items.find((entry) => entry.refId === refId);
            if (current && item) writeSession({ ...current, items: current.items.map((entry) => (entry.id === item.id ? { ...entry, done: next } : entry)) });
          }} /> : null}

          {tab === "notes" ? (
            <section>
              <label className="sr-only" htmlFor="lock-in-session-notes">Notes</label>
              <div className="relative">
                <textarea
                  id="lock-in-session-notes"
                  value={session.notes}
                  onChange={(event) => update({ notes: event.target.value })}
                  rows={10}
                  placeholder="Jot things down as you go. Type or talk."
                  className={`${field} resize-y pr-14 leading-6`}
                />
                <MicButton dictation={dictation} active={activeTarget === "notes"} onClick={() => toggleFor("notes")} className="absolute right-3 top-3" />
              </div>
              <DictationHint dictation={dictation} className="mt-2" />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Change the timer while you work: count down, count up, or no timer at all. The time already worked is kept. */
function TimerEditor({ session, now, onApply, onCancel }: { session: LockInSession; now: number; onApply: (mode: LockInMode, minutes: number) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<LockInMode>(session.mode);
  const left = Math.max(1, Math.round((session.goalMs - elapsedMs(session, now)) / 60_000));
  const [minutes, setMinutes] = useState(session.mode === "countdown" ? String(left) : session.mode === "stopwatch" && session.goalMs > 0 ? String(Math.round(session.goalMs / 60_000)) : "");
  const options: [LockInMode, string][] = [
    ["countdown", "Count down"],
    ["stopwatch", "Count up"],
    ["free", "Locked, no timer"],
    ["checklist", "To-do list"],
  ];
  return (
    <div className="w-[min(92%,22rem)] rounded-2xl border-[1.5px] border-foreground/25 bg-background p-4 text-left shadow-xl">
      <p className="text-sm font-semibold tracking-tight">Edit timer</p>
      <div role="radiogroup" aria-label="Timer type" className="mt-3 grid grid-cols-2 gap-2">
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={mode === key}
            onClick={() => {
              setMode(key);
              if (key === "countdown" && !minutes) setMinutes("25");
            }}
            className={`press rounded-xl border px-3 py-2 text-sm transition-colors ${mode === key ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {text}
          </button>
        ))}
      </div>
      {mode === "countdown" || mode === "stopwatch" ? (
        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          {mode === "countdown" ? "Minutes left, from now" : "Goal in total minutes (optional)"}
          <input type="number" inputMode="numeric" min={mode === "countdown" ? 1 : 0} max={720} value={minutes} onChange={(event) => setMinutes(event.target.value)} placeholder={mode === "countdown" ? "25" : "No goal"} className={`${field} mt-1`} />
        </label>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">Time already worked is kept.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => onApply(mode, Number(minutes) || 0)} className="press rounded-full bg-inverted px-5 py-2 text-sm font-medium text-inverted-foreground">Apply</button>
        <button type="button" onClick={onCancel} className="press rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">Cancel</button>
      </div>
    </div>
  );
}

function ChecklistRow({ item, locked, onToggle, onRemove }: { item: LockInItem; locked: boolean; onToggle: (next: boolean) => void; onRemove: () => void }) {
  const [flashing, setFlashing] = useState(false);
  return (
    <li className={`flex items-start gap-3 py-3 transition-colors ${flashing ? "az-row-flash" : ""} ${item.done ? "text-muted-foreground" : ""}`}>
      <span className="mt-0.5">
        <AnimatedCheck
          checked={item.done}
          label={`${item.done ? "Mark not done" : "Mark done"}: ${item.text}`}
          onChange={(next) => {
            if (next) {
              setFlashing(true);
              window.setTimeout(() => setFlashing(false), 900);
            }
            onToggle(next);
          }}
        />
      </span>
      <span className="min-w-0 flex-1 break-words text-base leading-7">
        {item.kind !== "custom" ? <span className="mr-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{item.kind === "todo" ? "to-do" : item.kind}</span> : null}
        <span data-done={item.done} className="az-strike">{item.text}</span>
      </span>
      {!locked ? (
        <button type="button" aria-label={`Remove ${item.text}`} onClick={onRemove} className="press -mr-1 mt-0.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
          <Icon name="close" className="size-4" />
        </button>
      ) : null}
    </li>
  );
}

/** The general to-do list, inside a session: add to it, tick things off, or put an item on this session's checklist. */
function SessionTodos({
  session,
  disabled,
  onAdd,
  onToggleInSession,
}: {
  session: LockInSession;
  disabled: boolean;
  onAdd: (todos: Todo[]) => void;
  onToggleInSession: (refId: string, next: boolean) => void;
}) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [error, setError] = useState("");
  const [alsoChecklist, setAlsoChecklist] = useState(true);

  useEffect(() => {
    let live = true;
    listTodosAction().then((result) => {
      if (!live) return;
      if (result.error) setError(result.error);
      setTodos(result.todos.filter((todo) => !todo.done));
    });
    return () => {
      live = false;
    };
  }, []);

  const inSession = (id: string) => session.items.some((item) => item.refId === id);
  const tick = async (todo: Todo, next: boolean) => {
    setTodos((current) => (current ?? []).map((item) => (item.id === todo.id ? { ...item, done: next } : item)));
    onToggleInSession(todo.id, next);
    const result = await setTodoDoneAction(todo.id, next);
    if (result.error) setError(result.error);
  };

  if (todos === null) return <p className="text-sm text-muted-foreground">Loading your to-do list…</p>;
  return (
    <section className="space-y-4">
      {error ? <p role="alert" className="text-sm font-medium">{error}</p> : null}
      {error && /0031/.test(error) ? null : (
        <>
          <TodoQuickAdd
            placeholder="Add to your to-do list"
            onAdded={(added) => {
              setTodos((current) => [...added, ...(current ?? [])]);
              if (alsoChecklist && !disabled) onAdd(added);
            }}
          />
          {disabled ? null : (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={alsoChecklist} onChange={(event) => setAlsoChecklist(event.target.checked)} className="size-4 accent-foreground" />
              Also put new items on this session&apos;s checklist
            </label>
          )}
          {todos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your to-do list is empty.</p>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li key={todo.id} className={`flex items-start gap-3 rounded-xl border-[1.5px] px-4 py-3 ${todo.done ? "border-border text-muted-foreground" : "border-foreground/30"}`}>
                  <span className="mt-0.5">
                    <AnimatedCheck checked={todo.done} label={`${todo.done ? "Mark not done" : "Mark done"}: ${todo.text}`} onChange={(next) => void tick(todo, next)} />
                  </span>
                  <span className="min-w-0 flex-1 break-words text-base leading-7"><span data-done={todo.done} className="az-strike">{todo.text}</span></span>
                  {!disabled && !todo.done && !inSession(todo.id) ? (
                    <button type="button" onClick={() => onAdd([todo])} className="press shrink-0 rounded-md border border-border px-2.5 py-1 text-xs transition-colors hover:bg-muted">
                      + Checklist
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
