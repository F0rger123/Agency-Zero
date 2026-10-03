"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";

export async function createReminderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const message = requiredText(formData, "message", "Reminder", 1000);
  const dueAt = field(formData, "due_at");
  if (typeof message !== "string") return message;
  if (!dueAt || Number.isNaN(new Date(`${dueAt}:00Z`).getTime())) return { error: "Choose a valid reminder time." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase
    .from("reminders")
    .insert({
      kind: "custom",
      due_at: new Date(`${dueAt}:00Z`).toISOString(),
      message,
      subject_type: optionalField(formData, "subject_type"),
      subject_id: optionalField(formData, "subject_id"),
    });
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/reminders");
  revalidatePath("/app");
  return { success: "Reminder created." };
}
export async function completeReminderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Reminder ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("reminders").update({ done: true }, { count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Reminder");
  if (missing) return missing;
  revalidatePath("/app/reminders");
  return { success: "Reminder completed." };
}
export async function deleteReminderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Reminder ID is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("reminders").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: readableError(error.message) };
  const missing = notFoundWhenNoRows(count, "Reminder");
  if (missing) return missing;
  revalidatePath("/app/reminders");
  return { success: "Reminder removed." };
}
