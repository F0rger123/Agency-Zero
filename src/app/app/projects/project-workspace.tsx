"use client";

import { crmHref } from "@/lib/routes";
import Link from "next/link";
import { useState } from "react";
import { dateLabel, hoursLabel } from "@/lib/format";
import { moneyNode } from "@/components/money-node";
import { OverviewTab } from "./project-tabs/overview-tab";
import { TasksTab } from "./project-tabs/tasks-tab";
import { WorkItemsTab, type WorkItemsPayload } from "./project-tabs/work-items";
import { PhasesTab, type ProjectPhasesPayload } from "./project-tabs/phases";
import { ProjectQuickControls } from "./project-quick-controls";
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
  "Phases",
  "Bugs",
  "Feature requests",
  "Goals & milestones",
  "Timeline",
  "Time",
  "Files",
  "Notes",
  "Client",
  "Financials",
  "Edit project",
] as const;

type Tab = (typeof tabs)[number];

export function ProjectWorkspace({ data }: { data: ProjectWorkspaceData & { work_items: WorkItemsPayload | null; phases: ProjectPhasesPayload | null } }) {
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
        {data.phases?.phases.find((phase) => phase.status === "active") ? (
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">
            Phase: {data.phases.phases.find((phase) => phase.status === "active")?.name}
          </span>
        ) : null}
        <span className="text-sm text-muted-foreground">Deadline {dateLabel(project.deadline)}</span>
        <span className="text-sm text-muted-foreground">
          Actual {hoursLabel(totals.actual_minutes)} / estimated {hoursLabel(estimate)}
          {variance != null ? ` (${variance > 0 ? "+" : ""}${variance}%)` : ""}
        </span>
      </div>

      <ProjectQuickControls key={`${project.status}|${project.progress}|${project.starts_on}|${project.deadline}`} data={data} onEditAll={() => setTab("Edit project")} />

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-5">
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{project.progress}%</p>
          <div className="mt-2 h-1.5 w-full bg-muted" aria-hidden>
            <div className="h-full bg-foreground" style={{ width: `${project.progress}%` }} />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">Progress</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyNode(project.value_cents, currency)}</p>
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
          <p className="text-xl font-semibold tracking-tight">{moneyNode(totals.outstanding_cents, currency)}</p>
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
            {item === "Bugs" && data.work_items && data.work_items.open_bugs > 0 ? (
              <span className="ml-1.5 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">{data.work_items.open_bugs}</span>
            ) : null}
            {item === "Feature requests" && data.work_items && data.work_items.open_feature_requests > 0 ? (
              <span className="ml-1.5 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium">{data.work_items.open_feature_requests}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={tab} className="mt-8">
        {tab === "Overview" ? <OverviewTab data={data} currency={currency} /> : null}
        {tab === "Tasks" ? <TasksTab data={data} /> : null}
        {tab === "Phases" ? <PhasesTab data={data} /> : null}
        {tab === "Bugs" ? <WorkItemsTab data={data} kind="bug" /> : null}
        {tab === "Feature requests" ? <WorkItemsTab data={data} kind="feature_request" /> : null}
        {tab === "Goals & milestones" ? <MilestonesTab data={data} /> : null}
        {tab === "Timeline" ? <TimelineTab data={data} /> : null}
        {tab === "Time" ? <TimeTab data={data} /> : null}
        {tab === "Files" ? <FilesTab data={data} /> : null}
        {tab === "Notes" ? <NotesTab data={data} /> : null}
        {tab === "Client" ? <ClientTab data={data} /> : null}
        {tab === "Financials" ? <FinancialsTab data={data} currency={currency} /> : null}
        {tab === "Edit project" ? <SettingsTab data={data} /> : null}
      </div>
    </div>
  );
}
