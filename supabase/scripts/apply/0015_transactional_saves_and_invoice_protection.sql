-- Migration 0015_transactional_saves_and_invoice_protection — run in the Supabase SQL editor. Wrapped in a transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0015: atomic quote/invoice saves + financial record protection
-- (audit BUGS B-004, B-005)
--
--   A. `save_quote()` / `save_invoice()` — header + line items in ONE
--      transaction. Previously the app deleted the lines, then inserted them,
--      then (for updates) had already rewritten the header; any failure left a
--      quote or invoice with missing or stale lines.
--      Both are SECURITY INVOKER, so RLS (owner-only, 0014) and the
--      accepted-quote immutability triggers (0008) still apply.
--   B. Invoices that are not drafts can no longer be deleted (void them), and
--      an invoice with payments can never be deleted: payments → invoice is
--      now ON DELETE RESTRICT instead of CASCADE.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. save_quote ──────────────────────────────────────────────────────────
create or replace function public.save_quote(
  p_id uuid,
  p_header jsonb,
  p_lines jsonb,
  p_token text default null,
  p_token_hash text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $m0015x1$
declare
  h public.quotes%rowtype;
  v_id uuid;
begin
  if jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'Line items must be a JSON array';
  end if;

  h := jsonb_populate_record(null::public.quotes, p_header);

  if p_id is null then
    if p_token is null or p_token_hash is null then
      raise exception 'A public token is required for new quotes';
    end if;
    insert into public.quotes (
      client_id, number, title, notes, status, issued_on, valid_until, currency,
      subtotal_cents, discount_cents, tax_rate, tax_cents, total_cents,
      public_token, public_token_hash
    ) values (
      h.client_id, h.number, h.title, h.notes, h.status, h.issued_on, h.valid_until, h.currency,
      h.subtotal_cents, h.discount_cents, h.tax_rate, h.tax_cents, h.total_cents,
      p_token, p_token_hash
    ) returning id into v_id;
  else
    update public.quotes q set
      client_id = h.client_id, number = h.number, title = h.title, notes = h.notes,
      status = h.status, issued_on = h.issued_on, valid_until = h.valid_until,
      currency = h.currency, subtotal_cents = h.subtotal_cents,
      discount_cents = h.discount_cents, tax_rate = h.tax_rate,
      tax_cents = h.tax_cents, total_cents = h.total_cents
    where q.id = p_id
    returning q.id into v_id;
    if v_id is null then raise exception 'Quote not found'; end if;
  end if;

  delete from public.quote_line_items where quote_id = v_id;
  insert into public.quote_line_items (
    quote_id, sort_order, service_id, description, details, qty, unit_amount_cents,
    is_recurring, billing_period, amount_cents, selection, option_group
  )
  select v_id, coalesce(l.sort_order, 0), l.service_id, l.description, l.details,
         coalesce(l.qty, 1), coalesce(l.unit_amount_cents, 0),
         coalesce(l.is_recurring, false), l.billing_period, coalesce(l.amount_cents, 0),
         coalesce(l.selection, 'fixed'), l.option_group
  from jsonb_populate_recordset(null::public.quote_line_items, p_lines) l;

  return v_id;
end;
$m0015x1$;

-- ── A. save_invoice ────────────────────────────────────────────────────────
create or replace function public.save_invoice(
  p_id uuid,
  p_header jsonb,
  p_lines jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $m0015x2$
declare
  h public.invoices%rowtype;
  v_id uuid;
  v_paid integer;
begin
  if jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'Line items must be a JSON array';
  end if;

  h := jsonb_populate_record(null::public.invoices, p_header);

  if p_id is null then
    insert into public.invoices (
      client_id, project_id, quote_id, contract_id, number, title, status,
      issued_on, due_on, currency, subtotal_cents, discount_cents, tax_cents,
      total_cents, deposit_cents, paid_cents, balance_cents
    ) values (
      h.client_id, h.project_id, h.quote_id, h.contract_id, h.number, h.title, h.status,
      h.issued_on, h.due_on, h.currency, h.subtotal_cents, h.discount_cents, h.tax_cents,
      h.total_cents, h.deposit_cents, 0, h.total_cents
    ) returning id into v_id;
  else
    select i.paid_cents into v_paid from public.invoices i where i.id = p_id for update;
    if not found then raise exception 'Invoice not found'; end if;
    if h.total_cents < v_paid then
      raise exception 'Invoice total cannot be lower than payments already recorded';
    end if;
    update public.invoices i set
      client_id = h.client_id, project_id = h.project_id, quote_id = h.quote_id,
      contract_id = h.contract_id, number = h.number, title = h.title, status = h.status,
      issued_on = h.issued_on, due_on = h.due_on, currency = h.currency,
      subtotal_cents = h.subtotal_cents, discount_cents = h.discount_cents,
      tax_cents = h.tax_cents, total_cents = h.total_cents,
      deposit_cents = h.deposit_cents, balance_cents = h.total_cents - v_paid
    where i.id = p_id
    returning i.id into v_id;
  end if;

  delete from public.invoice_line_items where invoice_id = v_id;
  insert into public.invoice_line_items (
    invoice_id, sort_order, description, qty, unit_amount_cents, amount_cents
  )
  select v_id, coalesce(l.sort_order, 0), l.description, coalesce(l.qty, 1),
         coalesce(l.unit_amount_cents, 0), coalesce(l.amount_cents, 0)
  from jsonb_populate_recordset(null::public.invoice_line_items, p_lines) l;

  return v_id;
end;
$m0015x2$;

revoke execute on function public.save_quote(uuid, jsonb, jsonb, text, text) from public, anon;
revoke execute on function public.save_invoice(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_quote(uuid, jsonb, jsonb, text, text) to authenticated;
grant execute on function public.save_invoice(uuid, jsonb, jsonb) to authenticated;

-- ── B. financial record protection ─────────────────────────────────────────
do $m0015x3$
declare fk text;
begin
  select c.conname into fk
  from pg_constraint c
  where c.conrelid = 'public.payments'::regclass
    and c.contype = 'f'
    and c.confrelid = 'public.invoices'::regclass;
  if fk is not null then
    execute format('alter table public.payments drop constraint %I', fk);
  end if;
  alter table public.payments
    add constraint payments_invoice_id_fkey
    foreign key (invoice_id) references public.invoices (id) on delete restrict;
end
$m0015x3$;

create or replace function public.protect_issued_invoice()
returns trigger
language plpgsql
set search_path = public
as $m0015x4$
begin
  if old.status <> 'draft' then
    raise exception 'Only draft invoices can be deleted. Void the invoice instead.';
  end if;
  return old;
end;
$m0015x4$;

drop trigger if exists invoices_protect_issued on public.invoices;
create trigger invoices_protect_issued
  before delete on public.invoices
  for each row execute function public.protect_issued_invoice();

revoke execute on function public.protect_issued_invoice() from public, anon, authenticated;

commit;
