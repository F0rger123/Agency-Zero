import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { NewProjectForm } from "./project-forms";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [projectsResponse, clientsResponse] = await Promise.all([
    supabase.from("projects").select("id, name, client_id, status, deadline, progress, value_cents, currency, estimated_minutes, actual_minutes, clients(name, company)").is("deleted_at", null).order("deadline", { ascending: true, nullsFirst: false }).order("name"),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
  ]);
  const missing = [projectsResponse, clientsResponse].find((response) => response.error && isMissingTable(response.error.message));
  if (missing) return <MigrationsRequired />;
  const failed = [projectsResponse, clientsResponse].find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);

  const projects = (projectsResponse.data ?? []) as {
    id: string; name: string; client_id: string; status: string; deadline: string | null; progress: number; value_cents: number | null; currency: string; estimated_minutes: number | null; actual_minutes: number | null; clients: { name: string; company: string | null } | { name: string; company: string | null }[] | null;
  }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00Z`)) : "—";
  const moneyLabel = (cents: number | null, currency: string) => cents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  const hoursLabel = (minutes: number | null) => minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`;

  return <>
    <PageHeader title="Projects" description="Delivery work grouped by client, with milestones, deadlines, status, progress, value, and time." />
    <section aria-labelledby="projects-heading">
      <div className="flex items-baseline justify-between gap-4"><h2 id="projects-heading" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{projects.length} {projects.length === 1 ? "project" : "projects"}</h2><a href="#add-project" className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Add project</a></div>
      {projects.length === 0 ? <div className="mt-4 border-t border-border pt-8 text-sm text-muted-foreground">No active projects yet. Add one below, after creating a client.</div> : <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[840px] text-left text-sm"><thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Project</th><th className="px-3 py-3 font-medium">Client</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Deadline</th><th className="px-3 py-3 font-medium">Progress</th><th className="px-3 py-3 font-medium">Time</th><th className="px-3 py-3 font-medium">Value</th></tr></thead><tbody className="divide-y divide-border">{projects.map((project) => { const client = Array.isArray(project.clients) ? project.clients[0] : project.clients; return <tr key={project.id}><td className="px-3 py-4 font-medium"><Link href={`/projects/${project.id}`} className="underline decoration-border underline-offset-4">{project.name}</Link></td><td className="px-3 py-4 text-muted-foreground">{client?.name ?? "—"}</td><td className="px-3 py-4 text-muted-foreground">{project.status}</td><td className="px-3 py-4 text-muted-foreground">{dateLabel(project.deadline)}</td><td className="px-3 py-4 text-muted-foreground">{project.progress}%</td><td className="px-3 py-4 text-muted-foreground">{hoursLabel(project.actual_minutes)} / {hoursLabel(project.estimated_minutes)}</td><td className="px-3 py-4 text-muted-foreground">{moneyLabel(project.value_cents, project.currency)}</td></tr>; })}</tbody></table></div>}
    </section>
    <div id="add-project" className="mt-14 scroll-mt-8"><NewProjectForm clients={clients} /></div>
  </>;
}
