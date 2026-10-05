import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { todayIso } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { needsShootsMigration } from "@/lib/shoots";
import { ShootsView, type ShootsOverview } from "./shoots-view";

export const metadata: Metadata = { title: "Content shoots" };

/** Every client's upcoming content shoots and recurring schedules (migration 0024). Client workspaces show the same view per client. */
export default async function ShootsPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_shoots_overview", { p_client_id: null, p_today: todayIso() });
  if (error) {
    if (needsShootsMigration(error.message)) return <MigrationsRequired detail="Content shoots need migration 0024." />;
    return <DataFailure title="Content shoots" message={error.message} />;
  }
  return (
    <>
      <PageHeader
        title="Content shoots"
        description="Recurring shoot schedules for content clients, the dated shoots they plan, and a checklist for each. Open a client to manage just their shoots."
      />
      <ShootsView data={data as ShootsOverview} />
    </>
  );
}
