"use client";

import Link from "next/link";
import { useState } from "react";
import { FileLinks } from "@/components/file-links";
import { invoiceStatusLabel } from "@/lib/invoice-status";
import { FormSection } from "@/components/form-controls";
import { billingIntervalLabel, dateLabel, dateTimeLabel, hoursLabel, moneyLabel } from "@/lib/format";
import {
  ArchiveClientForm,
  CommunicationForm,
  ContactForm,
  DeleteCommunicationForm,
  DeleteContactForm,
  DeleteFileForm,
  DeleteNoteForm,
  EditClientForm,
  NoteForm,
  RemoveServiceForm,
  ServiceForm,
  UploadFileForm,
  type CatalogService,
} from "./client-forms";

/**
 * Tabbed client workspace.
 *
 * Every tab renders from the single `get_client_workspace()` payload handed in
 * by the server page, so switching tabs is instant: no navigation, no loading
 * skeleton, no extra query. Forms are the existing server-action forms, which
 * revalidate this page (and the sections they touch) after each mutation.
 */

type Contact = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
};

type ClientProject = {
  id: string;
  name: string;
  status: string;
  deadline: string | null;
  progress: number;
  value_cents: number | null;
  currency: string;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  open_tasks: number;
  href: string;
};

type ClientTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  scheduled_date: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  project_id: string | null;
  project_name: string | null;
  updated_at: string;
  href: string;
};

type ServiceAssignment = {
  id: string;
  service_id: string;
  service_name: string;
  billing: string;
  billing_interval: string;
  amount_cents: number | null;
  monthly_amount_cents: number | null;
  started_on: string | null;
  default_estimated_minutes: number | null;
};

type QuoteRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  issued_on: string;
  valid_until: string | null;
  total_cents: number;
  currency: string;
  is_recurring: boolean;
  accepted_at: string | null;
  updated_at: string;
  href: string;
};

type ContractRow = {
  id: string;
  title: string;
  status: string;
  version: number;
  signed_at: string | null;
  quote_id: string | null;
  project_id: string | null;
  updated_at: string;
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
  project_id: string | null;
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
  reference: string | null;
};

type NoteRow = { id: string; body: string; pinned: boolean; created_at: string };

type CommunicationRow = {
  id: string;
  channel: string;
  direction: string;
  summary: string;
  occurred_at: string;
  contact_id: string | null;
  contact_name: string | null;
};

type FileMeta = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type ClientWorkspaceData = {
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    status: string;
    source: string | null;
    notes_summary: string | null;
  };
  stats: {
    mrr_cents: number;
    active_services: number;
    outstanding_cents: number;
    paid_cents: number;
    invoiced_cents: number;
    active_projects: number;
    total_projects: number;
    open_tasks: number;
    waiting_tasks: number;
    quotes_awaiting: number;
    contracts_unsigned: number;
    last_activity_at: string;
  };
  contacts: Contact[];
  projects: ClientProject[];
  tasks: ClientTask[];
  services: ServiceAssignment[];
  service_catalog: CatalogService[];
  quotes: QuoteRow[];
  contracts: ContractRow[];
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  notes: NoteRow[];
  communications: CommunicationRow[];
  files: FileMeta[];
};

const tabs = [
  "Overview",
  "Contacts",
  "Projects",
  "Tasks",
  "Services",
  "Quotes",
  "Contracts",
  "Invoices & payments",
  "Notes",
  "Activity",
  "Files",
  "Settings",
] as const;

type Tab = (typeof tabs)[number];

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function ClientWorkspace({ data }: { data: ClientWorkspaceData }) {
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
        {client.source ? (
          <span className="text-sm text-muted-foreground">Source: {client.source}</span>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          Last activity {dateTimeLabel(stats.last_activity_at)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-5">
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{moneyLabel(stats.mrr_cents, currency)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">MRR</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">
            {moneyLabel(stats.outstanding_cents, currency)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Outstanding</p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{stats.active_projects}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Active projects
          </p>
        </div>
        <div className="bg-background p-5">
          <p className="text-xl font-semibold tracking-tight">{stats.waiting_tasks}</p>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            Waiting on client
          </p>
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
        {tab === "Contacts" ? <ContactsTab data={data} /> : null}
        {tab === "Projects" ? <ProjectsTab data={data} currency={currency} /> : null}
        {tab === "Tasks" ? <TasksTab data={data} /> : null}
        {tab === "Services" ? <ServicesTab data={data} /> : null}
        {tab === "Quotes" ? <QuotesTab data={data} /> : null}
        {tab === "Contracts" ? <ContractsTab data={data} /> : null}
        {tab === "Invoices & payments" ? <InvoicesTab data={data} currency={currency} /> : null}
        {tab === "Notes" ? <NotesTab data={data} /> : null}
        {tab === "Activity" ? <ActivityTab data={data} /> : null}
        {tab === "Files" ? <FilesTab data={data} /> : null}
        {tab === "Settings" ? <SettingsTab data={data} /> : null}
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: ClientWorkspaceData }) {
  const { client, stats } = data;
  const pinned = data.notes.filter((note) => note.pinned);

  return (
    <div className="space-y-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <FormSection title="Position" description="What this client is worth and what is open right now.">
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["MRR", moneyLabel(stats.mrr_cents)],
              ["Invoiced", moneyLabel(stats.invoiced_cents)],
              ["Collected", moneyLabel(stats.paid_cents)],
              ["Outstanding", moneyLabel(stats.outstanding_cents)],
              ["Open tasks", String(stats.open_tasks)],
              ["Waiting on client", String(stats.waiting_tasks)],
              ["Quotes awaiting response", String(stats.quotes_awaiting)],
              ["Contracts unsigned", String(stats.contracts_unsigned)],
              ["Projects", `${stats.active_projects} active · ${stats.total_projects} total`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>
        <FormSection title="Summary" description="Client context as recorded on the client record.">
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {client.notes_summary || "No summary recorded yet."}
          </p>
          <div className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Pinned notes
            </h3>
            {pinned.length === 0 ? (
              <Empty>No pinned notes. Pin one in the Notes tab to keep it visible here.</Empty>
            ) : (
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {pinned.map((note) => (
                  <li key={note.id} className="py-3 text-sm leading-6">
                    {note.body}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FormSection>
      </div>
      <FormSection title="Recent activity" description="The newest logged client communication.">
        {data.communications.length === 0 ? (
          <Empty>No activity logged yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.communications.slice(0, 5).map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="text-sm font-medium">
                  {entry.channel} · {entry.direction === "in" ? "Incoming" : "Outgoing"}
                  {entry.contact_name ? ` · ${entry.contact_name}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
                <p className="mt-1 text-xs text-faint-foreground">
                  {dateTimeLabel(entry.occurred_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

function ContactsTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Contacts" description="People associated with this client.">
      {data.contacts.length === 0 ? (
        <Empty>No contacts yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.contacts.map((contact) => (
            <li key={contact.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium">
                  {contact.name}
                  {contact.is_primary ? (
                    <span className="ml-2 text-xs text-muted-foreground">Primary</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[contact.role, contact.email, contact.phone].filter(Boolean).join(" · ") ||
                    "No additional details"}
                </p>
              </div>
              <DeleteContactForm clientId={data.client.id} id={contact.id} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <ContactForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}

function ProjectsTab({ data, currency }: { data: ClientWorkspaceData; currency: string }) {
  return (
    <FormSection title="Projects" description="Delivery work for this client. Open a project to run it from the workspace.">
      {data.projects.length === 0 ? (
        <Empty>No projects yet. Create one from the Projects page.</Empty>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Project</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Deadline</th>
                <th className="px-3 py-3 font-medium">Progress</th>
                <th className="px-3 py-3 font-medium">Open tasks</th>
                <th className="px-3 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-3 py-4 font-medium">
                    <Link href={project.href} className="underline decoration-border underline-offset-4">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{project.status}</td>
                  <td className="px-3 py-4 text-muted-foreground">{dateLabel(project.deadline)}</td>
                  <td className="px-3 py-4 text-muted-foreground">{project.progress}%</td>
                  <td className="px-3 py-4 text-muted-foreground">{project.open_tasks}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {moneyLabel(project.value_cents, project.currency || currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormSection>
  );
}

function TasksTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Tasks" description="Every task linked to this client, oldest due date first.">
      {data.tasks.length === 0 ? (
        <Empty>No tasks for this client yet. Create one from the Tasks page or inside a project.</Empty>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Priority</th>
                <th className="px-3 py-3 font-medium">Due</th>
                <th className="px-3 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-3 py-4 font-medium">
                    <Link href={task.href} className="underline decoration-border underline-offset-4">
                      {task.title}
                    </Link>
                    {task.project_name ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {task.project_name}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {task.status === "blocked_waiting_client"
                      ? "waiting on client"
                      : task.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-4 text-muted-foreground">{task.priority}</td>
                  <td className="px-3 py-4 text-muted-foreground">{dateLabel(task.due_date)}</td>
                  <td className="px-3 py-4 text-muted-foreground">
                    {hoursLabel(task.actual_minutes)} / {hoursLabel(task.estimated_minutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormSection>
  );
}

function ServicesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Services"
      description="Catalogue services delivered to this client. Recurring amounts drive the dashboard MRR."
    >
      {data.services.length === 0 ? (
        <Empty>No services assigned yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.services.map((assignment) => (
            <li key={assignment.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{assignment.service_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {assignment.billing === "recurring"
                    ? `Recurring · ${moneyLabel(assignment.amount_cents)} ${billingIntervalLabel(
                        assignment.billing_interval
                      )} · ${moneyLabel(assignment.monthly_amount_cents)}/month`
                    : "One-off"}
                  {assignment.started_on ? ` · since ${dateLabel(assignment.started_on)}` : ""}
                </p>
              </div>
              <RemoveServiceForm clientId={data.client.id} id={assignment.id} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Assign a service
        </h3>
        {data.service_catalog.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            The catalogue is empty. Add services in <Link href="/services" className="underline decoration-border underline-offset-4">Services</Link>.
          </p>
        ) : (
          <div className="mt-4">
            <ServiceForm clientId={data.client.id} services={data.service_catalog} compact />
          </div>
        )}
      </div>
    </FormSection>
  );
}

function QuotesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Quotes" description="Proposals sent to this client, including recurring proposals.">
      {data.quotes.length === 0 ? (
        <Empty>No quotes yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.quotes.map((quote) => (
            <li key={quote.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <Link href={quote.href} className="font-medium underline decoration-border underline-offset-4">
                  {quote.number} · {quote.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {quote.status}
                  {quote.is_recurring ? " · includes recurring" : ""} · issued{" "}
                  {dateLabel(quote.issued_on)}
                  {quote.accepted_at ? ` · accepted ${dateLabel(quote.accepted_at)}` : ""}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {moneyLabel(quote.total_cents, quote.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}

function ContractsTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Contracts" description="Agreements for this client and their signature status.">
      {data.contracts.length === 0 ? (
        <Empty>No contracts yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.contracts.map((contract) => (
            <li key={contract.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <Link href={contract.href} className="font-medium underline decoration-border underline-offset-4">
                  {contract.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contract.status} · v{contract.version}
                  {contract.signed_at ? ` · signed ${dateLabel(contract.signed_at)}` : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                updated {dateLabel(contract.updated_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}

function InvoicesTab({
  data,
  currency,
}: {
  data: ClientWorkspaceData;
  currency: string;
}) {
  return (
    <div className="space-y-12">
      <FormSection title="Invoices" description="Billing history with derived balances.">
        {data.invoices.length === 0 ? (
          <Empty>No invoices yet.</Empty>
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
                      <span className="mt-1 block text-xs text-muted-foreground">{invoice.title}</span>
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
      </FormSection>
      <FormSection title="Payments" description="Manual payments recorded against this client's invoices.">
        {data.payments.length === 0 ? (
          <Empty>No payments recorded yet.</Empty>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {data.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">
                    {moneyLabel(payment.amount_cents)} · {payment.method.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {payment.invoice_number} · {payment.kind}
                    {payment.reference ? ` · ${payment.reference}` : ""}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{dateLabel(payment.paid_on)}</span>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

function NotesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Notes" description="Persistent client context. Pin the notes you need to keep visible.">
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
                <DeleteNoteForm clientId={data.client.id} id={note.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <NoteForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}

function ActivityTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection title="Activity" description="Manual log of calls, emails, meetings, and messages.">
      {data.communications.length === 0 ? (
        <Empty>No activity logged yet.</Empty>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {data.communications.map((entry) => (
            <li key={entry.id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {entry.channel} · {entry.direction === "in" ? "Incoming" : "Outgoing"}
                    {entry.contact_name ? ` · ${entry.contact_name}` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {entry.summary}
                  </p>
                  <p className="mt-2 text-xs text-faint-foreground">
                    {dateTimeLabel(entry.occurred_at)}
                  </p>
                </div>
                <DeleteCommunicationForm clientId={data.client.id} id={entry.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6">
        <CommunicationForm
          clientId={data.client.id}
          contacts={data.contacts.map(({ id, name }) => ({ id, name }))}
        />
      </div>
    </FormSection>
  );
}

function FilesTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Files"
      description="Private files in the client-files bucket. Download links are created on demand and expire after one hour."
    >
      <FileLinks
        files={data.files}
        emptyLabel="No files uploaded yet."
        renderDelete={(file) => (
          <DeleteFileForm clientId={data.client.id} id={file.id} storagePath={file.storage_path} />
        )}
      />
      <div className="mt-6">
        <UploadFileForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}

function SettingsTab({ data }: { data: ClientWorkspaceData }) {
  return (
    <FormSection
      title="Client settings"
      description="Edit the client record or archive it when the relationship is no longer active."
    >
      <EditClientForm client={data.client} />
      <div className="mt-10 border-t border-border pt-6">
        <h3 className="text-sm font-medium">Archive</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Archiving removes this client from active lists while preserving its history.
        </p>
        <ArchiveClientForm clientId={data.client.id} />
      </div>
    </FormSection>
  );
}
