import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { ArchiveProjectForm, DeleteMilestoneForm, EditProjectForm, MilestoneForm } from "../project-forms";
import { DeleteTimeEntryForm, TimeEntryForm } from "../../tasks/task-forms";

export const metadata: Metadata = { title: "Project" };
export const dynamic = "force-dynamic";

function dateLabel(date: string | null, time = false): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", ...(time ? { timeStyle: "short" as const } : {}) }).format(new Date(date.includes("T") ? date : `${date}T00:00:00Z`));
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();
  const [projectResponse, clientsResponse, milestonesResponse, tasksResponse, entriesResponse] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("clients").select("id, name, company").is("deleted_at", null).order("name"),
    supabase.from("milestones").select("id, project_id, name, due_date, completed_at, sort_order").eq("project_id", id).order("sort_order").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("tasks").select("id, title, status, priority, due_date, estimated_minutes, actual_minutes, milestone_id, parent_task_id").eq("project_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("time_entries").select("id, minutes, worked_on, note, created_at").eq("project_id", id).order("worked_on", { ascending: false }),
  ]);
  const responses = [projectResponse, clientsResponse, milestonesResponse, tasksResponse, entriesResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (!projectResponse.data) notFound();
  const project = projectResponse.data as { id: string; client_id: string; name: string; description: string | null; status: string; value_cents: number | null; currency: string; estimated_minutes: number | null; actual_minutes: number | null; starts_on: string | null; deadline: string | null; progress: number };
  const clients = (clientsResponse.data ?? []) as { id: string; name: string; company: string | null }[];
  const milestones = (milestonesResponse.data ?? []) as { id: string; project_id: string; name: string; due_date: string | null; completed_at: string | null; sort_order: number }[];
  const tasks = (tasksResponse.data ?? []) as { id: string; title: string; status: string; priority: string; due_date: string | null; estimated_minutes: number | null; actual_minutes: number | null; milestone_id: string | null; parent_task_id: string | null }[];
  const entries = (entriesResponse.data ?? []) as { id: string; minutes: number; worked_on: string; note: string | null; created_at: string }[];
  const client = clients.find((item) => item.id === project.client_id);
  const money = project.value_cents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency }).format(project.value_cents / 100);
  const hours = (minutes: number | null) => minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`;

  return <>
    <Link href="/projects" className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">← All projects</Link>
    <PageHeader title={project.name} description={[client?.name, project.status, project.deadline ? `Deadline ${dateLabel(project.deadline)}` : "No deadline"].filter(Boolean).join(" · ")} />
    <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-5"><div className="bg-background p-5"><p className="text-2xl font-semibold">{project.progress}%</p><p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Progress</p></div><div className="bg-background p-5"><p className="text-2xl font-semibold">{money}</p><p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Value</p></div><div className="bg-background p-5"><p className="text-2xl font-semibold">{hours(project.estimated_minutes)}</p><p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Estimated</p></div><div className="bg-background p-5"><p className="text-2xl font-semibold">{hours(project.actual_minutes)}</p><p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Actual</p></div><div className="bg-background p-5"><p className="text-2xl font-semibold">{milestones.filter((milestone) => milestone.completed_at).length}/{milestones.length}</p><p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Milestones</p></div></div>

    <FormSection title="Milestones" description="Break the project deadline into meaningful checkpoints.">{milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones yet.</p> : <div className="space-y-6">{milestones.map((milestone) => <div key={milestone.id} className="border-b border-border pb-6"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="font-medium">{milestone.name} {milestone.completed_at ? <span className="ml-2 text-xs text-muted-foreground">Completed</span> : null}</p><p className="mt-1 text-xs text-muted-foreground">Due {dateLabel(milestone.due_date)}</p></div><DeleteMilestoneForm projectId={id} milestoneId={milestone.id} /></div><MilestoneForm projectId={id} milestone={milestone} /></div>)}</div>}<div className="mt-8"><MilestoneForm projectId={id} /></div></FormSection>

    <FormSection title="Tasks" description="Tasks assigned to this project. Create subtasks and dependencies from the Tasks page.">{tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks assigned yet. Create one from the Tasks page and choose this project.</p> : <div className="overflow-x-auto border-y border-border"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Task</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Priority</th><th className="px-3 py-3 font-medium">Due</th><th className="px-3 py-3 font-medium">Time</th></tr></thead><tbody className="divide-y divide-border">{tasks.map((task) => <tr key={task.id}><td className="px-3 py-4 font-medium"><Link href={`/tasks/${task.id}`} className="underline decoration-border underline-offset-4">{task.parent_task_id ? "↳ " : ""}{task.title}</Link></td><td className="px-3 py-4 text-muted-foreground">{task.status.replaceAll("_", " ")}</td><td className="px-3 py-4 text-muted-foreground">{task.priority}</td><td className="px-3 py-4 text-muted-foreground">{dateLabel(task.due_date)}</td><td className="px-3 py-4 text-muted-foreground">{hours(task.actual_minutes)} / {hours(task.estimated_minutes)}</td></tr>)}</tbody></table></div>}</FormSection>

    <FormSection title="Project time entries" description="Manual actual-time log; durations are stored as minutes and entered as hours.">{entries.length === 0 ? <p className="text-sm text-muted-foreground">No project-level time entries yet.</p> : <ul className="divide-y divide-border border-y border-border">{entries.map((entry) => <li key={entry.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-medium">{hours(entry.minutes)} · {dateLabel(entry.worked_on)}</p><p className="mt-1 text-sm text-muted-foreground">{entry.note || "No note"}</p></div><DeleteTimeEntryForm id={entry.id} projectId={id} /></li>)}</ul>}<div className="mt-6"><TimeEntryForm projectId={id} /></div></FormSection>

    <FormSection title="Project record" description={project.description || "No description yet."}><EditProjectForm clients={clients} project={project} /></FormSection>
    <FormSection title="Archive"><p className="text-sm text-muted-foreground">Archiving removes this project from active lists while preserving its tasks and history.</p><ArchiveProjectForm projectId={id} /></FormSection>
  </>;
}
