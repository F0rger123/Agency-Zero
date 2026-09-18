import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { DeleteContractForm, EditContractForm, RegenerateContractLinkForm } from "../contract-forms";

export const metadata: Metadata = { title: "Contract" };
export const dynamic = "force-dynamic";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();
  const [contractResponse, versionsResponse, clientsResponse, quotesResponse, projectsResponse, templatesResponse] = await Promise.all([
    supabase.from("contracts").select("*").eq("id", id).maybeSingle(),
    supabase.from("contract_versions").select("id, version, body, created_at").eq("contract_id", id).order("version", { ascending: false }),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
    supabase.from("quotes").select("id, number, title").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("contract_templates").select("id, name, active").eq("active", true).order("name"),
  ]);
  const responses = [contractResponse, versionsResponse, clientsResponse, quotesResponse, projectsResponse, templatesResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (!contractResponse.data) notFound();

  const contract = contractResponse.data as {
    id: string; client_id: string; quote_id: string | null; project_id: string | null;
    title: string; status: string; body: string; template_id: string | null; version: number;
    public_token: string; token_expires_at: string | null; viewed_at: string | null;
    signed_at: string | null; signer_name: string | null; signed_snapshot: string | null;
  };
  const versions = (versionsResponse.data ?? []) as { id: string; version: number; body: string; created_at: string }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const quotes = (quotesResponse.data ?? []) as { id: string; number: string; title: string }[];
  const projects = (projectsResponse.data ?? []) as { id: string; name: string }[];
  const templates = (templatesResponse.data ?? []) as { id: string; name: string }[];

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const publicLink = `${site || ""}/c/${contract.public_token}`;
  const isSigned = contract.status === "signed";
  const datetime = (value: string | null) => (value ? new Date(value).toLocaleString() : null);

  return (
    <>
      <Link href="/contracts" className="text-sm text-muted-foreground underline decoration-border underline-offset-4">← All contracts</Link>
      <PageHeader title={contract.title} description={`Status: ${contract.status} · Version ${contract.version}`} />

      <div className="flex flex-wrap gap-3 border-y border-border py-4">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">{contract.status}</span>
        {datetime(contract.viewed_at) ? <span className="text-sm text-muted-foreground">Viewed {datetime(contract.viewed_at)}</span> : null}
        {contract.signer_name ? <span className="text-sm text-muted-foreground">Signed by {contract.signer_name}</span> : null}
        {datetime(contract.signed_at) ? <span className="text-sm text-muted-foreground">{datetime(contract.signed_at)}</span> : null}
      </div>

      <FormSection title="Customer signing link" description="Share this secure link. Customers can read the current contract and sign once while its status is Sent.">
        <div className="break-all border-y border-border py-4 font-mono text-sm">{publicLink}</div>
        <RegenerateContractLinkForm id={contract.id} />
      </FormSection>

      {contract.signed_snapshot ? (
        <FormSection title="Signed snapshot" description="The exact document the customer signed, preserved at signing time and immutable.">
          <pre className="whitespace-pre-wrap border-y border-border py-4 font-sans text-sm leading-6 text-muted-foreground">{contract.signed_snapshot}</pre>
        </FormSection>
      ) : null}

      <FormSection title="Version history" description="Every save creates a new version. Version rows cannot be edited or removed.">
        <div className="divide-y divide-border border-y border-border">
          {versions.map((version) => (
            <details key={version.id} className="py-4" open={version.version === contract.version}>
              <summary className="cursor-pointer font-medium">Version {version.version} · {new Date(version.created_at).toLocaleString()}</summary>
              <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-muted-foreground">{version.body}</pre>
            </details>
          ))}
        </div>
      </FormSection>

      {isSigned ? (
        <FormSection title="Contract record">
          <p className="text-sm text-muted-foreground">
            This contract is signed and immutable — its body, parties, signature,
            snapshot, and version history are frozen as a permanent record. Create
            a new contract for follow-up agreements.
          </p>
        </FormSection>
      ) : (
        <FormSection title="Contract record">
          <EditContractForm
            clients={clients.map((item) => ({ id: item.id, label: `${item.name}${item.company ? ` · ${item.company}` : ""}` }))}
            quotes={quotes.map((item) => ({ id: item.id, label: `${item.number} · ${item.title}` }))}
            projects={projects.map((item) => ({ id: item.id, label: item.name }))}
            templates={templates.map((item) => ({ id: item.id, label: item.name }))}
            contract={contract}
          />
          <div className="mt-8 border-t border-border pt-6"><DeleteContractForm id={contract.id} /></div>
        </FormSection>
      )}
    </>
  );
}
