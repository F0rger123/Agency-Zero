"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { billingIntervalLabel, moneyLabel } from "@/lib/format";
import type { ProjectWorkspaceData } from "../project-workspace-types";
import { Empty } from "../project-workspace-parts";

export function ClientTab({ data }: { data: ProjectWorkspaceData }) {
  const { client, services } = data;
  if (!client) return <Empty>This project has no client record.</Empty>;

  return (
    <div className="space-y-12">
      <FormSection title="Client" description="The relationship this project belongs to.">
        <dl className="divide-y divide-border border-y border-border text-sm">
          {[
            ["Name", client.name],
            ["Company", client.company ?? "—"],
            ["Status", client.status],
            ["Email", client.email ?? "—"],
            ["Phone", client.phone ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-6 py-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4">
          <Link href={crmHref(client.href)} className="text-sm underline decoration-border underline-offset-4">
            Open the client workspace →
          </Link>
        </p>
      </FormSection>
      <FormSection title="Client services" description="Recurring services on this client contribute to MRR.">
        {services.length === 0 ? (
          <Empty>No services assigned to this client.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {services.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-medium">{service.service_name}</span>
                <span className="text-muted-foreground">
                  {service.billing === "recurring"
                    ? `${moneyLabel(service.amount_cents)} ${billingIntervalLabel(service.billing_interval)} · ${moneyLabel(service.monthly_amount_cents)}/mo`
                    : "one-off"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4">
          <Link href="/app/services" className="text-sm underline decoration-border underline-offset-4">
            Manage the service catalogue →
          </Link>
        </p>
      </FormSection>
    </div>
  );
}
