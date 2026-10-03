import type { CatalogService } from "./client-forms";

export type Contact = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
};

export type ClientProject = {
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

export type ClientTask = {
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

export type ServiceAssignment = {
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

export type QuoteRow = {
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

export type ContractRow = {
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
  project_id: string | null;
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
  reference: string | null;
  voided_at?: string | null;
};

export type NoteRow = { id: string; body: string; pinned: boolean; created_at: string };

export type CommunicationRow = {
  id: string;
  channel: string;
  direction: string;
  summary: string;
  occurred_at: string;
  contact_id: string | null;
  contact_name: string | null;
};

export type FileMeta = {
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
