"use server";

import { revalidatePath } from "next/cache";
import { getUserClient } from "@/lib/actions";
import { readableError } from "@/lib/forms";

export type LockInOptions = {
  tasks: { id: string; title: string; client: string | null }[];
  projects: { id: string; name: string; client: string | null }[];
  error?: string;
};

type Named = { name: string } | { name: string }[] | null;
const nameOf = (value: Named) => (Array.isArray(value) ? value[0]?.name : value?.name) ?? null;

/** Open tasks and active projects the owner can pull into a session. Read only. */
export async function getLockInOptionsAction(): Promise<LockInOptions> {
  const auth = await getUserClient();
  if ("error" in auth) return { tasks: [], projects: [], error: auth.error };
  const [tasks, projects] = await Promise.all([
    auth.supabase
      .from("tasks")
      .select("id, title, clients(name)")
      .not("status", "in", "(done,cancelled)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(60),
    auth.supabase
      .from("projects")
      .select("id, name, clients(name)")
      .is("deleted_at", null)
      .in("status", ["planning", "active"])
      .order("name")
      .limit(60),
  ]);
  if (tasks.error) return { tasks: [], projects: [], error: readableError(tasks.error.message) };
  return {
    tasks: ((tasks.data ?? []) as unknown as { id: string; title: string; clients: Named }[]).map((row) => ({ id: row.id, title: row.title, client: nameOf(row.clients) })),
    projects: projects.error
      ? []
      : ((projects.data ?? []) as unknown as { id: string; name: string; clients: Named }[]).map((row) => ({ id: row.id, name: row.name, client: nameOf(row.clients) })),
  };
}

/** After a session, mark the tasks the owner ticked as done. Called only from an explicit button. */
export async function completeLockInTasksAction(ids: string[]): Promise<{ error?: string; success?: string }> {
  const clean = Array.from(new Set(ids.filter((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))).slice(0, 100);
  if (clean.length === 0) return { error: "No tasks to complete." };
  const auth = await getUserClient();
  if ("error" in auth) return auth;
  const { error, count } = await auth.supabase.from("tasks").update({ status: "done" }, { count: "exact" }).in("id", clean);
  if (error) return { error: readableError(error.message) };
  revalidatePath("/app/tasks");
  revalidatePath("/app");
  return { success: `${count ?? clean.length} task${(count ?? clean.length) === 1 ? "" : "s"} marked done.` };
}

export type SavedSession = {
  id: string;
  startedAt: number;
  endedAt: number | null;
  elapsedMs: number;
  goalMs: number;
  status: "running" | "paused" | "done";
  done: number;
  total: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Saves a session (migration 0029). The browser makes the id, so this is an upsert and is safe to repeat: it runs on every
 * change, every 30 seconds while a session runs, and when it ends. `missing` means the table is not there yet, so the
 * session simply stays on this device.
 */
export async function saveLockInSessionAction(record: {
  id: string;
  startedAt: number;
  endedAt: number | null;
  elapsedMs: number;
  goalMs: number;
  status: string;
  items: unknown;
  notes: string;
}): Promise<{ ok: boolean; missing?: boolean; error?: string }> {
  if (!record || !UUID.test(String(record.id))) return { ok: false, error: "Bad session id." };
  if (!["running", "paused", "done"].includes(record.status)) return { ok: false, error: "Bad status." };
  const auth = await getUserClient();
  if ("error" in auth) return { ok: false, error: auth.error };
  const items = (Array.isArray(record.items) ? record.items : []).slice(0, 100).map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return { id: String(row.id ?? "").slice(0, 64), text: String(row.text ?? "").slice(0, 300), done: Boolean(row.done), kind: String(row.kind ?? "custom"), ...(row.refId ? { refId: String(row.refId) } : {}) };
  });
  const { error } = await auth.supabase.from("lock_in_sessions").upsert(
    {
      id: record.id,
      started_at: new Date(Number(record.startedAt)).toISOString(),
      ended_at: record.endedAt ? new Date(Number(record.endedAt)).toISOString() : null,
      elapsed_seconds: Math.max(0, Math.round(Number(record.elapsedMs) / 1000)),
      goal_seconds: Number(record.goalMs) > 0 ? Math.round(Number(record.goalMs) / 1000) : null,
      status: record.status,
      items,
      notes: String(record.notes ?? "").slice(0, 5000),
    },
    { onConflict: "id" },
  );
  if (!error) return { ok: true };
  if (/lock_in_sessions|schema cache|does not exist/i.test(error.message)) return { ok: false, missing: true };
  return { ok: false, error: readableError(error.message) };
}

/** The most recent sessions, newest first. Returns null when the table does not exist yet. */
export async function listLockInSessionsAction(): Promise<SavedSession[] | null> {
  const auth = await getUserClient();
  if ("error" in auth) return null;
  const { data, error } = await auth.supabase
    .from("lock_in_sessions")
    .select("id, started_at, ended_at, elapsed_seconds, goal_seconds, status, items")
    .order("started_at", { ascending: false })
    .limit(15);
  if (error) return null;
  return ((data ?? []) as { id: string; started_at: string; ended_at: string | null; elapsed_seconds: number; goal_seconds: number | null; status: SavedSession["status"]; items: { done?: boolean }[] }[]).map((row) => ({
    id: row.id,
    startedAt: new Date(row.started_at).getTime(),
    endedAt: row.ended_at ? new Date(row.ended_at).getTime() : null,
    elapsedMs: row.elapsed_seconds * 1000,
    goalMs: (row.goal_seconds ?? 0) * 1000,
    status: row.status,
    done: Array.isArray(row.items) ? row.items.filter((item) => item?.done).length : 0,
    total: Array.isArray(row.items) ? row.items.length : 0,
  }));
}

