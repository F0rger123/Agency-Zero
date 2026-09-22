"use client";

import Link from "next/link";
import { useState } from "react";
import { FileLinks } from "@/components/file-links";
import { invoiceStatusLabel } from "@/lib/invoice-status";
import { FormSection } from "@/components/form-controls";
import { billingIntervalLabel, dateLabel, dateTimeLabel, hoursLabel, moneyLabel } from "@/lib/format";
import { CompleteTaskForm, TimeEntryForm, DeleteTimeEntryForm } from "../tasks/task-forms";
import { ArchiveProjectForm, EditProjectForm } from "./project-forms";
import {
  DeleteProjectFileForm,
  DeleteProjectNoteForm,
  MilestoneBlock,
  ProjectMilestoneForm,
  ProjectFileUploadForm,
  ProjectNoteForm,
  ProjectTaskForm,
  type WorkspaceMilestone,
  type WorkspaceTask,
} from "./project-workspace-forms";

/**
 * Tabbed project workspace.
 *
 * All ten tabs render from the single `get_project_workspace()` payload, so
 * moving between Overview / Tasks / Goals / Timeline / Time / Files / Notes /
 * Client / Financials / Settings is instant client-side state — no navigation,
 * no skeleton, no extra query. Tasks and milestones created here are
 * automatically associated with this project.
 */

type ProjectRow = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  value_cents: number | null;
  currency: string;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  starts_on: string | null;
  deadline: string | null;
  progress: number;
};

type Totals = {
  actual_minutes: number;
  estimated_minutes: number | null;
  open_tasks: number;
  done_tasks: number;
  milestones: number;
  milestones_done: number;
  invoiced_cents: number;
  paid_cents: number;
  outstanding_cents: number;
  client_mrr_cents: number;
};

type TimeEntry = {
  id: string;
  minutes: number;
  worked_on: string;
  note: string | null;
  task_id: string | null;
  task_title: string | null;
  created_at: string;
};

type NoteRow = { id: string; body: string; pinned: boolean; created_at: string };

type FileMeta = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

type QuoteRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  total_cents: number;
  currency: string;
  issued_on: string;
  accepted_at: string | null;
  linked: boolean;
  href: string;
};

type ContractRow = {
  id: string;
  title: string;
  status: string;
  version: number;
  signed_at: string | null;
  quote_id: string | null;
  linked: boolean;
  href: string;
};

type InvoiceRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  issued_on: string;
  due_on: string;
  currency: string;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  linked: boolean;
  href: string;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount_cents: number;
  paid_on: string;
  method: string;
  kind: string;
};

type ServiceRow = {
  id: string;
  service_name: string;
  billing: string;
  billing_interval: string;
  amount_cents: number | null;
  monthly_amount_cents: number | null;
};

type ActivityRow = { id: string; label: string; occurred_at: string | null };

export type ProjectWorkspaceData = {
  project: ProjectRow;
  client_options: { id: string; name: string; company: string | null }[];
  client: {
    id: string;
    name: string;
    company: string | null;
    status: string;
    email: string | null;
    phone: string | null;
    href: string;
  } | null;
  totals: Totals;
  tasks: WorkspaceTask[];
  milestones: WorkspaceMilestone[];
  time_entries: TimeEntry[];
  notes: NoteRow[];
  files: FileMeta[];
  quotes: QuoteRow[];
  contracts: ContractRow[];
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  services: ServiceRow[];
  activity: ActivityRow[];
};

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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function ProjectWorkspace({ data }: { data: ProjectWorkspaceData }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const { project, totals, client } = data;
  const currency = project.currency || "USD";
  const estimate = totals.estimated_minutes ?? project.estimated_minutes;
  const variance =
    estimate != null && estimate > 0
      ? Math.round(((totals.actual_minutes - estimate) / estimate) * 100)
      : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-y border-border py-4">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest">
          {project.status.replaceAll("_", " ")}
        </span>
        {client ? (
          <Link href={client.href} className="text-sm underline decoration-border underline-offset-4">
            {client.name}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">No client</span>
        )}
        <span className="text-sm text-muted-foreground">
          Deadline {dateLabel(project.deadline)}
        </span>
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
          <p className="text-xl font-semibold tracking-tight">
            {moneyLabel(project.value_cents, currency)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Value</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{totals.open_tasks}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Open tasks
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">
            {totals.milestones_done}/{totals.milestones}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Milestones
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">
            {moneyLabel(totals.outstanding_cents, currency)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Outstanding
          </p>
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

function OverviewTab({ data, currency }: { data: ProjectWorkspaceData; currency: string }) {
  const { project, totals, services } = data;
  const estimate = totals.estimated_minutes ?? project.estimated_minutes;

  return (
    <div className="space-y-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <FormSection title="Delivery" description="Where the project stands right now.">
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["Status", project.status.replaceAll("_", " ")],
              ["Starts", dateLabel(project.starts_on)],
              ["Deadline", dateLabel(project.deadline)],
              ["Progress", `${project.progress}%`],
              ["Tasks", `${totals.open_tasks} open · ${totals.done_tasks} done`],
              ["Milestones", `${totals.milestones_done} of ${totals.milestones} complete`],
              ["Estimated", hoursLabel(estimate)],
              ["Actual (time entries)", hoursLabel(totals.actual_minutes)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {project.description || "No description yet."}
          </p>
        </FormSection>

        <FormSection title="Money" description="Project value, collected revenue, and client MRR.">
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["Project value", moneyLabel(project.value_cents, currency)],
              ["Invoiced", moneyLabel(totals.invoiced_cents, currency)],
              ["Collected", moneyLabel(totals.paid_cents, currency)],
              ["Outstanding", moneyLabel(totals.outstanding_cents, currency)],
              ["Client MRR", moneyLabel(totals.client_mrr_cents, currency)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {services.length > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Client services:{" "}
              {services
                .map((service) =>
                  service.billing === "recurring"
                    ? `${service.service_name} (${moneyLabel(service.amount_cents)} ${billingIntervalLabel(
                        service.billing_interval
                      )})`
                    : `${service.service_name} (one-off)`
                )
                .join(" · ")}
            </p>
          ) : null}
        </FormSection>
      </div>

      <FormSection title="Recent activity" description="Newest project, task, time, note, and client events.">
        {data.activity.length === 0 ? (
          <Empty>No activity on this project yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.activity.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm">{entry.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {dateTimeLabel(entry.occurred_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

function TasksTab({ data }: { data: ProjectWorkspaceData }) {
  const taskOptions = data.tasks.map((task) => ({
    id: task.id,
    label: task.parent_title ? `↳ ${task.title}` : task.title,
  }));

  return (
    <div className="space-y-12">
      <FormSection
        title="Tasks and subtasks"
        description="Created here, tasks are attached to this project automatically. Subtasks use the parent task field."
      >
        {data.tasks.length === 0 ? (
          <Empty>No tasks yet. Add the first one below.</Empty>
        ) : (
          <div className="space-y-10">
            {data.tasks.map((task) => (
              <div key={task.id} className="border-t border-border pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">
                      {task.parent_title ? "↳ " : ""}
                      <Link href={task.href} className="underline decoration-border underline-offset-4">
                        {task.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.status === "blocked_waiting_client"
                        ? "waiting on client"
                        : task.status.replaceAll("_", " ")}{" "}
                      · {task.priority} · due {dateLabel(task.due_date)}
                      {task.milestone_name ? ` · ${task.milestone_name}` : ""}
                      {task.parent_title ? ` · subtask of ${task.parent_title}` : ""}
                    </p>
                  </div>
                  <CompleteTaskForm taskId={task.id} />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4">
                    Edit task
                  </summary>
                  <div className="mt-4">
                    <ProjectTaskForm
                      projectId={data.project.id}
                      clientId={data.project.client_id}
                      milestones={data.milestones}
                      tasks={taskOptions}
                      task={task}
                    />
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="Add a task" description="Status, priority, due date, milestone, estimate, and subtask parent.">
        <ProjectTaskForm
          projectId={data.project.id}
          clientId={data.project.client_id}
          milestones={data.milestones}
          tasks={taskOptions}
        />
      </FormSection>
    </div>
  );
}

function MilestonesTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <div className="space-y-12">
      <FormSection
        title="Goals & milestones"
        description="Goals for this project, with the tasks linked to each one. Milestones created here belong to this project."
      >
        {data.milestones.length === 0 ? (
          <Empty>No milestones yet. Add the first goal below.</Empty>
        ) : (
          <div className="space-y-6">
            {data.milestones.map((milestone) => (
              <MilestoneBlock key={milestone.id} projectId={data.project.id} milestone={milestone} />
            ))}
          </div>
        )}
      </FormSection>
      <FormSection title="Add a milestone" description="Name it, give it a due date, then complete it from the list above.">
        <ProjectMilestoneForm projectId={data.project.id} />
      </FormSection>
    </div>
  );
}

function TimelineTab({ data }: { data: ProjectWorkspaceData }) {
  const items = [
    ...(data.project.starts_on
      ? [{ id: "start", date: data.project.starts_on, label: "Project starts", context: data.project.name }]
      : []),
    ...data.milestones.map((milestone) => ({
      id: `milestone-${milestone.id}`,
      date: milestone.due_date ?? "",
      label: milestone.completed_at ? `Milestone completed: ${milestone.name}` : `Milestone: ${milestone.name}`,
      context: `${milestone.total_tasks - milestone.open_tasks}/${milestone.total_tasks} tasks done`,
    })),
    ...data.tasks.flatMap((task) =>
      task.due_date
        ? [
            {
              id: `task-${task.id}`,
              date: task.due_date,
              label: `Task due: ${task.title}`,
              context: task.status.replaceAll("_", " "),
            },
          ]
        : []
    ),
    ...(data.project.deadline
      ? [{ id: "deadline", date: data.project.deadline, label: "Project deadline", context: data.project.name }]
      : []),
  ]
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <FormSection title="Timeline" description="Starts, milestone dates, task due dates, and the project deadline in order.">
      {items.length === 0 ? (
        <Empty>No dates yet. Add a deadline, milestone date, or task due date.</Empty>
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.context}</p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">{dateLabel(item.date)}</span>
            </li>
          ))}
        </ol>
      )}
    </FormSection>
  );
}

function TimeTab({ data }: { data: ProjectWorkspaceData }) {
  const estimate = data.totals.estimated_minutes ?? data.project.estimated_minutes;
  const actual = data.totals.actual_minutes;
  const progressPercent = estimate && estimate > 0 ? Math.min(999, Math.round((actual / estimate) * 100)) : null;

  return (
    <div className="space-y-12">
      <FormSection title="Actual vs estimated" description="Time entries are the source of truth for actual time; estimates come from the project and its tasks.">
        <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="text-2xl font-semibold tracking-tight">{hoursLabel(estimate)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Estimated
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="text-2xl font-semibold tracking-tight">{hoursLabel(actual)}</p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Actual</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-2xl font-semibold tracking-tight">
              {progressPercent == null ? "—" : `${progressPercent}%`}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Of estimate
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Time entries" description="Log time against this project (optionally against a specific task).">
        {data.time_entries.length === 0 ? (
          <Empty>No time logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.time_entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">
                    {hoursLabel(entry.minutes)} · {dateLabel(entry.worked_on)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.task_title ? `${entry.task_title} · ` : ""}
                    {entry.note || "No note"}
                  </p>
                </div>
                <DeleteTimeEntryForm id={entry.id} projectId={data.project.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6">
          <TimeEntryForm projectId={data.project.id} />
        </div>
      </FormSection>
    </div>
  );
}

function FilesTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <FormSection
      title="Files"
      description="Private project files, stored under projects/<project id>/ in the client-files bucket. Download links are created on demand and expire after one hour."
    >
      <FileLinks
        files={data.files}
        emptyLabel="No files uploaded yet."
        renderDelete={(file) => (
          <DeleteProjectFileForm
            projectId={data.project.id}
            fileId={file.id}
            storagePath={file.storage_path}
          />
        )}
      />
      <div className="mt-6">
        <ProjectFileUploadForm projectId={data.project.id} />
      </div>
    </FormSection>
  );
}

function NotesTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <FormSection title="Notes" description="Project context, decisions, and risks. Pin what should stay visible.">
      {data.notes.length === 0 ? (
        <Empty>No notes yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.notes.map((note) => (
            <li key={note.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{note.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.pinned ? "Pinned · " : ""}
                    {dateTimeLabel(note.created_at)}
                  </p>
                </div>
                <DeleteProjectNoteForm projectId={data.project.id} noteId={note.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <ProjectNoteForm projectId={data.project.id} />
      </div>
    </FormSection>
  );
}

function ClientTab({ data }: { data: ProjectWorkspaceData }) {
  const { client, services } = data;
  if (!client) return <Empty>This project has no client record.</Empty>;

  return (
    <div className="space-y-12">
      <FormSection title="Client" description="The relationship this project belongs to.">
        <dl className="divide-y divide-border border-y border-border text-sm">
          {[
            ["Name", client.name],
            ["Company", client.company ?? "—"],
            ["Status", client.status],
            ["Email", client.email ?? "—"],
            ["Phone", client.phone ?? "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-6 py-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4">
          <Link href={client.href} className="text-sm underline decoration-border underline-offset-4">
            Open the client workspace →
          </Link>
        </p>
      </FormSection>
      <FormSection title="Client services" description="Recurring services on this client contribute to MRR.">
        {services.length === 0 ? (
          <Empty>No services assigned to this client.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {services.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-medium">{service.service_name}</span>
                <span className="text-muted-foreground">
                  {service.billing === "recurring"
                    ? `${moneyLabel(service.amount_cents)} ${billingIntervalLabel(service.billing_interval)} · ${moneyLabel(service.monthly_amount_cents)}/mo`
                    : "one-off"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4">
          <Link href="/services" className="text-sm underline decoration-border underline-offset-4">
            Manage the service catalogue →
          </Link>
        </p>
      </FormSection>
    </div>
  );
}

function FinancialsTab({
  data,
  currency,
}: {
  data: ProjectWorkspaceData;
  currency: string;
}) {
  return (
    <div className="space-y-12">
      <FormSection title="Project financials" description="Value, billing, and collection for this project only.">
        <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">
              {moneyLabel(data.project.value_cents, currency)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Value</p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">
              {moneyLabel(data.totals.invoiced_cents, currency)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Invoiced
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">
              {moneyLabel(data.totals.paid_cents, currency)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Collected
            </p>
          </div>
          <div className="bg-background p-5">
            <p className="text-xl font-semibold tracking-tight">
              {moneyLabel(data.totals.outstanding_cents, currency)}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
              Outstanding
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection title="Linked quotes" description="Quotes for this client. Linked means the quote converted into this project.">
        {data.quotes.length === 0 ? (
          <Empty>No quotes for this client.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.quotes.map((quote) => (
              <li key={quote.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <Link href={quote.href} className="text-sm font-medium underline decoration-border underline-offset-4">
                  {quote.number} · {quote.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {quote.linked ? "linked · " : ""}
                  {quote.status} · {moneyLabel(quote.total_cents, quote.currency || currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Linked contracts" description="Contracts tied to this project or to its converted quote.">
        {data.contracts.length === 0 ? (
          <Empty>No contracts linked to this project.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.contracts.map((contract) => (
              <li key={contract.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <Link href={contract.href} className="text-sm font-medium underline decoration-border underline-offset-4">
                  {contract.title}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {contract.linked ? "linked · " : ""}
                  {contract.status} · v{contract.version}
                  {contract.signed_at ? ` · signed ${dateLabel(contract.signed_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Invoices & payments" description="Invoices raised against this project and the payments recorded on them.">
        {data.invoices.length === 0 ? (
          <Empty>No invoices yet for this project.</Empty>
        ) : (
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 font-medium">Invoice</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Due</th>
                  <th className="px-3 py-3 font-medium">Total</th>
                  <th className="px-3 py-3 font-medium">Paid</th>
                  <th className="px-3 py-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-4 font-medium">
                      <Link href={invoice.href} className="underline decoration-border underline-offset-4">
                        {invoice.number}
                      </Link>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {invoice.linked ? "linked · " : ""}
                        {invoice.title}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">{invoiceStatusLabel(invoice.status, invoice.due_on, invoice.balance_cents)}</td>
                    <td className="px-3 py-4 text-muted-foreground">{dateLabel(invoice.due_on)}</td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {moneyLabel(invoice.total_cents, invoice.currency || currency)}
                    </td>
                    <td className="px-3 py-4 text-muted-foreground">
                      {moneyLabel(invoice.paid_cents, invoice.currency || currency)}
                    </td>
                    <td className="px-3 py-4">
                      {moneyLabel(invoice.balance_cents, invoice.currency || currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.payments.length === 0 ? null : (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {data.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium">
                  {moneyLabel(payment.amount_cents)} · {payment.method.replaceAll("_", " ")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {payment.invoice_number} · {payment.kind} · {dateLabel(payment.paid_on)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

function SettingsTab({ data }: { data: ProjectWorkspaceData }) {
  return (
    <FormSection
      title="Project settings"
      description="Change status, client, deadline, value, estimate, or progress — or archive the project."
    >
      <EditProjectForm project={data.project} clients={data.client_options} />
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="text-sm font-medium">Archive</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Archiving keeps every task, milestone, time entry, note, and file while
          removing the project from active lists.
        </p>
        <ArchiveProjectForm projectId={data.project.id} />
      </div>
    </FormSection>
  );
}
