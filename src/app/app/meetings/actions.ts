"use server";

import { revalidatePath } from "next/cache";
import { getUserClient, notFoundWhenNoRows } from "@/lib/actions";
import { field, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";
import { MEETINGS_MIGRATION_MESSAGE, cleanActionItems, needsMeetingsMigration, openItemsToConvert, type ActionItem } from "@/lib/meetings";

const fail = (message: string) => (needsMeetingsMigration(message) ? MEETINGS_MIGRATION_MESSAGE : readableError(message));

function revalidateClient(clientId?: string | null) {
  revalidatePath("/app");
  if (clientId) revalidatePath(`/app/clients/${clientId}`);
}

/** Start a meeting: creates it in progress so notes can be taken straight away. */
export async function startMeetingAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const clientId = field(formData, "client_id");
  if (!clientId) return { error: "Client is missing." };
  const title = requiredText(formData, "title", "Meeting title", 160);
  if (typeof title !== "string") return title;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("meetings").insert({
    client_id: clientId,
    project_id: optionalField(formData, "project_id"),
    title,
    attendees: optionalField(formData, "attendees"),
    location: optionalField(formData, "location"),
    agenda: optionalField(formData, "agenda"),
    status: "in_progress",
  });
  if (error) return { error: fail(error.message) };
  revalidateClient(clientId);
  return { success: "Meeting started. Take notes below." };
}

export type SaveMeetingInput = {
  id: string;
  title?: string;
  notes: string;
  decisions: string;
  attendees: string;
  agenda: string;
  actionItems: ActionItem[];
};

/** Autosave from the live editor. Called directly (not through a form) after every pause in typing. */
export async function saveMeetingAction(input: SaveMeetingInput): Promise<{ ok: boolean; error?: string }> {
  if (!input || typeof input.id !== "string") return { ok: false, error: "Meeting is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const patch: Record<string, unknown> = {
    notes: String(input.notes ?? "").slice(0, 50_000),
    decisions: String(input.decisions ?? "").slice(0, 10_000) || null,
    attendees: String(input.attendees ?? "").slice(0, 500) || null,
    agenda: String(input.agenda ?? "").slice(0, 10_000) || null,
    action_items: cleanActionItems(input.actionItems),
  };
  if (typeof input.title === "string" && input.title.trim()) patch.title = input.title.trim().slice(0, 160);
  const { error, count } = await auth.supabase.from("meetings").update(patch, { count: "exact" }).eq("id", input.id);
  if (error) return { ok: false, error: fail(error.message) };
  if (!count) return { ok: false, error: "Meeting not found." };
  // No revalidate on every keystroke-save: the list refreshes when the meeting ends or the page reloads.
  return { ok: true };
}

export async function setMeetingStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const status = field(formData, "status");
  if (!id || !["in_progress", "done"].includes(status)) return { error: "Meeting update is incomplete." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase
    .from("meetings")
    .update({ status, ended_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("client_id")
    .maybeSingle();
  if (error) return { error: fail(error.message) };
  if (!data) return { error: "Meeting not found." };
  revalidateClient(data.client_id);
  return { success: status === "done" ? "Meeting ended." : "Meeting reopened." };
}

/** Turns the still-open action items into real tasks on the customer (and project, if the meeting had one). */
export async function meetingTasksAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Meeting is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const found = await auth.supabase.from("meetings").select("client_id, project_id, title, action_items").eq("id", id).maybeSingle();
  if (found.error) return { error: fail(found.error.message) };
  const meeting = found.data;
  if (!meeting) return { error: "Meeting not found." };
  const items = cleanActionItems(meeting.action_items);
  const todo = openItemsToConvert(items);
  if (todo.length === 0) return { error: "No open action items to turn into tasks." };
  const { error } = await auth.supabase.from("tasks").insert(
    todo.map((item) => ({
      title: item.text.slice(0, 200),
      description: `From meeting: ${meeting.title}`,
      client_id: meeting.client_id,
      project_id: meeting.project_id,
      status: "todo",
      priority: "medium",
    })),
  );
  if (error) return { error: readableError(error.message) };
  const converted = new Set(todo.map((item) => item.id));
  await auth.supabase
    .from("meetings")
    .update({ action_items: items.map((item) => (converted.has(item.id) ? { ...item, task: true } : item)) })
    .eq("id", id);
  revalidateClient(meeting.client_id);
  revalidatePath("/app/tasks");
  return { success: `${todo.length} task${todo.length === 1 ? "" : "s"} created.` };
}

export async function deleteMeetingAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!id) return { error: "Meeting is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const found = await auth.supabase.from("meetings").select("client_id").eq("id", id).maybeSingle();
  const { error, count } = await auth.supabase.from("meetings").delete({ count: "exact" }).eq("id", id);
  if (error) return { error: fail(error.message) };
  const missing = notFoundWhenNoRows(count, "Meeting");
  if (missing) return missing;
  revalidateClient(found.data?.client_id);
  return { success: "Meeting deleted." };
}
