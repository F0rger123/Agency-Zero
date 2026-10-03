import Link from "next/link";
import { crmHref } from "@/lib/routes";
import { moneyLabel, billingIntervalLabel } from "@/lib/format";

/**
 * Dashboard presentation pieces built from ONE payload
 * (`public.get_dashboard_summary`, migration 0011). No widget queries the
 * database itself — that keeps the dashboard a single round trip and makes
 * every section, including the empty ones, render from the same snapshot.
 */

export type DashboardDeadline = {
  id: string;
  kind: string;
  name: string;
  date: string;
  context: string;
  href: string;
};

export type DashboardActivity = {
  id: string;
  label: string;
  context: string;
  occurred_at: string;
  href: string;
};

export type DashboardWaitingTask = {
  id: string;
  title: string;
  due_date: string | null;
  client_id: string | null;
  client_name: string | null;
  project_id: string | null;
  project_name: string | null;
  href: string;
};

export type RecurringBreakdownRow = {
  id: string;
  name: string;
  clients: number;
  assignments: number;
  mrr_cents: number;
  intervals: string[];
  service_active: boolean;
  href: string;
};

export type DashboardSummary = {
  generated_on: string;
  currency: string;
  tasks_due_today: number;
  tasks_overdue: number;
  tasks_open: number;
  active_projects: number;
  clients: number;
  active_clients: number;
  waiting_on_client: number;
  waiting_tasks: DashboardWaitingTask[];
  upcoming_deadlines: DashboardDeadline[];
  recent_activity: DashboardActivity[];
  recurring: {
    mrr_cents: number;
    arr_cents: number;
    recurring_client_count: number;
    recurring_service_count: number;
    breakdown: RecurringBreakdownRow[];
  };
};

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="bg-background p-6">
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {note ? <p className="mt-1 text-xs text-faint-foreground">{note}</p> : null}
    </div>
  );
}

export type RevenueSummary = {
  total_revenue_cents: number;
  revenue_this_month_cents: number;
  outstanding_cents: number;
  mixed_currency: boolean;
  currency: string;
};

/**
 * Revenue = money actually received (non-voided payments), never quoted value
 * or unpaid invoices. Source: `public.get_revenue_summary()` (migration 0018).
 * `revenue === null` means the migration is not applied yet — say so honestly.
 */
export function RevenueCards({ revenue, mrrCents, currency }: { revenue: RevenueSummary | null; mrrCents: number; currency: string }) {
  return (
    <section aria-labelledby="revenue-heading">
      <h2 id="revenue-heading" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Revenue
      </h2>
      {revenue ? (
        <>
          <ul className="mt-4 grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
            <li className="col-span-2 lg:col-span-1">
              <div className="bg-background p-6">
                <p className="text-4xl font-semibold tracking-tight">
                  {moneyLabel(revenue.total_revenue_cents, revenue.currency)}
                </p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-foreground">Total revenue</p>
                <p className="mt-1 text-xs text-faint-foreground">All payments received</p>
              </div>
            </li>
            <li>
              <Stat
                label="Revenue this month"
                value={moneyLabel(revenue.revenue_this_month_cents, revenue.currency)}
              />
            </li>
            <li>
              <Stat label="Monthly recurring" value={moneyLabel(mrrCents, currency)} />
            </li>
            <li>
              <Stat label="Outstanding" value={moneyLabel(revenue.outstanding_cents, revenue.currency)} note="Issued, unpaid" />
            </li>
          </ul>
          {revenue.mixed_currency ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Payments exist in more than one currency; the totals above add raw amounts and are not converted.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 border-y border-border py-6 text-sm text-muted-foreground">
          Total revenue needs database migration <code className="font-mono text-foreground">0018</code>. Apply it and reload.
        </p>
      )}
    </section>
  );
}

export function KpiGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <ul
      aria-label="Key numbers"
      className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3"
    >
      <li>
        <Stat label="Tasks due today" value={summary.tasks_due_today} />
      </li>
      <li>
        <Stat
          label="Overdue tasks"
          value={summary.tasks_overdue}
          note={summary.tasks_overdue > 0 ? "Needs attention" : undefined}
        />
      </li>
      <li>
        <Stat label="Waiting on client" value={summary.waiting_on_client} />
      </li>
      <li>
        <Stat
          label="Active projects"
          value={summary.active_projects}
          note={`${summary.tasks_open} open tasks`}
        />
      </li>
      <li>
        <Stat
          label="Clients"
          value={summary.clients}
          note={`${summary.active_clients} active`}
        />
      </li>
      <li>
        <Stat
          label="Monthly recurring"
          value={moneyLabel(summary.recurring.mrr_cents, summary.currency)}
          note={`${moneyLabel(summary.recurring.arr_cents, summary.currency)} ARR`}
        />
      </li>
    </ul>
  );
}

export function RecurringRevenue({ summary }: { summary: DashboardSummary }) {
  const { recurring, currency } = summary;

  return (
    <section aria-labelledby="recurring-heading" className="mt-14">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2
          id="recurring-heading"
          className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          Recurring revenue
        </h2>
        <div className="flex gap-4 text-xs">
          <Link href="/app/clients?billing=recurring" className="underline decoration-border underline-offset-4">
            Recurring clients
          </Link>
          <Link href="/app/services" className="underline decoration-border underline-offset-4">
            Services
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        <div className="bg-background p-6">
          <p className="text-3xl font-semibold tracking-tight">
            {moneyLabel(recurring.mrr_cents, currency)}
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            MRR
          </p>
        </div>
        <div className="bg-background p-6">
          <p className="text-3xl font-semibold tracking-tight">
            {moneyLabel(recurring.arr_cents, currency)}
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            ARR
          </p>
        </div>
        <div className="bg-background p-6">
          <p className="text-3xl font-semibold tracking-tight">
            {recurring.recurring_client_count}
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Recurring clients
          </p>
        </div>
        <div className="bg-background p-6">
          <p className="text-3xl font-semibold tracking-tight">
            {recurring.recurring_service_count}
          </p>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Recurring services
          </p>
        </div>
      </div>

      {recurring.breakdown.length === 0 ? (
        <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">
          No recurring revenue yet. Assign a recurring service to a client, or add
          one to the catalogue in <Link href="/app/services" className="underline decoration-border underline-offset-4">Services</Link>.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto border-y border-border">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Service</th>
                <th className="px-3 py-3 font-medium">Clients</th>
                <th className="px-3 py-3 font-medium">Billed</th>
                <th className="px-3 py-3 font-medium">MRR</th>
                <th className="px-3 py-3 font-medium">ARR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recurring.breakdown.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-4 font-medium">
                    <Link href={crmHref(row.href)} className="underline decoration-border underline-offset-4">
                      {row.name}
                    </Link>
                    {row.service_active ? null : (
                      <span className="ml-2 text-[11px] uppercase tracking-widest text-faint-foreground">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{row.clients}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {row.intervals.map((interval) => billingIntervalLabel(interval)).join(" · ")}
                  </td>
                  <td className="px-3 py-4">{moneyLabel(row.mrr_cents, currency)}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {moneyLabel(row.mrr_cents * 12, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        MRR normalises every recurring service to a monthly figure — quarterly
        amounts divide by three, yearly by twelve. Archived clients are excluded.
      </p>
    </section>
  );
}

export function UpcomingDeadlines({ summary }: { summary: DashboardSummary }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Upcoming deadlines
        </h2>
        <Link href="/app/projects" className="text-xs underline decoration-border underline-offset-4">
          All projects
        </Link>
      </div>
      {summary.upcoming_deadlines.length === 0 ? (
        <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">
          No project or milestone deadlines in the next 30 days.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {summary.upcoming_deadlines.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link
                  href={crmHref(item.href)}
                  className="font-medium underline decoration-border underline-offset-4"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
                  new Date(`${item.date}T00:00:00Z`)
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function WaitingOnClient({ summary }: { summary: DashboardSummary }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Waiting on client
        </h2>
        <Link href="/app/tasks" className="text-xs underline decoration-border underline-offset-4">
          All tasks
        </Link>
      </div>
      {summary.waiting_tasks.length === 0 ? (
        <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">
          No tasks are waiting on a client.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {summary.waiting_tasks.map((task) => (
            <li key={task.id} className="flex items-start justify-between gap-4 py-4">
              <div className="min-w-0">
                <Link
                  href={crmHref(task.href)}
                  className="font-medium underline decoration-border underline-offset-4"
                >
                  {task.title}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {task.client_name ?? task.project_name ?? "Unassigned"}
                </p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {task.due_date ? task.due_date : "No due date"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RecentActivity({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="mt-14">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Recent activity
      </h2>
      {summary.recent_activity.length === 0 ? (
        <p className="mt-4 border-t border-border py-6 text-sm text-muted-foreground">
          No activity yet. Create a client, project, task, or communication to
          start the record.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {summary.recent_activity.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-4">
              <Link
                href={crmHref(item.href)}
                className="min-w-0 truncate text-sm font-medium underline decoration-border underline-offset-4"
              >
                {item.label}
              </Link>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeZone: "UTC",
                }).format(new Date(item.occurred_at))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
