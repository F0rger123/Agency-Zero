"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextInput } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import type { ActionState } from "@/lib/forms";
import { PHASE_STATUS_LABEL, PHASE_STATUSES, SERVICE_KIND_LABEL, type PhaseStatus, type ServiceKind } from "@/lib/phases";
import { crmHref } from "@/lib/routes";
import { createTaskAction } from "../../tasks/actions";
import { CompleteTaskForm } from "../../tasks/task-forms";
import {
  applyProjectTemplateAction,
  assignTaskPhaseAction,
  createPhaseAction,
  deletePhaseAction,
  movePhaseAction,
  setPhaseStatusAction,
  updatePhaseAction,
} from "../phase-actions";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

const initialState: ActionState = {};
const quiet = "bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground";

export type PhaseRow = {
  id: string;
  name: string;
  sort_order: number;
  status: PhaseStatus;
  starts_on: string | null;
  due_on: string | null;
  total_tasks: number;
  open_tasks: number;
};
export type TemplateOption = { id: string; name: string; service_kind: ServiceKind; description: string | null; phase_count: number; task_count: number };
export type ProjectPhasesPayload = {
  phases: PhaseRow[];
  task_phases: { id: string; phase_id: string }[];
  templates: TemplateOption[];
};

function ApplyTemplateForm({ projectId, templates }: { projectId: string; templates: TemplateOption[] }) {
  const [state, action] = useActionState(applyProjectTemplateAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel label="Template" htmlFor="apply-template" required />
          <SelectInput id="apply-template" name="template_id" required defaultValue="">
            <option value="">Choose a template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} — {SERVICE_KIND_LABEL[template.service_kind] ?? template.service_kind} ({template.phase_count} phases, {template.task_count} tasks)
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Start date" htmlFor="apply-start" hint="task due dates count from here" />
          <TextInput id="apply-start" name="start_date" type="date" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pendingLabel="Adding…">Add phases and tasks</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

function AddPhaseForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(createPhaseAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="min-w-60 flex-1">
        <FieldLabel label="Phase name" htmlFor="new-phase" required />
        <TextInput id="new-phase" name="name" required placeholder="Discovery" />
      </div>
      <SubmitButton pendingLabel="Adding…">Add phase</SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

function PhaseControl({ action: serverAction, fields, label, pending }: { action: typeof setPhaseStatusAction; fields: Record<string, string>; label: string; pending: string }) {
  const [state, action] = useActionState(serverAction, initialState);
  return (
    <form action={action} className="flex items-center gap-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton pendingLabel={pending} className={quiet}>
        {label}
      </SubmitButton>
      {state.error ? <span className="text-xs">{state.error}</span> : null}
    </form>
  );
}

function EditPhaseForm({ projectId, phase }: { projectId: string; phase: PhaseRow }) {
  const [state, action] = useActionState(updatePhaseAction, initialState);
  const [deleteState, deleteAction] = useActionState(deletePhaseAction, initialState);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={phase.id} />
        <input type="hidden" name="project_id" value={projectId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel label="Name" htmlFor={`ph-name-${phase.id}`} required />
            <TextInput id={`ph-name-${phase.id}`} name="name" required defaultValue={phase.name} />
          </div>
          <div>
            <FieldLabel label="Status" htmlFor={`ph-status-${phase.id}`} required />
            <SelectInput id={`ph-status-${phase.id}`} name="status" required defaultValue={phase.status}>
              {PHASE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {PHASE_STATUS_LABEL[value]}
                </option>
              ))}
            </SelectInput>
          </div>
          <div />
          <div>
            <FieldLabel label="Starts" htmlFor={`ph-start-${phase.id}`} />
            <TextInput id={`ph-start-${phase.id}`} name="starts_on" type="date" defaultValue={phase.starts_on} />
          </div>
          <div>
            <FieldLabel label="Due" htmlFor={`ph-due-${phase.id}`} />
            <TextInput id={`ph-due-${phase.id}`} name="due_on" type="date" defaultValue={phase.due_on} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Save phase</SubmitButton>
          <FormMessage {...state} />
        </div>
      </form>
      <form action={deleteAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={phase.id} />
        <input type="hidden" name="project_id" value={projectId} />
        <SubmitButton pendingLabel="Deleting…" className={quiet}>
          Delete phase (tasks are kept)
        </SubmitButton>
        <FormMessage {...deleteState} />
      </form>
    </div>
  );
}

function QuickTaskForm({ projectId, clientId, phaseId }: { projectId: string; clientId: string | null; phaseId: string }) {
  const [state, action] = useActionState(createTaskAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      <input type="hidden" name="phase_id" value={phaseId} />
      <input type="hidden" name="status" value="todo" />
      <input type="hidden" name="priority" value="medium" />
      <label className="sr-only" htmlFor={`qt-${phaseId}`}>
        New task in this phase
      </label>
      <input
        id={`qt-${phaseId}`}
        name="title"
        required
        placeholder="Add a task to this phase"
        className="h-9 min-w-56 flex-1 border border-border bg-background px-3 text-sm"
      />
      <SubmitButton pendingLabel="Adding…" className="h-9 px-4 text-xs">
        Add
      </SubmitButton>
      {state.error ? <span className="text-xs">{state.error}</span> : null}
    </form>
  );
}

function AssignTaskForm({ projectId, taskId, phases }: { projectId: string; taskId: string; phases: PhaseRow[] }) {
  const [state, action] = useActionState(assignTaskPhaseAction, initialState);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="task_id" value={taskId} />
      <label className="sr-only" htmlFor={`as-${taskId}`}>
        Phase
      </label>
      <select id={`as-${taskId}`} name="phase_id" defaultValue="" className="h-8 border border-border bg-background px-2 text-xs">
        <option value="">Choose a phase</option>
        {phases.map((phase) => (
          <option key={phase.id} value={phase.id}>
            {phase.name}
          </option>
        ))}
      </select>
      <SubmitButton pendingLabel="Saving…" className={quiet}>
        Move
      </SubmitButton>
      {state.error ? <span className="text-xs">{state.error}</span> : null}
    </form>
  );
}

const statusTone: Record<PhaseStatus, string> = {
  active: "border-foreground text-foreground",
  done: "border-border text-faint-foreground",
  upcoming: "border-border text-muted-foreground",
};

/** Phases tab: ordered stages with their tasks, plus applying a service template. */
export function PhasesTab({ data }: { data: ProjectWorkspaceData & { phases: ProjectPhasesPayload | null } }) {
  const payload = data.phases;
  if (!payload) {
    return (
      <Empty>
        Project phases need database update <code className="font-mono text-foreground">0025</code>. Apply it in the Supabase SQL editor and reload.
      </Empty>
    );
  }
  const projectId = data.project.id;
  const phaseOf = new Map(payload.task_phases.map((link) => [link.id, link.phase_id]));
  const tasksIn = (phaseId: string) => data.tasks.filter((task) => phaseOf.get(task.id) === phaseId);
  const loose = data.tasks.filter((task) => !phaseOf.has(task.id) && task.status !== "done" && task.status !== "cancelled");
  const done = payload.phases.filter((phase) => phase.status === "done").length;

  return (
    <div className="space-y-12">
      {payload.phases.length === 0 ? (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Start from a template</h2>
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
            A template adds the usual phases for this kind of work and a starter task list. You can rename, reorder and edit everything afterwards, and{" "}
            <Link href={crmHref("/projects/templates")} className="underline decoration-border underline-offset-4">
              edit the templates themselves
            </Link>
            .
          </p>
          <div className="mt-4">
            <ApplyTemplateForm projectId={projectId} templates={payload.templates} />
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {done} of {payload.phases.length} phases done
          </h2>
          <ol className="mt-4 space-y-8">
            {payload.phases.map((phase, index) => {
              const tasks = tasksIn(phase.id);
              const progress = phase.total_tasks > 0 ? Math.round(((phase.total_tasks - phase.open_tasks) / phase.total_tasks) * 100) : 0;
              return (
                <li key={phase.id} className="border-t border-border pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Phase {index + 1}</p>
                      <h3 className="mt-1 flex flex-wrap items-center gap-2 text-lg font-medium">
                        {phase.name}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest ${statusTone[phase.status]}`}>
                          {PHASE_STATUS_LABEL[phase.status]}
                        </span>
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {phase.total_tasks - phase.open_tasks}/{phase.total_tasks} tasks done
                        {phase.total_tasks > 0 ? ` (${progress}%)` : ""}
                        {phase.starts_on ? ` · starts ${dateLabel(phase.starts_on)}` : ""}
                        {phase.due_on ? ` · due ${dateLabel(phase.due_on)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      {phase.status === "upcoming" ? (
                        <PhaseControl action={setPhaseStatusAction} fields={{ id: phase.id, project_id: projectId, status: "active" }} label="Start phase" pending="Starting…" />
                      ) : null}
                      {phase.status === "active" ? (
                        <PhaseControl action={setPhaseStatusAction} fields={{ id: phase.id, project_id: projectId, status: "done" }} label="Complete phase" pending="Saving…" />
                      ) : null}
                      {phase.status === "done" ? (
                        <PhaseControl action={setPhaseStatusAction} fields={{ id: phase.id, project_id: projectId, status: "active" }} label="Reopen" pending="Saving…" />
                      ) : null}
                      {index > 0 ? <PhaseControl action={movePhaseAction} fields={{ id: phase.id, project_id: projectId, direction: "-1" }} label="↑ Up" pending="…" /> : null}
                      {index < payload.phases.length - 1 ? (
                        <PhaseControl action={movePhaseAction} fields={{ id: phase.id, project_id: projectId, direction: "1" }} label="↓ Down" pending="…" />
                      ) : null}
                    </div>
                  </div>

                  {tasks.length > 0 ? (
                    <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
                      {tasks.map((task) => (
                        <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                          <span className={task.status === "done" ? "text-muted-foreground line-through" : ""}>
                            <Link href={crmHref(task.href)} className="underline decoration-border underline-offset-4">
                              {task.title}
                            </Link>
                            <span className="text-muted-foreground"> · {task.due_date ? `due ${dateLabel(task.due_date)}` : "no due date"}</span>
                          </span>
                          {task.status !== "done" && task.status !== "cancelled" ? <CompleteTaskForm taskId={task.id} /> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No tasks in this phase yet.</p>
                  )}
                  <div className="mt-4">
                    <QuickTaskForm projectId={projectId} clientId={data.project.client_id} phaseId={phase.id} />
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">Edit phase</summary>
                    <div className="mt-4">
                      <EditPhaseForm projectId={projectId} phase={phase} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {payload.phases.length > 0 && loose.length > 0 ? (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Tasks not in a phase ({loose.length})</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
            {loose.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link href={crmHref(task.href)} className="underline decoration-border underline-offset-4">
                  {task.title}
                </Link>
                <AssignTaskForm projectId={projectId} taskId={task.id} phases={payload.phases} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Add a phase</h2>
        <div className="mt-4">
          <AddPhaseForm projectId={projectId} />
        </div>
        {payload.phases.length > 0 ? (
          <p className="mt-4 text-xs text-faint-foreground">
            Want the usual phases for a service?{" "}
            <Link href={crmHref("/projects/templates")} className="underline decoration-border underline-offset-4">
              Manage templates
            </Link>{" "}
            (templates can only be applied to a project that has no phases yet).
          </p>
        ) : null}
      </section>
    </div>
  );
}
