"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { ActionState } from "@/lib/forms";
import { completeTaskAction, createTaskAction, createTimeEntryAction, deleteTaskAction, deleteTimeEntryAction, updateTaskAction } from "./actions";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";

const initialState: ActionState = {};

type Option = { id: string; label: string };
type Task = {
  id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null;
  estimated_minutes: number | null; actual_minutes: number | null; scheduled_date: string | null; client_id: string | null; project_id: string | null;
  milestone_id: string | null; parent_task_id: string | null; depends_on_task_id: string | null; recurrence_rule: Record<string, unknown> | null;
};

function FormShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="border-t border-border pt-6"><h2 className="text-sm font-medium">{title}</h2><div className="mt-4">{children}</div></div>;
}

function TaskFields({ task, clients, projects, milestones, tasks }: { task?: Task; clients: Option[]; projects: Option[]; milestones: Option[]; tasks: Option[] }) {
  return <div className="space-y-4">
    <div><FieldLabel label="Title" htmlFor="task-title" required /><TextInput id="task-title" name="title" defaultValue={task?.title} required placeholder="Send homepage draft" /></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><FieldLabel label="Status" htmlFor="task-status" required /><SelectInput id="task-status" name="status" defaultValue={task?.status ?? "todo"} required><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked_waiting_client">Waiting on client</option><option value="blocked_other">Blocked</option><option value="done">Done</option><option value="cancelled">Cancelled</option></SelectInput></div>
      <div><FieldLabel label="Priority" htmlFor="task-priority" required /><SelectInput id="task-priority" name="priority" defaultValue={task?.priority ?? "medium"} required><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></SelectInput></div>
      <div><FieldLabel label="Client" htmlFor="task-client" /><SelectInput id="task-client" name="client_id" defaultValue={task?.client_id}><option value="">No client</option>{clients.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</SelectInput></div>
      <div><FieldLabel label="Project" htmlFor="task-project" /><SelectInput id="task-project" name="project_id" defaultValue={task?.project_id}><option value="">No project</option>{projects.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</SelectInput></div>
      <div><FieldLabel label="Milestone" htmlFor="task-milestone" /><SelectInput id="task-milestone" name="milestone_id" defaultValue={task?.milestone_id}><option value="">No milestone</option>{milestones.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</SelectInput></div>
      <div><FieldLabel label="Parent task" htmlFor="task-parent" hint="for subtasks" /><SelectInput id="task-parent" name="parent_task_id" defaultValue={task?.parent_task_id}><option value="">No parent</option>{tasks.filter((option) => option.id !== task?.id).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</SelectInput></div>
      <div><FieldLabel label="Due date" htmlFor="task-due" /><TextInput id="task-due" name="due_date" type="date" defaultValue={task?.due_date} /></div>
      <div><FieldLabel label="Planned date" htmlFor="task-scheduled" hint="workload" /><TextInput id="task-scheduled" name="scheduled_date" type="date" defaultValue={task?.scheduled_date} /></div>
      <div><FieldLabel label="Depends on" htmlFor="task-dependency" hint="one predecessor" /><SelectInput id="task-dependency" name="depends_on_task_id" defaultValue={task?.depends_on_task_id}><option value="">No dependency</option>{tasks.filter((option) => option.id !== task?.id).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</SelectInput></div>
      <div><FieldLabel label="Estimated time" htmlFor="task-estimated" hint="hours" /><TextInput id="task-estimated" name="estimated_hours" type="number" min={0} step={0.25} defaultValue={task?.estimated_minutes != null ? task.estimated_minutes / 60 : null} /></div>
      <div><FieldLabel label="Actual time" htmlFor="task-actual" hint="hours" /><TextInput id="task-actual" name="actual_hours" type="number" min={0} step={0.25} defaultValue={task?.actual_minutes != null ? task.actual_minutes / 60 : null} /></div>
    </div>
    <div><FieldLabel label="Description" htmlFor="task-description" /><TextArea id="task-description" name="description" defaultValue={task?.description} rows={4} /></div>
    <div><FieldLabel label="Recurring rule" htmlFor="task-recurrence" hint="JSON architecture, for example frequency weekly" /><TextInput id="task-recurrence" name="recurrence_rule" defaultValue={task?.recurrence_rule ? JSON.stringify(task.recurrence_rule) : ""} placeholder='{"frequency":"weekly"}' /></div>
  </div>;
}

export function NewTaskForm({ clients, projects, milestones, tasks }: { clients: Option[]; projects: Option[]; milestones: Option[]; tasks: Option[] }) {
  const [state, action] = useActionState(createTaskAction, initialState);
  return <FormShell title="Add task"><form action={action} className="space-y-5"><TaskFields clients={clients} projects={projects} milestones={milestones} tasks={tasks} /><div className="flex flex-wrap items-center gap-4"><SubmitButton>Create task</SubmitButton><FormMessage {...state} /></div></form></FormShell>;
}

export function EditTaskForm({ task, clients, projects, milestones, tasks }: { task: Task; clients: Option[]; projects: Option[]; milestones: Option[]; tasks: Option[] }) {
  const [state, action] = useActionState(updateTaskAction, initialState);
  return <FormShell title="Edit task"><form action={action} className="space-y-5"><input type="hidden" name="id" value={task.id} /><TaskFields task={task} clients={clients} projects={projects} milestones={milestones} tasks={tasks} /><div className="flex flex-wrap items-center gap-4"><SubmitButton>Save task</SubmitButton><FormMessage {...state} /></div></form></FormShell>;
}

export function CompleteTaskForm({ taskId }: { taskId: string }) {
  const [state, action] = useActionState(completeTaskAction, initialState);
  return <form action={action} className="flex flex-wrap items-center gap-3"><input type="hidden" name="id" value={taskId} /><SubmitButton pendingLabel="Completing…">Complete task</SubmitButton><FormMessage {...state} /></form>;
}

export function DeleteTaskForm({ taskId }: { taskId: string }) {
  const [state, action] = useActionState(deleteTaskAction, initialState);
  return <form action={action} className="flex flex-wrap items-center gap-3"><input type="hidden" name="id" value={taskId} /><SubmitButton pendingLabel="Deleting…" className="bg-background px-0 py-0 text-sm font-normal text-muted-foreground ring-0 hover:text-foreground">Delete task</SubmitButton><FormMessage {...state} /></form>;
}

export function TimeEntryForm({ taskId, projectId }: { taskId?: string; projectId?: string }) {
  const [state, action] = useActionState(createTimeEntryAction, initialState);
  return <form action={action} className="space-y-4"><input type="hidden" name="task_id" value={taskId ?? ""} /><input type="hidden" name="project_id" value={projectId ?? ""} /><div className="grid gap-4 sm:grid-cols-3"><div><FieldLabel label="Time" htmlFor="time-entry-hours" required hint="hours" /><TextInput id="time-entry-hours" name="hours" type="number" min={0.01} step={0.25} required /></div><div><FieldLabel label="Worked on" htmlFor="time-entry-date" required /><TextInput id="time-entry-date" name="worked_on" type="date" required /></div><div><FieldLabel label="Note" htmlFor="time-entry-note" /><TextInput id="time-entry-note" name="note" /></div></div><div className="flex flex-wrap items-center gap-4"><SubmitButton>Add time</SubmitButton><FormMessage {...state} /></div></form>;
}

export function DeleteTimeEntryForm({ id, taskId, projectId }: { id: string; taskId?: string; projectId?: string }) {
  const [state, action] = useActionState(deleteTimeEntryAction, initialState);
  return <form action={action} className="flex flex-wrap items-center gap-3"><input type="hidden" name="id" value={id} /><input type="hidden" name="task_id" value={taskId ?? ""} /><input type="hidden" name="project_id" value={projectId ?? ""} /><SubmitButton pendingLabel="Removing…" className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground">Remove</SubmitButton><FormMessage {...state} /></form>;
}
