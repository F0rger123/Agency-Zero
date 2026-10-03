"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dateTimeLabel, moneyLabel } from "@/lib/format";

/**
 * Client directory (server payload → instant client-side filtering).
 *
 * `get_client_directory()` returns every active client with its services,
 * MRR, outstanding balance, active projects, waiting-on-client tasks, and last
 * activity in ONE round trip. Search, status/billing/service filters, and
 * sorting therefore run in the browser — no query per keystroke, no server
 * round trip per filter change, no loading state.
 */

export type ClientDirectoryRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  active_services: number;
  recurring_services: number;
  service_names: string[];
  mrr_cents: number;
  outstanding_cents: number;
  active_projects: number;
  total_projects: number;
  waiting_tasks: number;
  open_tasks: number;
  last_activity_at: string;
  created_at: string;
};

type SortKey = "name" | "mrr" | "balance" | "activity";

const sortLabels: Record<SortKey, string> = {
  name: "Name (A–Z)",
  mrr: "MRR (high → low)",
  balance: "Outstanding balance (high → low)",
  activity: "Last activity (recent first)",
};

const statusOptions = ["all", "lead", "active", "past", "archived"] as const;

export function ClientDirectory({
  rows,
  initialQuery = "",
  initialStatus = "all",
  initialBilling = "all",
  initialService = "all",
  initialSort = "name",
}: {
  rows: ClientDirectoryRow[];
  initialQuery?: string;
  initialStatus?: string;
  initialBilling?: string;
  initialService?: string;
  initialSort?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(
    statusOptions.includes(initialStatus as (typeof statusOptions)[number])
      ? initialStatus
      : "all"
  );
  const [billing, setBilling] = useState(
    ["all", "recurring", "one_off"].includes(initialBilling) ? initialBilling : "all"
  );
  const [service, setService] = useState(initialService);
  const [sort, setSort] = useState<SortKey>(
    ["name", "mrr", "balance", "activity"].includes(initialSort)
      ? (initialSort as SortKey)
      : "name"
  );

  const services = useMemo(() => {
    const names = new Set<string>();
    rows.forEach((row) => row.service_names.forEach((name) => names.add(name)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const summary = useMemo(
    () => ({
      clients: rows.length,
      recurring: rows.filter((row) => row.recurring_services > 0).length,
      mrr: rows.reduce((sum, row) => sum + row.mrr_cents, 0),
      outstanding: rows.reduce((sum, row) => sum + row.outstanding_cents, 0),
      waiting: rows.reduce((sum, row) => sum + row.waiting_tasks, 0),
    }),
    [rows]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (needle) {
        const haystack = [row.name, row.company, row.email, ...row.service_names]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (status !== "all" && row.status !== status) return false;
      if (billing === "recurring" && row.recurring_services === 0) return false;
      if (billing === "one_off" && row.recurring_services > 0) return false;
      if (service !== "all" && !row.service_names.includes(service)) return false;
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "mrr":
          return b.mrr_cents - a.mrr_cents || a.name.localeCompare(b.name);
        case "balance":
          return b.outstanding_cents - a.outstanding_cents || a.name.localeCompare(b.name);
        case "activity":
          return b.last_activity_at.localeCompare(a.last_activity_at);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [rows, query, status, billing, service, sort]);

  const filtersActive =
    query.trim().length > 0 || status !== "all" || billing !== "all" || service !== "all";

  return (
    <section aria-labelledby="client-list-heading">
      <h2
        id="client-list-heading"
        className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {visible.length} of {summary.clients} {summary.clients === 1 ? "client" : "clients"}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{summary.recurring}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Recurring clients
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{moneyLabel(summary.mrr)}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            MRR
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">
            {moneyLabel(summary.outstanding)}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Outstanding
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-2xl font-semibold tracking-tight">{summary.waiting}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Waiting on client
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="client-search" className="sr-only">
            Search clients
          </label>
          <input
            id="client-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, company, email, or service"
            className="block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-faint-foreground focus:border-foreground"
          />
        </div>
        <div>
          <label htmlFor="client-status" className="sr-only">
            Status filter
          </label>
          <select
            id="client-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          >
            <option value="all">All statuses</option>
            <option value="lead">Leads</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="client-billing" className="sr-only">
            Billing filter
          </label>
          <select
            id="client-billing"
            value={billing}
            onChange={(event) => setBilling(event.target.value)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          >
            <option value="all">Recurring and one-off</option>
            <option value="recurring">Recurring only</option>
            <option value="one_off">No recurring services</option>
          </select>
        </div>
        <div>
          <label htmlFor="client-sort" className="sr-only">
            Sort by
          </label>
          <select
            id="client-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {sortLabels[key]}
              </option>
            ))}
          </select>
        </div>
        {services.length > 0 ? (
          <div className="lg:col-span-5">
            <label htmlFor="client-service" className="sr-only">
              Service filter
            </label>
            <select
              id="client-service"
              value={service}
              onChange={(event) => setService(event.target.value)}
              className="block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground sm:w-80"
            >
              <option value="all">Any service</option>
              {services.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {filtersActive ? (
          <div className="lg:col-span-5">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
                setBilling("all");
                setService("all");
              }}
              className="text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <p className="border-b border-border py-8 text-sm text-muted-foreground">
          {summary.clients === 0
            ? "No client records yet. Add the first one below."
            : "No clients match these filters."}
        </p>
      ) : (
        <div className="overflow-x-auto border-b border-border">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Services</th>
                <th className="px-3 py-3 font-medium">MRR</th>
                <th className="px-3 py-3 font-medium">Outstanding</th>
                <th className="px-3 py-3 font-medium">Projects</th>
                <th className="px-3 py-3 font-medium">Waiting</th>
                <th className="px-3 py-3 font-medium">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((row) => (
                <tr key={row.id} className="group align-top">
                  <td className="px-3 py-4">
                    <Link
                      href={`/app/clients/${row.id}`}
                      className="font-medium underline decoration-border underline-offset-4 group-hover:decoration-foreground"
                    >
                      {row.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[row.company, row.email].filter(Boolean).join(" · ") || "No company on file"}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <span className="rounded-full border border-border px-2 py-1 text-[11px] font-medium uppercase tracking-widest">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {row.service_names.length === 0 ? (
                      "—"
                    ) : (
                      <span className="block max-w-[220px] text-xs leading-5">
                        {row.service_names.join(", ")}
                        <span className="mt-1 block text-faint-foreground">
                          {row.recurring_services > 0
                            ? `${row.recurring_services} recurring`
                            : "one-off only"}
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {row.mrr_cents > 0 ? moneyLabel(row.mrr_cents) : "—"}
                  </td>
                  <td className="px-3 py-4">
                    {row.outstanding_cents > 0 ? (
                      <span className="font-medium">{moneyLabel(row.outstanding_cents)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {row.active_projects} active
                    <span className="mt-1 block text-xs text-faint-foreground">
                      {row.total_projects} total · {row.open_tasks} open tasks
                    </span>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {row.waiting_tasks > 0 ? (
                      <span className="font-medium">{row.waiting_tasks}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {dateTimeLabel(row.last_activity_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
