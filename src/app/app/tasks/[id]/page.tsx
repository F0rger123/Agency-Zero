import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PICKER_LIMIT } from "@/lib/limits";
import { MigrationsRequired, SetupRequired } from "@/components/states";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DeleteTimeEntryForm, EditTaskForm, TimeEntryForm } from "../task-forms";
import { TaskQuickEdit } from "../task-quick-edit";
import { TaskDoneToggle } from "../task-done-toggle";
import { deleteTaskAction } from "../actions";

export const metadata: Metadata = { title: "Task" };

function dateLabel(date: string | null, time = false): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    ...(time ? { timeStyle: "short" as const } : {}),
  }).format(new Date(date.includes("T") ? date : `${date}T00:00:00Z`));
}

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const { id } = await params;
  const supabase = await createClient();
  const [
    taskResponse,
    clientsResponse,
    projectsResponse,
    milestonesResponse,
    allTasksResponse,
    subtasksResponse,
    timeEntriesResponse,
  ] = await Promise.all([
    supabase.from("tasks").select("*, clients(name), projects(name)").eq("id", id).maybeSingle(),
    supabase.from("clients").select("id, name").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    supabase.from("projects").select("id, name, client_id").is("deleted_at", null).order("name").limit(PICKER_LIMIT),
    supabase
      .from("milestones")
      .select("id, name, project_id, projects(name)")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("id, title")
      .not("status", "in", "(done,cancelled)")
      .order("created_at", { ascending: false })
      .limit(PICKER_LIMIT),
    supabase
      .from("tasks")
      .select("id, title, status, due_date")
      .eq("parent_task_id", id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("time_entries")
      .select("id, minutes, worked_on, note, created_at")
      .eq("task_id", id)
      .order("worked_on", { ascending: false }),
  ]);
  const responses = [
    taskResponse,
    clientsResponse,
    projectsResponse,
    milestonesResponse,
    allTasksResponse,
    subtasksResponse,
    timeEntriesResponse,
  ];
  if (responses.some((response) => response.error && isMissingTable(response.error.message)))
    return <MigrationsRequired />;
  const failed = responses.find((response) => response.error);
  if (failed?.error) throw new Error(failed.error.message);
  if (!taskResponse.data) notFound();

  const task = taskResponse.data as {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    estimated_minutes: number | null;
    actual_minutes: number | null;
    scheduled_date: string | null;
    client_id: string | null;
    project_id: string | null;
    milestone_id: string | null;
    parent_task_id: string | null;
    depends_on_task_id: string | null;
    recurrence_rule: Record<string, unknown> | null;
    kind?: string;
    clients?: { name: string } | { name: string }[] | null;
    projects?: { name: string } | { name: string }[] | null;
  };
  const clients = (clientsResponse.data ?? []) as { id: string; name: string }[];
  const projects = (projectsResponse.data ?? []) as { id: string; name: string }[];
  const milestones = (milestonesResponse.data ?? []) as {
    id: string;
    name: string;
    projects: { name: string } | { name: string }[] | null;
  }[];
  const allTasks = (allTasksResponse.data ?? []) as { id: string; title: string }[];
  const subtasks = (subtasksResponse.data ?? []) as {
    id: string;
    title: string;
    status: string;
    due_date: string | null;
  }[];
  const entries = (timeEntriesResponse.data ?? []) as {
    id: string;
    minutes: number;
    worked_on: string;
    note: string | null;
    created_at: string;
  }[];
  const dependency = task.depends_on_task_id ? allTasks.find((item) => item.id === task.depends_on_task_id) : null;
  const options = {
    clients: clients.map((client) => ({ id: client.id, label: client.name })),
    projects: projects.map((project) => ({ id: project.id, label: project.name })),
    milestones: milestones.map((milestone) => {
      const project = Array.isArray(milestone.projects) ? milestone.projects[0] : milestone.projects;
      return { id: milestone.id, label: `${milestone.name}${project?.name ? ` · ${project.name}` : ""}` };
    }),
    tasks: allTasks.map((item) => ({ id: item.id, label: item.title })),
  };
  const hours = (minutes: number | null) => (minutes == null ? "—" : `${Math.round((minutes / 60) * 10) / 10} h`);

  const name = (value: { name: string } | { name: string }[] | null | undefined) => (Array.isArray(value) ? value[0]?.name : value?.name) ?? null;
  const done = task.status === "done" || task.status === "cancelled";
  const logged = entries.reduce((sum, entry) => sum + entry.minutes, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/tasks" className="text-sm text-muted-foreground hover:text-foreground">
        ← Tasks
      </Link>

      <div className="mt-6 flex items-start gap-3">
        <span className="mt-1.5">
          <TaskDoneToggle id={task.id} done={done} title={task.title} />
        </span>
        <div className="min-w-0">
          <h1 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${done ? "text-muted-foreground line-through" : ""}`}>{task.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              task.client_id ? <Link key="c" href={`/app/clients/${task.client_id}`} className="hover:text-foreground hover:underline">{name(task.clients) ?? "Client"}</Link> : null,
              task.project_id ? <Link key="p" href={`/app/projects/${task.project_id}`} className="hover:text-foreground hover:underline">{name(task.projects) ?? "Project"}</Link> : null,
            ]
              .filter(Boolean)
              .reduce<React.ReactNode[]>((all, item, index) => (index ? [...all, " · ", item] : [item]), [])}
            {!task.client_id && !task.project_id ? "Not linked to a client or project" : null}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border p-4">
        <TaskQuickEdit id={task.id} kind={task.kind ?? "task"} status={task.status} priority={task.priority} dueDate={task.due_date} />
      </div>

      {task.description ? <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7">{task.description}</p> : null}

      {dependency ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Waits for{" "}
          <Link href={`/app/tasks/${dependency.id}`} className="underline decoration-border underline-offset-4">
            {dependency.title}
          </Link>
        </p>
      ) : null}

      {subtasks.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Subtasks</h2>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {subtasks.map((subtask) => (
              <li key={subtask.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/app/tasks/${subtask.id}`} className={`min-w-0 truncate font-medium hover:underline ${subtask.status === "done" ? "text-muted-foreground line-through" : ""}`}>
                  {subtask.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">{subtask.due_date ? dateLabel(subtask.due_date) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="group mt-8 border-t border-border pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
          <span>
            Time{" "}
            <span className="font-normal text-muted-foreground">
              · {logged || task.actual_minutes ? `${hours(logged || task.actual_minutes)} logged` : "nothing logged yet"}
              {task.estimated_minutes ? ` (estimate ${hours(task.estimated_minutes)})` : ""}
            </span>
          </span>
          <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="mt-4 space-y-4">
          <TimeEntryForm taskId={id} />
          {entries.length ? (
            <ul className="divide-y divide-border border-y border-border text-sm">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 py-3">
                  <span>
                    {hours(entry.minutes)} · {dateLabel(entry.worked_on)}
                    {entry.note ? <span className="block text-muted-foreground">{entry.note}</span> : null}
                  </span>
                  <DeleteTimeEntryForm id={entry.id} taskId={id} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>

      <details className="group mt-2 border-t border-border pt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
          <span>Edit all details</span>
          <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="mt-4">
          <EditTaskForm task={task} {...options} />
        </div>
      </details>

      <div className="mt-8 border-t border-border pt-4">
        <ConfirmDelete
          action={deleteTaskAction}
          fields={{ id: task.id, after: "list" }}
          label="Delete task"
          title="Delete this task?"
          message={`“${task.title}” will be removed. This cannot be undone.`}
          className="text-sm text-red-600 hover:text-red-700"
        />
      </div>
    </div>
  );
}
