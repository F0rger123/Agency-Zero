"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { Icon } from "@/components/icons";
import { useOnline } from "@/components/offline";
import { openItemsToConvert, type ActionItem, type Meeting, type MeetingQuestion } from "@/lib/meetings";
import { useDictation } from "@/lib/use-dictation";
import { applyDictation } from "@/lib/dictation-text";
import { DictationHint, MicButton } from "@/components/mic-button";
import type { ActionState } from "@/lib/forms";
import { recoverIfStale } from "@/lib/stale-build";
import { deleteMeetingAction, meetingTasksAction, saveMeetingAction, setMeetingStatusAction } from "./actions";

const initialState: ActionState = {};
const field = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

type Draft = { notes: string; decisions: string; attendees: string; agenda: string; actionItems: ActionItem[]; questions: MeetingQuestion[]; scratchpad: string; dirty: boolean };
const draftKey = (id: string) => `az-meeting-${id}`;

function readDraft(meeting: Meeting): Draft {
  const fromServer: Draft = {
    notes: meeting.notes,
    decisions: meeting.decisions ?? "",
    attendees: meeting.attendees ?? "",
    agenda: meeting.agenda ?? "",
    actionItems: meeting.action_items ?? [],
    questions: meeting.questions ?? [],
    scratchpad: meeting.scratchpad ?? "",
    dirty: false,
  };
  try {
    // Notes typed with no signal are kept on this device until they have been saved.
    const stored = JSON.parse(window.localStorage.getItem(draftKey(meeting.id)) ?? "null") as Draft | null;
    if (stored && stored.dirty) return { ...stored, questions: stored.questions ?? fromServer.questions, scratchpad: stored.scratchpad ?? fromServer.scratchpad };
  } catch {
    // Storage blocked or damaged: use the server copy.
  }
  return fromServer;
}

/** Live notes: everything autosaves, and survives a dropped connection (kept on the device, sent when back online). */
/**
 * A plain pad next to the meeting notes for anything pasted or jotted during the meeting (links, prices, text from an
 * email). Kept separate so the notes stay a clean record. Paste/Copy buttons for phones, where long-press is fiddly.
 */
export function Scratchpad({ id, value, onChange, rows = 6 }: { id: string; value: string; onChange: (value: string) => void; rows?: number }) {
  const [hint, setHint] = useState("");
  const flash = (text: string) => {
    setHint(text);
    window.setTimeout(() => setHint(""), 1800);
  };
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return flash("Clipboard is empty");
      onChange(value ? `${value.replace(/\s+$/, "")}\n${text}` : text);
      flash("Pasted");
    } catch {
      flash("Press and hold in the box, then Paste");
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      flash("Copied");
    } catch {
      flash("Select the text and copy it");
    }
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`pad-${id}`} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Notepad
        </label>
        <span className="flex items-center gap-1.5">
          {hint ? <span role="status" className="mr-1 text-xs text-muted-foreground">{hint}</span> : null}
          <button type="button" onClick={paste} className="press rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted">Paste</button>
          <button type="button" onClick={copy} disabled={!value} className="press rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-40">Copy</button>
        </span>
      </div>
      <textarea
        id={`pad-${id}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder="Paste links, numbers or text here. Separate from the meeting notes."
        className={`${field} mt-2 resize-y font-mono text-[13px] leading-6`}
      />
    </div>
  );
}

export function MeetingEditor({ meeting, afterDelete }: { meeting: Meeting; /** "list" when the editor is the meeting page itself */ afterDelete?: "list" }) {
  // Before migration 0033 the meeting has no questions column: hide that section rather than lose what is typed.
  const hasQuestions = Array.isArray(meeting.questions);
  // Same for the copy/paste notepad (0034).
  const hasScratchpad = typeof meeting.scratchpad === "string";
  const online = useOnline();
  const [draft, setDraft] = useState<Draft>(() => readDraft(meeting));
  const [status, setStatus] = useState<"saved" | "saving" | "device" | "error">("saved");
  const [message, setMessage] = useState("");
  const [item, setItem] = useState("");
  const [question, setQuestion] = useState("");
  const latest = useRef(draft);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    latest.current = draft;
  });

  const persist = (value: Draft) => {
    try {
      window.localStorage.setItem(draftKey(meeting.id), JSON.stringify(value));
    } catch {
      // Ignore: the server save below is the real one.
    }
  };

  const save = async () => {
    const value = latest.current;
    if (!navigator.onLine) {
      setStatus("device");
      return;
    }
    setStatus("saving");
    try {
      const result = await saveMeetingAction({ id: meeting.id, notes: value.notes, decisions: value.decisions, attendees: value.attendees, agenda: value.agenda, actionItems: value.actionItems, ...(hasQuestions ? { questions: value.questions } : {}), ...(hasScratchpad ? { scratchpad: value.scratchpad } : {}) });
      if (result.ok) {
        // Only clear the "unsaved" mark if nothing changed while the save was in flight.
        if (latest.current === value) persist({ ...value, dirty: false });
        setStatus(latest.current === value ? "saved" : "saving");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(result.error ?? "Could not save.");
      }
    } catch (error) {
      // An update was deployed while this page was open: the draft is kept on the device and sent after the reload.
      if (!recoverIfStale(error)) setStatus("device");
    }
  };

  const change = (patch: Partial<Draft>) => {
    const next = { ...latest.current, ...patch, dirty: true };
    latest.current = next;
    setDraft(next);
    persist(next);
    window.clearTimeout(timer.current);
    setStatus(navigator.onLine ? "saving" : "device");
    timer.current = window.setTimeout(save, 900);
  };

  const dictation = useDictation((phrase) => change({ notes: applyDictation(latest.current.notes, phrase) }));

  // Back online: send whatever was waiting on the device.
  useEffect(() => {
    if (online && latest.current.dirty) {
      const retry = window.setTimeout(save, 400);
      return () => window.clearTimeout(retry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const addItem = () => {
    const text = item.trim();
    if (!text) return;
    change({ actionItems: [...draft.actionItems, { id: newId(), text, done: false }] });
    setItem("");
  };
  const addQuestion = () => {
    const text = question.trim();
    if (!text) return;
    change({ questions: [...draft.questions, { id: newId(), text, answer: "" }] });
    setQuestion("");
  };
  const [endState, endAction] = useActionState(setMeetingStatusAction, initialState);
  const [tasksState, tasksAction] = useActionState(meetingTasksAction, initialState);
  const done = meeting.status === "done";
  const toConvert = openItemsToConvert(draft.actionItems).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`att-${meeting.id}`} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Who is there</label>
          <input id={`att-${meeting.id}`} value={draft.attendees} onChange={(event) => change({ attendees: event.target.value })} className={`${field} mt-2`} />
        </div>
        <div>
          <label htmlFor={`agenda-${meeting.id}`} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agenda</label>
          <input id={`agenda-${meeting.id}`} value={draft.agenda} onChange={(event) => change({ agenda: event.target.value })} className={`${field} mt-2`} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={`notes-${meeting.id}`} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Meeting notes</label>
          <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
            {status === "saving" ? "Saving…" : status === "device" ? "Saved on this device. Will send when you are online." : status === "error" ? message : "All changes saved"}
          </span>
        </div>
        <div className="relative mt-2">
          <textarea
            id={`notes-${meeting.id}`}
            value={draft.notes}
            onChange={(event) => change({ notes: event.target.value })}
            rows={done ? 8 : 14}
            placeholder="Type or dictate as you go. It saves itself."
            className={`${field} resize-y pr-14 leading-6`}
          />
          <MicButton dictation={dictation} className="absolute right-3 top-3" />
        </div>
        <DictationHint dictation={dictation} className="mt-2" />
      </div>

      {hasScratchpad ? <Scratchpad id={meeting.id} value={draft.scratchpad} onChange={(scratchpad) => change({ scratchpad })} /> : null}

      {hasQuestions ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Questions</p>
          {draft.questions.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {draft.questions.map((entry, index) => (
                <li key={entry.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-xs tabular-nums text-muted-foreground">{index + 1}.</span>
                    <input
                      aria-label={`Question ${index + 1}`}
                      value={entry.text}
                      onChange={(event) => change({ questions: draft.questions.map((row) => (row.id === entry.id ? { ...row, text: event.target.value } : row)) })}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                    />
                    <button type="button" aria-label={`Remove question ${index + 1}`} onClick={() => change({ questions: draft.questions.filter((row) => row.id !== entry.id) })} className="press rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Icon name="close" className="size-4" />
                    </button>
                  </div>
                  <textarea
                    aria-label={`Answer to question ${index + 1}`}
                    value={entry.answer}
                    onChange={(event) => change({ questions: draft.questions.map((row) => (row.id === entry.id ? { ...row, answer: event.target.value } : row)) })}
                    rows={2}
                    placeholder="Their answer"
                    className={`${field} mt-2 resize-y leading-6`}
                  />
                </li>
              ))}
            </ol>
          ) : null}
          <div className="mt-3 flex gap-2">
            <label htmlFor={`question-${meeting.id}`} className="sr-only">New question</label>
            <input
              id={`question-${meeting.id}`}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addQuestion();
                }
              }}
              placeholder="Add a question to ask and press Enter"
              className={field}
            />
            <button type="button" onClick={addQuestion} className="press shrink-0 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">
              Add
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <label htmlFor={`dec-${meeting.id}`} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Decisions</label>
        <textarea id={`dec-${meeting.id}`} value={draft.decisions} onChange={(event) => change({ decisions: event.target.value })} rows={3} placeholder="What was agreed." className={`${field} mt-2 resize-y leading-6`} />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Action items</p>
        {draft.actionItems.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {draft.actionItems.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
                <input type="checkbox" checked={entry.done} onChange={() => change({ actionItems: draft.actionItems.map((row) => (row.id === entry.id ? { ...row, done: !row.done } : row)) })} className="size-4 accent-foreground" aria-label={`Done: ${entry.text}`} />
                <span className={`min-w-0 flex-1 ${entry.done ? "text-muted-foreground line-through" : ""}`}>
                  {entry.text}
                  {entry.task ? <span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">task created</span> : null}
                </span>
                <button type="button" aria-label={`Remove ${entry.text}`} onClick={() => change({ actionItems: draft.actionItems.filter((row) => row.id !== entry.id) })} className="press rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Icon name="close" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex gap-2">
          <label htmlFor={`item-${meeting.id}`} className="sr-only">New action item</label>
          <input
            id={`item-${meeting.id}`}
            value={item}
            onChange={(event) => setItem(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addItem();
              }
            }}
            placeholder="Add an action item and press Enter"
            className={field}
          />
          <button type="button" onClick={addItem} className="press shrink-0 rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-muted">
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <form action={endAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={meeting.id} />
          <input type="hidden" name="status" value={done ? "in_progress" : "done"} />
          <button
            type="submit"
            onClick={() => window.clearTimeout(timer.current)}
            className={`press rounded-md px-4 py-2 text-sm font-medium transition-opacity ${done ? "border border-border hover:bg-muted" : "bg-inverted text-inverted-foreground hover:opacity-80"}`}
          >
            {done ? "Reopen meeting" : "End meeting"}
          </button>
          <FormMessage {...endState} />
        </form>
        {toConvert > 0 ? (
          <form action={tasksAction} className="flex items-center gap-3">
            <input type="hidden" name="id" value={meeting.id} />
            <SubmitButton className="bg-background">{`Turn ${toConvert} open item${toConvert === 1 ? "" : "s"} into tasks`}</SubmitButton>
            <FormMessage {...tasksState} />
          </form>
        ) : (
          <FormMessage {...tasksState} />
        )}
        <span className="ml-auto">
          <ConfirmDelete action={deleteMeetingAction} fields={afterDelete ? { id: meeting.id, after: afterDelete } : { id: meeting.id }} title="Delete this meeting?" message={`“${meeting.title}” and its notes will be removed. This cannot be undone.`} />
        </span>
      </div>
    </div>
  );
}
