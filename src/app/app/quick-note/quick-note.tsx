"use client";

import { Component, useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { useOnline } from "@/components/offline";
import type { NoteContext, ProposedAction } from "@/lib/quick-note";
import { applyNoteActionsAction, organizeNoteAction, type ApplyState, type OrganizeState } from "./actions";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground";

const dollars = (n: number) => `$${n.toFixed(2)}`;

function describe(action: ProposedAction): { label: string; detail: string } {
  switch (action.type) {
    case "create_client":
      return { label: "New customer", detail: [action.name, action.company, action.email, action.phone].filter(Boolean).join(" · ") };
    case "create_project":
      return {
        label: "New project",
        detail: [action.name, action.status.replace("_", " "), action.deadline ? `due ${action.deadline}` : "", action.value !== null ? dollars(action.value) : "", action.description].filter(Boolean).join(" · "),
      };
    case "create_task":
      return {
        label: `New task · ${action.status.replaceAll("_", " ")}`,
        detail: [action.title, action.description, action.due_date ? `due ${action.due_date}` : ""].filter(Boolean).join(" — "),
      };
    case "update_task":
      return {
        label: "Update task",
        detail: [action.status ? `status ${action.status.replaceAll("_", " ")}` : "", action.priority ? `priority ${action.priority}` : "", action.due_date ? `due ${action.due_date}` : "", action.note].filter(Boolean).join(" · "),
      };
    case "update_project":
      return {
        label: "Update project",
        detail: [action.progress !== null ? `progress ${action.progress}%` : "", action.status ? `status ${action.status.replace("_", " ")}` : ""].filter(Boolean).join(", "),
      };
    case "note":
      return { label: "Add note", detail: action.body };
    case "payment":
      return { label: "Record payment", detail: `${dollars(action.amount)} · ${action.description} · ${action.method.replace("_", " ")}` };
    case "invoice":
      return { label: action.status === "draft" ? "Draft invoice" : "New invoice", detail: `${action.title} · ${dollars(action.amount)}${action.due_on ? ` · due ${action.due_on}` : ""}` };
    case "service":
      return { label: action.billing === "recurring" ? "Recurring service" : "One-time service", detail: action.amount !== null ? `${dollars(action.amount)}${action.billing === "recurring" ? ` ${action.interval}` : ""}` : "No price set" };
    case "reminder":
      return { label: "Reminder", detail: `${action.message} · ${action.due_at.replace("T", " ")}` };
  }
}

/** Which proposals are about a client the owner can still pick (not a brand-new one from the same note). */
function pickableClient(action: ProposedAction): action is ProposedAction & { client_id: string | null; client_ref: string | null } {
  return "client_ref" in action && !action.client_ref;
}

function Review({ initial, context, ai, onDone }: { initial: ProposedAction[]; context: NoteContext; ai: boolean; onDone: () => void }) {
  const [items, setItems] = useState(() => initial.map((action) => ({ action, include: true })));
  const [state, apply, pending] = useActionState<ApplyState, FormData>(applyNoteActionsAction, {});
  const included = items.filter((item) => item.include).map((item) => item.action);
  const needsClient = included.some((a) => ["note", "payment", "invoice", "service", "create_project"].includes(a.type) && pickableClient(a) && !a.client_id);

  const setClient = (index: number, clientId: string) =>
    setItems((current) =>
      current.map((item, position) => {
        if (position !== index || !pickableClient(item.action)) return item;
        return { ...item, action: { ...item.action, client_id: clientId || null } as ProposedAction };
      }),
    );

  if (state.success) {
    return (
      <div className="space-y-5">
        <p role="status" className="text-sm font-medium">{state.success}</p>
        <button type="button" onClick={onDone} className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground">
          Done
        </button>
      </div>
    );
  }

  return (
    <form action={apply} className="space-y-5">
      <input type="hidden" name="actions" value={JSON.stringify(included)} />
      <p className="text-sm text-muted-foreground">
        {ai ? "Here is what I will do." : "AI is not set up yet, so this is the simple version: it keeps your words as a note and spots payments and percentages. To create customers, projects and tasks from a sentence, add the ANTHROPIC_API_KEY secret."} Nothing is saved until you press Save.
      </p>
      {items.length === 0 ? <p className="text-sm">Nothing to do from that note.</p> : null}
      <ul className="space-y-3">
        {items.map(({ action, include }, index) => {
          const { label, detail } = describe(action);
          const clientId = pickableClient(action) ? action.client_id : null;
          const forNew = "client_ref" in action && Boolean(action.client_ref);
          return (
            <li key={index} className={`rounded-lg border p-4 transition-colors ${include ? "border-foreground" : "border-border opacity-60"}`}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={include}
                  onChange={(event) => setItems((current) => current.map((item, position) => (position === index ? { ...item, include: event.target.checked } : item)))}
                  className="mt-1 size-4 accent-foreground"
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className="mt-1 block whitespace-pre-wrap text-sm leading-6">{detail}</span>
                </span>
              </label>
              {forNew && include ? <p className="mt-2 pl-7 text-xs text-muted-foreground">For the new customer above.</p> : null}
              {pickableClient(action) && include ? (
                <div className="mt-3 pl-7">
                  <label className="sr-only" htmlFor={`qn-client-${index}`}>Client</label>
                  <select id={`qn-client-${index}`} value={clientId ?? ""} onChange={(event) => setClient(index, event.target.value)} className={field}>
                    <option value="">{action.type === "create_task" || action.type === "reminder" ? "No client" : "Choose a client"}</option>
                    {context.clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.company ? ` · ${client.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending || included.length === 0 || needsClient}
          className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Saving…" : `Save ${included.length || ""}`.trim()}
        </button>
        <button type="button" onClick={onDone} className="press rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted">
          Back
        </button>
        {needsClient ? <span className="text-xs text-muted-foreground">Pick a client for each item that needs one.</span> : null}
        {state.error ? <span role="alert" className="text-sm font-medium">{state.error}</span> : null}
      </div>
    </form>
  );
}

const DRAFT_KEY = "az-note-drafts";

function readDrafts(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 30) : [];
  } catch {
    return [];
  }
}

function writeDrafts(list: string[]) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(list));
  } catch {
    // Storage blocked: the draft only lives until the dialog closes.
  }
}

function NoteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const [state, organize, pending] = useActionState<OrganizeState, FormData>(organizeNoteAction, {});
  const [reviewKey, setReviewKey] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const supported = typeof window !== "undefined" && recognitionCtor() !== null;
  const online = useOnline();
  // Notes written with no connection wait here until there is one to organise them.
  const [drafts, setDrafts] = useState<string[]>(readDrafts);
  const [savedNotice, setSavedNotice] = useState("");

  const stop = useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    setListening(false);
  }, []);

  // The dialog is only mounted while open, so unmounting is the moment to release the microphone.
  useEffect(() => () => recognition.current?.stop(), []);

  const toggle = () => {
    if (listening) return stop();
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setVoiceError("");
    const instance = new Ctor();
    instance.lang = "en-US";
    instance.continuous = true;
    instance.interimResults = false;
    instance.onresult = (event) => {
      let spoken = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) spoken += event.results[i][0].transcript;
      }
      if (spoken) setText((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}${spoken.trim()}`);
    };
    instance.onerror = (event) => {
      setVoiceError(event.error === "not-allowed" ? "Microphone access was blocked. Allow it in your browser, or just type." : "Voice typing stopped. Try again.");
      setListening(false);
    };
    instance.onend = () => setListening(false);
    recognition.current = instance;
    instance.start();
    setListening(true);
  };

  const showReview = reviewing && state.actions && state.context;

  return (
    <Modal open={open} onClose={onClose} title="Quick note" description="Say what happened or what you want done. I will turn it into customers, projects, tasks, notes, payments, invoices and reminders for you to confirm.">
      {showReview ? (
        <Review
          key={reviewKey}
          initial={state.actions!}
          context={state.context!}
          ai={Boolean(state.ai)}
          onDone={() => {
            setReviewing(false);
            if (state.actions) setText("");
          }}
        />
      ) : (
        <form
          action={(formData) => {
            stop();
            if (!navigator.onLine) {
              const next = [...drafts, text.trim()];
              writeDrafts(next);
              setDrafts(next);
              setText("");
              setSavedNotice("Saved on this device. Open Quick note again when you are back online to organise it.");
              return;
            }
            setSavedNotice("");
            setReviewKey((key) => key + 1);
            setReviewing(true);
            organize(formData);
          }}
          className="space-y-4"
        >
          <div className="relative">
            <label htmlFor="quick-note-text" className="sr-only">Your note</label>
            <textarea
              id="quick-note-text"
              name="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={7}
              placeholder={`“Acme Bakery paid me $400 for the website. Started the logo task, I'm 50% done, they want a warmer red.”`}
              className={`${field} resize-y pr-14 leading-6`}
            />
            {supported ? (
              <button
                type="button"
                onClick={toggle}
                aria-pressed={listening}
                aria-label={listening ? "Stop voice typing" : "Start voice typing"}
                className={`press absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border transition-colors ${
                  listening ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"
                }`}
              >
                <Icon name="mic" className={`size-5 ${listening ? "animate-pulse" : ""}`} />
              </button>
            ) : null}
          </div>
          {drafts.length > 0 && online ? (
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Saved while offline</p>
              <ul className="mt-2 space-y-2">
                {drafts.map((draft, index) => (
                  <li key={index} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{draft}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = drafts.filter((_, position) => position !== index);
                        writeDrafts(next);
                        setDrafts(next);
                        setText((current) => (current ? `${current} ${draft}` : draft));
                      }}
                      className="press shrink-0 text-xs underline underline-offset-4"
                    >
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {savedNotice ? <p role="status" className="text-sm font-medium">{savedNotice}</p> : null}
          {listening ? <p role="status" className="text-xs text-muted-foreground">Listening… tap the mic again when you are done.</p> : null}
          {!supported ? <p className="text-xs text-muted-foreground">Voice typing is not available in this browser. Use your keyboard&apos;s microphone key, or type.</p> : null}
          {voiceError ? <p role="alert" className="text-xs font-medium">{voiceError}</p> : null}
          {state.error && !pending ? <p role="alert" className="text-sm font-medium">{state.error}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Organising…" : online ? "Organise" : "Save for later"}
            </button>
            <button type="button" onClick={onClose} className="press rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** A failure inside the dialog must never take the whole CRM down with it. */
class NoteBoundary extends Component<{ children: ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Modal open onClose={this.props.onClose} title="Quick note">
        <p className="text-sm leading-6">Quick note ran into a problem on this device. Nothing was saved. Close this and try again.</p>
        <button type="button" onClick={this.props.onClose} className="press mt-5 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted">
          Close
        </button>
      </Modal>
    );
  }
}

/** The top-bar button that opens the quick-note dialog. The mic wobbles and a ring pulses on hover. */
export function QuickNote() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press group inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-medium transition-[background-color,border-color] hover:border-foreground hover:bg-muted"
      >
        <span className="relative flex size-4 items-center justify-center">
          <span aria-hidden className="mic-ring absolute inset-[-6px] rounded-full border border-foreground opacity-0" />
          <Icon name="mic" className="mic-icon relative size-4" />
        </span>
        <span className="max-sm:sr-only">Quick note</span>
      </button>
      {open ? (
        <NoteBoundary onClose={close}>
          <NoteDialog open={open} onClose={close} />
        </NoteBoundary>
      ) : null}
    </>
  );
}
