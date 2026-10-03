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
 * client component that does search / status / billing / service filtering and
 * sorting in the browser. Drill-down links from the dashboard recurring
 * revenue table arrive as query params and pre-set those filters.
 */
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; billing?: string; service?: string; sort?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_client_directory");

  const header = (
    <PageHeader
      title="Clients"
      description="Every relationship with its services, recurring revenue, outstanding balance, delivery load, and last activity — filtered and sorted instantly."
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

  const rows = (data ?? []) as ClientDirectoryRow[];

  return (
    <>
      {header}
      <ClientDirectory
        rows={rows}
        initialQuery={params.q ?? ""}
        initialStatus={params.status ?? "all"}
        initialBilling={params.billing ?? "all"}
        initialService={params.service ?? "all"}
        initialSort={params.sort ?? "name"}
      />
      <div id="add-client" className="mt-14 scroll-mt-8">
        <NewClientForm />
      </div>
    </>
  );
}
