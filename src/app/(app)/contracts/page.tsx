import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { DeleteTemplateForm, NewContractForm, TemplateForm } from "./contract-forms";

export const metadata: Metadata = { title: "Contracts" };
export const dynamic = "force-dynamic";
export default async function ContractsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />; const supabase = await createClient();
  const [contractsResponse, templatesResponse, clientsResponse, quotesResponse, projectsResponse] = await Promise.all([
    supabase.from("contracts").select("id, title, status, version, created_at, client_id, public_token, clients(name)").order("created_at", { ascending: false }),
    supabase.from("contract_templates").select("id, name, body, active").order("name"),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
    supabase.from("quotes").select("id, number, title, client_id").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, client_id").is("deleted_at", null).order("name"),
  ]);
  const responses = [contractsResponse, templatesResponse, clientsResponse, quotesResponse, projectsResponse]; if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />; const failed = responses.find((response) => response.error); if (failed?.error) throw new Error(failed.error.message);
  const contracts = (contractsResponse.data ?? []) as { id: string; title: string; status: string; version: number; created_at: string; client_id: string; public_token: string; clients: { name: string } | { name: string }[] | null }[];
  const templates = (templatesResponse.data ?? []) as { id: string; name: string; body: string; active: boolean }[]; const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[]; const quotes = (quotesResponse.data ?? []) as { id: string; number: string; title: string }[]; const projects = (projectsResponse.data ?? []) as { id: string; name: string }[];
  return <><PageHeader title="Contracts" description="Templates, linked agreements, version history, secure signing links, and preserved signed snapshots." /><section><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{contracts.length} contracts</h2>{contracts.length === 0 ? <p className="mt-4 border-t border-border py-8 text-sm text-muted-foreground">No contracts yet. Create one below.</p> : <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Contract</th><th className="px-3 py-3 font-medium">Client</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Version</th></tr></thead><tbody className="divide-y divide-border">{contracts.map((contract) => { const client = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients; return <tr key={contract.id}><td className="px-3 py-4"><Link href={`/contracts/${contract.id}`} className="font-medium underline decoration-border underline-offset-4">{contract.title}</Link></td><td className="px-3 py-4 text-muted-foreground">{client?.name ?? "—"}</td><td className="px-3 py-4 text-muted-foreground">{contract.status}</td><td className="px-3 py-4 text-muted-foreground">v{contract.version}</td></tr>; })}</tbody></table></div>}</section><div className="mt-14"><FormSection title="New contract"><NewContractForm clients={clients.map((item) => ({ id: item.id, label: `${item.name}${item.company ? ` · ${item.company}` : ""}` }))} quotes={quotes.map((item) => ({ id: item.id, label: `${item.number} · ${item.title}` }))} projects={projects.map((item) => ({ id: item.id, label: item.name }))} templates={templates.filter((item) => item.active).map((item) => ({ id: item.id, label: item.name }))} /></FormSection></div><FormSection title="Contract templates" description="Reusable bodies for new agreements. Existing contracts preserve their own version history."><div className="space-y-8">{templates.map((template) => <div key={template.id} className="border-b border-border pb-8"><div className="mb-4 flex items-center justify-between gap-4"><h3 className="font-medium">{template.name}</h3><DeleteTemplateForm id={template.id} /></div><TemplateForm template={template} /></div>)}<TemplateForm /></div></FormSection></>;
}
