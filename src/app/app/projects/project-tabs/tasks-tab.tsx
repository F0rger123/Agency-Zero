"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import { AddDialog } from "@/components/modal";
import { ConfirmDelete } from "@/components/confirm-delete";
import { CompleteTaskForm, NewTaskForm } from "../../tasks/task-forms";
import { deleteTaskAction } from "../../tasks/actions";
import { TaskQuickEdit } from "../../tasks/task-quick-edit";
import { ProjectTaskForm } from "../project-workspace-forms";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function TasksTab({ data }: { data: ProjectWorkspaceData }) {
  const taskOptions = data.tasks.map((task) => ({
    id: task.id,
    label: task.parent_title ? `↳ ${task.title}` : task.title,
  }));

  return (
    <div className="space-y-12">
      <FormSection
        title="Tasks and subtasks"
        description="Created here, tasks are attached to this project automatically. Subtasks use the parent task field."
        action={
          <AddDialog label="New task" title="New task" description={data.project.name}>
            <NewTaskForm
              lockedClientId={data.project.client_id}
              lockedProjectId={data.project.id}
              clients={[{ id: data.project.client_id, label: data.client?.name ?? "This client" }]}
              projects={[{ id: data.project.id, label: data.project.name }]}
              milestones={data.milestones.map((m) => ({ id: m.id, label: m.name }))}
            />
          </AddDialog>
        }
      >
        {data.tasks.length === 0 ? (
          <Empty>No tasks yet.</Empty>
        ) : (
          <div className="space-y-10">
            {data.tasks.map((task) => (
              <div key={task.id} className="border-t border-border pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">
                      {task.parent_title ? "↳ " : ""}
                      <Link href={crmHref(task.href)} className="underline decoration-border underline-offset-4">
                        {task.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.status === "blocked_waiting_client"
                        ? "waiting on client"
                        : task.status.replaceAll("_", " ")}{" "}
                      · {task.priority} · due {dateLabel(task.due_date)}
                      {task.milestone_name ? ` · ${task.milestone_name}` : ""}
                      {task.parent_title ? ` · subtask of ${task.parent_title}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <CompleteTaskForm taskId={task.id} />
                    <ConfirmDelete
                      action={deleteTaskAction}
                      fields={{ id: task.id }}
                      title="Delete this task?"
                      message={`“${task.title}” and its subtasks will be removed. This cannot be undone.`}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <TaskQuickEdit key={`${task.status}|${task.priority}|${task.due_date}`} id={task.id} status={task.status} priority={task.priority} dueDate={task.due_date} />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">
                    Edit task
                  </summary>
                  <div className="mt-4">
                    <ProjectTaskForm
                      projectId={data.project.id}
                      clientId={data.project.client_id}
                      milestones={data.milestones}
                      tasks={taskOptions}
                      task={task}
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
}
