-- Agency Zero — 0006: sales (quotes, contracts, invoices, payments)
-- MASTER_SPEC §§4.6–4.8. Public quote/contract links use hashed tokens and
-- narrow security-definer functions; internal tables remain owner-only.

create type public.quote_status as enum ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
create type public.contract_status as enum ('draft', 'sent', 'signed', 'void');
create type public.invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void');
create type public.payment_method as enum ('bank_transfer', 'cash', 'card', 'other', 'stripe');
create type public.payment_kind as enum ('deposit', 'partial', 'full');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  number text not null unique,
  title text not null default 'Proposal',
  notes text,
  status public.quote_status not null default 'draft',
  issued_on date not null default current_date,
  valid_until date,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  tax_rate numeric not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  public_token text not null unique,
  public_token_hash text not null unique,
  token_expires_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  converted_project_id uuid references public.projects (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  sort_order integer not null default 0,
  description text not null check (length(trim(description)) > 0),
  qty numeric not null default 1 check (qty > 0),
  unit_amount_cents integer not null default 0 check (unit_amount_cents >= 0),
  is_recurring boolean not null default false,
  billing_period text check (billing_period is null or billing_period in ('month', 'quarter', 'year')),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_client_id_idx on public.quotes (client_id, created_at desc);
create index quotes_status_idx on public.quotes (status, valid_until);
create index quote_line_items_quote_id_idx on public.quote_line_items (quote_id, sort_order);

create table public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  quote_id uuid references public.quotes (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  status public.contract_status not null default 'draft',
  body text not null,
  template_id uuid references public.contract_templates (id) on delete set null,
  version integer not null default 1 check (version > 0),
  public_token text not null unique,
  public_token_hash text not null unique,
  token_expires_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signed_snapshot text,
  signed_file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quote_id is not null or project_id is not null or client_id is not null)
);

create table public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  version integer not null check (version > 0),
  body text not null,
  created_at timestamptz not null default now(),
  unique (contract_id, version)
);

create index contracts_client_id_idx on public.contracts (client_id, created_at desc);
create index contracts_status_idx on public.contracts (status);
create index contract_versions_contract_id_idx on public.contract_versions (contract_id, version desc);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  project_id uuid references public.projects (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  number text not null unique,
  title text not null default 'Invoice',
  status public.invoice_status not null default 'draft',
  issued_on date not null default current_date,
  due_on date not null,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  deposit_cents integer not null default 0 check (deposit_cents >= 0),
  paid_cents integer not null default 0 check (paid_cents >= 0),
  balance_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  sort_order integer not null default 0,
  description text not null check (length(trim(description)) > 0),
  qty numeric not null default 1 check (qty > 0),
  unit_amount_cents integer not null default 0 check (unit_amount_cents >= 0),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  paid_on date not null default current_date,
  method public.payment_method not null default 'other',
  kind public.payment_kind not null default 'partial',
  reference text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_client_id_idx on public.invoices (client_id, issued_on desc);
create index invoices_status_due_idx on public.invoices (status, due_on);
create index invoice_line_items_invoice_id_idx on public.invoice_line_items (invoice_id, sort_order);
create index payments_invoice_id_idx on public.payments (invoice_id, paid_on desc);

-- ── Updated timestamps ─────────────────────────────────────────────────────
create trigger quotes_set_updated_at before update on public.quotes for each row execute function public.set_updated_at();
create trigger quote_line_items_set_updated_at before update on public.quote_line_items for each row execute function public.set_updated_at();
create trigger contract_templates_set_updated_at before update on public.contract_templates for each row execute function public.set_updated_at();
create trigger contracts_set_updated_at before update on public.contracts for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger invoice_line_items_set_updated_at before update on public.invoice_line_items for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

-- ── RLS: sales records are private to the owner ────────────────────────────
alter table public.quotes enable row level security;
alter table public.quote_line_items enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.payments enable row level security;

create policy "Owner manages quotes" on public.quotes for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages quote line items" on public.quote_line_items for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages contract templates" on public.contract_templates for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages contracts" on public.contracts for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner views contract versions" on public.contract_versions for select to authenticated
  using ((select auth.uid()) is not null);
create policy "Owner creates contract versions" on public.contract_versions for insert to authenticated
  with check ((select auth.uid()) is not null);
create policy "Owner manages invoices" on public.invoices for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages invoice line items" on public.invoice_line_items for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "Owner manages payments" on public.payments for all to authenticated
  using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);

-- ── Payment totals/status are derived from real payment rows ───────────────
create or replace function public.recalculate_invoice_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_uuid uuid;
  paid integer;
  total integer;
  due date;
  current_status invoice_status;
begin
  invoice_uuid := coalesce(new.invoice_id, old.invoice_id);
  select i.total_cents, i.due_on, i.status into total, due, current_status
  from public.invoices i where i.id = invoice_uuid;
  select coalesce(sum(p.amount_cents), 0)::integer into paid
  from public.payments p where p.invoice_id = invoice_uuid;
  update public.invoices
  set paid_cents = paid,
      balance_cents = total - paid,
      status = case
        when current_status = 'void' then 'void'::invoice_status
        when total > 0 and paid >= total then 'paid'::invoice_status
        when paid > 0 then 'partially_paid'::invoice_status
        when due < current_date and current_status in ('sent', 'partially_paid', 'overdue') then 'overdue'::invoice_status
        else current_status
      end
  where id = invoice_uuid;
  return coalesce(new, old);
end;
$$;

create trigger payments_recalculate_invoice
  after insert or update or delete on public.payments
  for each row execute function public.recalculate_invoice_payment();

create or replace function public.refresh_invoice_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.invoices
  set status = 'overdue'::invoice_status
  where status in ('sent', 'partially_paid') and due_on < current_date and paid_cents < total_cents;
end;
$$;

-- ── Public secure quote functions ─────────────────────────────────────────
create or replace function public.mark_public_quote_viewed(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  update public.quotes
  set viewed_at = coalesce(viewed_at, now()),
      status = case when status = 'sent' then 'viewed'::quote_status else status end
  where public_token_hash = p_token_hash
    and (token_expires_at is null or token_expires_at > now())
    and status in ('sent', 'viewed');
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

create or replace function public.get_public_quote(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', q.id, 'number', q.number, 'title', q.title, 'status', q.status,
    'issued_on', q.issued_on, 'valid_until', q.valid_until, 'currency', q.currency,
    'subtotal_cents', q.subtotal_cents, 'discount_cents', q.discount_cents,
    'tax_rate', q.tax_rate, 'tax_cents', q.tax_cents, 'total_cents', q.total_cents,
    'viewed_at', q.viewed_at, 'accepted_at', q.accepted_at, 'rejected_at', q.rejected_at,
    'client_name', c.name, 'company', c.company,
    'line_items', coalesce((select jsonb_agg(to_jsonb(li) - 'quote_id' order by li.sort_order)
      from public.quote_line_items li where li.quote_id = q.id), '[]'::jsonb)
  )
  from public.quotes q
  join public.clients c on c.id = q.client_id
  where q.public_token_hash = p_token_hash
    and q.status in ('sent', 'viewed', 'accepted', 'rejected')
    and (q.token_expires_at is null or q.token_expires_at > now());
$$;

create or replace function public.respond_public_quote(p_token_hash text, p_decision text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if p_decision not in ('accepted', 'rejected') then raise exception 'Invalid quote decision'; end if;
  update public.quotes
  set status = p_decision::quote_status,
      viewed_at = coalesce(viewed_at, now()),
      accepted_at = case when p_decision = 'accepted' then now() else accepted_at end,
      rejected_at = case when p_decision = 'rejected' then now() else rejected_at end
  where public_token_hash = p_token_hash
    and (token_expires_at is null or token_expires_at > now())
    and status in ('sent', 'viewed');
  if not found then raise exception 'This quote is no longer available for a response'; end if;
  select jsonb_build_object('status', status, 'accepted_at', accepted_at, 'rejected_at', rejected_at)
    into result from public.quotes where public_token_hash = p_token_hash;
  return result;
end;
$$;

create or replace function public.convert_quote_to_project(p_quote_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare q public.quotes%rowtype; project_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into q from public.quotes where id = p_quote_id for update;
  if not found then raise exception 'Quote not found'; end if;
  if q.status <> 'accepted' then raise exception 'Only accepted quotes can become projects'; end if;
  if q.converted_project_id is not null then return q.converted_project_id; end if;
  insert into public.projects (client_id, name, description, status, value_cents, currency, progress)
  values (q.client_id, q.title, 'Created from accepted quote ' || q.number, 'planning', q.total_cents, q.currency, 0)
  returning id into project_uuid;
  update public.quotes set converted_project_id = project_uuid where id = q.id;
  return project_uuid;
end;
$$;

grant execute on function public.mark_public_quote_viewed(text) to anon, authenticated;
grant execute on function public.get_public_quote(text) to anon, authenticated;
grant execute on function public.respond_public_quote(text, text) to anon, authenticated;
grant execute on function public.convert_quote_to_project(uuid) to authenticated;
grant execute on function public.refresh_invoice_statuses() to authenticated;

-- ── Public secure contract functions ──────────────────────────────────────
create or replace function public.get_public_contract(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'status', c.status, 'body', c.body,
    'version', c.version, 'signed_at', c.signed_at, 'signer_name', c.signer_name,
    'client_name', cl.name, 'company', cl.company
  )
  from public.contracts c
  join public.clients cl on cl.id = c.client_id
  where c.public_token_hash = p_token_hash
    and c.status in ('sent', 'signed')
    and (c.token_expires_at is null or c.token_expires_at > now());
$$;

create or replace function public.sign_public_contract(p_token_hash text, p_signer_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if length(trim(p_signer_name)) < 2 or length(trim(p_signer_name)) > 160 then raise exception 'Enter a valid signer name'; end if;
  update public.contracts
  set status = 'signed'::contract_status,
      signer_name = trim(p_signer_name),
      signed_at = now(),
      signed_snapshot = body,
      viewed_at = coalesce(viewed_at, now())
  where public_token_hash = p_token_hash
    and (token_expires_at is null or token_expires_at > now())
    and status = 'sent';
  if not found then raise exception 'This contract is no longer available for signing'; end if;
  select jsonb_build_object('status', status, 'signed_at', signed_at, 'signer_name', signer_name)
    into result from public.contracts where public_token_hash = p_token_hash;
  return result;
end;
$$;

grant execute on function public.get_public_contract(text) to anon, authenticated;
grant execute on function public.sign_public_contract(text, text) to anon, authenticated;
