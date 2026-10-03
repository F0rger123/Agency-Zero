"use client";

import { FormSection } from "@/components/form-controls";
import { dateLabel, hoursLabel } from "@/lib/format";
import { TimeEntryForm, DeleteTimeEntryForm } from "../../tasks/task-forms";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function TimeTab({ data }: { data: ProjectWorkspaceData }) {
  const estimate = data.totals.estimated_minutes ?? data.project.estimated_minutes;
  const actual = data.totals.actual_minutes;
  const progressPercent = estimate && estimate > 0 ? Math.min(999, Math.round((actual / estimate) * 100)) : null;

  return (
    <div className="space-y-12">
      <FormSection
        title="Actual vs estimated"
        description="Time entries are the source of truth for actual time; estimates come from the project and its tasks."
      >
        <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="text-2xl font-semibold tracking-tight">{hoursLabel(estimate)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Estimated</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-2xl font-semibold tracking-tight">{hoursLabel(actual)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Actual</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-2xl font-semibold tracking-tight">
              {progressPercent == null ? "—" : `${progressPercent}%`}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Of estimate</p>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Time entries"
        description="Log time against this project (optionally against a specific task)."
      >
        {data.time_entries.length === 0 ? (
          <Empty>No time logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.time_entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">
                    {hoursLabel(entry.minutes)} · {dateLabel(entry.worked_on)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.task_title ? `${entry.task_title} · ` : ""}
                    {entry.note || "No note"}
                  </p>
                </div>
                <DeleteTimeEntryForm id={entry.id} projectId={data.project.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6">
          <TimeEntryForm projectId={data.project.id} />
        </div>
      </FormSection>
    </div>
  );
}
