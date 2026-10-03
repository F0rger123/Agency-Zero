"use client";

import { FormSection } from "@/components/form-controls";
import { dateTimeLabel, moneyLabel } from "@/lib/format";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function OverviewTab({ data }: { data: ClientWorkspaceData }) {
  const { client, stats } = data;
  const pinned = data.notes.filter((note) => note.pinned);

  return (
    <div className="space-y-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <FormSection title="Position" description="What this client is worth and what is open right now.">
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["MRR", moneyLabel(stats.mrr_cents)],
              ["Invoiced", moneyLabel(stats.invoiced_cents)],
              ["Collected", moneyLabel(stats.paid_cents)],
              ["Outstanding", moneyLabel(stats.outstanding_cents)],
              ["Open tasks", String(stats.open_tasks)],
              ["Waiting on client", String(stats.waiting_tasks)],
              ["Quotes awaiting response", String(stats.quotes_awaiting)],
              ["Contracts unsigned", String(stats.contracts_unsigned)],
              ["Projects", `${stats.active_projects} active · ${stats.total_projects} total`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>
        <FormSection title="Summary" description="Client context as recorded on the client record.">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {client.notes_summary || "No summary recorded yet."}
          </p>
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Pinned notes</h3>
            {pinned.length === 0 ? (
              <Empty>No pinned notes. Pin one in the Notes tab to keep it visible here.</Empty>
            ) : (
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {pinned.map((note) => (
                  <li key={note.id} className="py-3 text-sm leading-6">
                    {note.body}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormSection>
      </div>
      <FormSection title="Recent activity" description="The newest logged client communication.">
        {data.communications.length === 0 ? (
          <Empty>No activity logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.communications.slice(0, 5).map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm font-medium">
                  {entry.channel} · {entry.direction === "in" ? "Incoming" : "Outgoing"}
                  {entry.contact_name ? ` · ${entry.contact_name}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
                <p className="mt-1 text-xs text-faint-foreground">{dateTimeLabel(entry.occurred_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
