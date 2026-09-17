import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { ConvertQuoteForm, DeleteQuoteForm, EditQuoteForm } from "../quote-forms";

export const metadata: Metadata = { title: "Quote" };
export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params; const supabase = await createClient();
  const [quoteResponse, linesResponse, clientsResponse] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).maybeSingle(),
    supabase.from("quote_line_items").select("id, description, qty, unit_amount_cents, is_recurring, billing_period, amount_cents, sort_order").eq("quote_id", id).order("sort_order"),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
  ]);
  const responses = [quoteResponse, linesResponse, clientsResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error); if (failed?.error) throw new Error(failed.error.message);
  if (!quoteResponse.data) notFound();
  const raw = quoteResponse.data as { id: string; client_id: string; number: string; title: string; notes: string | null; status: string; issued_on: string; valid_until: string | null; currency: string; subtotal_cents: number; discount_cents: number; tax_rate: number; tax_cents: number; total_cents: number; public_token: string; viewed_at: string | null; accepted_at: string | null; rejected_at: string | null; converted_project_id: string | null };
  const lineItems = (linesResponse.data ?? []) as { id: string; description: string; qty: number; unit_amount_cents: number; is_recurring: boolean; billing_period: string | null; amount_cents: number; sort_order: number }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const quote = { ...raw, line_items: lineItems.map((line) => ({ description: line.description, qty: line.qty, unit_amount: line.unit_amount_cents / 100, is_recurring: line.is_recurring, billing_period: line.billing_period ?? "month" })) };
  const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: raw.currency }).format(cents / 100);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, ""); const publicLink = `${site || ""}/q/${raw.public_token}`;
  return <>
    <Link href="/quotes" className="text-sm text-muted-foreground underline decoration-border underline-offset-4">← All quotes</Link>
    <PageHeader title={`${raw.number}: ${raw.title}`} description={`Status: ${raw.status} · Issued ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${raw.issued_on}T00:00:00Z`))}`} />
    <div className="flex flex-wrap items-center gap-3 border-y border-border py-4"><span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">{raw.status}</span>{raw.viewed_at ? <span className="text-sm text-muted-foreground">Viewed {new Date(raw.viewed_at).toLocaleString()}</span> : null}{raw.accepted_at ? <span className="text-sm text-muted-foreground">Accepted {new Date(raw.accepted_at).toLocaleString()}</span> : null}{raw.rejected_at ? <span className="text-sm text-muted-foreground">Rejected {new Date(raw.rejected_at).toLocaleString()}</span> : null}</div>
    <FormSection title="Customer link" description="Share this secure link with the customer. The token is random and only exposes this quote."><div className="break-all border-y border-border py-4 font-mono text-sm">{publicLink}</div><p className="mt-2 text-xs text-muted-foreground">The link is available while the quote is not expired. Customer responses are recorded in the quote status.</p></FormSection>
    <FormSection title="Totals"><dl className="max-w-md divide-y divide-border border-y border-border text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Subtotal</dt><dd>{money(raw.subtotal_cents)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Discount</dt><dd>−{money(raw.discount_cents)}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-muted-foreground">Tax ({raw.tax_rate}%)</dt><dd>{money(raw.tax_cents)}</dd></div><div className="flex justify-between gap-4 py-3 font-medium"><dt>Total</dt><dd>{money(raw.total_cents)}</dd></div></dl><ul className="mt-6 divide-y divide-border border-y border-border">{lineItems.map((line) => <li key={line.id} className="flex flex-wrap justify-between gap-4 py-4"><div><p className="font-medium">{line.description}</p><p className="mt-1 text-xs text-muted-foreground">{line.qty} × {money(line.unit_amount_cents)}{line.is_recurring ? ` · recurring ${line.billing_period}` : ""}</p></div><span>{money(line.amount_cents)}</span></li>)}</ul></FormSection>
    {raw.status === "accepted" && !raw.converted_project_id ? <FormSection title="Delivery"><p className="text-sm text-muted-foreground">This accepted quote can become a planning project with the quote total as its value.</p><div className="mt-4"><ConvertQuoteForm id={raw.id} /></div></FormSection> : null}
    {raw.converted_project_id ? <FormSection title="Converted project"><Link href={`/projects/${raw.converted_project_id}`} className="font-medium underline decoration-border underline-offset-4">Open created project →</Link></FormSection> : null}
    <FormSection title="Quote record"><EditQuoteForm clients={clients.map((client) => ({ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }))} quote={quote} /><div className="mt-8 border-t border-border pt-6"><DeleteQuoteForm id={raw.id} /></div></FormSection>
  </>;
}
