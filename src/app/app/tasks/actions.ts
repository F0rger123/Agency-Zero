"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows, hoursToMinutesField as hoursField } from "@/lib/actions";
import { SEVERITIES, WORK_ITEMS_MIGRATION_MESSAGE, WORK_SOURCES, isWorkKind, needsWorkItemsMigration } from "@/lib/work-items";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

function taskFields(formData: FormData): ActionState | Record<string, string | number | null | Record<string, string>> {
  const title = requiredText(formData, "title", "Task title", 240);
  if (typeof title !== "string") return title;
  const status = field(formData, "status") || "todo";
  const priority = field(formData, "priority") || "medium";
  if (!["todo", "in_progress", "blocked_waiting_client", "blocked_other", "done", "cancelled"].includes(status))
    return { error: "Choose a valid task status." };
  if (!["low", "medium", "high", "urgent"].includes(priority)) return { error: "Choose a valid task priority." };
  const estimated = hoursField(formData, "estimated_hours", "Estimated time");
  if (estimated !== null && typeof estimated === "object") return estimated;
  const actual = hoursField(formData, "actual_hours", "Actual time");
  if (actual !== null && typeof actual === "object") return actual;
  const recurrence = optionalField(formData, "recurrence_rule");
  let recurrenceValue: Record<string, string> | null = null;
  if (recurrence) {
    try {
      const parsed = JSON.parse(recurrence) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return { error: "Recurring rule must be a JSON object." };
      recurrenceValue = parsed as Record<string, string>;
    } catch {
      return { error: 'Recurring rule must be valid JSON, for example {"frequency":"weekly"}.' };
    }
  }
  // Work-item fields (migration 0023) are only written when the form submits `kind`, so forms that predate them
  // (and databases that have not applied 0023) keep working and never clear an existing bug's severity.
  const workItem: Record<string, string | null> = {};
  if (formData.has("kind")) {
    const kind = field(formData, "kind") || "task";
    if (!isWorkKind(kind)) return { error: "Choose a valid kind." };
    const severity = optionalField(formData, "severity");
    if (kind === "bug" && severity && !(SEVERITIES as readonly string[]).includes(severity))
      return { error: "Choose a valid severity." };
    const source = field(formData, "source") || "internal";
    if (!(WORK_SOURCES as readonly string[]).includes(source)) return { error: "Choose a valid source." };
    const resolution = optionalField(formData, "resolution");
    if (resolution && resolution.length > 2000) return { error: "Resolution must be 2000 characters or fewer." };
    workItem.kind = kind;
    workItem.severity = kind === "bug" ? severity : null;
    workItem.requester_contact_id = optionalField(formData, "requester_contact_id");
    workItem.source = source;
    workItem.resolution = resolution;
  }
  // Project phase (migration 0025): only written when the form submits it.
  if (formData.has("phase_id")) workItem.phase_id = optionalField(formData, "phase_id");
  return {
    ...workItem,
    title,
    description: optionalField(formData, "description"),
    status,
    priority,
    due_date: optionalDate(formData, "due_date"),
    scheduled_date: optionalDate(formData, "scheduled_date"),
    estimated_minutes: estimated,
    actual_minutes: actual,
    client_id: optionalField(formData, "client_id"),
    project_id: optionalField(formData, "project_id"),
    milestone_id: optionalField(formData, "milestone_id"),
    parent_task_id: optionalField(formData, "parent_task_id"),
    depends_on_task_id: optionalField(formData, "depends_on_task_id"),
    recurrence_rule: recurrenceValue,
  };
}

function taskError(message: string, formData: FormData): string {
  return formData.has("kind") && needsWorkItemsMigration(message) ? WORK_ITEMS_MIGRATION_MESSAGE : readableError(message);
}

function revalidateTaskPaths(id?: string, projectId?: string | null, clientId?: string | null) {
  revalidatePath("/app/tasks");
  revalidatePath("/app");
  if (id) revalidatePath(`/app/tasks/${id}`);
  if (projectId) revalidatePath(`/app/projects/${projectId}`);
  if (clientId) revalidatePath(`/app/clients/${clientId}`);
}

export async function createTaskAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = taskFields(formData);
  if ("error" in values) return values;
  const taskValues = values as Record<string, string | number | null | Record<string, string>>;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("tasks").insert(taskValues);
  if (error) return { error: taskError(error.message, formData) };
  revalidateTaskPaths(
    undefined,
    String(taskValues.project_id ?? "") || null,
    String(taskValues.client_id ?? "") || null,
  );
  return { success: "Task created." };
}

export async function updateTaskAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Task ID is missing." };
  const values = taskFields(formData);
  if ("error" in values) return values;
  const taskValues = values as Record<string, string | number | null | Record<string, string>>;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("tasks").update(taskValues, { count: "exact" }).eq("id", id);
  if (error) return { error: taskError(error.message, formData) };
  const missing = notFoundWhenNoRows(count, "Task");
  if (missing) return missing;
  revalidateTaskPaths(id, String(taskValues.project_id ?? "") || null, String(taskValues.client_id ?? "") || null);
  return { success: "Task saved." };
}

export async function completeTaskAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Task ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase
    .from("tasks")
    .update({ status: "done" })
    .eq("id", id)
    .select("project_id, client_id")
    .maybeSingle();
  if (error) return { error: readableError(error.message) };
  revalidateTaskPaths(id, data?.project_id, data?.client_id);
  return { success: "Task completed." };
}

export async function deleteTaskAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Task ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data } = await auth.supabase.from("tasks").select("project_id, client_id").eq("id", id).maybeSingle();
  const { error, count } = await auth.supabase.from("tasks").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Task");
  if (missing) return missing;
  revalidateTaskPaths(undefined, data?.project_id, data?.client_id);
  return { success: "Task deleted." };
}

export async function createTimeEntryAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const taskId = optionalField(formData, "task_id");
  const projectId = optionalField(formData, "project_id");
  const rawHours = field(formData, "hours");
  const hours = Number(rawHours);
  const minutes = Math.round(hours * 60);
  if (!taskId && !projectId) return { error: "Choose a task or project for this time entry." };
  if (!Number.isFinite(hours) || hours <= 0 || minutes <= 0) return { error: "Time must be greater than zero hours." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("time_entries")
    .insert({
      task_id: taskId,
      project_id: projectId,
      minutes,
      worked_on: optionalDate(formData, "worked_on") ?? new Date().toISOString().slice(0, 10),
      note: optionalField(formData, "note"),
    });
  if (error) return { error: readableError(error.message) };
  revalidateTaskPaths(taskId ?? undefined, projectId);
  return { success: "Time entry added." };
}

export async function deleteTimeEntryAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const taskId = optionalField(formData, "task_id");
  const projectId = optionalField(formData, "project_id");
  if (!id) return { error: "Time entry ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("time_entries").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Time entry");
  if (missing) return missing;
  revalidateTaskPaths(taskId ?? undefined, projectId);
  return { success: "Time entry removed." };
}
