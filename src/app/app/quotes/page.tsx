import { AddDialog } from "@/components/modal";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT } from "@/lib/limits";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired, LimitNotice } from "@/components/states";
import { ConfirmDelete } from "@/components/confirm-delete";
import { LinkDialog } from "@/components/modal";
import { EditQuoteForm, NewQuoteForm } from "./quote-forms";
import { LINE_COLUMNS, editorLines, type StoredQuoteLine } from "./quote-data";
import { QuotePrice } from "./quote-price";
import { deleteQuoteAction } from "./actions";

export const metadata: Metadata = { title: "Quotes" };

export default async function QuotesPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [quotesResponse, clientsResponse, servicesResponse] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        "id, number, title, notes, status, issued_on, valid_until, discount_cents, tax_rate, total_cents, currency, client_id, public_token, converted_project_id, clients(name, company)",
      )
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    // Catalogue defaults used to prefill quote lines (migration 0010).
    supabase
      .from("services")
      .select("id, name, default_billing, default_price_cents, billing_interval")
      .eq("active", true)
      .order("name"),
  ]);
  const responses = [quotesResponse, clientsResponse, servicesResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message)))
    return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  const quotes = (quotesResponse.data ?? []) as {
    id: string;
    number: string;
    notes: string | null;
    discount_cents: number;
    tax_rate: number;
    title: string;
    status: string;
    issued_on: string;
    valid_until: string | null;
    total_cents: number;
    currency: string;
    client_id: string;
    public_token: string;
    converted_project_id: string | null;
    clients: { name: string; company: string | null } | { name: string; company: string | null }[] | null;
  }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  // Line items for the visible quotes: price breakdown and the Edit dialog.
  // `kind` (quote or estimate) arrives with migration 0027; read on its own so a database that is behind never breaks the list.
  const kindResponse = await supabase.from("quotes").select("id, kind").limit(LIST_LIMIT);
  const kindById = new Map(
    (kindResponse.error ? [] : ((kindResponse.data ?? []) as { id: string; kind: string }[])).map((row) => [row.id, row.kind]),
  );
  const linesByQuote = new Map<string, StoredQuoteLine[]>();
  if (quotes.length > 0) {
    const linesResponse = await supabase
      .from("quote_line_items")
      .select(LINE_COLUMNS)
      .in("quote_id", quotes.map((quote) => quote.id))
      .order("sort_order")
      .limit(3000);
    for (const line of (linesResponse.data ?? []) as StoredQuoteLine[]) {
      const list = linesByQuote.get(line.quote_id as string) ?? [];
      list.push(line);
      linesByQuote.set(line.quote_id as string, list);
    }
  }
  const clientOptions = clients.map((client) => ({
    id: client.id,
    label: `${client.name}${client.company ? ` · ${client.company}` : ""}`,
  }));
  const services = (servicesResponse.data ?? []) as {
    id: string;
    name: string;
    default_billing: string;
    default_price_cents: number | null;
    billing_interval: string;
  }[];
  const date = (value: string | null) =>
    value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00Z`)) : "—";
  return (
    <>
      <PageHeader
        title="Quotes"
        description="Build a quote, send the link, and track whether it was viewed, accepted or declined."
      />
      <LimitNotice shown={quotesResponse.data?.length ?? 0} limit={LIST_LIMIT} hint="Older quotes are hidden; find them in the client workspace." />
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
          </h2>
          <AddDialog label="New quote" title="New quote">
            <NewQuoteForm
              clients={clientOptions}
              services={services}
            />
          </AddDialog>
        </div>
        {quotes.length === 0 ? (
          <p className="mt-4 border-t border-border py-8 text-sm text-muted-foreground">
            No quotes yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Quote</th>
                  <th className="px-3 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Valid until</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotes.map((quote) => {
                  const client = Array.isArray(quote.clients) ? quote.clients[0] : quote.clients;
                  return (
                    <tr key={quote.id}>
                      <td className="px-3 py-4">
                        <Link
                          href={`/app/quotes/${quote.id}`}
                          className="font-medium underline decoration-border underline-offset-4"
                        >
                          {quote.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{kindById.get(quote.id) === "estimate" ? "Estimate" : "Quote"}</p>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{client?.name ?? "—"}</td>
                      <td className="px-3 py-4 text-muted-foreground">{quote.status}</td>
                      <td className="px-3 py-4 text-muted-foreground">{date(quote.valid_until)}</td>
                      <td className="px-3 py-4">
                        <QuotePrice
                          lines={linesByQuote.get(quote.id) ?? []}
                          discountCents={quote.discount_cents}
                          taxRate={quote.tax_rate}
                          currency={quote.currency}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-end gap-4 text-xs">
                          <Link href={`/app/quotes/${quote.id}`} className="underline decoration-border underline-offset-4">
                            Open
                          </Link>
                          {quote.status === "accepted" ? null : (
                            <>
                              <LinkDialog label="Edit" title="Edit quote" className="text-xs text-foreground">
                                <EditQuoteForm
                                  clients={clientOptions}
                                  services={services}
                                  quote={{ ...quote, kind: kindById.get(quote.id), line_items: editorLines(linesByQuote.get(quote.id) ?? []) }}
                                />
                              </LinkDialog>
                              <ConfirmDelete
                                action={deleteQuoteAction}
                                fields={{ id: quote.id }}
                                title={`Delete ${quote.title}?`}
                                message="This permanently removes the quote and its customer link. This cannot be undone."
                                className="text-xs text-red-600 hover:text-red-700"
                              />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
