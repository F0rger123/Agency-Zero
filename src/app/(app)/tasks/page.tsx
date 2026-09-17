import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { NewTaskForm } from "./task-forms";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const [tasksResponse, clientsResponse, projectsResponse, milestonesResponse] = await Promise.all([
    supabase.from("tasks").select("id, title, status, priority, due_date, estimated_minutes, actual_minutes, client_id, project_id, milestone_id, parent_task_id, clients(name), projects(name), milestones(name)").order("due_date", { ascending: true, nullsFirst: false }).order("priority"),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("projects").select("id, name, client_id").is("deleted_at", null).order("name"),
    supabase.from("milestones").select("id, name, project_id, projects(name)").order("due_date", { ascending: true, nullsFirst: false }),
  ]);
  const responses = [tasksResponse, clientsResponse, projectsResponse, milestonesResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message))) return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);

  const tasks = (tasksResponse.data ?? []) as {
    id: string; title: string; status: string; priority: string; due_date: string | null; estimated_minutes: number | null; actual_minutes: number | null; client_id: string | null; project_id: string | null; milestone_id: string | null; parent_task_id: string | null; clients: { name: string } | { name: string }[] | null; projects: { name: string } | { name: string }[] | null; milestones: { name: string } | { name: string }[] | null;
  }[];
  const clients = (clientsResponse.data ?? []) as { id: string; name: string }[];
  const projects = (projectsResponse.data ?? []) as { id: string; name: string; client_id: string }[];
  const milestones = (milestonesResponse.data ?? []) as { id: string; name: string; project_id: string; projects: { name: string } | { name: string }[] | null }[];
  const options = {
    clients: clients.map((client) => ({ id: client.id, label: client.name })),
    projects: projects.map((project) => ({ id: project.id, label: project.name })),
    milestones: milestones.map((milestone) => { const project = Array.isArray(milestone.projects) ? milestone.projects[0] : milestone.projects; return { id: milestone.id, label: `${milestone.name}${project?.name ? ` · ${project.name}` : ""}` }; }),
    tasks: tasks.map((task) => ({ id: task.id, label: task.title })),
  };
  const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00Z`)) : "—";
  const hoursLabel = (minutes: number | null) => minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`;
  const activeTasks = tasks.filter((task) => !["done", "cancelled"].includes(task.status));

  return <>
    <PageHeader title="Tasks" description="Tasks and subtasks with priorities, deadlines, time, dependencies, recurring rules, and waiting-on-client status." />
    <section aria-labelledby="tasks-heading"><div className="flex items-baseline justify-between gap-4"><h2 id="tasks-heading" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{activeTasks.length} open · {tasks.length} total</h2><a href="#add-task" className="text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-foreground">Add task</a></div>
      {tasks.length === 0 ? <div className="mt-4 border-t border-border pt-8 text-sm text-muted-foreground">No tasks yet. Add the first one below.</div> : <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground"><tr><th className="px-3 py-3 font-medium">Task</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Priority</th><th className="px-3 py-3 font-medium">Client / project</th><th className="px-3 py-3 font-medium">Due</th><th className="px-3 py-3 font-medium">Time</th></tr></thead><tbody className="divide-y divide-border">{tasks.map((task) => { const client = Array.isArray(task.clients) ? task.clients[0] : task.clients; const project = Array.isArray(task.projects) ? task.projects[0] : task.projects; return <tr key={task.id}><td className="px-3 py-4 font-medium"><Link href={`/tasks/${task.id}`} className="underline decoration-border underline-offset-4">{task.parent_task_id ? "↳ " : ""}{task.title}</Link></td><td className="px-3 py-4 text-muted-foreground">{task.status === "blocked_waiting_client" ? "waiting on client" : task.status.replaceAll("_", " ")}</td><td className="px-3 py-4 text-muted-foreground">{task.priority}</td><td className="px-3 py-4 text-muted-foreground">{[client?.name, project?.name].filter(Boolean).join(" · ") || "—"}</td><td className="px-3 py-4 text-muted-foreground">{dateLabel(task.due_date)}</td><td className="px-3 py-4 text-muted-foreground">{hoursLabel(task.actual_minutes)} / {hoursLabel(task.estimated_minutes)}</td></tr>; })}</tbody></table></div>}
    </section>
    <div id="add-task" className="mt-14 scroll-mt-8"><NewTaskForm {...options} /></div>
  </>;
}
