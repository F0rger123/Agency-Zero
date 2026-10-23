"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatedCheck } from "@/components/animated-check";
import { groupTasks } from "@/lib/task-groups";
import { setTaskDoneAction } from "./actions";

export type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  kind?: string;
  severity?: string | null;
  parent: boolean;
  client: string | null;
  project: string | null;
};

const shortDate = (iso: string) => new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** A calm task list: grouped by when it is due, one line each, tick to complete, tap to open. */
export function TaskList({ tasks: initial, today }: { tasks: TaskRow[]; today: string }) {
  const [tasks, setTasks] = useState(initial);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);
  const groups = groupTasks(tasks, today);

  const toggle = async (task: TaskRow, done: boolean) => {
    setError("");
    const previous = task.status;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: done ? "done" : "todo" } : item)));
    const result = await setTaskDoneAction(task.id, done);
    if (result.error) {
      setError(result.error);
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: previous } : item)));
    }
  };

  if (tasks.length === 0) return <p className="border-y border-border py-10 text-sm text-muted-foreground">Nothing here yet.</p>;

  return (
    <div className="space-y-8">
      {error ? <p role="alert" className="text-sm font-medium">{error}</p> : null}
      {groups.map((group) => {
        const collapsed = group.key === "done" && !showDone;
        return (
          <section key={group.key} aria-label={group.label}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xs font-medium uppercase tracking-widest ${group.key === "overdue" ? "text-red-600" : "text-muted-foreground"}`}>
                {group.label} <span className="text-faint-foreground">{group.tasks.length}</span>
              </h2>
              {group.key === "done" ? (
                <button type="button" onClick={() => setShowDone((value) => !value)} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  {showDone ? "Hide" : "Show"}
                </button>
              ) : null}
            </div>
            {collapsed ? null : (
              <ul className="mt-2 divide-y divide-border border-y border-border">
                {group.tasks.map((task) => {
                  const done = task.status === "done" || task.status === "cancelled";
                  const tags = [
                    task.kind && task.kind !== "task" ? (task.kind === "bug" ? "Bug" : "Request") : null,
                    task.status === "in_progress" ? "In progress" : null,
                    task.status.startsWith("blocked") ? "Waiting" : null,
                    task.priority === "urgent" || task.priority === "high" ? (task.priority === "urgent" ? "Urgent" : "High") : null,
                  ].filter(Boolean) as string[];
                  const meta = [task.client, task.project, task.due_date && group.key !== "nodate" ? shortDate(task.due_date) : null].filter(Boolean).join(" · ");
                  return (
                    <li key={task.id} className="flex items-center gap-3 py-3">
                      <AnimatedCheck checked={done} label={`${done ? "Mark not done" : "Mark done"}: ${task.title}`} onChange={(next) => void toggle(task, next)} />
                      <Link href={`/app/tasks/${task.id}`} className="group min-w-0 flex-1">
                        <span className={`block truncate text-[15px] font-medium transition-colors group-hover:underline group-hover:underline-offset-4 ${done ? "text-muted-foreground line-through" : ""}`}>
                          {task.parent ? <span className="text-faint-foreground">↳ </span> : null}
                          {task.title}
                        </span>
                        {meta ? <span className="block truncate text-xs text-muted-foreground">{meta}</span> : null}
                      </Link>
                      {tags.length ? (
                        <span className="hidden shrink-0 gap-1 sm:flex">
                          {tags.map((tag) => (
                            <span key={tag} className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tag === "Urgent" ? "border-red-600/40 text-red-600" : "border-border text-muted-foreground"}`}>{tag}</span>
                          ))}
                        </span>
                      ) : null}
                      {tags.includes("Urgent") || tags.includes("High") ? <span aria-hidden className={`size-2 shrink-0 rounded-full sm:hidden ${tags.includes("Urgent") ? "bg-red-600" : "bg-foreground"}`} /> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
