"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  field,
  optionalDate,
  optionalField,
  readableError,
  requiredText,
  type ActionState,
} from "@/lib/forms";

async function getUserClient(): Promise<
  | { supabase: Awaited<ReturnType<typeof createSupabaseClient>> }
  | { error: string }
> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? { supabase } : { error: "Your session has expired. Sign in again." };
}

function numberField(formData: FormData, name: string, label: string, max: number): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0 || value > max) return { error: `${label} must be a whole number from 0 to ${max}.` };
  return value;
}

function hoursField(formData: FormData, name: string, label: string): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24000) return { error: `${label} must be zero or a positive number of hours.` };
  return Math.round(hours * 60);
}

function moneyField(formData: FormData, name: string, label: string): number | null | ActionState {
  const raw = field(formData, name);
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) return { error: `${label} must be a valid positive amount.` };
  return Math.round(amount * 100);
}

function projectFields(formData: FormData): ActionState | Record<string, string | number | null> {
  const name = requiredText(formData, "name", "Project name", 200);
  if (typeof name !== "string") return name;
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const status = field(formData, "status") || "planning";
  if (!["planning", "active", "on_hold", "completed", "cancelled"].includes(status)) return { error: "Choose a valid project status." };
  const value = moneyField(formData, "value_amount", "Project value");
  if (value !== null && typeof value === "object") return value;
  const estimated = hoursField(formData, "estimated_hours", "Estimated time");
  if (estimated !== null && typeof estimated === "object") return estimated;
  const actual = hoursField(formData, "actual_hours", "Actual time");
  if (actual !== null && typeof actual === "object") return actual;
  const progress = numberField(formData, "progress", "Progress", 100);
  if (progress !== null && typeof progress === "object") return progress;
  const currency = (field(formData, "currency") || "USD").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a three-letter code such as USD." };
  return {
    client_id: clientId,
    name,
    description: optionalField(formData, "description"),
    status,
    value_cents: value,
    currency,
    estimated_minutes: estimated,
    actual_minutes: actual,
    starts_on: optionalDate(formData, "starts_on"),
    deadline: optionalDate(formData, "deadline"),
    progress: progress ?? 0,
  };
}

export async function createProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = projectFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("projects").insert(values);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/projects"); revalidatePath("/clients"); revalidatePath("/");
  return { success: "Project created." };
}

export async function updateProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Project ID is missing." };
  const values = projectFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("projects").update(values).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/projects"); revalidatePath(`/projects/${id}`); revalidatePath("/clients"); revalidatePath("/");
  return { success: "Project saved." };
}

export async function archiveProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Project ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/projects"); revalidatePath(`/projects/${id}`); revalidatePath("/");
  return { success: "Project archived." };
}

export async function createMilestoneAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = field(formData, "project_id");
  const name = requiredText(formData, "name", "Milestone name", 200);
  if (!projectId) return { error: "Project ID is missing." };
  if (typeof name !== "string") return name;
  const sortOrder = numberField(formData, "sort_order", "Sort order", 10000);
  if (sortOrder !== null && typeof sortOrder === "object") return sortOrder;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("milestones").insert({ project_id: projectId, name, due_date: optionalDate(formData, "due_date"), sort_order: sortOrder ?? 0 });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/projects/${projectId}`); revalidatePath("/tasks"); revalidatePath("/");
  return { success: "Milestone added." };
}

export async function updateMilestoneAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  const name = requiredText(formData, "name", "Milestone name", 200);
  if (!id || !projectId) return { error: "Milestone details are missing." };
  if (typeof name !== "string") return name;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const completed = formData.get("completed") === "on";
  const { error } = await auth.supabase.from("milestones").update({ name, due_date: optionalDate(formData, "due_date"), completed_at: completed ? new Date().toISOString() : null }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/projects/${projectId}`); revalidatePath("/tasks"); revalidatePath("/");
  return { success: "Milestone saved." };
}

export async function deleteMilestoneAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  if (!id || !projectId) return { error: "Milestone details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("milestones").delete().eq("id", id);
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/projects/${projectId}`); revalidatePath("/tasks");
  return { success: "Milestone removed." };
}
