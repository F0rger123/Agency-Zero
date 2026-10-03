"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { dateLabel, hoursLabel } from "@/lib/format";
import { NewTaskForm } from "../../tasks/task-forms";
import { clientFormOptions } from "../client-workspace-options";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function TasksTab({ data }: { data: ClientWorkspaceData }) {
  const options = clientFormOptions(data);
  return (
    <FormSection title="Tasks" description="Every task linked to this client, oldest due date first.">
      {data.tasks.length === 0 ? (
        <Empty>No tasks for this client yet. Add the first one below.</Empty>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Priority</th>
                <th className="px-3 py-3 font-medium">Due</th>
                <th className="px-3 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-3 py-4 font-medium">
                    <Link href={crmHref(task.href)} className="underline decoration-border underline-offset-4">
                      {task.title}
                    </Link>
                    {task.project_name ? (
                      <span className="mt-1 block text-xs text-muted-foreground">{task.project_name}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {task.status === "blocked_waiting_client" ? "waiting on client" : task.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{task.priority}</td>
                  <td className="px-3 py-4 text-muted-foreground">{dateLabel(task.due_date)}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {hoursLabel(task.actual_minutes)} / {hoursLabel(task.estimated_minutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-8">
        <NewTaskForm
          lockedClientId={data.client.id}
          clients={options.clients}
          projects={options.projects}
          milestones={[]}
          tasks={[]}
        />
      </div>
    </FormSection>
  );
}
