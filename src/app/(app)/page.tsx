import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired } from "@/components/states";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type CountResult = { data: unknown; count: number | null; error: { message: string } | null };
type RowsResult = { data: unknown[] | null; error: { message: string } | null };

function isMissing(message: string): boolean {
  return isMissingTable(message);
}

async function safeCount(query: PromiseLike<CountResult>): Promise<number | null> {
  const { count, error } = await query;
  if (error) {
    if (isMissing(error.message)) return null;
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function safeRows<T>(query: PromiseLike<RowsResult>): Promise<T[] | null> {
  const { data, error } = await query;
  if (error) {
    if (isMissing(error.message)) return null;
    throw new Error(error.message);
  }
  return (data ?? []) as T[];
}

const openStatuses = ["todo", "in_progress", "blocked_waiting_client", "blocked_other"];

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const deadlineDate = new Date(`${today}T00:00:00Z`);
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + 30);
  const deadlineLimit = deadlineDate.toISOString().slice(0, 10);

  const [clients, activeProjects, dueToday, overdue, waiting, upcomingProjects, upcomingMilestones, recentClients, recentProjects, recentTasks, recentCommunications] = await Promise.all([
    safeCount(supabase.from("clients").select("id", { count: "exact", head: true }).is("deleted_at", null)),
    safeCount(supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null)),
    safeCount(supabase.from("tasks").select("id", { count: "exact", head: true }).eq("due_date", today).in("status", openStatuses)),
    safeCount(supabase.from("tasks").select("id", { count: "exact", head: true }).lt("due_date", today).in("status", openStatuses)),
    safeRows<{ id: string; title: string; due_date: string | null; project_id: string | null; clients: { name: string } | { name: string }[] | null; projects: { name: string } | { name: string }[] | null }>(supabase.from("tasks").select("id, title, due_date, project_id, clients(name), projects(name)").eq("status", "blocked_waiting_client").order("due_date", { ascending: true, nullsFirst: false }).limit(8)),
    safeRows<{ id: string; name: string; deadline: string; clients: { name: string } | { name: string }[] | null }>(supabase.from("projects").select("id, name, deadline, clients(name)").is("deleted_at", null).gte("deadline", today).lte("deadline", deadlineLimit).order("deadline").limit(8)),
    safeRows<{ id: string; name: string; due_date: string; project_id: string; projects: { name: string } | { name: string }[] | null }>(supabase.from("milestones").select("id, name, due_date, project_id, projects(name)").gte("due_date", today).lte("due_date", deadlineLimit).order("due_date").limit(8)),
    safeRows<{ id: string; name: string; created_at: string }>(supabase.from("clients").select("id, name, created_at").order("created_at", { ascending: false }).limit(5)),
    safeRows<{ id: string; name: string; created_at: string; clients: { name: string } | { name: string }[] | null }>(supabase.from("projects").select("id, name, created_at, clients(name)").order("created_at", { ascending: false }).limit(5)),
    safeRows<{ id: string; title: string; updated_at: string; status: string }>(supabase.from("tasks").select("id, title, updated_at, status").order("updated_at", { ascending: false }).limit(5)),
    safeRows<{ id: string; client_id: string; summary: string; occurred_at: string; clients: { name: string } | { name: string }[] | null }>(supabase.from("communications").select("id, client_id, summary, occurred_at, clients(name)").order("occurred_at", { ascending: false }).limit(5)),
  ]);

  const required = [clients, activeProjects, dueToday, overdue, waiting, upcomingProjects, upcomingMilestones, recentClients, recentProjects, recentTasks, recentCommunications];
  if (required.some((result) => result === null)) return <MigrationsRequired />;

  const stats = [
    { label: "Tasks due today", value: dueToday ?? 0 },
    { label: "Overdue tasks", value: overdue ?? 0 },
    { label: "Active projects", value: activeProjects ?? 0 },
    { label: "Clients", value: clients ?? 0 },
  ];
  const dateLabel = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value.includes("T") ? value : `${value}T00:00:00Z`));
  const relationName = (value: { name: string } | { name: string }[] | null) => Array.isArray(value) ? value[0]?.name : value?.name;
  const deadlineItems = [
    ...(upcomingProjects ?? []).map((item) => ({ id: `project-${item.id}`, name: item.name, date: item.deadline, context: `Project · ${relationName(item.clients) ?? "No client"}`, href: `/projects/${item.id}` })),
    ...(upcomingMilestones ?? []).map((item) => ({ id: `milestone-${item.id}`, name: item.name, date: item.due_date, context: `Milestone · ${relationName(item.projects) ?? "Project"}`, href: `/projects/${item.project_id}` })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const activity = [
    ...(recentClients ?? []).map((item) => ({ id: `client-${item.id}`, label: `Client added: ${item.name}`, date: item.created_at, href: `/clients/${item.id}` })),
    ...(recentProjects ?? []).map((item) => ({ id: `project-${item.id}`, label: `Project added: ${item.name}`, date: item.created_at, href: `/projects/${item.id}` })),
    ...(recentTasks ?? []).map((item) => ({ id: `task-${item.id}`, label: `Task updated: ${item.title}`, date: item.updated_at, href: `/tasks/${item.id}` })),
    ...(recentCommunications ?? []).map((item) => ({ id: `communication-${item.id}`, label: `Client activity: ${item.summary}`, date: item.occurred_at, href: `/clients/${item.client_id}` })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return <>
    <PageHeader title="Dashboard" description="The day’s work, upcoming deadlines, active delivery, and recent agency activity — all live from your database." />
    <ul aria-label="Key numbers" className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">{stats.map((stat) => <li key={stat.label} className="bg-background p-6"><p className="text-3xl font-semibold tracking-tight">{stat.value}</p><p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{stat.label}</p></li>)}</ul>

    <div className="mt-14 grid gap-12 lg:grid-cols-2">
      <section><div className="flex items-baseline justify-between gap-4"><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Tasks due today</h2><Link href="/tasks" className="text-xs underline decoration-border underline-offset-4">View tasks</Link></div><div className="mt-4 border-t border-border">{(dueToday ?? 0) === 0 ? <p className="py-6 text-sm text-muted-foreground">Nothing due today.</p> : <p className="py-6 text-sm text-muted-foreground">{dueToday} open task{dueToday === 1 ? "" : "s"} due today.</p>}</div></section>
      <section><div className="flex items-baseline justify-between gap-4"><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Overdue tasks</h2><Link href="/tasks" className="text-xs underline decoration-border underline-offset-4">View tasks</Link></div><div className="mt-4 border-t border-border">{(overdue ?? 0) === 0 ? <p className="py-6 text-sm text-muted-foreground">No overdue tasks.</p> : <p className="py-6 text-sm font-medium">{overdue} task{overdue === 1 ? "" : "s"} need attention.</p>}</div></section>
    </div>

    <div className="mt-14 grid gap-12 lg:grid-cols-2">
      <section><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Upcoming deadlines</h2>{deadlineItems.length === 0 ? <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">No project or milestone deadlines in the next 30 days.</p> : <ul className="mt-4 divide-y divide-border border-t border-border">{deadlineItems.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 py-4"><div><Link href={item.href} className="font-medium underline decoration-border underline-offset-4">{item.name}</Link><p className="mt-1 text-xs text-muted-foreground">{item.context}</p></div><span className="shrink-0 text-sm text-muted-foreground">{dateLabel(item.date)}</span></li>)}</ul>}</section>
      <section><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Waiting on client</h2>{(waiting ?? []).length === 0 ? <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">No tasks are waiting on a client.</p> : <ul className="mt-4 divide-y divide-border border-t border-border">{(waiting ?? []).map((task) => <li key={task.id} className="flex items-start justify-between gap-4 py-4"><div><Link href={`/tasks/${task.id}`} className="font-medium underline decoration-border underline-offset-4">{task.title}</Link><p className="mt-1 text-xs text-muted-foreground">{relationName(task.clients) ?? relationName(task.projects) ?? "Unassigned"}</p></div><span className="shrink-0 text-sm text-muted-foreground">{dateLabel(task.due_date ?? new Date().toISOString())}</span></li>)}</ul>}</section>
    </div>

    <section className="mt-14"><h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Recent activity</h2>{activity.length === 0 ? <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">No activity yet. Create a client, project, task, or communication to start the record.</p> : <ul className="mt-4 divide-y divide-border border-t border-border">{activity.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-4"><Link href={item.href} className="min-w-0 truncate text-sm font-medium underline decoration-border underline-offset-4">{item.label}</Link><span className="shrink-0 text-xs text-muted-foreground">{dateLabel(item.date)}</span></li>)}</ul>}</section>
  </>;
}
