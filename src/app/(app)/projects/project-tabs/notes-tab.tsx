"use client";

import { FormSection } from "@/components/form-controls";
import { dateTimeLabel } from "@/lib/format";
import { DeleteProjectNoteForm, ProjectNoteForm } from "../project-workspace-forms";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function NotesTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <FormSection title="Notes" description="Project context, decisions, and risks. Pin what should stay visible.">
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
                <DeleteProjectNoteForm projectId={data.project.id} noteId={note.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <ProjectNoteForm projectId={data.project.id} />
      </div>
    </FormSection>
  );
}
