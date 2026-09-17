import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { MigrationsRequired, SetupRequired } from "@/components/states";

export const metadata: Metadata = { title: "Dashboard" };

// Live database reads — always render per request, never prerender.
export const dynamic = "force-dynamic";

/**
 * Dashboard shell — Phase 1 (BUILD_PROGRESS.md).
 * Queries real counts from the database; every state is honest:
 * zeros while empty, a setup state if migrations are missing,
 * and the error boundary if the backend is unreachable.
 */

type CountResult = {
  data: unknown;
  count: number | null;
  error: { message: string } | null;
};

function isMissingTable(message: string): boolean {
  return message.includes("does not exist") || message.includes("schema cache");
}

/** Resolves to the row count, or null when the table itself is missing. */
async function safeCount(query: PromiseLike<CountResult>): Promise<number | null> {
  const { count, error } = await query;
  if (error) {
    if (isMissingTable(error.message)) return null; // migrations not applied
    throw new Error(error.message);
  }
  return count ?? 0;
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const supabase = await createClient();

  const openStatuses = "todo,in_progress,blocked_waiting_client,blocked_other";
  const today = new Date().toISOString().slice(0, 10);

  const [clients, activeProjects, openTasks, overdueTasks] = await Promise.all([
    safeCount(
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
    ),
    safeCount(
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .is("deleted_at", null)
    ),
    safeCount(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", openStatuses.split(","))
    ),
    safeCount(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .lt("due_date", today)
        .in("status", openStatuses.split(","))
    ),
  ]);

  const schemaMissing =
    clients === null || activeProjects === null || openTasks === null || overdueTasks === null;

  const stats = [
    { label: "Clients", value: clients ?? 0 },
    { label: "Active projects", value: activeProjects ?? 0 },
    { label: "Open tasks", value: openTasks ?? 0 },
    { label: "Overdue tasks", value: overdueTasks ?? 0 },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your agency at a glance. Counts are live from the database — they stay at zero until you add data."
      />

      {schemaMissing ? (
        <MigrationsRequired />
      ) : (
        <>
          <ul
            aria-label="Key numbers"
            className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4"
          >
            {stats.map((s) => (
              <li key={s.label} className="bg-background p-6">
                <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </li>
            ))}
          </ul>

          <section className="mt-14">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              System status
            </h2>
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {[
                ["Owner authentication (Supabase Auth)", "Live"],
                ["Monochrome design system", "Live"],
                ["App shell, navigation, states", "Live"],
                ["Database schema + RLS (profiles, settings, clients, projects, tasks)", "Live"],
                ["Clients & contacts", "Phase 2"],
                ["Projects & tasks interfaces", "Phase 3"],
                ["Workload, calendar & reminders", "Phase 4"],
                ["Quotes, contracts, invoices & payments", "Phase 5"],
                ["AI assistant v1", "Phase 6"],
                ["Social media pipeline", "Phase 7"],
                ["Profitability & reporting", "Phase 8"],
                ["Client portal, integrations & marketing AI", "Later phases"],
              ].map(([label, status]) => (
                <li key={label} className="flex items-baseline justify-between gap-6 py-3">
                  <span className="text-sm">{label}</span>
                  <span
                    className={`shrink-0 text-[11px] font-medium uppercase tracking-widest ${
                      status === "Live" ? "text-foreground" : "text-faint-foreground"
                    }`}
                  >
                    {status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-14">
            <EmptyState
              tag="Next up"
              title="Phase 2 — Clients & contacts"
            >
              <p>
                The database tables are ready. The working client records — contacts,
                notes, files, communication history, services, and status — arrive in
                Phase 2 of the roadmap (see docs/BUILD_PROGRESS.md).
              </p>
            </EmptyState>
          </div>
        </>
      )}
    </>
  );
}
