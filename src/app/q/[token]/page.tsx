import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { isMissingTable } from "@/lib/forms";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { QuoteDocument, type PublicLine } from "./quote-response-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Proposal" };

type Quote = {
  number: string;
  title: string;
  notes: string | null;
  status: string;
  issued_on: string;
  valid_until: string | null;
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  tax_rate: number;
  tax_cents: number;
  total_cents: number;
  client_name: string;
  company: string | null;
  business_name: string | null;
  line_items: PublicLine[];
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  responded_by: string | null;
  selected_item_ids: string[] | null;
  accepted_subtotal_cents: number | null;
  accepted_total_cents: number | null;
};

function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero</p>
      <h1 className="mt-4 text-2xl font-semibold">Quote not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This link may be expired, revoked, or incorrect.</p>
    </main>
  );
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { token } = await params;
  const supabase = await createClient();
  const tokenHash = hashPublicToken(token);
  await supabase.rpc("mark_public_quote_viewed", { p_token_hash: tokenHash });
  const response = await supabase.rpc("get_public_quote", { p_token_hash: tokenHash });
  if (response.error) {
    if (isMissingTable(response.error.message)) return <MigrationsRequired />;
    throw new Error(response.error.message);
  }
  if (!response.data) return <NotFound />;

  const quote = response.data as Quote;
  const money = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency }).format(cents / 100);
  const date = (value: string | null) =>
    value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`)) : "—";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
      <header className="border-b border-border pb-10">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {quote.business_name || "Agency Zero"} · Proposal
        </p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{quote.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {quote.number} · Prepared for {quote.client_name}
          {quote.company ? `, ${quote.company}` : ""}
        </p>
        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Issued</dt><dd className="mt-1 font-medium">{date(quote.issued_on)}</dd></div>
          <div><dt className="text-muted-foreground">Valid until</dt><dd className="mt-1 font-medium">{date(quote.valid_until)}</dd></div>
          <div><dt className="text-muted-foreground">Full-price reference</dt><dd className="mt-1 font-medium">{money(quote.total_cents)}</dd></div>
        </dl>
        {quote.notes ? (
          <p className="mt-8 max-w-prose whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{quote.notes}</p>
        ) : null}
      </header>

      <QuoteDocument
        token={token}
        status={quote.status}
        currency={quote.currency}
        discountCents={quote.discount_cents}
        taxRate={quote.tax_rate}
        lines={(quote.line_items ?? []) as PublicLine[]}
        acceptedAt={quote.accepted_at}
        rejectedAt={quote.rejected_at}
        respondedBy={quote.responded_by}
        selectedItemIds={quote.selected_item_ids ?? []}
        acceptedSubtotalCents={quote.accepted_subtotal_cents}
        acceptedTotalCents={quote.accepted_total_cents}
      />

      <footer className="mt-16 border-t border-border pt-5 text-xs text-muted-foreground">
        Questions about this proposal? Contact the agency owner directly.
      </footer>
    </main>
  );
}
