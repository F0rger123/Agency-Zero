"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function ContractsTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Contracts" description="Agreements for this client and their signature status.">
      {data.contracts.length === 0 ? (
        <Empty>No contracts yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.contracts.map((contract) => (
            <li key={contract.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <Link href={crmHref(contract.href)} className="font-medium underline decoration-border underline-offset-4">
                  {contract.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contract.status} · v{contract.version}
                  {contract.signed_at ? ` · signed ${dateLabel(contract.signed_at)}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">updated {dateLabel(contract.updated_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
