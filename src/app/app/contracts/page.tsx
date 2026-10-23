import { AddDialog } from "@/components/modal";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT } from "@/lib/limits";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired, LimitNotice } from "@/components/states";
import { DeleteTemplateForm, TemplateForm } from "./contract-forms";
import { NewContractWizard } from "./contract-wizard";
import { WORK_TYPES } from "@/lib/contract-library";

export const metadata: Metadata = { title: "Contracts" };
export default async function ContractsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [contractsResponse, templatesResponse, clientsResponse] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, title, status, version, created_at, client_id, public_token, clients(name)")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase.from("contract_templates").select("id, name, body, active").order("name"),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
  ]);
  const responses = [contractsResponse, templatesResponse, clientsResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message)))
    return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  const contracts = (contractsResponse.data ?? []) as {
    id: string;
    title: string;
    status: string;
    version: number;
    created_at: string;
    client_id: string;
    public_token: string;
    clients: { name: string } | { name: string }[] | null;
  }[];
  const templates = (templatesResponse.data ?? []) as { id: string; name: string; body: string; active: boolean }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  return (
    <>
      <PageHeader
        title="Contracts"
        description="Create a contract in a few taps, send the customer a link, and keep the signed copy here."
      />
      <LimitNotice shown={contractsResponse.data?.length ?? 0} limit={LIST_LIMIT} hint="Older contracts are hidden; find them in the client workspace." />
      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {contracts.length} contracts
          </h2>
          <AddDialog label="Create contract" title="Create contract" description="Pick the customer and the kind of work. The contract fills itself in.">
            <NewContractWizard
              clients={clients.map((item) => ({
                id: item.id,
                label: `${item.name}${item.company ? ` · ${item.company}` : ""}`,
              }))}
            />
          </AddDialog>
        </div>
        {contracts.length === 0 ? (
          <p className="mt-4 border-t border-border py-8 text-sm text-muted-foreground">
            No contracts yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Contract</th>
                  <th className="px-3 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contracts.map((contract) => {
                  const client = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients;
                  return (
                    <tr key={contract.id}>
                      <td className="px-3 py-4">
                        <Link
                          href={`/app/contracts/${contract.id}`}
                          className="font-medium underline decoration-border underline-offset-4"
                        >
                          {contract.title}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{client?.name ?? "—"}</td>
                      <td className="px-3 py-4 text-muted-foreground">{contract.status}</td>
                      <td className="px-3 py-4 text-muted-foreground">v{contract.version}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="mt-14" />
      <FormSection
        title="Built-in templates"
        description="Used by Create contract. Each one covers payment, ownership, confidentiality, liability, ending the deal and disputes for both sides, plus what is specific to that kind of work. General starting points, not legal advice."
      >
        <ul className="divide-y divide-border border-y border-border">
          {WORK_TYPES.map((type) => (
            <li key={type.key}>
              <details className="py-3">
                <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="font-medium">{type.name}</span>
                  <span className="text-xs text-muted-foreground">{type.summary}</span>
                </summary>
                <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                  {type.covers.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      </FormSection>
      <div className="mt-14" />
      <FormSection
        title="Your own templates"
        description="Optional: your own reusable text. Existing contracts keep their own version history."
      >
        <div className="space-y-8">
          {templates.map((template) => (
            <div key={template.id} className="border-b border-border pb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-medium">{template.name}</h3>
                <DeleteTemplateForm id={template.id} />
              </div>
              <TemplateForm template={template} />
            </div>
          ))}
          <TemplateForm />
        </div>
      </FormSection>
    </>
  );
}
