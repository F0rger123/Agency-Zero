"use client";

import Link from "next/link";
import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { billingIntervalLabel, dateLabel, moneyLabel } from "@/lib/format";
import { RemoveServiceForm, ServiceForm } from "../client-forms";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function ServicesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Services"
      description="Catalogue services delivered to this client. Recurring amounts drive the dashboard MRR."
      action={
        data.service_catalog.length === 0 ? (
          <Link href="/app/services" className="text-sm underline decoration-border underline-offset-4">
            Add services to your catalogue first
          </Link>
        ) : (
          <AddDialog label="Add service" title="Add a service" description={`For ${data.client.name}`}>
            <ServiceForm clientId={data.client.id} services={data.service_catalog} compact />
          </AddDialog>
        )
      }
    >
      {data.services.length === 0 ? (
        <Empty>No services yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.services.map((assignment) => (
            <li key={assignment.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{assignment.service_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {assignment.billing === "recurring"
                    ? `Recurring · ${moneyLabel(assignment.amount_cents)} ${billingIntervalLabel(
                        assignment.billing_interval,
                      )} · ${moneyLabel(assignment.monthly_amount_cents)}/month`
                    : `One-time${assignment.amount_cents ? ` · ${moneyLabel(assignment.amount_cents)}` : ""}`}
                  {assignment.started_on ? ` · since ${dateLabel(assignment.started_on)}` : ""}
                </p>
              </div>
              <RemoveServiceForm clientId={data.client.id} id={assignment.id} />
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
