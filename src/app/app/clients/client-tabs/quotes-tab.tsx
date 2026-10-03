"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { FormSection } from "@/components/form-controls";
import { dateLabel, moneyLabel } from "@/lib/format";
import { NewQuoteForm } from "../../quotes/quote-forms";
import { clientFormOptions } from "../client-workspace-options";
import type { ClientWorkspaceData } from "../client-workspace-types";
import { Empty } from "../client-workspace-parts";

export function QuotesTab({ data }: { data: ClientWorkspaceData }) {
  const options = clientFormOptions(data);
  return (
    <FormSection title="Quotes" description="Proposals sent to this client, including recurring proposals.">
      {data.quotes.length === 0 ? (
        <Empty>No quotes yet. Create the first one below.</Empty>
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
              <span className="text-sm text-muted-foreground">{moneyLabel(quote.total_cents, quote.currency)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <NewQuoteForm lockedClientId={data.client.id} clients={options.clients} services={options.services} />
      </div>
    </FormSection>
  );
}
