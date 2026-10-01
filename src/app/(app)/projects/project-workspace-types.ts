import type { WorkspaceMilestone, WorkspaceTask } from "./project-workspace-forms";

export type ProjectRow = {
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

export type Totals = {
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

export type TimeEntry = {
  id: string;
  minutes: number;
  worked_on: string;
  note: string | null;
  task_id: string | null;
  task_title: string | null;
  created_at: string;
};

export type NoteRow = { id: string; body: string; pinned: boolean; created_at: string };

export type FileMeta = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type QuoteRow = {
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

export type ContractRow = {
  id: string;
  title: string;
  status: string;
  version: number;
  signed_at: string | null;
  quote_id: string | null;
  linked: boolean;
  href: string;
};

export type InvoiceRow = {
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

export type PaymentRow = {
  id: string;
  invoice_id: string;
  invoice_number: string;
  amount_cents: number;
  paid_on: string;
  method: string;
  kind: string;
  voided_at?: string | null;
};

export type ServiceRow = {
  id: string;
  service_name: string;
  billing: string;
  billing_interval: string;
  amount_cents: number | null;
  monthly_amount_cents: number | null;
};

export type ActivityRow = { id: string; label: string; occurred_at: string | null };

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
