"use client";

import { FormSection } from "@/components/form-controls";
import { billingIntervalLabel, dateLabel, dateTimeLabel, hoursLabel, moneyLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function OverviewTab({ data, currency }: { data: ProjectWorkspaceData; currency: string }) {
  const { project, totals, services } = data;
  const estimate = totals.estimated_minutes ?? project.estimated_minutes;

  return (
    <div className="space-y-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <FormSection title="Delivery" description="Where the project stands right now.">
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["Status", project.status.replaceAll("_", " ")],
              ["Starts", dateLabel(project.starts_on)],
              ["Deadline", dateLabel(project.deadline)],
              ["Progress", `${project.progress}%`],
              ["Tasks", `${totals.open_tasks} open · ${totals.done_tasks} done`],
              ["Milestones", `${totals.milestones_done} of ${totals.milestones} complete`],
              ["Estimated", hoursLabel(estimate)],
              ["Actual (time entries)", hoursLabel(totals.actual_minutes)],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {project.description || "No description yet."}
          </p>
        </FormSection>

        <FormSection title="Money" description="Project value, collected revenue, and client MRR.">
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["Project value", moneyNode(project.value_cents, currency)],
              ["Invoiced", moneyNode(totals.invoiced_cents, currency)],
              ["Collected", moneyNode(totals.paid_cents, currency)],
              ["Outstanding", moneyNode(totals.outstanding_cents, currency)],
              ["Client MRR", moneyNode(totals.client_mrr_cents, currency)],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {services.length > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Client services:{" "}
              {services
                .map((service) =>
                  service.billing === "recurring"
                    ? `${service.service_name} (${moneyLabel(service.amount_cents)} ${billingIntervalLabel(
                        service.billing_interval,
                      )})`
                    : `${service.service_name} (one-off)`,
                )
                .join(" · ")}
            </p>
          ) : null}
        </FormSection>
      </div>

      <FormSection title="Recent activity" description="Newest project, task, time, note, and client events.">
        {data.activity.length === 0 ? (
          <Empty>No activity on this project yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm">{entry.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{dateTimeLabel(entry.occurred_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
