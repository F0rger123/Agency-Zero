"use client";

import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/lib/forms";
import { quickUpdateProjectAction } from "./actions";
import type { ProjectWorkspaceData } from "./project-workspace-types";

const initialState: ActionState = {};

const STATUSES = [
  ["planning", "Planning"],
  ["active", "Active"],
  ["on_hold", "On hold"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

/**
 * Edit the things you change most (status, progress, dates) right from the top of the project, on every tab.
 * Each change saves as soon as you make it; only these fields are written, so nothing else on the project is touched.
 * "Set from tasks" fills the progress from the share of tasks that are done.
 */
export function ProjectQuickControls({ data, onEditAll }: { data: ProjectWorkspaceData; onEditAll: () => void }) {
  const { project, totals } = data;
  const [state, action, pending] = useActionState(quickUpdateProjectAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progress);
  const [starts, setStarts] = useState(project.starts_on ?? "");
  const [deadline, setDeadline] = useState(project.deadline ?? "");
  const totalTasks = totals.done_tasks + totals.open_tasks;
  const fromTasks = totalTasks > 0 ? Math.round((totals.done_tasks / totalTasks) * 100) : null;

  const save = () => window.setTimeout(() => formRef.current?.requestSubmit(), 0);
  const overdue = Boolean(deadline) && deadline < new Date().toISOString().slice(0, 10) && !["completed", "cancelled"].includes(status);

  const field = "mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground";
  const label = "text-[11px] font-medium uppercase tracking-widest text-muted-foreground";

  return (
    <form ref={formRef} action={action} className="border-b border-border py-5" aria-label="Quick edit project">
      <input type="hidden" name="id" value={project.id} />
      <input type="hidden" name="progress" value={progress} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-2">
          <label htmlFor="qc-status" className={label}>
            Status
          </label>
          <select
            id="qc-status"
            name="status"
            value={status}
            onChange={(event) => {
              const next = event.target.value;
              setStatus(next);
              if (next === "completed") setProgress(100);
              save();
            }}
            className={field}
          >
            {STATUSES.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="qc-progress" className={label}>
              Progress
            </label>
            <span className="text-sm font-semibold tabular-nums">{progress}%</span>
          </div>
          <input
            id="qc-progress"
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
            onPointerUp={save}
            onKeyUp={save}
            onBlur={() => {
              if (progress !== project.progress) save();
            }}
            aria-valuetext={`${progress} percent`}
            className="mt-3 h-2 w-full cursor-pointer accent-black"
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {fromTasks !== null ? (
              <button
                type="button"
                onClick={() => {
                  setProgress(fromTasks);
                  save();
                }}
                className="underline decoration-border underline-offset-4 hover:text-foreground"
              >
                Set from tasks ({totals.done_tasks} of {totalTasks} done = {fromTasks}%)
              </button>
            ) : (
              <span>Add tasks to set progress from them.</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="qc-starts" className={label}>
            Starts
          </label>
          <input
            id="qc-starts"
            name="starts_on"
            type="date"
            value={starts}
            onChange={(event) => {
              setStarts(event.target.value);
              save();
            }}
            className={field}
          />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="qc-deadline" className={label}>
            Deadline{overdue ? " · overdue" : ""}
          </label>
          <input
            id="qc-deadline"
            name="deadline"
            type="date"
            value={deadline}
            onChange={(event) => {
              setDeadline(event.target.value);
              save();
            }}
            className={`${field} ${overdue ? "border-foreground" : ""}`}
          />
        </div>
        <div className="flex items-end lg:col-span-1">
          <button type="button" onClick={onEditAll} className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted">
            Edit all
          </button>
        </div>
      </div>
      <p className="mt-3 min-h-5 text-xs text-muted-foreground" role="status" aria-live="polite">
        {pending ? "Saving…" : state.error ? <span className="text-foreground">{state.error}</span> : state.success ? "Saved." : "Changes save automatically."}
      </p>
    </form>
  );
}
