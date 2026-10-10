import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isClockSkewError, retryOnClockSkew } from "@/lib/supabase/retry";
import { isMissingTable } from "@/lib/forms";
import { todayIso } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { DataFailure, MigrationsRequired, SetupRequired } from "@/components/states";
import { HomeWidgets } from "./home-widgets";
import { AgendaPanel, InvoicesPanel, Panel, RemindersPanel, ResponsesPanel, type AgendaEvent, type InvoiceRow, type ReminderRow, type ResponseRow } from "./home-panels";
import {
  DeliveryPanel,
  type UpcomingShoot,
  KpiGrid,
  RevenueCards,
  type RevenueSummary,
  RecentActivity,
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
  const nowIso = new Date().toISOString();
  const since = new Date(new Date().getTime() - 14 * 86400000).toISOString();
  const [{ data, error }, revenueResponse, leadsResponse, shootsResponse, eventsResponse, remindersResponse, unpaidResponse, quotesAnsweredResponse, contractsSignedResponse, bugsResponse] = await Promise.all([
    retryOnClockSkew(() => supabase.rpc("get_dashboard_summary", { p_today: today })),
    retryOnClockSkew(() => supabase.rpc("get_revenue_summary", { p_today: today })),
    // New website inquiries (migration 0019). Errors (e.g. not applied yet) just hide the strip.
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    // Next content shoots (0024) and open bugs (0023): optional panels that simply hide on a database that is behind.
    supabase
      .from("shoots")
      .select("id, title, shoot_date, start_time, location, status, clients(name)")
      .gte("shoot_date", today)
      .in("status", ["planned", "confirmed"])
      .order("shoot_date")
      .order("start_time", { nullsFirst: false })
      .limit(5),
    supabase.from("calendar_events").select("id, title, type, starts_at").gte("starts_at", nowIso).order("starts_at").limit(5),
    supabase.from("reminders").select("id, message, due_at").eq("done", false).order("due_at").limit(5),
    supabase
      .from("invoices")
      .select("id, number, title, due_on, balance_cents, currency, clients(name)")
      .in("status", ["sent", "partially_paid", "overdue"])
      .order("due_on")
      .limit(5),
    supabase
      .from("quotes")
      .select("id, title, status, accepted_at, rejected_at, clients(name)")
      .or(`accepted_at.gte.${since},rejected_at.gte.${since}`)
      .limit(10),
    supabase
      .from("contracts")
      .select("id, title, signed_at, clients(name)")
      .gte("signed_at", since)
      .limit(10),
    supabase.from("tasks").select("severity").eq("kind", "bug").not("status", "in", "(done,cancelled)").limit(500),
  ]);
  const upcomingShoots = (shootsResponse.error ? null : (shootsResponse.data ?? [])) as unknown as UpcomingShoot[] | null;
  const openBugs = bugsResponse.error ? null : (bugsResponse.data ?? []) as { severity: string | null }[];
  const events = (eventsResponse.error ? null : (eventsResponse.data ?? [])) as AgendaEvent[] | null;
  const reminders = (remindersResponse.error ? null : (remindersResponse.data ?? [])) as ReminderRow[] | null;
  const unpaid = (unpaidResponse.error ? null : (unpaidResponse.data ?? [])) as unknown as InvoiceRow[] | null;
  const clientName = (value: unknown) => ((Array.isArray(value) ? value[0] : value) as { name?: string } | null)?.name ?? null;
  const responses: ResponseRow[] | null =
    quotesAnsweredResponse.error || contractsSignedResponse.error
      ? null
      : [
          ...((quotesAnsweredResponse.data ?? []) as unknown as { id: string; title: string; accepted_at: string | null; rejected_at: string | null; clients: unknown }[]).map((quote): ResponseRow => ({
            id: `q-${quote.id}`,
            kind: "quote",
            title: quote.title,
            client: clientName(quote.clients),
            outcome: quote.accepted_at ? "accepted" : "declined",
            at: (quote.accepted_at ?? quote.rejected_at) as string,
            href: `/app/quotes/${quote.id}`,
          })),
          ...((contractsSignedResponse.data ?? []) as unknown as { id: string; title: string; signed_at: string; clients: unknown }[]).map((contract): ResponseRow => ({
            id: `c-${contract.id}`,
            kind: "contract",
            title: contract.title,
            client: clientName(contract.clients),
            outcome: "signed",
            at: contract.signed_at,
            href: `/app/contracts/${contract.id}`,
          })),
        ]
          .sort((a, b) => (a.at < b.at ? 1 : -1))
          .slice(0, 6);
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

      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        <Panel className="lg:col-span-2">
          <KpiGrid summary={summary} />
        </Panel>
        <ResponsesPanel rows={responses} />
        <AgendaPanel events={events} />
        <RemindersPanel reminders={reminders} now={nowIso} />
        <Panel>
          <UpcomingDeadlines summary={summary} />
        </Panel>
        <Panel>
          <WaitingOnClient summary={summary} />
        </Panel>
        <InvoicesPanel invoices={unpaid} today={today} />
        {upcomingShoots !== null || openBugs !== null ? (
          <Panel>
            <DeliveryPanel
              shoots={upcomingShoots}
              openBugs={openBugs ? openBugs.length : null}
              criticalBugs={openBugs ? openBugs.filter((bug) => bug.severity === "critical").length : 0}
            />
          </Panel>
        ) : null}
        <Panel className="lg:col-span-2">
          <RecentActivity summary={summary} />
        </Panel>
      </div>
    </>
  );
}
