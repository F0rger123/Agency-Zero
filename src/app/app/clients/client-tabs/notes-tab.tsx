"use client";

import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { dateTimeLabel } from "@/lib/format";
import { DeleteNoteForm, NoteForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function NotesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Notes"
      description="Persistent client context. Pin the notes you need to keep visible."
      action={
        <AddDialog label="New note" title="New note" description={`About ${data.client.name}`}>
          <NoteForm clientId={data.client.id} />
        </AddDialog>
      }
    >
      {data.notes.length === 0 ? (
        <Empty>No notes yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.notes.map((note) => (
            <li key={note.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{note.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.pinned ? "Pinned · " : ""}
                    {dateTimeLabel(note.created_at)}
                  </p>
                </div>
                <DeleteNoteForm clientId={data.client.id} id={note.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
