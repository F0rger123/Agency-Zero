import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { FormSection } from "@/components/form-controls";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { CompleteTaskForm, DeleteTaskForm, DeleteTimeEntryForm, EditTaskForm, TimeEntryForm } from "../task-forms";

export const metadata: Metadata = { title: "Task" };
export const dynamic = "force-dynamic";

function dateLabel(date: string | null, time = false): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", ...(time ? { timeStyle: "short" as const } : {}) }).format(new Date(date.includes("T") ? date : `${date}T00:00:00Z`));
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();
  const [taskResponse, clientsResponse, projectsResponse, milestonesResponse, allTasksResponse, subtasksResponse, timeEntriesResponse] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).maybeSingle(),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("projects").select("id, name, client_id").is("deleted_at", null).order("name"),
    supabase.from("milestones").select("id, name, project_id, projects(name)").order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("tasks").select("id, title").order("title"),
    supabase.from("tasks").select("id, title, status, due_date").eq("parent_task_id", id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("time_entries").select("id, minutes, worked_on, note, created_at").eq("task_id", id).order("worked_on", { ascending: false }),
  ]);
  const responses = [taskResponse, clientsResponse, projectsResponse, milestonesResponse, allTasksResponse, subtasksResponse, timeEntriesResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (!taskResponse.data) notFound();

  const task = taskResponse.data as {
    id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; estimated_minutes: number | null; actual_minutes: number | null; scheduled_date: string | null; client_id: string | null; project_id: string | null; milestone_id: string | null; parent_task_id: string | null; depends_on_task_id: string | null; recurrence_rule: Record<string, unknown> | null;
  };
  const clients = (clientsResponse.data ?? []) as { id: string; name: string }[];
  const projects = (projectsResponse.data ?? []) as { id: string; name: string }[];
  const milestones = (milestonesResponse.data ?? []) as { id: string; name: string; projects: { name: string } | { name: string }[] | null }[];
  const allTasks = (allTasksResponse.data ?? []) as { id: string; title: string }[];
  const subtasks = (subtasksResponse.data ?? []) as { id: string; title: string; status: string; due_date: string | null }[];
  const entries = (timeEntriesResponse.data ?? []) as { id: string; minutes: number; worked_on: string; note: string | null; created_at: string }[];
  const dependency = task.depends_on_task_id ? allTasks.find((item) => item.id === task.depends_on_task_id) : null;
  const options = {
    clients: clients.map((client) => ({ id: client.id, label: client.name })),
    projects: projects.map((project) => ({ id: project.id, label: project.name })),
    milestones: milestones.map((milestone) => { const project = Array.isArray(milestone.projects) ? milestone.projects[0] : milestone.projects; return { id: milestone.id, label: `${milestone.name}${project?.name ? ` · ${project.name}` : ""}` }; }),
    tasks: allTasks.map((item) => ({ id: item.id, label: item.title })),
  };
  const hours = (minutes: number | null) => minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`;

  return <>
    <Link href="/tasks" className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">← All tasks</Link>
    <PageHeader title={task.title} description={[task.status === "blocked_waiting_client" ? "Waiting on client" : task.status.replaceAll("_", " "), task.priority, task.due_date ? `Due ${dateLabel(task.due_date)}` : "No due date"].join(" · ")} />
    <div className="flex flex-wrap items-center gap-4 border-y border-border py-4"><span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">{task.status.replaceAll("_", " ")}</span><span className="text-sm text-muted-foreground">{hours(task.actual_minutes)} actual / {hours(task.estimated_minutes)} estimated</span>{dependency ? <span className="text-sm text-muted-foreground">Depends on: <Link href={`/tasks/${dependency.id}`} className="underline decoration-border underline-offset-4">{dependency.title}</Link></span> : null}</div>

    <div className="mt-10 grid gap-12 lg:grid-cols-2">
      <FormSection title="Subtasks" description="Nested work stays connected to this task.">{subtasks.length === 0 ? <p className="text-sm text-muted-foreground">No subtasks yet. Create one from the Tasks page and choose this task as its parent.</p> : <ul className="divide-y divide-border border-y border-border">{subtasks.map((subtask) => <li key={subtask.id} className="flex items-center justify-between gap-4 py-4"><Link href={`/tasks/${subtask.id}`} className="font-medium underline decoration-border underline-offset-4">↳ {subtask.title}</Link><span className="text-xs text-muted-foreground">{subtask.status.replaceAll("_", " ")}{subtask.due_date ? ` · ${dateLabel(subtask.due_date)}` : ""}</span></li>)}</ul>}</FormSection>
      <FormSection title="Time entries" description="Actual time is stored as minutes in the database and shown here as hours.">{entries.length === 0 ? <p className="text-sm text-muted-foreground">No time entries yet.</p> : <ul className="divide-y divide-border border-y border-border">{entries.map((entry) => <li key={entry.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-medium">{hours(entry.minutes)} · {dateLabel(entry.worked_on)}</p><p className="mt-1 text-sm text-muted-foreground">{entry.note || "No note"}</p></div><DeleteTimeEntryForm id={entry.id} taskId={id} /></li>)}</ul>}<div className="mt-6"><TimeEntryForm taskId={id} /></div></FormSection>
    </div>

    <FormSection title="Task record" description={task.description || "No description yet."}><EditTaskForm task={task} {...options} /></FormSection>
    <FormSection title="Actions"><div className="flex flex-wrap items-center gap-6"><CompleteTaskForm taskId={id} /><DeleteTaskForm taskId={id} /></div></FormSection>
  </>;
}
