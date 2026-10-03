import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isMissingTable } from "@/lib/forms";
import { todayIso } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import {
  KpiGrid,
  RevenueCards,
  type RevenueSummary,
  RecentActivity,
  RecurringRevenue,
  UpcomingDeadlines,
  WaitingOnClient,
  type DashboardSummary,
} from "./dashboard-widgets";

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
    supabase.rpc("get_dashboard_summary", { p_today: today }),
    supabase.rpc("get_revenue_summary", { p_today: today }),
    // New website inquiries (migration 0019). Errors (e.g. not applied yet) just hide the strip.
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const newLeads = leadsResponse.error ? 0 : (leadsResponse.count ?? 0);
  const revenue = revenueResponse.error ? null : (revenueResponse.data as RevenueSummary | null);
  if (revenueResponse.error && !isMissingTable(revenueResponse.error.message) && !revenueResponse.error.message.includes("Could not find the function")) {
    throw new Error(revenueResponse.error.message);
  }

  const header = (
    <PageHeader
      title="Dashboard"
      description="The day’s work, upcoming deadlines, active delivery, and recurring revenue — all live from your database in a single query."
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
          hint="The dashboard is one database read: public.get_dashboard_summary(p_today). The exact error is below, so it can be fixed rather than guessed at."
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
      {newLeads > 0 ? (
        <Link
          href="/app/leads"
          className="mb-10 flex items-center justify-between border border-border px-5 py-4 text-sm transition-colors hover:bg-muted"
        >
          <span>
            <span className="font-medium">{newLeads} new website {newLeads === 1 ? "lead" : "leads"}</span>
            <span className="text-muted-foreground"> waiting for a reply</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      ) : null}
      <RevenueCards revenue={revenue} mrrCents={summary.recurring.mrr_cents} currency={summary.currency} />

      <div className="mt-14">
        <KpiGrid summary={summary} />
      </div>

      <RecurringRevenue summary={summary} />

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <UpcomingDeadlines summary={summary} />
        <WaitingOnClient summary={summary} />
      </div>

      <RecentActivity summary={summary} />
    </>
  );
}
