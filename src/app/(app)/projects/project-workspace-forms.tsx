"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/forms";
import { FieldLabel, FormMessage, SelectInput, SubmitButton, TextArea, TextInput } from "@/components/form-controls";
import { createTaskAction, updateTaskAction } from "../tasks/actions";
import { MilestoneForm } from "./project-forms";
import {
  createProjectNoteAction,
  deleteProjectNoteAction,
  deleteProjectFileAction,
  setMilestoneCompletedAction,
  uploadProjectFileAction,
} from "./actions";

const initialState: ActionState = {};

type Option = { id: string; label: string };

export type WorkspaceTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  scheduled_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  milestone_id: string | null;
  milestone_name: string | null;
  parent_task_id: string | null;
  parent_title: string | null;
  depends_on_task_id: string | null;
  recurrence_rule: Record<string, unknown> | null;
  updated_at: string;
  href: string;
};

export type WorkspaceMilestone = {
  id: string;
  name: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  open_tasks: number;
  total_tasks: number;
};

export function ProjectMilestoneForm({ projectId }: { projectId: string }) {
  return <MilestoneForm projectId={projectId} />;
}

/**
 * Create OR edit a task without leaving the project.
 *
 * `createTaskAction` / `updateTaskAction` rebuild the whole task from the
 * submitted fields, so every value the form does not show is carried through
 * as a hidden input. That keeps in-project editing lossless: changing status,
 * priority, due date, milestone, or estimate never clears a description,
 * planned date, dependency, or recurrence rule.
 */
export function ProjectTaskForm({
  projectId,
  clientId,
  milestones,
  tasks,
  task,
}: {
  projectId: string;
  clientId: string | null;
  milestones: WorkspaceMilestone[];
  tasks: Option[];
  task?: WorkspaceTask;
}) {
  const [state, action] = useActionState(task ? updateTaskAction : createTaskAction, initialState);
  const key = task?.id ?? "new";

  return (
    <form action={action} className="space-y-4">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}
      {/* Auto-association: tasks created here belong to this project. */}
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      {/* Fields that are not edited in this form, preserved on update. */}
      {task ? (
        <>
          <input type="hidden" name="scheduled_date" value={task.scheduled_date ?? ""} />
          <input
            type="hidden"
            name="actual_hours"
            value={task.actual_minutes != null ? task.actual_minutes / 60 : ""}
          />
          <input
            type="hidden"
            name="recurrence_rule"
            value={task.recurrence_rule ? JSON.stringify(task.recurrence_rule) : ""}
          />
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FieldLabel label="Task" htmlFor={`pw-title-${key}`} required />
          <TextInput
            id={`pw-title-${key}`}
            name="title"
            required
            defaultValue={task?.title}
            placeholder="Build the pricing page"
          />
        </div>
        <div>
          <FieldLabel label="Status" htmlFor={`pw-status-${key}`} required />
          <SelectInput id={`pw-status-${key}`} name="status" required defaultValue={task?.status ?? "todo"}>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked_waiting_client">Waiting on client</option>
            <option value="blocked_other">Blocked</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Priority" htmlFor={`pw-priority-${key}`} required />
          <SelectInput id={`pw-priority-${key}`} name="priority" required defaultValue={task?.priority ?? "medium"}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Due date" htmlFor={`pw-due-${key}`} />
          <TextInput id={`pw-due-${key}`} name="due_date" type="date" defaultValue={task?.due_date} />
        </div>
        <div>
          <FieldLabel label="Milestone" htmlFor={`pw-milestone-${key}`} hint="link to a goal" />
          <SelectInput id={`pw-milestone-${key}`} name="milestone_id" defaultValue={task?.milestone_id ?? ""}>
            <option value="">No milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Parent task" htmlFor={`pw-parent-${key}`} hint="for subtasks" />
          <SelectInput id={`pw-parent-${key}`} name="parent_task_id" defaultValue={task?.parent_task_id ?? ""}>
            <option value="">No parent</option>
            {tasks
              .filter((option) => option.id !== task?.id)
              .map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel label="Estimated time" htmlFor={`pw-estimate-${key}`} hint="hours" />
          <TextInput
            id={`pw-estimate-${key}`}
            name="estimated_hours"
            type="number"
            min={0}
            step={0.25}
            defaultValue={task?.estimated_minutes != null ? task.estimated_minutes / 60 : null}
          />
        </div>
        {task ? (
          <div>
            <FieldLabel label="Depends on" htmlFor={`pw-dependency-${key}`} />
            <SelectInput
              id={`pw-dependency-${key}`}
              name="depends_on_task_id"
              defaultValue={task.depends_on_task_id ?? ""}
            >
              <option value="">No dependency</option>
              {tasks
                .filter((option) => option.id !== task.id)
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
            </SelectInput>
          </div>
        ) : null}
      </div>

      <div>
        <FieldLabel label="Description" htmlFor={`pw-description-${key}`} />
        <TextArea id={`pw-description-${key}`} name="description" rows={3} defaultValue={task?.description} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>{task ? "Save task" : "Add task"}</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function MilestoneBlock({ projectId, milestone }: { projectId: string; milestone: WorkspaceMilestone }) {
  const completed = Boolean(milestone.completed_at);
  return (
    <div className="border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-medium">{milestone.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {milestone.due_date ? `Due ${milestone.due_date}` : "No due date"} ·{" "}
            {milestone.total_tasks - milestone.open_tasks}/{milestone.total_tasks} tasks done
            {completed ? " · completed" : ""}
          </p>
        </div>
        <SetMilestoneCompletedForm projectId={projectId} milestoneId={milestone.id} completed={completed} />
      </div>
      <div className="mt-4">
        <MilestoneForm
          projectId={projectId}
          milestone={{
            id: milestone.id,
            project_id: projectId,
            name: milestone.name,
            due_date: milestone.due_date,
            completed_at: milestone.completed_at,
          }}
        />
      </div>
    </div>
  );
}

export function SetMilestoneCompletedForm({
  projectId,
  milestoneId,
  completed,
}: {
  projectId: string;
  milestoneId: string;
  completed: boolean;
}) {
  const [state, action] = useActionState(setMilestoneCompletedAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="id" value={milestoneId} />
      <input type="hidden" name="completed" value={completed ? "false" : "true"} />
      <SubmitButton
        pendingLabel="Saving…"
        className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground"
      >
        {completed ? "Reopen milestone" : "Mark complete"}
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ProjectNoteForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(createProjectNoteAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <FieldLabel label="Note" htmlFor="project-note" required />
        <TextArea
          id="project-note"
          name="body"
          rows={4}
          required
          placeholder="Decision, risk, or context for this project"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="pinned" className="size-4 accent-black" />
        Pin this note
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Add note</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function DeleteProjectNoteForm({ projectId, noteId }: { projectId: string; noteId: string }) {
  const [state, action] = useActionState(deleteProjectNoteAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="id" value={noteId} />
      <SubmitButton
        pendingLabel="Removing…"
        className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground"
      >
        Remove
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}

export function ProjectFileUploadForm({ projectId }: { projectId: string }) {
  const [state, action] = useActionState(uploadProjectFileAction, initialState);
  return (
    <form action={action} encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <FieldLabel label="File" htmlFor="project-file" hint="10 MB maximum" required />
        <input id="project-file" name="file" type="file" required className="mt-2 block w-full text-sm" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Upload file</SubmitButton>
        <FormMessage {...state} />
      </div>
    </form>
  );
}

export function DeleteProjectFileForm({
  projectId,
  fileId,
  storagePath,
}: {
  projectId: string;
  fileId: string;
  storagePath: string;
}) {
  const [state, action] = useActionState(deleteProjectFileAction, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="id" value={fileId} />
      <input type="hidden" name="storage_path" value={storagePath} />
      <SubmitButton
        pendingLabel="Removing…"
        className="bg-background px-0 py-0 text-xs font-normal text-muted-foreground ring-0 hover:text-foreground"
      >
        Remove
      </SubmitButton>
      <FormMessage {...state} />
    </form>
  );
}
