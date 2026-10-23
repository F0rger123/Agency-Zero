import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import type { Todo } from "./actions";
import { TodoList } from "./todo-list";

export const metadata: Metadata = { title: "To-do" };

/** A plain list for things that are not tied to a client or project. Also reachable from inside Lock In. */
export default async function TodosPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("id, text, done, created_at, done_at")
    .order("done")
    .order("created_at", { ascending: false })
    .limit(300);

  const header = <PageHeader title="To-do" description="Quick things that are not tied to a client. Type or talk, press Enter, tick it off." />;
  if (error) {
    return (
      <>
        {header}
        {isMissingTable(error.message) ? (
          <MigrationsRequired detail="The to-do list needs database update 0031." />
        ) : (
          <DataFailure title="To-do list" message={error.message} hint="The list is the public.todos table (migration 0031)." />
        )}
      </>
    );
  }
  return (
    <>
      {header}
      <TodoList initial={(data ?? []) as Todo[]} />
    </>
  );
}
