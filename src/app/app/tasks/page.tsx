import { AddDialog } from "@/components/modal";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT, daysAgoIso } from "@/lib/limits";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired, LimitNotice } from "@/components/states";
import { KIND_LABEL_PLURAL, WORK_KINDS, isWorkKind, needsWorkItemsMigration } from "@/lib/work-items";
import { NewTaskForm } from "./task-forms";
import { TaskList, type TaskRow } from "./task-list";
import { todayIso } from "@/lib/format";

export const metadata: Metadata = { title: "Tasks" };

const TASK_COLUMNS =
  "id, title, status, priority, due_date, scheduled_date, estimated_minutes, actual_minutes, client_id, project_id, milestone_id, parent_task_id, clients(name), projects(name), milestones(name)";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { kind: kindParam } = await searchParams;
  const supabase = await createClient();
  const listTasks = (columns: string) =>
    supabase
      .from("tasks")
      .select(columns)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("priority")
      .or(`status.not.in.(done,cancelled),updated_at.gte.${daysAgoIso(30)}T00:00:00Z`)
      .limit(LIST_LIMIT);
  let workItemsReady = true;
  let firstResponse = await listTasks(`${TASK_COLUMNS}, kind, severity`);
  if (firstResponse.error && needsWorkItemsMigration(firstResponse.error.message)) {
    // The database has not applied 0023 yet: fall back to the plain task list.
    workItemsReady = false;
    firstResponse = await listTasks(TASK_COLUMNS);
  }
  const [tasksResponse, clientsResponse, projectsResponse, milestonesResponse] = await Promise.all([
    Promise.resolve(firstResponse),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    supabase.from("projects").select("id, name, client_id").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    supabase
      .from("milestones")
      .select("id, name, project_id, projects(name)")
      .is("completed_at", null)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(PICKER_LIMIT),
  ]);
  const responses = [tasksResponse, clientsResponse, projectsResponse, milestonesResponse];
  if (responses.some((response) => response.error && isMissingTable(response.error.message)))
    return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);

  const allTasks = (tasksResponse.data ?? []) as unknown as {
    kind?: string;
    severity?: string | null;
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
    scheduled_date: string | null;
    estimated_minutes: number | null;
    actual_minutes: number | null;
    client_id: string | null;
    project_id: string | null;
    milestone_id: string | null;
    parent_task_id: string | null;
    clients: { name: string } | { name: string }[] | null;
    projects: { name: string } | { name: string }[] | null;
    milestones: { name: string } | { name: string }[] | null;
  }[];
  const activeKind = kindParam && isWorkKind(kindParam) && workItemsReady ? kindParam : "all";
  const tasks = activeKind === "all" ? allTasks : allTasks.filter((task) => (task.kind ?? "task") === activeKind);
  const kindCount = (kind: string) => allTasks.filter((task) => (task.kind ?? "task") === kind).length;
  const clients = (clientsResponse.data ?? []) as { id: string; name: string }[];
  const projects = (projectsResponse.data ?? []) as { id: string; name: string; client_id: string }[];
  const milestones = (milestonesResponse.data ?? []) as {
    id: string;
    name: string;
    project_id: string;
    projects: { name: string } | { name: string }[] | null;
  }[];
  const options = {
    clients: clients.map((client) => ({ id: client.id, label: client.name })),
    projects: projects.map((project) => ({ id: project.id, label: project.name })),
    milestones: milestones.map((milestone) => {
      const project = Array.isArray(milestone.projects) ? milestone.projects[0] : milestone.projects;
      return { id: milestone.id, label: `${milestone.name}${project?.name ? ` · ${project.name}` : ""}` };
    }),
    tasks: allTasks.map((task) => ({ id: task.id, label: task.title })),
  };
  const name = (value: { name: string } | { name: string }[] | null) => (Array.isArray(value) ? value[0]?.name : value?.name) ?? null;
  const rows: TaskRow[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    kind: task.kind,
    severity: task.severity,
    parent: Boolean(task.parent_task_id),
    client: name(task.clients),
    project: name(task.projects),
  }));
  const openCount = tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length;

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Everything to do, grouped by when it is due. Tick to complete, tap to open."
      />
      <LimitNotice shown={tasksResponse.data?.length ?? 0} limit={LIST_LIMIT} hint="Tasks completed more than 30 days ago are hidden; find them in their client or project workspace." />
      {workItemsReady ? (
        <nav aria-label="Work item kind" className="mb-6 flex flex-wrap gap-2 text-sm">
          {(["all", ...WORK_KINDS] as const).map((kind) => (
            <Link
              key={kind}
              href={kind === "all" ? "/app/tasks" : `/app/tasks?kind=${kind}`}
              aria-current={kind === activeKind ? "page" : undefined}
              className={`press rounded-full border px-3.5 py-1.5 transition-colors ${kind === activeKind ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {kind === "all" ? "All" : KIND_LABEL_PLURAL[kind]} <span className="opacity-60">{kind === "all" ? allTasks.length : kindCount(kind)}</span>
            </Link>
          ))}
        </nav>
      ) : null}
      <section aria-labelledby="tasks-heading">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="tasks-heading" className="text-sm text-muted-foreground">
            {openCount} open
          </h2>
          <AddDialog label="New task" title="New task">
            <NewTaskForm {...options} />
          </AddDialog>
        </div>
        <TaskList key={activeKind} tasks={rows} today={todayIso()} />
      </section>
    </>
  );
}
