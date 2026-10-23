"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dateTimeLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import { ConfirmDelete } from "@/components/confirm-delete";
import { LinkDialog } from "@/components/modal";
import { archiveClientAction } from "./actions";
import { EditClientForm } from "./client-forms";

/**
 * Client directory (server payload → instant client-side filtering).
 *
 * Search, status filter and sorting run in the browser — no query per keystroke.
 * Each row has Quick edit (dialog) and Delete (confirmation dialog; the client is
 * archived and hidden, its invoices and history are kept).
 */

export type ClientDirectoryRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes_summary: string | null;
  status: string;
  source: string | null;
  /** Sum of money actually received on this client's invoices (void ones excluded). */
  revenue_cents: number;
  last_activity_at: string;
  created_at: string;
};

type SortKey = "name" | "revenue" | "activity";

const sortLabels: Record<SortKey, string> = {
  name: "Name (A–Z)",
  revenue: "Total revenue (high → low)",
  activity: "Last activity (recent first)",
};

const statusOptions = ["all", "lead", "active", "past", "archived"] as const;

export function ClientDirectory({
  rows,
  initialQuery = "",
  initialStatus = "all",
  initialSort = "name",
}: {
  rows: ClientDirectoryRow[];
  initialQuery?: string;
  initialStatus?: string;
  initialSort?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(
    statusOptions.includes(initialStatus as (typeof statusOptions)[number]) ? initialStatus : "all"
  );
  const [sort, setSort] = useState<SortKey>(
    ["name", "revenue", "activity"].includes(initialSort) ? (initialSort as SortKey) : "name"
  );

  const totalRevenue = useMemo(() => rows.reduce((sum, row) => sum + row.revenue_cents, 0), [rows]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (needle) {
        const haystack = [row.name, row.company, row.email].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (status !== "all" && row.status !== status) return false;
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case "revenue":
          return b.revenue_cents - a.revenue_cents || a.name.localeCompare(b.name);
        case "activity":
          return b.last_activity_at.localeCompare(a.last_activity_at);
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [rows, query, status, sort]);

  const filtersActive = query.trim().length > 0 || status !== "all";
  const control =
    "block w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground";

  return (
    <section aria-labelledby="client-list-heading">
      <h2
        id="client-list-heading"
        className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        {visible.length} of {rows.length} {rows.length === 1 ? "client" : "clients"}
      </h2>

      <div className="mt-4 border border-border p-5">
        <p className="text-2xl font-semibold tracking-tight">{moneyNode(totalRevenue)}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Total revenue
        </p>
      </div>

      <div className="mt-6 grid gap-3 border-y border-border py-4 sm:grid-cols-3">
        <div>
          <label htmlFor="client-search" className="sr-only">
            Search clients
          </label>
          <input
            id="client-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, company, or email"
            className={`${control} placeholder:text-faint-foreground`}
          />
        </div>
        <div>
          <label htmlFor="client-status" className="sr-only">
            Status filter
          </label>
          <select id="client-status" value={status} onChange={(event) => setStatus(event.target.value)} className={control}>
            <option value="all">All statuses</option>
            <option value="lead">Leads</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="client-sort" className="sr-only">
            Sort by
          </label>
          <select id="client-sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className={control}>
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {sortLabels[key]}
              </option>
            ))}
          </select>
        </div>
        {filtersActive ? (
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
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
          {rows.length === 0 ? "No client records yet. Add the first one above." : "No clients match these filters."}
        </p>
      ) : (
        <div className="overflow-x-auto border-b border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Total revenue</th>
                <th className="px-3 py-3 font-medium">Last activity</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
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
                  <td className="px-3 py-4">{row.revenue_cents > 0 ? moneyNode(row.revenue_cents) : "—"}</td>
                  <td className="px-3 py-4 text-muted-foreground">{dateTimeLabel(row.last_activity_at)}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <LinkDialog label="Quick edit" title={`Edit ${row.name}`} className="text-xs text-foreground">
                        <EditClientForm client={row} />
                      </LinkDialog>
                      <ConfirmDelete
                        action={archiveClientAction}
                        fields={{ id: row.id }}
                        title={`Delete ${row.name}?`}
                        message={`${row.name} will be removed from your client list. Their invoices, payments and history are kept for your records.`}
                        className="text-xs text-red-600 hover:text-red-700"
                      />
                    </div>
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
