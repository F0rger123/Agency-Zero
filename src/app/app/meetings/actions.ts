"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserClient, notFoundWhenNoRows, type UserClient } from "@/lib/actions";
import { field, isMissingTable, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";
import {
  MEETINGS_MIGRATION_MESSAGE,
  MEETING_WORKSPACE_MIGRATION_MESSAGE,
  cleanActionItems,
  cleanQuestions,
  needsMeetingWorkspaceMigration,
  needsMeetingsMigration,
  openItemsToConvert,
  type ActionItem,
  type MeetingQuestion,
} from "@/lib/meetings";
import { createPublicToken } from "@/lib/public-tokens";
import { buildTemplate } from "@/lib/whiteboard/templates";

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function fail(message: string) {
  if (/whiteboards/i.test(message) && isMissingTable(message)) return "Whiteboards need database update 0032. Apply it in the Supabase SQL editor.";
  if (needsMeetingWorkspaceMigration(message)) return MEETING_WORKSPACE_MIGRATION_MESSAGE;
  return needsMeetingsMigration(message) ? MEETINGS_MIGRATION_MESSAGE : readableError(message);
}

function revalidateClient(clientId?: string | null, meetingId?: string | null) {
  revalidatePath("/app");
  revalidatePath("/app/meetings");
  if (meetingId) revalidatePath(`/app/meetings/${meetingId}`);
  if (clientId) revalidatePath(`/app/clients/${clientId}`);
}

/**
 * A whiteboard for a meeting, filed under the meeting and its customer.
 * Falls back to a board without the meeting link while migration 0033 is not applied.
 */
async function createMeetingBoard(supabase: UserClient, meeting: { id: string; title: string; client_id: string | null }) {
  const token = createPublicToken();
  const row = {
    title: meeting.title.slice(0, 200),
    client_id: meeting.client_id,
    data: buildTemplate("meeting"),
    public_token: token.token,
    public_token_hash: token.hash,
  };
  let result = await supabase.from("whiteboards").insert({ ...row, meeting_id: meeting.id }).select("id").single();
  if (result.error && /meeting_id/i.test(result.error.message)) result = await supabase.from("whiteboards").insert(row).select("id").single();
  return result;
}

/**
 * Stores a file in the private client-files bucket and lists it on the customer's Files tab,
 * linked to the meeting when there is one (meeting_id falls away while migration 0033 is not applied).
 */
async function storeClientFile(supabase: UserClient, clientId: string, file: File, meetingId: string | null): Promise<string | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160) || "file";
  const path = `${clientId}/${crypto.randomUUID()}-${safeName}`;
  const upload = await supabase.storage.from("client-files").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (upload.error) return readableError(upload.error.message);
  const row: Record<string, unknown> = { client_id: clientId, file_name: file.name.slice(0, 200), storage_path: path, mime_type: file.type || null, size_bytes: file.size };
  let { error } = await supabase.from("client_files").insert(meetingId ? { ...row, meeting_id: meetingId } : row);
  if (error && meetingId && /meeting_id/i.test(error.message)) ({ error } = await supabase.from("client_files").insert(row));
  if (error) {
    await supabase.storage.from("client-files").remove([path]);
    return readableError(error.message);
  }
  return null;
}

/**
 * Start a meeting: creates it in progress so notes can be taken straight away.
 * The customer is optional (a general meeting can be filed under one later). `open` decides where to go next:
 * "board" opens a whiteboard for it, "page" opens the meeting page, anything else stays put (the client tab).
 */
export async function startMeetingAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const clientId = optionalField(formData, "client_id");
  if (clientId && !UUID.test(clientId)) return { error: "Choose a customer from the list." };
  const title = requiredText(formData, "title", "Meeting title", 160);
  if (typeof title !== "string") return title;
  const open = field(formData, "open");
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { data, error } = await auth.supabase
    .from("meetings")
    .insert({
      client_id: clientId,
      project_id: optionalField(formData, "project_id"),
      title,
      attendees: optionalField(formData, "attendees"),
      location: optionalField(formData, "location"),
      agenda: optionalField(formData, "agenda"),
      status: "in_progress",
    })
    .select("id")
    .single();
  if (error) return { error: fail(error.message) };
  revalidateClient(clientId, data.id);
  if (open === "board") {
    const board = await createMeetingBoard(auth.supabase, { id: data.id, title, client_id: clientId });
    if (board.error) return { error: `Meeting saved, but the whiteboard could not be created: ${fail(board.error.message)}` };
    revalidatePath("/app/whiteboard");
    redirect(`/app/whiteboard/${board.data.id}`);
  }
  if (open === "page") redirect(`/app/meetings/${data.id}`);
  return { success: "Meeting started. Take notes below." };
}

/** Opens the meeting's whiteboard, making one first if it has none (or `new` is set). */
export async function openMeetingBoardAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!UUID.test(id)) return { error: "Meeting is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const found = await auth.supabase.from("meetings").select("id, title, client_id").eq("id", id).maybeSingle();
  if (found.error) return { error: fail(found.error.message) };
  if (!found.data) return { error: "Meeting not found." };
  if (field(formData, "new") !== "1") {
    const existing = await auth.supabase.from("whiteboards").select("id").eq("meeting_id", id).order("updated_at", { ascending: false }).limit(1);
    if (existing.error) return { error: fail(existing.error.message) };
    if (existing.data?.[0]) redirect(`/app/whiteboard/${existing.data[0].id}`);
  }
  const board = await createMeetingBoard(auth.supabase, found.data);
  if (board.error) return { error: fail(board.error.message) };
  revalidateClient(found.data.client_id, id);
  revalidatePath("/app/whiteboard");
  redirect(`/app/whiteboard/${board.data.id}`);
}

/** Files a general meeting (and its whiteboards) under a customer. */
export async function assignMeetingClientAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  const clientId = field(formData, "client_id");
  if (!UUID.test(id)) return { error: "Meeting is missing." };
  if (!UUID.test(clientId)) return { error: "Choose a customer." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("meetings").update({ client_id: clientId }, { count: "exact" }).eq("id", id);
  if (error) return { error: fail(error.message) };
  const missing = notFoundWhenNoRows(count, "Meeting");
  if (missing) return missing;
  // Boards made for this meeting follow it (ignored before 0033, when boards have no meeting link).
  await auth.supabase.from("whiteboards").update({ client_id: clientId }).eq("meeting_id", id).is("client_id", null);
  revalidateClient(clientId, id);
  revalidatePath("/app/whiteboard");
  return { success: "Saved to the customer." };
}

/** Uploads a photo, scan or document from the meeting into the customer's files. */
export async function uploadMeetingFileAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "meeting_id");
  // The form has a file picker and a camera input under the same name; use whichever holds a file.
  const file = formData.getAll("file").find((entry) => entry instanceof File && entry.size > 0);
  if (!UUID.test(id)) return { error: "Meeting is missing." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > MAX_FILE_BYTES) return { error: "Files must be 10 MB or smaller." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const found = await auth.supabase.from("meetings").select("client_id").eq("id", id).maybeSingle();
  if (found.error) return { error: fail(found.error.message) };
  if (!found.data) return { error: "Meeting not found." };
  if (!found.data.client_id) return { error: "Save this meeting to a customer first, so the file has a home." };
  const problem = await storeClientFile(auth.supabase, found.data.client_id, file, id);
  if (problem) return { error: problem };
  revalidateClient(found.data.client_id, id);
  return { success: "Uploaded to the customer's files." };
}

/** The whiteboard's "Save to customer file": the exported PNG/PDF goes into the board's customer files. */
export async function saveBoardFileAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const boardId = field(formData, "board_id");
  const file = formData.get("file");
  if (!UUID.test(boardId)) return { ok: false, error: "Board not found." };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "The export was empty." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "The export is over 10 MB. Try PNG of one frame." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  let board = await auth.supabase.from("whiteboards").select("client_id, meeting_id").eq("id", boardId).maybeSingle();
  if (board.error && /meeting_id/i.test(board.error.message)) {
    board = (await auth.supabase.from("whiteboards").select("client_id").eq("id", boardId).maybeSingle()) as typeof board;
  }
  if (board.error) return { ok: false, error: fail(board.error.message) };
  if (!board.data) return { ok: false, error: "Board not found." };
  let clientId = board.data.client_id as string | null;
  const meetingId = (board.data as { meeting_id?: string | null }).meeting_id ?? null;
  if (!clientId && meetingId) {
    const meeting = await auth.supabase.from("meetings").select("client_id").eq("id", meetingId).maybeSingle();
    clientId = meeting.data?.client_id ?? null;
  }
  if (!clientId) return { ok: false, error: "This board is not linked to a customer yet." };
  const problem = await storeClientFile(auth.supabase, clientId, file, meetingId);
  if (problem) return { ok: false, error: problem };
  revalidateClient(clientId, meetingId);
  return { ok: true };
}

/** The whiteboard notepad's autosave: only the meeting's notes. */
export async function saveMeetingNotesAction(id: string, notes: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(id)) return { ok: false, error: "Meeting is missing." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { error, count } = await auth.supabase.from("meetings").update({ notes: String(notes ?? "").slice(0, 50_000) }, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: fail(error.message) };
  if (!count) return { ok: false, error: "Meeting not found." };
  return { ok: true };
}

/** A board with no meeting yet: start one (same customer, same name) and link the board, so the notepad has a home. */
export async function startBoardMeetingAction(boardId: string): Promise<{ ok: boolean; meeting?: { id: string; title: string; notes: string }; error?: string }> {
  if (!UUID.test(boardId)) return { ok: false, error: "Board not found." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const board = await auth.supabase.from("whiteboards").select("title, client_id").eq("id", boardId).maybeSingle();
  if (board.error) return { ok: false, error: fail(board.error.message) };
  if (!board.data) return { ok: false, error: "Board not found." };
  const title = String(board.data.title || "Meeting").slice(0, 160);
  const created = await auth.supabase
    .from("meetings")
    .insert({ client_id: board.data.client_id, title, status: "in_progress" })
    .select("id")
    .single();
  if (created.error) return { ok: false, error: fail(created.error.message) };
  const linked = await auth.supabase.from("whiteboards").update({ meeting_id: created.data.id }).eq("id", boardId);
  if (linked.error) {
    await auth.supabase.from("meetings").delete().eq("id", created.data.id);
    return { ok: false, error: fail(linked.error.message) };
  }
  revalidateClient(board.data.client_id, created.data.id);
  return { ok: true, meeting: { id: created.data.id, title, notes: "" } };
}

export type SaveMeetingInput = {
  id: string;
  title?: string;
  notes: string;
  decisions: string;
  attendees: string;
  agenda: string;
  actionItems: ActionItem[];
  /** Left out when the database has no questions column yet (before 0033). */
  questions?: MeetingQuestion[];
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
  if (Array.isArray(input.questions)) patch.questions = cleanQuestions(input.questions);
  let { error, count } = await auth.supabase.from("meetings").update(patch, { count: "exact" }).eq("id", input.id);
  if (error && "questions" in patch && /questions/i.test(error.message)) {
    // Database is behind (no 0033): keep the notes, drop the questions.
    delete patch.questions;
    ({ error, count } = await auth.supabase.from("meetings").update(patch, { count: "exact" }).eq("id", input.id));
  }
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
  revalidateClient(data.client_id, id);
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
  revalidateClient(meeting.client_id, id);
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
  if (field(formData, "after") === "list") redirect("/app/meetings");
  return { success: "Meeting deleted." };
}
