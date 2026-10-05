"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalDate, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";
import { PHASES_MIGRATION_MESSAGE, PHASE_STATUSES, needsPhasesMigration } from "@/lib/phases";

function phaseError(message: string): string {
  return needsPhasesMigration(message) ? PHASES_MIGRATION_MESSAGE : readableError(message);
}

function revalidateProject(projectId: string) {
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath("/app/tasks");
  revalidatePath("/app");
}

/** Apply a template: creates its phases and tasks in one transaction (due dates count from the start date). */
export async function applyProjectTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = field(formData, "project_id");
  const templateId = field(formData, "template_id");
  if (!projectId) return { error: "Project is missing." };
  if (!templateId) return { error: "Choose a template." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase.rpc("apply_project_template", {
    p_project_id: projectId,
    p_template_id: templateId,
    p_start: optionalDate(formData, "start_date"),
  });
  if (error) return { error: phaseError(error.message) };
  revalidateProject(projectId);
  const result = data as { phases?: number; tasks?: number } | null;
  return { success: `Added ${result?.phases ?? 0} phases and ${result?.tasks ?? 0} tasks.` };
}

export async function createPhaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const projectId = field(formData, "project_id");
  if (!projectId) return { error: "Project is missing." };
  const name = requiredText(formData, "name", "Phase name", 120);
  if (typeof name !== "string") return name;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const last = await auth.supabase
    .from("project_phases")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last.error) return { error: phaseError(last.error.message) };
  const { error } = await auth.supabase
    .from("project_phases")
    .insert({ project_id: projectId, name, sort_order: (last.data?.sort_order ?? -1) + 1, status: last.data ? "upcoming" : "active" });
  if (error) return { error: phaseError(error.message) };
  revalidateProject(projectId);
  return { success: "Phase added." };
}

export async function updatePhaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  if (!id || !projectId) return { error: "Phase is missing." };
  const name = requiredText(formData, "name", "Phase name", 120);
  if (typeof name !== "string") return name;
  const status = field(formData, "status") || "upcoming";
  if (!(PHASE_STATUSES as readonly string[]).includes(status)) return { error: "Choose a valid status." };
  const startsOn = optionalDate(formData, "starts_on");
  const dueOn = optionalDate(formData, "due_on");
  if (startsOn && dueOn && dueOn < startsOn) return { error: "The due date must be after the start date." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("project_phases")
    .update({ name, status, starts_on: startsOn, due_on: dueOn }, { count: "exact" })
    .eq("id", id);
  if (error) return { error: phaseError(error.message) };
  const missing = notFoundWhenNoRows(count, "Phase");
  if (missing) return missing;
  revalidateProject(projectId);
  return { success: "Phase saved." };
}

/** Start or finish a phase. Finishing the active phase starts the next upcoming one. */
export async function setPhaseStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  const status = field(formData, "status");
  if (!id || !projectId) return { error: "Phase is missing." };
  if (!(PHASE_STATUSES as readonly string[]).includes(status)) return { error: "Choose a valid status." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error, count } = await auth.supabase
    .from("project_phases")
    .update({ status }, { count: "exact" })
    .eq("id", id)
    .select("sort_order")
    .maybeSingle();
  if (error) return { error: phaseError(error.message) };
  const missing = notFoundWhenNoRows(count, "Phase");
  if (missing) return missing;
  if (status === "done" && data) {
    const next = await auth.supabase
      .from("project_phases")
      .select("id")
      .eq("project_id", projectId)
      .eq("status", "upcoming")
      .gt("sort_order", data.sort_order)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (next.data) await auth.supabase.from("project_phases").update({ status: "active" }).eq("id", next.data.id);
  }
  revalidateProject(projectId);
  return {};
}

export async function movePhaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  const direction = Number(field(formData, "direction"));
  if (!id || !projectId || (direction !== -1 && direction !== 1)) return { error: "Phase is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.rpc("move_project_phase", { p_phase_id: id, p_direction: direction });
  if (error) return { error: phaseError(error.message) };
  revalidateProject(projectId);
  return {};
}

/** Delete a phase. Its tasks are kept (they just stop belonging to a phase). */
export async function deletePhaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const projectId = field(formData, "project_id");
  if (!id || !projectId) return { error: "Phase is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("project_phases").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: phaseError(error.message) };
  const missing = notFoundWhenNoRows(count, "Phase");
  if (missing) return missing;
  revalidateProject(projectId);
  return { success: "Phase deleted. Its tasks were kept." };
}

/** Put an existing task into a phase (or take it out with an empty phase). */
export async function assignTaskPhaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const taskId = field(formData, "task_id");
  const projectId = field(formData, "project_id");
  if (!taskId || !projectId) return { error: "Task is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase
    .from("tasks")
    .update({ phase_id: optionalField(formData, "phase_id") }, { count: "exact" })
    .eq("id", taskId);
  if (error) return { error: phaseError(error.message) };
  const missing = notFoundWhenNoRows(count, "Task");
  if (missing) return missing;
  revalidateProject(projectId);
  return {};
}
