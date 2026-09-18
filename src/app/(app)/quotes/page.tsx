import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { NewQuoteForm } from "./quote-forms";

export const metadata: Metadata = { title: "Quotes" };
export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [quotesResponse, clientsResponse] = await Promise.all([
    supabase.from("quotes").select("id, number, title, status, issued_on, valid_until, total_cents, currency, client_id, public_token, converted_project_id, clients(name, company)").order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
  ]);
  const responses = [quotesResponse, clientsResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error); if (failed?.error) throw new Error(failed.error.message);
  const quotes = (quotesResponse.data ?? []) as { id: string; number: string; title: string; status: string; issued_on: string; valid_until: string | null; total_cents: number; currency: string; client_id: string; public_token: string; converted_project_id: string | null; clients: { name: string; company: string | null } | { name: string; company: string | null }[] | null }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const money = (cents: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  const date = (value: string | null) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`)) : "—";
  return <>
    <PageHeader title="Quotes" description="Build proposals with priced line items, recurring services, taxes, secure customer links, and response tracking." />
    <section><div className="flex items-baseline justify-between gap-4"><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{quotes.length} {quotes.length === 1 ? "quote" : "quotes"}</h2><a href="#new-quote" className="text-sm font-medium underline decoration-border underline-offset-4">New quote</a></div>{quotes.length === 0 ? <p className="mt-4 border-t border-border py-8 text-sm text-muted-foreground">No quotes yet. Create your first proposal below.</p> : <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Quote</th><th className="px-3 py-3 font-medium">Client</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Valid until</th><th className="px-3 py-3 font-medium">Total</th><th className="px-3 py-3 font-medium"><span className="sr-only">Open</span></th></tr></thead><tbody className="divide-y divide-border">{quotes.map((quote) => { const client = Array.isArray(quote.clients) ? quote.clients[0] : quote.clients; return <tr key={quote.id}><td className="px-3 py-4"><Link href={`/quotes/${quote.id}`} className="font-medium underline decoration-border underline-offset-4">{quote.number}</Link><p className="mt-1 text-xs text-muted-foreground">{quote.title}</p></td><td className="px-3 py-4 text-muted-foreground">{client?.name ?? "—"}</td><td className="px-3 py-4 text-muted-foreground">{quote.status}</td><td className="px-3 py-4 text-muted-foreground">{date(quote.valid_until)}</td><td className="px-3 py-4 text-muted-foreground">{money(quote.total_cents, quote.currency)}</td><td className="px-3 py-4 text-right"><Link href={`/quotes/${quote.id}`} className="underline decoration-border underline-offset-4">Open</Link></td></tr>; })}</tbody></table></div>}</section>
    <div id="new-quote" className="mt-14 scroll-mt-8"><NewQuoteForm clients={clients.map((client) => ({ id: client.id, label: `${client.name}${client.company ? ` · ${client.company}` : ""}` }))} /></div>
  </>;
}
