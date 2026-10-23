"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FieldLabel, FormMessage, FormSection, SelectInput, TextArea, TextInput } from "@/components/form-controls";
import { AddDialog } from "@/components/modal";
import { dateTimeLabel } from "@/lib/format";
import { MEETINGS_MIGRATION_MESSAGE, meetingDuration, type Meeting } from "@/lib/meetings";
import type { ActionState } from "@/lib/forms";
import { openMeetingBoardAction, startMeetingAction } from "../../meetings/actions";
import { MeetingEditor } from "../../meetings/meeting-editor";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

const initialState: ActionState = {};

function StartMeetingForm({ clientId, projects }: { clientId: string; projects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(startMeetingAction, initialState);
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
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" name="open" value="" disabled={pending} className="press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80 disabled:opacity-50">
          Take notes here
        </button>
        <button type="submit" name="open" value="board" disabled={pending} className="press rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50">
          Open a whiteboard with them
        </button>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

/** Meeting page (whiteboards, files, questions) and the meeting's whiteboard, one tap away. */
function MeetingLinks({ meeting }: { meeting: Meeting }) {
  const [state, action, pending] = useActionState(openMeetingBoardAction, initialState);
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <Link href={`/app/meetings/${meeting.id}`} className="press rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
        Open meeting page
      </Link>
      <form action={action}>
        <input type="hidden" name="id" value={meeting.id} />
        <button type="submit" disabled={pending} className="press rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50">
          {pending ? "Opening…" : "Whiteboard"}
        </button>
      </form>
      <FormMessage {...state} />
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
          <MeetingLinks meeting={meeting} />
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
