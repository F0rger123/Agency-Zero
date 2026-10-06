import { AddDialog } from "@/components/modal";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteTaskAction } from "./actions";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { LIST_LIMIT, PICKER_LIMIT, daysAgoIso } from "@/lib/limits";
import { PageHeader } from "@/components/page-header";
import { MigrationsRequired, SetupRequired, LimitNotice } from "@/components/states";
import { KIND_LABEL, KIND_LABEL_PLURAL, WORK_KINDS, isWorkKind, needsWorkItemsMigration, statusLabel } from "@/lib/work-items";
import { NewTaskForm } from "./task-forms";

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
  const dateLabel = (date: string | null) =>
    date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00Z`)) : "—";
  const hoursLabel = (minutes: number | null) => (minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`);
  const activeTasks = tasks.filter((task) => !["done", "cancelled"].includes(task.status));

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Tasks, bugs and feature requests with priorities, deadlines, time, dependencies, recurring rules, and waiting-on-client status. Log bugs and requests inside their project."
      />
      <LimitNotice shown={tasksResponse.data?.length ?? 0} limit={LIST_LIMIT} hint="Tasks completed more than 30 days ago are hidden; find them in their client or project workspace." />
      {workItemsReady ? (
        <nav aria-label="Work item kind" className="mb-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-3 text-sm">
          {(["all", ...WORK_KINDS] as const).map((kind) => (
            <Link
              key={kind}
              href={kind === "all" ? "/app/tasks" : `/app/tasks?kind=${kind}`}
              aria-current={kind === activeKind ? "page" : undefined}
              className={`underline-offset-4 ${kind === activeKind ? "font-medium underline decoration-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {kind === "all" ? "All" : KIND_LABEL_PLURAL[kind]} <span className="text-faint-foreground">{kind === "all" ? allTasks.length : kindCount(kind)}</span>
            </Link>
          ))}
        </nav>
      ) : null}
      <section aria-labelledby="tasks-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="tasks-heading" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {activeTasks.length} open · {tasks.length} total
          </h2>
          <AddDialog label="New task" title="New task">
            <NewTaskForm {...options} />
          </AddDialog>
        </div>
        {tasks.length === 0 ? (
          <div className="mt-4 border-t border-border pt-8 text-sm text-muted-foreground">
            No tasks yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Task</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Priority</th>
                  <th className="px-3 py-3 font-medium">Client / project</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium"><span className="sr-only">Delete</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => {
                  const client = Array.isArray(task.clients) ? task.clients[0] : task.clients;
                  const project = Array.isArray(task.projects) ? task.projects[0] : task.projects;
                  return (
                    <tr key={task.id}>
                      <td className="px-3 py-4 font-medium">
                        <Link href={`/app/tasks/${task.id}`} className="underline decoration-border underline-offset-4">
                          {task.parent_task_id ? "↳ " : ""}
                          {task.title}
                        </Link>
                        {task.kind && task.kind !== "task" ? (
                          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                            {KIND_LABEL[task.kind as keyof typeof KIND_LABEL] ?? task.kind}
                            {task.severity ? ` · ${task.severity}` : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {statusLabel(task.kind ?? "task", task.status).toLowerCase()}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{task.priority}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {[client?.name, project?.name].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">{dateLabel(task.due_date)}</td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {hoursLabel(task.actual_minutes)} / {hoursLabel(task.estimated_minutes)}
                      </td>
                      <td className="px-3 py-4 text-right">
                        <ConfirmDelete
                          action={deleteTaskAction}
                          fields={{ id: task.id }}
                          title="Delete this task?"
                          message={`“${task.title}” will be removed. This cannot be undone.`}
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
