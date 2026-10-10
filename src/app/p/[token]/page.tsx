import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { isMissingTable } from "@/lib/forms";
import { MigrationsRequired, SetupRequired } from "@/components/states";

export const metadata: Metadata = {
  title: "Your documents",
  robots: { index: false, follow: false },
};

type Portal = {
  client_name: string;
  company: string | null;
  business_name: string | null;
  quotes: { number: string; title: string; kind: "quote" | "estimate"; status: string; total_cents: number; currency: string; valid_until: string | null; issued_on: string; accepted_at: string | null; rejected_at: string | null; token: string }[];
  contracts: { title: string; status: string; signed_at: string | null; token: string }[];
  invoices: { number: string; title: string; status: string; due_on: string; total_cents: number; balance_cents: number; currency: string }[];
};

const money = (cents: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
};
const day = (value: string | null) => (value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value)) : "");

function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">This link is not available</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">It may have been turned off or replaced. Please ask for a fresh link.</p>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <li className="rounded-2xl border-[1.5px] border-foreground/25 bg-background p-5 sm:p-6">{children}</li>;
}

/**
 * The private client portal. Reads one anonymous function (get_public_portal) and links to the existing secure
 * proposal (/q) and contract (/c) pages, so anything the client accepts or signs updates the CRM by itself.
 */
export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { token } = await params;
  const supabase = await createClient();
  const response = await supabase.rpc("get_public_portal", { p_token_hash: hashPublicToken(token) });
  if (response.error) {
    if (isMissingTable(response.error.message)) return <MigrationsRequired />;
    throw new Error(response.error.message);
  }
  if (!response.data) return <NotFound />;

  const portal = response.data as Portal;
  const brand = portal.business_name || "Agency Zero";
  const waitingQuotes = portal.quotes.filter((quote) => ["sent", "viewed"].includes(quote.status));
  const waitingContracts = portal.contracts.filter((contract) => contract.status === "sent");
  const doneQuotes = portal.quotes.filter((quote) => !["sent", "viewed"].includes(quote.status));
  const doneContracts = portal.contracts.filter((contract) => contract.status !== "sent");
  const open = portal.invoices.filter((invoice) => invoice.balance_cents > 0);
  const waiting = waitingQuotes.length + waitingContracts.length;
  const noun = (kind: string) => (kind === "estimate" ? "Estimate" : "Proposal");

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-6 sm:py-16">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">{brand}</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Hello, {portal.client_name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {waiting > 0 ? `${waiting} ${waiting === 1 ? "item is" : "items are"} waiting for you below.` : "You are all caught up. Everything we have shared is listed here."}
        </p>
      </header>

      {waiting > 0 ? (
        <section aria-labelledby="waiting-heading" className="mt-10">
          <h2 id="waiting-heading" className="text-sm font-semibold uppercase tracking-widest">Waiting for you</h2>
          <ul className="mt-4 space-y-3">
            {waitingQuotes.map((quote) => (
              <Card key={quote.token}>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{noun(quote.kind)} · {quote.number}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{quote.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {money(quote.total_cents, quote.currency)}
                  {quote.valid_until ? ` · valid until ${day(quote.valid_until)}` : ""}
                </p>
                <Link href={`/q/${quote.token}`} className="mt-4 inline-flex rounded-full bg-inverted px-5 py-2.5 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80">
                  Review and respond
                </Link>
              </Card>
            ))}
            {waitingContracts.map((contract) => (
              <Card key={contract.token}>
                <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Contract</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{contract.title}</p>
                <Link href={`/c/${contract.token}`} className="mt-4 inline-flex rounded-full bg-inverted px-5 py-2.5 text-sm font-medium text-inverted-foreground transition-opacity hover:opacity-80">
                  Review and sign
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      {open.length > 0 ? (
        <section aria-labelledby="owing-heading" className="mt-12">
          <h2 id="owing-heading" className="text-sm font-semibold uppercase tracking-widest">Invoices to pay</h2>
          <ul className="mt-4 space-y-3">
            {open.map((invoice) => (
              <Card key={invoice.number}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Invoice {invoice.number}</p>
                    <p className="mt-1 font-semibold tracking-tight">{invoice.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Due {day(invoice.due_on)}{invoice.status === "overdue" ? " · overdue" : ""}</p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold">{money(invoice.balance_cents, invoice.currency)}</p>
                </div>
              </Card>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">To pay, reply to the message you received with this link and we will confirm how.</p>
        </section>
      ) : null}

      {doneQuotes.length + doneContracts.length + portal.invoices.filter((invoice) => invoice.balance_cents <= 0).length > 0 ? (
        <section aria-labelledby="done-heading" className="mt-12">
          <h2 id="done-heading" className="text-sm font-semibold uppercase tracking-widest">History</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
            {doneQuotes.map((quote) => (
              <li key={quote.token} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link href={`/q/${quote.token}`} className="font-medium underline decoration-border underline-offset-4">{noun(quote.kind)} · {quote.title}</Link>
                <span className="text-muted-foreground">{quote.status === "accepted" ? `Accepted ${day(quote.accepted_at)}` : quote.status === "rejected" ? `Declined ${day(quote.rejected_at)}` : quote.status}</span>
              </li>
            ))}
            {doneContracts.map((contract) => (
              <li key={contract.token} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link href={`/c/${contract.token}`} className="font-medium underline decoration-border underline-offset-4">Contract · {contract.title}</Link>
                <span className="text-muted-foreground">{contract.signed_at ? `Signed ${day(contract.signed_at)}` : contract.status}</span>
              </li>
            ))}
            {portal.invoices.filter((invoice) => invoice.balance_cents <= 0).map((invoice) => (
              <li key={invoice.number} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium">Invoice {invoice.number} · {invoice.title}</span>
                <span className="text-muted-foreground">Paid · {money(invoice.total_cents, invoice.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-16 border-t border-border pt-5 text-xs text-muted-foreground">
        Private page for {portal.client_name}{portal.company ? `, ${portal.company}` : ""}. Please do not share this link. Questions? Reply to the message you received it in.
      </footer>
    </main>
  );
}
