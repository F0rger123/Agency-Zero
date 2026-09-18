"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/forms";
import {
  archiveProjectAction,
  createMilestoneAction,
  createProjectAction,
  deleteMilestoneAction,
  updateMilestoneAction,
  updateProjectAction,
} from "./actions";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";

const initialState: ActionState = {};

type ClientOption = { id: string; name: string; company: string | null };
type Project = {
  id: string; client_id: string; name: string; description: string | null; status: string;
  value_cents: number | null; currency: string; estimated_minutes: number | null; actual_minutes: number | null;
  starts_on: string | null; deadline: string | null; progress: number;
};

type Milestone = { id: string; project_id: string; name: string; due_date: string | null; completed_at: string | null };

function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="border-t border-border pt-6"><h2 className="text-sm font-medium">{title}</h2><div className="mt-4">{children}</div></div>;
}

function ProjectFields({ clients, project }: { clients: ClientOption[]; project?: Project }) {
  return (
    <div className="space-y-4">
      <div><FieldLabel label="Name" htmlFor="project-name" required /><TextInput id="project-name" name="name" defaultValue={project?.name} required placeholder="New website launch" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><FieldLabel label="Client" htmlFor="project-client" required /><SelectInput id="project-client" name="client_id" defaultValue={project?.client_id} required><option value="">Choose a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.company ? ` · ${client.company}` : ""}</option>)}</SelectInput></div>
        <div><FieldLabel label="Status" htmlFor="project-status" required /><SelectInput id="project-status" name="status" defaultValue={project?.status ?? "planning"} required><option value="planning">Planning</option><option value="active">Active</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></SelectInput></div>
        <div><FieldLabel label="Value" htmlFor="project-value" hint="USD, dollars" /><TextInput id="project-value" name="value_amount" type="number" min={0} step={0.01} defaultValue={project?.value_cents != null ? project.value_cents / 100 : null} /></div>
        <div><FieldLabel label="Currency" htmlFor="project-currency" required /><TextInput id="project-currency" name="currency" defaultValue={project?.currency ?? "USD"} required /></div>
        <div><FieldLabel label="Estimated time" htmlFor="project-estimated" hint="hours" /><TextInput id="project-estimated" name="estimated_hours" type="number" min={0} step={0.25} defaultValue={project?.estimated_minutes != null ? project.estimated_minutes / 60 : null} /></div>
        <div><FieldLabel label="Actual time" htmlFor="project-actual" hint="hours" /><TextInput id="project-actual" name="actual_hours" type="number" min={0} step={0.25} defaultValue={project?.actual_minutes != null ? project.actual_minutes / 60 : null} /></div>
        <div><FieldLabel label="Starts on" htmlFor="project-starts" /><TextInput id="project-starts" name="starts_on" type="date" defaultValue={project?.starts_on} /></div>
        <div><FieldLabel label="Deadline" htmlFor="project-deadline" /><TextInput id="project-deadline" name="deadline" type="date" defaultValue={project?.deadline} /></div>
      </div>
      <div><FieldLabel label="Progress" htmlFor="project-progress" hint="0–100%" /><TextInput id="project-progress" name="progress" type="number" min={0} max={100} step={1} defaultValue={project?.progress ?? 0} /></div>
      <div><FieldLabel label="Description" htmlFor="project-description" /><TextArea id="project-description" name="description" defaultValue={project?.description} rows={4} /></div>
    </div>
  );
}

export function NewProjectForm({ clients }: { clients: ClientOption[] }) {
  const [state, action] = useActionState(createProjectAction, initialState);
  return <FormShell title="Add project"><form action={action} className="space-y-5"><ProjectFields clients={clients} /><div className="flex flex-wrap items-center gap-4"><SubmitButton>Create project</SubmitButton><FormMessage {...state} /></div></form></FormShell>;
}

export function EditProjectForm({ clients, project }: { clients: ClientOption[]; project: Project }) {
  const [state, action] = useActionState(updateProjectAction, initialState);
  return <FormShell title="Edit project"><form action={action} className="space-y-5"><input type="hidden" name="id" value={project.id} /><ProjectFields clients={clients} project={project} /><div className="flex flex-wrap items-center gap-4"><SubmitButton>Save changes</SubmitButton><FormMessage {...state} /></div></form></FormShell>;
}

export function ArchiveProjectForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(archiveProjectAction, initialState);
  return <form action={action} className="mt-4 flex flex-wrap items-center gap-4"><input type="hidden" name="id" value={projectId} /><SubmitButton pendingLabel="Archiving…" className="bg-background text-foreground ring-1 ring-border">Archive project</SubmitButton><FormMessage {...state} /></form>;
}

export function MilestoneForm({ projectId, milestone }: { projectId: string; milestone?: Milestone }) {
  const [state, action] = useActionState(milestone ? updateMilestoneAction : createMilestoneAction, initialState);
  return <form action={action} className="space-y-4"><input type="hidden" name="project_id" value={projectId} />{milestone ? <input type="hidden" name="id" value={milestone.id} /> : null}<div className="grid gap-4 sm:grid-cols-[1fr_180px]"><div><FieldLabel label="Name" htmlFor={`milestone-name-${milestone?.id ?? "new"}`} required /><TextInput id={`milestone-name-${milestone?.id ?? "new"}`} name="name" defaultValue={milestone?.name} required placeholder="Design approved" /></div><div><FieldLabel label="Due date" htmlFor={`milestone-date-${milestone?.id ?? "new"}`} /><TextInput id={`milestone-date-${milestone?.id ?? "new"}`} name="due_date" type="date" defaultValue={milestone?.due_date} /></div></div>{milestone ? <label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" name="completed" defaultChecked={Boolean(milestone.completed_at)} className="size-4 accent-black" /> Completed</label> : null}<div className="flex flex-wrap items-center gap-4"><SubmitButton>{milestone ? "Save milestone" : "Add milestone"}</SubmitButton><FormMessage {...state} /></div></form>;
}

export function DeleteMilestoneForm({ projectId, milestoneId }: { projectId: string; milestoneId: string }) {
  const [state, action] = useActionState(deleteMilestoneAction, initialState);
  return <form action={action} className="flex flex-wrap items-center gap-3"><input type="hidden" name="project_id" value={projectId} /><input type="hidden" name="id" value={milestoneId} /><SubmitButton pendingLabel="Removing…" className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground">Remove</SubmitButton><FormMessage {...state} /></form>;
}
