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
