"use client";

import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { dateTimeLabel } from "@/lib/format";
import { CommunicationForm, DeleteCommunicationForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function ActivityTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Activity"
      description="Manual log of calls, emails, meetings, and messages."
      action={
        <AddDialog label="Log activity" title="Log activity" description={`With ${data.client.name}`}>
          <CommunicationForm clientId={data.client.id} contacts={data.contacts.map(({ id, name }) => ({ id, name }))} />
        </AddDialog>
      }
    >
      {data.communications.length === 0 ? (
        <Empty>No activity logged yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.communications.map((entry) => (
            <li key={entry.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {entry.channel} · {entry.direction === "in" ? "Incoming" : "Outgoing"}
                    {entry.contact_name ? ` · ${entry.contact_name}` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                  <p className="mt-2 text-xs text-faint-foreground">{dateTimeLabel(entry.occurred_at)}</p>
                </div>
                <DeleteCommunicationForm clientId={data.client.id} id={entry.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
