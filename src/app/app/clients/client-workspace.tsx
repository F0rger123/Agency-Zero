"use client";

import { useState } from "react";
import { dateTimeLabel, moneyLabel } from "@/lib/format";
import { OverviewTab } from "./client-tabs/overview-tab";
import { ProjectsTab } from "./client-tabs/projects-tab";
import { TasksTab } from "./client-tabs/tasks-tab";
import { ServicesTab } from "./client-tabs/services-tab";
import { QuotesTab } from "./client-tabs/quotes-tab";
import { ContractsTab } from "./client-tabs/contracts-tab";
import { InvoicesTab } from "./client-tabs/invoices-tab";
import { NotesTab } from "./client-tabs/notes-tab";
import { ActivityTab } from "./client-tabs/activity-tab";
import { FilesTab } from "./client-tabs/files-tab";
import { SettingsTab } from "./client-tabs/settings-tab";
import { ShootsView, type ShootsOverview } from "../shoots/shoots-view";
import type { ClientWorkspaceData } from "./client-workspace-types";
export type { ClientWorkspaceData } from "./client-workspace-types";

/**
 * Tabbed client workspace.
 *
 * Every tab renders from the single `get_client_workspace()` payload handed in
 * by the server page, so switching tabs is instant: no navigation, no loading
 * skeleton, no extra query. Forms are the existing server-action forms, which
 * revalidate this page (and the sections they touch) after each mutation.
 */

const tabs = [
  "Overview",
  "Projects",
  "Tasks",
  "Services",
  "Shoots",
  "Quotes",
  "Contracts",
  "Invoices & payments",
  "Notes",
  "Activity",
  "Files",
  "Profile",
] as const;

type Tab = (typeof tabs)[number];

export function ClientWorkspace({
  data,
  templates = [],
  shoots = null,
  projectTemplates = [],
}: {
  data: ClientWorkspaceData;
  templates?: { id: string; label: string }[];
  /** Content shoots for this client (migration 0024); null when the database has not applied it yet. */
  shoots?: ShootsOverview | null;
  /** Active project templates (0025) offered when adding a project. */
  projectTemplates?: { id: string; label: string }[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");
  const { client, stats } = data;
  const currency = "USD";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">
          {client.status}
        </span>
        {client.company ? <span className="text-sm text-muted-foreground">{client.company}</span> : null}
        {client.email ? <span className="text-sm text-muted-foreground">{client.email}</span> : null}
        {client.phone ? <span className="text-sm text-muted-foreground">{client.phone}</span> : null}
        {client.website ? (
          <a
            href={client.website}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline decoration-border underline-offset-4"
          >
            Website ↗
          </a>
        ) : null}
        {client.source ? <span className="text-sm text-muted-foreground">Source: {client.source}</span> : null}
        <button
          type="button"
          onClick={() => setTab("Profile")}
          className="ml-auto rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
        >
          Edit profile
        </button>
        <span className="text-xs text-muted-foreground">Last activity {dateTimeLabel(stats.last_activity_at)}</span>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-5">
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyLabel(stats.mrr_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">MRR</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyLabel(stats.outstanding_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Outstanding</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{stats.active_projects}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Active projects</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{stats.waiting_tasks}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Waiting on client</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{stats.active_services}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Services</p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Client sections"
        className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px"
      >
        {tabs.map((item) => (
          <button
            key={item}
            role="tab"
            type="button"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`shrink-0 rounded-t-md px-3 py-2 text-sm transition-colors ${
              tab === item
                ? "border-b-2 border-foreground font-medium text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tab} className="mt-8">
        {tab === "Overview" ? <OverviewTab data={data} /> : null}
        {tab === "Projects" ? <ProjectsTab data={data} currency={currency} projectTemplates={projectTemplates} /> : null}
        {tab === "Tasks" ? <TasksTab data={data} /> : null}
        {tab === "Services" ? <ServicesTab data={data} /> : null}
        {tab === "Shoots" ? (
          shoots ? (
            <ShootsView data={shoots} lockedClientId={client.id} />
          ) : (
            <p className="border-y border-border py-6 text-sm text-muted-foreground">
              Content shoots need database update <code className="font-mono text-foreground">0024</code>. Apply it in the Supabase SQL editor and reload.
            </p>
          )
        ) : null}
        {tab === "Quotes" ? <QuotesTab data={data} /> : null}
        {tab === "Contracts" ? <ContractsTab data={data} templates={templates} /> : null}
        {tab === "Invoices & payments" ? <InvoicesTab data={data} currency={currency} /> : null}
        {tab === "Notes" ? <NotesTab data={data} /> : null}
        {tab === "Activity" ? <ActivityTab data={data} /> : null}
        {tab === "Files" ? <FilesTab data={data} /> : null}
        {tab === "Profile" ? <SettingsTab data={data} /> : null}
      </div>
    </div>
  );
}
