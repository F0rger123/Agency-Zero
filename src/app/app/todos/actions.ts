"use server";

import { revalidatePath } from "next/cache";
import { getUserClient } from "@/lib/actions";
import { isMissingTable, readableError, type ActionState } from "@/lib/forms";

export type Todo = { id: string; text: string; done: boolean; created_at: string; done_at: string | null };
export type TodoResult<T = object> = ({ error?: string; missing?: boolean } & T);

const UUID = /^[0-9a-f-]{36}$/i;
const COLUMNS = "id, text, done, created_at, done_at";

function problem(message: string): { error: string; missing: boolean } {
  return {
    error: isMissingTable(message) ? "The to-do list needs database update 0031. Apply it in the Supabase SQL editor." : readableError(message),
    missing: isMissingTable(message),
  };
}

/** Open items (newest first) and the most recently finished ones. */
export async function listTodosAction(): Promise<TodoResult<{ todos: Todo[] }>> {
  const auth = await getUserClient();
  if ("error" in auth) return { todos: [], error: auth.error };
  const { data, error } = await auth.supabase.from("todos").select(COLUMNS).order("done").order("created_at", { ascending: false }).limit(300);
  if (error) return { todos: [], ...problem(error.message) };
  return { todos: (data ?? []) as Todo[] };
}

/** Adds one item per line (voice typing separates items with "new line"). */
export async function addTodosAction(text: string): Promise<TodoResult<{ todos: Todo[] }>> {
  const lines = String(text ?? "")
    .split(/\n+/)
    .map((line) => line.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 20);
  if (lines.length === 0) return { todos: [], error: "Type something to add." };
  const auth = await getUserClient();
  if ("error" in auth) return { todos: [], error: auth.error };
  const { data, error } = await auth.supabase.from("todos").insert(lines.map((line) => ({ text: line }))).select(COLUMNS);
  if (error) return { todos: [], ...problem(error.message) };
  revalidatePath("/app/todos");
  return { todos: ((data ?? []) as Todo[]).reverse() };
}

export async function setTodoDoneAction(id: string, done: boolean): Promise<TodoResult> {
  if (!UUID.test(id)) return { error: "To-do not found." };
  const auth = await getUserClient();
  if ("error" in auth) return { error: auth.error };
  const { error, count } = await auth.supabase
    .from("todos")
    .update({ done, done_at: done ? new Date().toISOString() : null }, { count: "exact" })
    .eq("id", id);
  if (error) return problem(error.message);
  if (!count) return { error: "That item was already removed." };
  revalidatePath("/app/todos");
  return {};
}

export async function deleteTodoAction(id: string): Promise<TodoResult> {
  if (!UUID.test(id)) return { error: "To-do not found." };
  const auth = await getUserClient();
  if ("error" in auth) return { error: auth.error };
  const { error } = await auth.supabase.from("todos").delete().eq("id", id);
  if (error) return problem(error.message);
  revalidatePath("/app/todos");
  return {};
}

/** "Clear done": the only way finished items are removed. Form-shaped so ConfirmDelete can run it. */
export async function clearDoneTodosAction(_previous: ActionState, _formData: FormData): Promise<ActionState> {
  void _formData;
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("todos").delete({ count: "exact" }).eq("done", true);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/todos");
  return { success: `Cleared ${count ?? 0} done ${count === 1 ? "item" : "items"}.` };
}
