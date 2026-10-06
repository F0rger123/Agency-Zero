"use client";

import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/lib/forms";
import { statusOptions } from "@/lib/work-items";
import { quickUpdateTaskAction } from "./actions";

const initialState: ActionState = {};
const control = "h-8 rounded-md border border-border bg-background px-2 text-xs outline-none transition-colors focus:border-foreground";

/** Status, priority and due date for one task, saved the moment you change them (no Edit form needed). */
export function TaskQuickEdit({
  id,
  kind = "task",
  status,
  priority,
  dueDate,
}: {
  id: string;
  kind?: string;
  status: string;
  priority: string;
  dueDate: string | null;
}) {
  const [state, action, pending] = useActionState(quickUpdateTaskAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ status, priority, due_date: dueDate ?? "" });
  const save = () => window.setTimeout(() => formRef.current?.requestSubmit(), 0);
  const change = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    save();
  };

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2" aria-label="Quick edit task">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`tq-status-${id}`}>Status</label>
      <select id={`tq-status-${id}`} name="status" value={values.status} onChange={(event) => change("status", event.target.value)} className={control}>
        {statusOptions(kind).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`tq-priority-${id}`}>Priority</label>
      <select id={`tq-priority-${id}`} name="priority" value={values.priority} onChange={(event) => change("priority", event.target.value)} className={control}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <label className="sr-only" htmlFor={`tq-due-${id}`}>Due date</label>
      <input id={`tq-due-${id}`} name="due_date" type="date" value={values.due_date} onChange={(event) => change("due_date", event.target.value)} className={control} />
      <span className="min-w-12 text-xs text-muted-foreground" role="status" aria-live="polite">
        {pending ? "Saving…" : state.error ? state.error : state.success ? "Saved" : ""}
      </span>
    </form>
  );
}
