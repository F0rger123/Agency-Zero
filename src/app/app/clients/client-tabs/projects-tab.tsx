"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteProjectAction } from "../../projects/actions";
import { NewProjectForm } from "../../projects/project-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function ProjectsTab({ data, currency, projectTemplates = [] }: { data: ClientWorkspaceData; currency: string; projectTemplates?: { id: string; label: string }[] }) {
  return (
    <FormSection
      title="Projects"
      description="Delivery work for this client. Open a project to run it from the workspace."
      action={
        <AddDialog label="New project" title="New project" description={`For ${data.client.name}`}>
          <NewProjectForm
            lockedClientId={data.client.id}
            clients={[{ id: data.client.id, name: data.client.name, company: data.client.company }]}
            templates={projectTemplates}
          />
        </AddDialog>
      }
    >
      {data.projects.length === 0 ? (
        <Empty>No projects yet.</Empty>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Project</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Deadline</th>
                <th className="px-3 py-3 font-medium">Progress</th>
                <th className="px-3 py-3 font-medium">Open tasks</th>
                <th className="px-3 py-3 font-medium">Value</th>
                <th className="px-3 py-3 font-medium"><span className="sr-only">Delete</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-3 py-4 font-medium">
                    <Link href={crmHref(project.href)} className="underline decoration-border underline-offset-4">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{project.status}</td>
                  <td className="px-3 py-4 text-muted-foreground">{dateLabel(project.deadline)}</td>
                  <td className="px-3 py-4 text-muted-foreground">{project.progress}%</td>
                  <td className="px-3 py-4 text-muted-foreground">{project.open_tasks}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {moneyNode(project.value_cents, project.currency || currency)}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <ConfirmDelete
                      action={deleteProjectAction}
                      fields={{ id: project.id }}
                      title="Delete this project?"
                      message={`“${project.name}” and all of its tasks, phases and milestones will be removed. Invoices, quotes and payments are kept. This cannot be undone.`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormSection>
  );
}
