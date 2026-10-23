import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isClockSkewError, retryOnClockSkew } from "@/lib/supabase/retry";
import { isMissingTable } from "@/lib/forms";
import { todayIso } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { HomeWidgets } from "./home-widgets";
import { Panel } from "./home-panels";
import { KpiGrid, RevenueCards, type RevenueSummary, type DashboardSummary } from "./dashboard-widgets";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Dashboard — ONE authenticated read.
 *
 * Before this rewrite the page issued eleven PostgREST requests per render
 * (four `count=exact` aggregates plus seven embedded selects) and threw on any
 * non-"missing table" failure, which replaced the whole page with the generic
 * error boundary ("Something went wrong … check that Supabase is reachable and
 * migrations are applied").
 *
 * Now the page makes a single call to `public.get_dashboard_summary(p_today)`
 * (migration 0011), which aggregates everything server-side in Postgres:
 * tasks due today, overdue tasks, open tasks, active projects, clients,
 * waiting-on-client tasks, upcoming deadlines, recent activity, and the
 * recurring revenue block (MRR, ARR, counts, breakdown).
 *
 * No `force-dynamic`: reading the auth cookie through `createClient()` already
 * makes this route dynamic, and the sidebar's prefetch + router cache
 * (`staleTimes.dynamic`) keep repeat navigations instant. Server actions
 * revalidate `/` after every mutation.
 *
 * Errors are NOT hidden: a missing function or table renders the migrations
 * state, and any other database error is shown with its exact message.
 */
export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupRequired />;

  const supabase = await createClient();
  const today = todayIso();
  // Two cheap aggregates in parallel. Revenue is a separate read model so a
  // missing migration 0018 degrades only the revenue cards, never the dashboard.
  const [{ data, error }, revenueResponse, leadsResponse] = await Promise.all([
    retryOnClockSkew(() => supabase.rpc("get_dashboard_summary", { p_today: today })),
    retryOnClockSkew(() => supabase.rpc("get_revenue_summary", { p_today: today })),
    // New website inquiries (migration 0019). Errors (e.g. not applied yet) just hide the count.
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const newLeads = leadsResponse.error ? 0 : (leadsResponse.count ?? 0);
  const revenue = revenueResponse.error ? null : (revenueResponse.data as RevenueSummary | null);

  const header = (
    <PageHeader
      title="Home"
      description="Pick where to work. Everything for a client lives inside that client."
    />
  );

  if (error) {
    if (isMissingTable(error.message)) {
      return (
        <>
          {header}
          <MigrationsRequired detail={error.message} />
        </>
      );
    }
    return (
      <>
        {header}
        <DataFailure
          title="Dashboard summary"
          message={error.message}
          hint={
            isClockSkewError(error.message)
              ? "The database clock and your sign-in token are out of step by a few seconds. This normally clears by itself: reload in a minute. If it keeps happening, sign out and back in, and check your device clock is set automatically."
              : "The dashboard is one database read: public.get_dashboard_summary(p_today). The exact error is below, so it can be fixed rather than guessed at."
          }
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        {header}
        <DataFailure
          title="Dashboard summary"
          message="public.get_dashboard_summary(p_today) returned no payload."
        />
      </>
    );
  }

  const summary = data as DashboardSummary;

  return (
    <>
      {header}
      <RevenueCards revenue={revenue} mrrCents={summary.recurring.mrr_cents} currency={summary.currency} />

      <div className="mt-10">
        <HomeWidgets
          counts={{
            "/app/clients": { value: summary.clients, label: summary.clients === 1 ? "customer" : "customers" },
            "/app/projects": { value: summary.active_projects, label: "active" },
            "/app/tasks": { value: summary.tasks_open, label: summary.tasks_overdue > 0 ? `open · ${summary.tasks_overdue} overdue` : "open" },
            ...(newLeads > 0 ? { "/app/leads": { value: newLeads, label: "new" } } : {}),
          }}
        />
      </div>

      <div className="mt-12">
        <Panel>
          <KpiGrid summary={summary} />
        </Panel>
      </div>
    </>
  );
}
