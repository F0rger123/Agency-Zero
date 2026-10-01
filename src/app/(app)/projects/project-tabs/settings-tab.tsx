"use client";

import { FormSection } from "@/components/form-controls";
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
    </FormSection>
  );
}
