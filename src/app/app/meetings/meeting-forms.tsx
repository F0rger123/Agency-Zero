"use client";

import { useActionState, useRef } from "react";
import { FileLinks, type FileRow } from "@/components/file-links";
import { FormMessage } from "@/components/form-controls";
import { DeleteFileForm } from "../clients/client-forms";
import type { ActionState } from "@/lib/forms";
import { assignMeetingClientAction, openMeetingBoardAction, startMeetingAction, uploadMeetingFileAction } from "./actions";

const initial: ActionState = {};
const field = "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground";
const solid = "press rounded-md bg-inverted px-4 py-2 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80 disabled:opacity-50";
const outline = "press rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50";

export type ClientOption = { id: string; label: string };

function ClientSelect({ id, clients, required = false }: { id: string; clients: ClientOption[]; required?: boolean }) {
  return (
    <select id={id} name="client_id" required={required} defaultValue="" className={`${field} mt-1`}>
      <option value="">{required ? "Choose a customer" : "No customer yet (file it later)"}</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.label}
        </option>
      ))}
    </select>
  );
}

/** Any meeting, with or without a customer: take notes, or go straight to a whiteboard to draw with them. */
export function NewMeetingForm({ clients }: { clients: ClientOption[] }) {
  const [state, action, pending] = useActionState(startMeetingAction, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="meeting-new-title" className="text-xs font-medium text-muted-foreground">What is it</label>
        <input id="meeting-new-title" name="title" required maxLength={160} placeholder="Coffee with Dana" className={`${field} mt-1`} />
      </div>
      <div>
        <label htmlFor="meeting-new-client" className="text-xs font-medium text-muted-foreground">Customer (optional)</label>
        <ClientSelect id="meeting-new-client" clients={clients} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="meeting-new-attendees" className="text-xs font-medium text-muted-foreground">Who is there (optional)</label>
          <input id="meeting-new-attendees" name="attendees" maxLength={500} placeholder="Dana, Sam" className={`${field} mt-1`} />
        </div>
        <div>
          <label htmlFor="meeting-new-location" className="text-xs font-medium text-muted-foreground">Where (optional)</label>
          <input id="meeting-new-location" name="location" maxLength={300} placeholder="Their office" className={`${field} mt-1`} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" name="open" value="page" disabled={pending} className={solid}>
          {pending ? "Starting…" : "Start taking notes"}
        </button>
        <button type="submit" name="open" value="board" disabled={pending} className={outline}>
          Start on a whiteboard
        </button>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

/** Files a general meeting under a customer, so its notes, boards and uploads land in their file. */
export function AssignClientForm({ meetingId, clients }: { meetingId: string; clients: ClientOption[] }) {
  const [state, action, pending] = useActionState(assignMeetingClientAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={meetingId} />
      <div className="min-w-56 flex-1">
        <label htmlFor="meeting-assign-client" className="text-xs font-medium text-muted-foreground">Save to a customer</label>
        <ClientSelect id="meeting-assign-client" clients={clients} required />
      </div>
      <button type="submit" disabled={pending} className={solid}>
        {pending ? "Saving…" : "Save to customer"}
      </button>
      <FormMessage {...state} />
    </form>
  );
}

/** Open the meeting's whiteboard (made on first use), or start another one. */
export function MeetingBoardButtons({ meetingId, hasBoard }: { meetingId: string; hasBoard: boolean }) {
  const [state, action, pending] = useActionState(openMeetingBoardAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={meetingId} />
      {hasBoard ? (
        <button type="submit" name="new" value="1" disabled={pending} className={outline}>
          {pending ? "Opening…" : "New whiteboard"}
        </button>
      ) : (
        <button type="submit" disabled={pending} className={solid}>
          {pending ? "Opening…" : "Open a whiteboard"}
        </button>
      )}
      <FormMessage {...state} />
    </form>
  );
}

/** Photos of a paper sketch, a scan, a doc they handed over: straight into the customer's files, tagged with this meeting. */
export function MeetingUploadForm({ meetingId }: { meetingId: string }) {
  const [state, action, pending] = useActionState(uploadMeetingFileAction, initial);
  const form = useRef<HTMLFormElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  return (
    <form ref={form} action={action} encType="multipart/form-data" className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="meeting_id" value={meetingId} />
      {/* Two hidden inputs share the name: the browser only sends the one that holds a file. */}
      <input ref={picker} type="file" name="file" className="sr-only" tabIndex={-1} aria-hidden onChange={() => form.current?.requestSubmit()} />
      <input ref={camera} type="file" name="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={() => form.current?.requestSubmit()} />
      <button type="button" disabled={pending} onClick={() => picker.current?.click()} className={outline}>
        {pending ? "Uploading…" : "Upload a file"}
      </button>
      <button type="button" disabled={pending} onClick={() => camera.current?.click()} className={`${outline} sm:hidden`}>
        Take a photo
      </button>
      <span className="text-xs text-muted-foreground">10 MB max. Saved to the customer&apos;s files.</span>
      <FormMessage {...state} />
    </form>
  );
}

/** Files from this meeting (they also show on the customer's Files tab). */
export function MeetingFiles({ clientId, files }: { clientId: string; files: FileRow[] }) {
  return (
    <FileLinks
      files={files}
      emptyLabel="Nothing uploaded from this meeting yet."
      renderDelete={(file) => <DeleteFileForm clientId={clientId} id={file.id} storagePath={file.storage_path} />}
    />
  );
}
