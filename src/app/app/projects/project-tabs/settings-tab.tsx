"use client";

import { FormSection } from "@/components/form-controls";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteProjectAction } from "../actions";
import { ArchiveProjectForm, EditProjectForm } from "../project-forms";
import type { ProjectWorkspaceData } from "../project-workspace-types";

export function SettingsTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <FormSection
      title="Project settings"
      description="Change status, client, deadline, value, estimate, or progress — or archive the project."
    >
      <EditProjectForm project={data.project} clients={data.client_options} />
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="text-sm font-medium">Archive</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Archiving keeps every task, milestone, time entry, note, and file while removing the project from active
          lists.
        </p>
        <ArchiveProjectForm projectId={data.project.id} />
      </div>
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="text-sm font-medium">Delete</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently removes the project with its tasks, phases and milestones. Invoices, quotes and payments are kept.
        </p>
        <div className="mt-4">
          <ConfirmDelete
            action={deleteProjectAction}
            fields={{ id: data.project.id, redirect_to: `/app/clients/${data.project.client_id}` }}
            label="Delete project"
            title="Delete this project?"
            message={`“${data.project.name}” and all of its tasks, phases and milestones will be removed. Invoices, quotes and payments are kept. This cannot be undone.`}
            className="rounded-md border border-red-600/40 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-600/5"
          />
        </div>
      </div>
    </FormSection>
  );
}
