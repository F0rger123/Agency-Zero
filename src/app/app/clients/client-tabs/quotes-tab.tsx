"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { AddDialog } from "@/components/modal";
import { FormSection } from "@/components/form-controls";
import { dateLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import { NewQuoteForm } from "../../quotes/quote-forms";
import { clientFormOptions } from "../client-workspace-options";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function QuotesTab({ data }: { data: ClientWorkspaceData }) {
  const options = clientFormOptions(data);
  return (
    <FormSection
      title="Quotes"
      description="Proposals sent to this client, including recurring proposals."
      action={
        <AddDialog label="New quote" title="New quote" description={`For ${data.client.name}`}>
          <NewQuoteForm lockedClientId={data.client.id} clients={options.clients} services={options.services} />
        </AddDialog>
      }
    >
      {data.quotes.length === 0 ? (
        <Empty>No quotes yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.quotes.map((quote) => (
            <li key={quote.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <Link href={crmHref(quote.href)} className="font-medium underline decoration-border underline-offset-4">
                  {quote.number} · {quote.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {quote.status}
                  {quote.is_recurring ? " · includes recurring" : ""} · issued {dateLabel(quote.issued_on)}
                  {quote.accepted_at ? ` · accepted ${dateLabel(quote.accepted_at)}` : ""}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">{moneyNode(quote.total_cents, quote.currency)}</span>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}
