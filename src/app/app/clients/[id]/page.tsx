import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { ClientWorkspace, type ClientWorkspaceData } from "../client-workspace";

/**
 * Client detail = one tabbed workspace.
 *
 * Everything the eleven tabs need comes from a single
 * `get_client_workspace(p_client_id)` read (migration 0012). Tab switching is
 * client-side state, so moving between Overview / Projects /
 * Tasks / Services / Quotes / Contracts / Invoices / Notes / Activity / Files /
 * Profile never triggers a navigation or a loading skeleton.
 */
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const { id } = await params;
  const supabase = await createClient();
  const [{ data, error }, templatesResponse] = await Promise.all([
    supabase.rpc("get_client_workspace", { p_client_id: id }),
    // Contract templates for the "new contract" form inside the client workspace.
    supabase.from("contract_templates").select("id, name, active").order("name").limit(100),
  ]);
  const templates = ((templatesResponse.data ?? []) as { id: string; name: string; active: boolean }[])
    .filter((template) => template.active)
    .map((template) => ({ id: template.id, label: template.name }));

  const backLink = (
    <Link
      href="/app/clients"
      className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
    >
      ← All clients
    </Link>
  );

  if (error) {
    if (isMissingTable(error.message)) {
      return (
        <>
          {backLink}
          <PageHeader title="Client" />
          <MigrationsRequired detail={error.message} />
        </>
      );
    }
    return (
      <>
        {backLink}
        <PageHeader title="Client" />
        <DataFailure
          title="Client workspace"
          message={error.message}
          hint="The workspace is one database read: public.get_client_workspace(p_client_id). The exact error is below."
        />
      </>
    );
  }

  if (!data) notFound();

  const workspace = data as ClientWorkspaceData;

  return (
    <>
      {backLink}
      <PageHeader
        title={workspace.client.name}
        description={
          [workspace.client.company, workspace.client.email].filter(Boolean).join(" · ") ||
          "Client record"
        }
      />
      <ClientWorkspace data={workspace} templates={templates} />
    </>
  );
}
