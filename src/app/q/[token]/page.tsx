import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hashPublicToken } from "@/lib/public-tokens";
import { isMissingTable } from "@/lib/forms";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { QuoteResponseForm } from "./quote-response-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Proposal" };

type Line = { id: string; description: string; qty: number; unit_amount_cents: number; amount_cents: number; is_recurring: boolean; billing_period: string | null };
type Quote = { number: string; title: string; status: string; issued_on: string; valid_until: string | null; currency: string; subtotal_cents: number; discount_cents: number; tax_rate: number; tax_cents: number; total_cents: number; client_name: string; company: string | null; line_items: Line[]; accepted_at: string | null; rejected_at: string | null };

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { token } = await params; const supabase = await createClient(); const tokenHash = hashPublicToken(token);
  await supabase.rpc("mark_public_quote_viewed", { p_token_hash: tokenHash });
  const response = await supabase.rpc("get_public_quote", { p_token_hash: tokenHash });
  if (response.error) { if (isMissingTable(response.error.message)) return <MigrationsRequired />; throw new Error(response.error.message); }
  if (!response.data) return <main className="mx-auto max-w-2xl px-6 py-16"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero</p><h1 className="mt-4 text-2xl font-semibold">Quote not found</h1><p className="mt-2 text-sm text-muted-foreground">This link may be expired, revoked, or incorrect.</p></main>;
  const quote = response.data as Quote; const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency }).format(cents / 100);
  const date = (value: string | null) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`)) : "—";
  const canRespond = ["sent", "viewed"].includes(quote.status);
  return <main className="mx-auto max-w-3xl px-6 py-12 sm:py-20"><header className="border-b border-border pb-10"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Agency Zero · Proposal</p><h1 className="mt-5 text-3xl font-semibold tracking-tight">{quote.title}</h1><p className="mt-2 text-sm text-muted-foreground">{quote.number} · Prepared for {quote.client_name}{quote.company ? `, ${quote.company}` : ""}</p></header><section className="mt-10"><dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Issued</dt><dd className="mt-1 font-medium">{date(quote.issued_on)}</dd></div><div><dt className="text-muted-foreground">Valid until</dt><dd className="mt-1 font-medium">{date(quote.valid_until)}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd className="mt-1 font-medium uppercase">{quote.status}</dd></div></dl><div className="mt-10 divide-y divide-border border-y border-border">{quote.line_items.map((line) => <div key={line.id} className="flex flex-wrap justify-between gap-4 py-5"><div><p className="font-medium">{line.description}</p><p className="mt-1 text-sm text-muted-foreground">{line.qty} × {money(line.unit_amount_cents)}{line.is_recurring ? ` · recurring ${line.billing_period}` : ""}</p></div><p className="font-medium">{money(line.amount_cents)}</p></div>)}</div><dl className="ml-auto mt-8 max-w-sm divide-y divide-border border-y border-border text-sm"><div className="flex justify-between py-3"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(quote.subtotal_cents)}</dd></div><div className="flex justify-between py-3"><dt className="text-muted-foreground">Discount</dt><dd>−{money(quote.discount_cents)}</dd></div><div className="flex justify-between py-3"><dt className="text-muted-foreground">Tax ({quote.tax_rate}%)</dt><dd>{money(quote.tax_cents)}</dd></div><div className="flex justify-between py-4 text-base font-semibold"><dt>Total</dt><dd>{money(quote.total_cents)}</dd></div></dl></section>{canRespond ? <QuoteResponseForm token={token} /> : <p className="mt-10 border-t border-border pt-6 text-sm font-medium">This quote is {quote.status}.</p>}<footer className="mt-16 border-t border-border pt-5 text-xs text-muted-foreground">Questions about this proposal? Contact the agency owner directly.</footer></main>;
}
