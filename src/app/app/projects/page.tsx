import { AddDialog } from "@/components/modal";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteProjectAction } from "./actions";
import { moneyNode } from "@/components/money-node";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT, daysAgoIso } from "@/lib/limits";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired, LimitNotice } from "@/components/states";
import { NewProjectForm } from "./project-forms";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { status: statusParam } = await searchParams;
  const supabase = await createClient();
  const [projectsResponse, clientsResponse, templatesResponse] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, name, client_id, status, deadline, progress, value_cents, currency, estimated_minutes, actual_minutes, clients(name, company)",
      )
      .is("deleted_at", null)
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("name")
      .or(`status.in.(planning,active,on_hold),updated_at.gte.${daysAgoIso(180)}T00:00:00Z`)
      .limit(LIST_LIMIT),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    // Templates (0025) are optional: a database without them just hides the "start from a template" fields.
    supabase.from("project_templates").select("id, name").eq("active", true).order("name").limit(100),
  ]);
  const templates = templatesResponse.error ? [] : ((templatesResponse.data ?? []) as { id: string; name: string }[]).map((t) => ({ id: t.id, label: t.name }));
  const missing = [projectsResponse, clientsResponse].find(
    (response) => response.error && isMissingTable(response.error.message),
  );
  if (missing) return <MigrationsRequired />;
  const failed = [projectsResponse, clientsResponse].find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);

  const allProjects = (projectsResponse.data ?? []) as {
    id: string;
    name: string;
    client_id: string;
    status: string;
    deadline: string | null;
    progress: number;
    value_cents: number | null;
    currency: string;
    estimated_minutes: number | null;
    actual_minutes: number | null;
    clients: { name: string; company: string | null } | { name: string; company: string | null }[] | null;
  }[];
  const tabs = [
    ["", "Open"],
    ["all", "All"],
    ["completed", "Completed"],
    ["on_hold", "On hold"],
  ] as const;
  const filter = ["all", "completed", "on_hold"].includes(statusParam ?? "") ? (statusParam as string) : "";
  const isOpen = (status: string) => ["planning", "active"].includes(status);
  const projects = allProjects.filter((project) =>
    filter === "all" ? true : filter === "" ? isOpen(project.status) : project.status === filter,
  );
  const today = new Date().toISOString().slice(0, 10);
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const dateLabel = (date: string | null) =>
    date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00Z`)) : "—";
  const moneyLabel = (cents: number | null, currency: string) => (cents == null ? "—" : moneyNode(cents, currency));
  const hoursLabel = (minutes: number | null) => (minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Delivery work grouped by client, with phases, milestones, deadlines, status, progress, value, and time. Phases and starter tasks come from per-service templates (see Project templates)."
      />
      <p className="-mt-2 mb-6 text-sm">
        <Link href="/app/projects/templates" className="underline decoration-border underline-offset-4">
          Project templates
        </Link>
      </p>
      <LimitNotice shown={projectsResponse.data?.length ?? 0} limit={LIST_LIMIT} hint="Completed or cancelled projects untouched for 180 days are hidden; open them from the client workspace." />
      <nav aria-label="Project status" className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-3 text-sm">
        {tabs.map(([value, text]) => (
          <Link
            key={value || "open"}
            href={value ? `/app/projects?status=${value}` : "/app/projects"}
            aria-current={filter === value ? "page" : undefined}
            className={`underline-offset-4 ${filter === value ? "font-medium underline decoration-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {text}{" "}
            <span className="text-faint-foreground">
              {value === "all" ? allProjects.length : value === "" ? allProjects.filter((p) => isOpen(p.status)).length : allProjects.filter((p) => p.status === value).length}
            </span>
          </Link>
        ))}
      </nav>
      <section aria-labelledby="projects-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="projects-heading" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </h2>
          <AddDialog label="New project" title="New project">
            <NewProjectForm clients={clients} templates={templates} />
          </AddDialog>
        </div>
        {projects.length === 0 ? (
          <div className="mt-4 border-t border-border pt-8 text-sm text-muted-foreground">
            No projects here yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Client</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Deadline</th>
                  <th className="px-3 py-3 font-medium">Progress</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Value</th>
                  <th className="px-3 py-3 font-medium"><span className="sr-only">Delete</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project) => {
                  const client = Array.isArray(project.clients) ? project.clients[0] : project.clients;
                  return (
                    <tr key={project.id}>
                      <td className="px-3 py-4 font-medium">
                        <Link
                          href={`/app/projects/${project.id}`}
                          className="underline decoration-border underline-offset-4"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{client?.name ?? "—"}</td>
                      <td className="px-3 py-4">
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                          {project.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className={`px-3 py-4 ${project.deadline && project.deadline < today && isOpen(project.status) ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {dateLabel(project.deadline)}
                        {project.deadline && project.deadline < today && isOpen(project.status) ? " · overdue" : ""}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 bg-muted" aria-hidden>
                            <div className="h-full bg-foreground" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-muted-foreground tabular-nums">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {hoursLabel(project.actual_minutes)} / {hoursLabel(project.estimated_minutes)}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {moneyLabel(project.value_cents, project.currency)}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <ConfirmDelete
                          action={deleteProjectAction}
                          fields={{ id: project.id }}
                          title="Delete this project?"
                          message={`“${project.name}” and all of its tasks, phases and milestones will be removed. Invoices, quotes and payments are kept. This cannot be undone.`}
                        />
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
