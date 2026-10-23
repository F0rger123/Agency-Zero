"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserClient } from "@/lib/actions";
import { field, isMissingTable, optionalField, readableError, requiredText, type ActionState } from "@/lib/forms";
import { createPublicToken } from "@/lib/public-tokens";
import { parseBoard } from "@/lib/whiteboard/ops";
import { defaultBoard } from "@/lib/whiteboard/template";

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_BYTES = 3_000_000;

function friendly(message: string): string {
  return isMissingTable(message) ? "Whiteboards need database update 0032. Apply it in the Supabase SQL editor." : readableError(message);
}

/** New board with the four-frame meeting template, then straight into it. */
export async function createWhiteboardAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const title = requiredText(formData, "title", "Board name", 200);
  if (typeof title !== "string") return title;
  const clientId = optionalField(formData, "client_id");
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const token = createPublicToken();
  const { data, error } = await auth.supabase
    .from("whiteboards")
    .insert({ title, client_id: clientId && UUID.test(clientId) ? clientId : null, data: defaultBoard(), public_token: token.token, public_token_hash: token.hash })
    .select("id")
    .single();
  if (error) return { error: friendly(error.message) };
  revalidatePath("/app/whiteboard");
  redirect(`/app/whiteboard/${data.id}`);
}

/** The owner's device saves the whole board here, shortly after every change. */
export async function saveWhiteboardAction(id: string, json: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(id)) return { ok: false, error: "Board not found." };
  if (typeof json !== "string" || json.length > MAX_BYTES) return { ok: false, error: "This board is too big to save. Clear some drawings." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "The board could not be read." };
  }
  const board = parseBoard(parsed);
  if (!board) return { ok: false, error: "The board could not be read." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { error, count } = await auth.supabase.from("whiteboards").update({ data: board }, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  if (!count) return { ok: false, error: "This board was deleted." };
  return { ok: true };
}

export async function renameWhiteboardAction(id: string, title: string): Promise<{ ok: boolean; error?: string }> {
  const clean = String(title ?? "").trim().slice(0, 200);
  if (!UUID.test(id) || !clean) return { ok: false, error: "Give the board a name." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { error } = await auth.supabase.from("whiteboards").update({ title: clean }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/app/whiteboard");
  return { ok: true };
}

export async function setWhiteboardShareAction(id: string, mode: string): Promise<{ ok: boolean; error?: string }> {
  if (!UUID.test(id) || !["edit", "view", "off"].includes(mode)) return { ok: false, error: "Choose a sharing option." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { error } = await auth.supabase.from("whiteboards").update({ share_mode: mode }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

/** A new link; the old one stops working. */
export async function regenerateWhiteboardLinkAction(id: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  if (!UUID.test(id)) return { ok: false, error: "Board not found." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const token = createPublicToken();
  const { error } = await auth.supabase.from("whiteboards").update({ public_token: token.token, public_token_hash: token.hash }).eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true, token: token.token };
}

export async function deleteWhiteboardAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "id");
  if (!UUID.test(id)) return { error: "Board not found." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error } = await auth.supabase.from("whiteboards").delete().eq("id", id);
  if (error) return { error: friendly(error.message) };
  revalidatePath("/app/whiteboard");
  return { success: "Board deleted." };
}
