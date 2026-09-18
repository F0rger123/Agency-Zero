import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { NewClientForm } from "./client-forms";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const response = await supabase
    .from("clients")
    .select("id, name, company, email, status, created_at")
    .is("deleted_at", null)
    .order("name");

  if (response.error) {
    if (isMissingTable(response.error.message)) return <MigrationsRequired />;
    throw new Error(response.error.message);
  }

  const clients = (response.data ?? []) as {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    status: string;
    created_at: string;
  }[];

  return (
    <>
      <PageHeader
        title="Clients"
        description="The working record for every relationship: contacts, notes, files, activity, services, and status."
      />

      <section aria-labelledby="client-list-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="client-list-heading" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {clients.length} {clients.length === 1 ? "client" : "clients"}
          </h2>
          <a href="#add-client" className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">
            Add client
          </a>
        </div>
        {clients.length === 0 ? (
          <div className="mt-4 border-t border-border pt-8 text-sm text-muted-foreground">
            No active client records yet. Add the first one below.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Company</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((client) => (
                  <tr key={client.id} className="group">
                    <td className="px-3 py-4 font-medium">{client.name}</td>
                    <td className="px-3 py-4 text-muted-foreground">{client.company || "—"}</td>
                    <td className="px-3 py-4">
                      <span className="rounded-full border border-border px-2 py-1 text-[11px] font-medium uppercase tracking-widest">
                        {client.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{client.email || "—"}</td>
                    <td className="px-3 py-4 text-right">
                      <Link href={`/clients/${client.id}`} className="font-medium underline decoration-border underline-offset-4 group-hover:decoration-foreground">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div id="add-client" className="mt-14 scroll-mt-8">
        <NewClientForm />
      </div>
    </>
  );
}
