"use client";

import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import { CompleteTaskForm } from "../../tasks/task-forms";
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
      >
        {data.tasks.length === 0 ? (
          <Empty>No tasks yet. Add the first one below.</Empty>
        ) : (
          <div className="space-y-10">
            {data.tasks.map((task) => (
              <div key={task.id} className="border-t border-border pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">
                      {task.parent_title ? "↳ " : ""}
                      <Link href={task.href} className="underline decoration-border underline-offset-4">
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
                  <CompleteTaskForm taskId={task.id} />
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

      <FormSection
        title="Add a task"
        description="Status, priority, due date, milestone, estimate, and subtask parent."
      >
        <ProjectTaskForm
          projectId={data.project.id}
          clientId={data.project.client_id}
          milestones={data.milestones}
          tasks={taskOptions}
        />
      </FormSection>
    </div>
  );
}
