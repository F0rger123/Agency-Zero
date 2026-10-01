"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows, wholeNumberField as numberField, hoursToMinutesField as hoursField, moneyToCentsField as moneyField } from "@/lib/actions";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

function projectFields(formData: FormData): ActionState | Record<string, string | number | null> {
  const name = requiredText(formData, "name", "Project name", 200);
  if (typeof name !== "string") return name;
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Choose a client." };
  const status = field(formData, "status") || "planning";
  if (!["planning", "active", "on_hold", "completed", "cancelled"].includes(status))
    return { error: "Choose a valid project status." };
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
  revalidatePath("/projects");
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: "Project created." };
}

export async function updateProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Project ID is missing." };
  const values = projectFields(formData);
  if ("error" in values) return values;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("projects").update(values, { count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Project");
  if (missing) return missing;
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/clients");
  revalidatePath("/");
  return { success: "Project saved." };
}

export async function archiveProjectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Project ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("projects").update({ deleted_at: new Date().toISOString() }, { count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Project");
  if (missing) return missing;
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
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
  const { error } = await auth.supabase
    .from("milestones")
    .insert({ project_id: projectId, name, due_date: optionalDate(formData, "due_date"), sort_order: sortOrder ?? 0 });
  if (error) return { error: readableError(error.message) };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
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
  const { error, count } = await auth.supabase
    .from("milestones")
    .update({
      name,
      due_date: optionalDate(formData, "due_date"),
      completed_at: completed ? new Date().toISOString() : null,
    }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Milestone");
  if (missing) return missing;
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/");
  return { success: "Milestone saved." };
}

export async function deleteMilestoneAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  if (!id || !projectId) return { error: "Milestone details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("milestones").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Milestone");
  if (missing) return missing;
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  return { success: "Milestone removed." };
}

// ─────────────────────────────────────────────────────────────────────────────
// Project workspace (migration 0013): notes, files, and milestone completion.
// Everything here is scoped to one project so the workspace never needs to
// leave the page to record work.
// ─────────────────────────────────────────────────────────────────────────────

function revalidateProjectPaths(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function createProjectNoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = field(formData, "project_id");
  const body = requiredText(formData, "body", "Note", 5000);
  if (!projectId) return { error: "Project ID is missing." };
  if (typeof body !== "string") return body;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("project_notes").insert({
    project_id: projectId,
    body,
    pinned: formData.get("pinned") === "on",
  });
  if (error) return { error: readableError(error.message) };
  revalidateProjectPaths(projectId);
  return { success: "Note added." };
}

export async function deleteProjectNoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  if (!id || !projectId) return { error: "Note details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("project_notes").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Note");
  if (missing) return missing;
  revalidateProjectPaths(projectId);
  return { success: "Note removed." };
}

/**
 * Project files reuse the private `client-files` bucket under a
 * `projects/<project_id>/…` prefix (D-021 / migration 0013): the storage
 * policies from 0005 apply unchanged, and downloads are one-hour signed URLs.
 */
export async function uploadProjectFileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = field(formData, "project_id");
  const fileValue = formData.get("file");
  if (!projectId) return { error: "Project ID is missing." };
  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (fileValue.size > 10 * 1024 * 1024) return { error: "Files must be 10 MB or smaller." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;

  const safeName = fileValue.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160);
  const path = `projects/${projectId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await auth.supabase.storage.from("client-files").upload(path, fileValue, {
    contentType: fileValue.type || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) return { error: readableError(upload.error.message) };

  const { error } = await auth.supabase.from("project_files").insert({
    project_id: projectId,
    file_name: fileValue.name,
    storage_path: path,
    mime_type: fileValue.type || null,
    size_bytes: fileValue.size,
  });
  if (error) {
    await auth.supabase.storage.from("client-files").remove([path]);
    return { error: readableError(error.message) };
  }
  revalidateProjectPaths(projectId);
  return { success: "File uploaded." };
}

export async function deleteProjectFileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  if (!id || !projectId) return { error: "File details are missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  // Never trust a client-supplied storage path: resolve it from the file row.
  const row = await auth.supabase.from("project_files").select("storage_path").eq("id", id).maybeSingle();
  if (row.error) return { error: readableError(row.error.message) };
  if (!row.data) return { error: "File not found, or it was already removed." };
  const path = row.data.storage_path;
  const removed = await auth.supabase.storage.from("client-files").remove([path]);
  if (removed.error) return { error: readableError(removed.error.message) };
  const { error, count } = await auth.supabase.from("project_files").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "File");
  if (missing) return missing;
  revalidateProjectPaths(projectId);
  return { success: "File removed." };
}

/**
 * Mark a milestone complete (or reopen it) straight from the project — the
 * owner never has to leave the page to move delivery forward.
 */
export async function setMilestoneCompletedAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  const completedRaw = field(formData, "completed");
  if (!id || !projectId) return { error: "Milestone details are missing." };
  if (!["true", "false"].includes(completedRaw)) {
    return { error: "Choose a valid milestone state." };
  }
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("milestones")
    .update({ completed_at: completedRaw === "true" ? new Date().toISOString() : null }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Milestone");
  if (missing) return missing;
  revalidateProjectPaths(projectId);
  revalidatePath("/tasks");
  return { success: completedRaw === "true" ? "Milestone completed." : "Milestone reopened." };
}
