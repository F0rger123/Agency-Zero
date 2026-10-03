"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { useState } from "react";
import { dateLabel, hoursLabel, moneyLabel } from "@/lib/format";
import { OverviewTab } from "./project-tabs/overview-tab";
import { TasksTab } from "./project-tabs/tasks-tab";
import { MilestonesTab } from "./project-tabs/milestones-tab";
import { TimelineTab } from "./project-tabs/timeline-tab";
import { TimeTab } from "./project-tabs/time-tab";
import { FilesTab } from "./project-tabs/files-tab";
import { NotesTab } from "./project-tabs/notes-tab";
import { ClientTab } from "./project-tabs/client-tab";
import { FinancialsTab } from "./project-tabs/financials-tab";
import { SettingsTab } from "./project-tabs/settings-tab";
import type { ProjectWorkspaceData } from "./project-workspace-types";
export type { ProjectWorkspaceData } from "./project-workspace-types";

/**
 * Tabbed project workspace.
 *
 * All ten tabs render from the single `get_project_workspace()` payload, so
 * moving between Overview / Tasks / Goals / Timeline / Time / Files / Notes /
 * Client / Financials / Settings is instant client-side state — no navigation,
 * no skeleton, no extra query. Tasks and milestones created here are
 * automatically associated with this project.
 */

const tabs = [
  "Overview",
  "Tasks",
  "Goals & milestones",
  "Timeline",
  "Time",
  "Files",
  "Notes",
  "Client",
  "Financials",
  "Settings",
] as const;

type Tab = (typeof tabs)[number];

export function ProjectWorkspace({ data }: { data: ProjectWorkspaceData }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const { project, totals, client } = data;
  const currency = project.currency || "USD";
  const estimate = totals.estimated_minutes ?? project.estimated_minutes;
  const variance =
    estimate != null && estimate > 0 ? Math.round(((totals.actual_minutes - estimate) / estimate) * 100) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">
          {project.status.replaceAll("_", " ")}
        </span>
        {client ? (
          <Link href={crmHref(client.href)} className="text-sm underline decoration-border underline-offset-4">
            {client.name}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">No client</span>
        )}
        <span className="text-sm text-muted-foreground">Deadline {dateLabel(project.deadline)}</span>
        <span className="text-sm text-muted-foreground">
          Actual {hoursLabel(totals.actual_minutes)} / estimated {hoursLabel(estimate)}
          {variance != null ? ` (${variance > 0 ? "+" : ""}${variance}%)` : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-5">
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{project.progress}%</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Progress</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyLabel(project.value_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Value</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{totals.open_tasks}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Open tasks</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">
            {totals.milestones_done}/{totals.milestones}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Milestones</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyLabel(totals.outstanding_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Outstanding</p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Project sections"
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
        {tab === "Overview" ? <OverviewTab data={data} currency={currency} /> : null}
        {tab === "Tasks" ? <TasksTab data={data} /> : null}
        {tab === "Goals & milestones" ? <MilestonesTab data={data} /> : null}
        {tab === "Timeline" ? <TimelineTab data={data} /> : null}
        {tab === "Time" ? <TimeTab data={data} /> : null}
        {tab === "Files" ? <FilesTab data={data} /> : null}
        {tab === "Notes" ? <NotesTab data={data} /> : null}
        {tab === "Client" ? <ClientTab data={data} /> : null}
        {tab === "Financials" ? <FinancialsTab data={data} currency={currency} /> : null}
        {tab === "Settings" ? <SettingsTab data={data} /> : null}
      </div>
    </div>
  );
}
