import { AddDialog } from "@/components/modal";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { NewClientForm } from "./client-forms";
import { ClientDirectory, type ClientDirectoryRow } from "./client-directory";

export const metadata: Metadata = { title: "Clients" };

/**
 * Client directory: ONE read (`get_client_directory`, migration 0012) plus a
 * client component that does search / status filtering and
 * sorting in the browser. Drill-down links from the dashboard recurring
 * revenue table arrive as query params and pre-set those filters.
 */
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_client_directory");

  const header = (
    <PageHeader
      title="Clients"
      description="Every client with total revenue and last activity. Quick edit or delete from any row."
    />
  );

  if (error) {
    if (isMissingTable(error.message)) {
      return (
        <>
          {header}
          <MigrationsRequired detail={error.message} />
        </>
      );
    }
    return (
      <>
        {header}
        <DataFailure
          title="Client directory"
          message={error.message}
          hint="The directory is one database read: public.get_client_directory(). The exact error is below."
        />
      </>
    );
  }

  // Total revenue = money received on non-void invoices; website/notes are read so Quick edit can't wipe them.
  const [invoiceResult, detailResult] = await Promise.all([
    supabase.from("invoices").select("client_id, paid_cents").neq("status", "void").gt("paid_cents", 0).limit(5000),
    supabase.from("clients").select("id, website, notes_summary").limit(2000),
  ]);
  const revenue = new Map<string, number>();
  for (const invoice of invoiceResult.data ?? []) {
    revenue.set(invoice.client_id, (revenue.get(invoice.client_id) ?? 0) + invoice.paid_cents);
  }
  const details = new Map((detailResult.data ?? []).map((row) => [row.id, row]));
  const rows = ((data ?? []) as Omit<ClientDirectoryRow, "revenue_cents" | "website" | "notes_summary">[]).map((row) => ({
    ...row,
    revenue_cents: revenue.get(row.id) ?? 0,
    website: details.get(row.id)?.website ?? null,
    notes_summary: details.get(row.id)?.notes_summary ?? null,
  }));

  return (
    <>
      {header}
      <div className="-mt-4 mb-8">
        <AddDialog label="New client" title="New client">
          <NewClientForm />
        </AddDialog>
      </div>
      <ClientDirectory
        rows={rows}
        initialQuery={params.q ?? ""}
        initialStatus={params.status ?? "all"}
        initialSort={params.sort ?? "name"}
      />
    </>
  );
}
