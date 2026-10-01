"use client";

import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function TimelineTab({ data }: { data: ProjectWorkspaceData }) {
  const items = [
    ...(data.project.starts_on
      ? [{ id: "start", date: data.project.starts_on, label: "Project starts", context: data.project.name }]
      : []),
    ...data.milestones.map((milestone) => ({
      id: `milestone-${milestone.id}`,
      date: milestone.due_date ?? "",
      label: milestone.completed_at ? `Milestone completed: ${milestone.name}` : `Milestone: ${milestone.name}`,
      context: `${milestone.total_tasks - milestone.open_tasks}/${milestone.total_tasks} tasks done`,
    })),
    ...data.tasks.flatMap((task) =>
      task.due_date
        ? [
            {
              id: `task-${task.id}`,
              date: task.due_date,
              label: `Task due: ${task.title}`,
              context: task.status.replaceAll("_", " "),
            },
          ]
        : [],
    ),
    ...(data.project.deadline
      ? [{ id: "deadline", date: data.project.deadline, label: "Project deadline", context: data.project.name }]
      : []),
  ]
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <FormSection
      title="Timeline"
      description="Starts, milestone dates, task due dates, and the project deadline in order."
    >
      {items.length === 0 ? (
        <Empty>No dates yet. Add a deadline, milestone date, or task due date.</Empty>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{dateLabel(item.date)}</span>
            </li>
          ))}
        </ol>
      )}
    </FormSection>
  );
}
