"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ConfirmDelete } from "@/components/confirm-delete";
import { FieldLabel, FormMessage, FormSection, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { Icon } from "@/components/icons";
import { AddDialog } from "@/components/modal";
import { useOnline } from "@/components/offline";
import { dateTimeLabel } from "@/lib/format";
import { MEETINGS_MIGRATION_MESSAGE, meetingDuration, openItemsToConvert, type ActionItem, type Meeting } from "@/lib/meetings";
import { useDictation } from "@/lib/use-dictation";
import type { ActionState } from "@/lib/forms";
import { deleteMeetingAction, meetingTasksAction, saveMeetingAction, setMeetingStatusAction, startMeetingAction } from "../../meetings/actions";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

const initialState: ActionState = {};
const field = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function StartMeetingForm({ clientId, projects }: { clientId: string; projects: { id: string; name: string }[] }) {
  const [state, action] = useActionState(startMeetingAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <FieldLabel label="Meeting title" htmlFor="meeting-title" required />
        <TextInput id="meeting-title" name="title" required placeholder="Kickoff call" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Who is there" htmlFor="meeting-attendees" hint="optional" />
          <TextInput id="meeting-attendees" name="attendees" placeholder="Dana, Sam" />
        </div>
        <div>
          <FieldLabel label="Where" htmlFor="meeting-location" hint="optional" />
          <TextInput id="meeting-location" name="location" placeholder="Their office, Zoom…" />
        </div>
      </div>
      {projects.length > 0 ? (
        <div>
          <FieldLabel label="About a project" htmlFor="meeting-project" hint="optional" />
          <SelectInput id="meeting-project" name="project_id">
            <option value="">Not about one project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </SelectInput>
        </div>
      ) : null}
      <div>
        <FieldLabel label="Agenda" htmlFor="meeting-agenda" hint="optional" />
        <TextArea id="meeting-agenda" name="agenda" rows={3} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Start meeting</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

type Draft = { notes: string; decisions: string; attendees: string; agenda: string; actionItems: ActionItem[]; dirty: boolean };
const draftKey = (id: string) => `az-meeting-${id}`;

function readDraft(meeting: Meeting): Draft {
  const fromServer: Draft = {
    notes: meeting.notes,
    decisions: meeting.decisions ?? "",
    attendees: meeting.attendees ?? "",
    agenda: meeting.agenda ?? "",
    actionItems: meeting.action_items ?? [],
    dirty: false,
  };
  try {
    // Notes typed with no signal are kept on this device until they have been saved.
    const stored = JSON.parse(window.localStorage.getItem(draftKey(meeting.id)) ?? "null") as Draft | null;
    if (stored && stored.dirty) return stored;
  } catch {
    // Storage blocked or damaged: use the server copy.
  }
  return fromServer;
}

/** Live notes: everything autosaves, and survives a dropped connection (kept on the device, sent when back online). */
function MeetingEditor({ meeting }: { meeting: Meeting }) {
  const online = useOnline();
  const [draft, setDraft] = useState<Draft>(() => readDraft(meeting));
  const [status, setStatus] = useState<"saved" | "saving" | "device" | "error">("saved");
  const [message, setMessage] = useState("");
  const [item, setItem] = useState("");
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
      const result = await saveMeetingAction({ id: meeting.id, notes: value.notes, decisions: value.decisions, attendees: value.attendees, agenda: value.agenda, actionItems: value.actionItems });
      if (result.ok) {
        // Only clear the "unsaved" mark if nothing changed while the save was in flight.
        if (latest.current === value) persist({ ...value, dirty: false });
        setStatus(latest.current === value ? "saved" : "saving");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(result.error ?? "Could not save.");
      }
    } catch {
      setStatus("device");
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

  const dictation = useDictation((phrase) => change({ notes: `${latest.current.notes}${latest.current.notes && !latest.current.notes.endsWith("\n") ? " " : ""}${phrase}` }));

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
          <label htmlFor={`notes-${meeting.id}`} className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Notes</label>
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
          {dictation.supported ? (
            <button
              type="button"
              onClick={dictation.toggle}
              aria-pressed={dictation.listening}
              aria-label={dictation.listening ? "Stop voice typing" : "Start voice typing"}
              className={`press absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border transition-colors ${dictation.listening ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
            >
              <Icon name="mic" className={`size-5 ${dictation.listening ? "animate-pulse" : ""}`} />
            </button>
          ) : null}
        </div>
        {dictation.error ? <p role="alert" className="mt-2 text-xs font-medium">{dictation.error}</p> : null}
      </div>

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
          <ConfirmDelete action={deleteMeetingAction} fields={{ id: meeting.id }} title="Delete this meeting?" message={`“${meeting.title}” and its notes will be removed. This cannot be undone.`} />
        </span>
      </div>
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const live = meeting.status === "in_progress";
  const length = meetingDuration(meeting);
  return (
    <li className={`rounded-2xl border-[1.5px] ${live ? "border-foreground" : "border-foreground/25"} bg-background`}>
      <details open={live} className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block text-base font-semibold tracking-tight">{meeting.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {dateTimeLabel(meeting.meeting_at)}
              {meeting.location ? ` · ${meeting.location}` : ""}
              {length ? ` · ${length}` : ""}
            </span>
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest ${live ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {live ? "Live" : meeting.status === "done" ? "Done" : "Scheduled"}
          </span>
        </summary>
        <div className="border-t border-border p-5">
          <MeetingEditor meeting={meeting} />
        </div>
      </details>
    </li>
  );
}

/** Meetings with a customer: start one, take notes live, end it, and turn the follow-ups into tasks. */
export function MeetingsTab({ data, meetings }: { data: ClientWorkspaceData; meetings: Meeting[] | null }) {
  const projects = data.projects.map((project) => ({ id: project.id, name: project.name }));
  return (
    <FormSection
      title="Meetings"
      description="Take notes while you are in the room. Notes save themselves, work with voice typing, and stay on this device if the signal drops."
      action={
        meetings ? (
          <AddDialog label="Start meeting" title="Start a meeting" description={`With ${data.client.name}`}>
            <StartMeetingForm clientId={data.client.id} projects={projects} />
          </AddDialog>
        ) : null
      }
    >
      {meetings === null ? (
        <Empty>{MEETINGS_MIGRATION_MESSAGE}</Empty>
      ) : meetings.length === 0 ? (
        <Empty>No meetings yet.</Empty>
      ) : (
        <ul className="space-y-4">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </ul>
      )}
    </FormSection>
  );
}
