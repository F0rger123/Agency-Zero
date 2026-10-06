"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { CountUp } from "@/components/money";
import type { IconName } from "@/lib/nav";
import { dateTimeLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import { OverviewTab } from "./client-tabs/overview-tab";
import { ProjectsTab } from "./client-tabs/projects-tab";
import { TasksTab } from "./client-tabs/tasks-tab";
import { ServicesTab } from "./client-tabs/services-tab";
import { QuotesTab } from "./client-tabs/quotes-tab";
import { ContractsTab } from "./client-tabs/contracts-tab";
import { InvoicesTab } from "./client-tabs/invoices-tab";
import { RemindersTab, type ClientReminder } from "./client-tabs/reminders-tab";
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

type Tab =
  | "Projects"
  | "Tasks"
  | "Services"
  | "Shoots"
  | "Quotes"
  | "Contracts"
  | "Invoices & payments"
  | "Reminders"
  | "Notes"
  | "Activity"
  | "Files"
  | "Profile";

export function ClientWorkspace({
  data,
  templates = [],
  shoots = null,
  projectTemplates = [],
  reminders = null,
}: {
  data: ClientWorkspaceData;
  templates?: { id: string; label: string }[];
  /** Content shoots for this client (migration 0024); null when the database has not applied it yet. */
  shoots?: ShootsOverview | null;
  /** Active project templates (0025) offered when adding a project. */
  projectTemplates?: { id: string; label: string }[];
  /** Reminders attached to this client; null when they could not be loaded. */
  reminders?: ClientReminder[] | null;
}) {
  // null = the customer home (big section widgets); otherwise one section is open.
  const [tab, setTab] = useState<Tab | null>(null);
  const { client, stats } = data;
  const currency = "USD";
  const sections: { tab: Tab; label: string; icon: IconName; blurb: string; count: number | null }[] = [
    { tab: "Projects", label: "Projects", icon: "projects", blurb: "Delivery work, with tasks inside.", count: data.projects.length },
    { tab: "Tasks", label: "Tasks", icon: "tasks", blurb: "Everything to do for this customer.", count: data.tasks.length },
    { tab: "Services", label: "Services", icon: "services", blurb: "One-time and recurring work.", count: data.services.length },
    { tab: "Shoots", label: "Shoots", icon: "shoots", blurb: "Content days and schedules.", count: shoots ? shoots.upcoming.length : null },
    { tab: "Quotes", label: "Quotes", icon: "quotes", blurb: "Proposals sent.", count: data.quotes.length },
    { tab: "Contracts", label: "Contracts", icon: "contracts", blurb: "Agreements and signatures.", count: data.contracts.length },
    { tab: "Invoices & payments", label: "Invoices", icon: "invoices", blurb: "Billing and money received.", count: data.invoices.length },
    { tab: "Reminders", label: "Reminders", icon: "reminders", blurb: "Follow-ups for this customer.", count: reminders ? reminders.length : null },
    { tab: "Notes", label: "Notes", icon: "dashboard", blurb: "Context worth keeping.", count: data.notes.length },
    { tab: "Activity", label: "Activity", icon: "leads", blurb: "Calls, emails and meetings.", count: data.communications.length },
    { tab: "Files", label: "Files", icon: "workload", blurb: "Private documents.", count: data.files.length },
    { tab: "Profile", label: "Profile", icon: "settings", blurb: "Contact details and settings.", count: null },
  ];

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
          <p className="text-xl font-semibold tracking-tight">{moneyNode(stats.mrr_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">MRR</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyNode(stats.outstanding_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Outstanding</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight"><CountUp value={stats.active_projects} /></p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Active projects</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight"><CountUp value={stats.waiting_tasks} /></p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Waiting on client</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight"><CountUp value={stats.active_services} /></p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Services</p>
        </div>
      </div>

      {tab === null ? (
        <>
          <section aria-label="Customer sections" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {sections.map((section, index) => (
              <button
                key={section.tab}
                type="button"
                onClick={() => setTab(section.tab)}
                style={{ "--i": index } as React.CSSProperties}
                className="widget-in press group flex min-h-36 flex-col justify-between rounded-2xl border border-border bg-background p-5 text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-foreground hover:shadow-lg"
              >
                <span className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-full border border-border transition-transform duration-300 group-hover:scale-110">
                    <Icon name={section.icon} className="size-5" />
                  </span>
                  {section.count !== null ? (
                    <span className="text-2xl font-semibold tracking-tight">
                      <CountUp value={section.count} />
                    </span>
                  ) : null}
                </span>
                <span className="mt-6 block">
                  <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    {section.label}
                    <span aria-hidden className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{section.blurb}</span>
                </span>
              </button>
            ))}
          </section>
          <div className="mt-12">
            <OverviewTab data={data} />
          </div>
        </>
      ) : (
        <>
          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTab(null)}
              className="press inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <span aria-hidden>←</span> {client.name}
            </button>
            <h2 className="text-lg font-semibold tracking-tight">{tab}</h2>
          </div>
          <div role="tabpanel" aria-label={tab} className="mt-6">
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
            {tab === "Reminders" ? <RemindersTab data={data} reminders={reminders} /> : null}
            {tab === "Notes" ? <NotesTab data={data} /> : null}
            {tab === "Activity" ? <ActivityTab data={data} /> : null}
            {tab === "Files" ? <FilesTab data={data} /> : null}
            {tab === "Profile" ? <SettingsTab data={data} /> : null}
          </div>
        </>
      )}
    </div>
  );
}
