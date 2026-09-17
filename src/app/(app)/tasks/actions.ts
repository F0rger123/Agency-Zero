"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

async function getUserClient(): Promise<
  | { supabase: Awaited<ReturnType<typeof createSupabaseClient>> }
  | { error: string }
> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase } : { error: "Your session has expired. Sign in again." };
}

function hoursField(formData: FormData, name: string, label: string): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24000) return { error: `${label} must be zero or a positive number of hours.` };
  return Math.round(hours * 60);
}

function taskFields(formData: FormData): ActionState | Record<string, string | number | null | Record<string, string>> {
  const title = requiredText(formData, "title", "Task title", 240);
  if (typeof title !== "string") return title;
  const status = field(formData, "status") || "todo";
  const priority = field(formData, "priority") || "medium";
  if (!["todo", "in_progress", "blocked_waiting_client", "blocked_other", "done", "cancelled"].includes(status)) return { error: "Choose a valid task status." };
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
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { error: "Recurring rule must be a JSON object." };
      recurrenceValue = parsed as Record<string, string>;
    } catch {
      return { error: "Recurring rule must be valid JSON, for example {\"frequency\":\"weekly\"}." };
    }
  }
  return {
    title,
    description: optionalField(formData, "description"),
    status,
    priority,
    due_date: optionalDate(formData, "due_date"),
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

function revalidateTaskPaths(id?: string, projectId?: string | null, clientId?: string | null) {
  revalidatePath("/tasks"); revalidatePath("/");
  if (id) revalidatePath(`/tasks/${id}`);
  if (projectId) revalidatePath(`/projects/${projectId}`);
  if (clientId) revalidatePath(`/clients/${clientId}`);
}

export async function createTaskAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = taskFields(formData);
  if ("error" in values) return values;
  const taskValues = values as Record<string, string | number | null | Record<string, string>>;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("tasks").insert(taskValues);
  if (error) return { error: readableError(error.message) };
  revalidateTaskPaths(undefined, String(taskValues.project_id ?? "") || null, String(taskValues.client_id ?? "") || null);
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
  const { error } = await auth.supabase.from("tasks").update(taskValues).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidateTaskPaths(id, String(taskValues.project_id ?? "") || null, String(taskValues.client_id ?? "") || null);
  return { success: "Task saved." };
}

export async function completeTaskAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Task ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase.from("tasks").update({ status: "done" }).eq("id", id).select("project_id, client_id").maybeSingle();
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
  const { error } = await auth.supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
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
  const { error } = await auth.supabase.from("time_entries").insert({ task_id: taskId, project_id: projectId, minutes, worked_on: optionalDate(formData, "worked_on") ?? new Date().toISOString().slice(0, 10), note: optionalField(formData, "note") });
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
  const { error } = await auth.supabase.from("time_entries").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidateTaskPaths(taskId ?? undefined, projectId);
  return { success: "Time entry removed." };
}
