"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";
import { PHASES_MIGRATION_MESSAGE, SERVICE_KINDS, needsPhasesMigration, parseTemplateText } from "@/lib/phases";

/** Create or edit a project template from the simple text format (## Phase, - task | priority | day). */
export async function saveProjectTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = optionalField(formData, "id");
  const name = requiredText(formData, "name", "Template name", 120);
  if (typeof name !== "string") return name;
  const kind = field(formData, "service_kind") || "other";
  if (!(SERVICE_KINDS as readonly string[]).includes(kind)) return { error: "Choose a service." };
  const description = optionalField(formData, "description");
  if (description && description.length > 500) return { error: "Description must be 500 characters or fewer." };
  const parsed = parseTemplateText(field(formData, "phases_text"));
  if ("error" in parsed) return parsed;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const values = { name, service_kind: kind, description, phases: parsed.phases, active: formData.get("active") !== "off" };
  if (id) {
    const { error, count } = await auth.supabase.from("project_templates").update(values, { count: "exact" }).eq("id", id);
    if (error) return { error: templateError(error) };
    const missing = notFoundWhenNoRows(count, "Template");
    if (missing) return missing;
  } else {
    const { error } = await auth.supabase.from("project_templates").insert(values);
    if (error) return { error: templateError(error) };
  }
  revalidatePath("/app/projects/templates");
  return { success: id ? "Template saved." : "Template created." };
}

function templateError(error: { message: string; code?: string }): string {
  if (error.code === "23505") return "A template with that name already exists.";
  return needsPhasesMigration(error.message) ? PHASES_MIGRATION_MESSAGE : readableError(error.message);
}
