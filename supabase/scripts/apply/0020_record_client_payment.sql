-- Migration 0020_record_client_payment — run in the Supabase SQL editor. Wrapped in a transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0020: record a payment received in one step
--
-- Total Revenue is the sum of payments received. Until now a payment could only be
-- added to an existing invoice, so a one-time fee ("built a website, charged $2,500")
-- never reached the dashboard unless an invoice was created first. This function
-- creates a PAID invoice (one line item) and its payment in a single transaction,
-- so the fee shows up in Total Revenue immediately and stays auditable in the
-- invoice/payment ledger. Security INVOKER: RLS (is_owner()) applies.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.record_client_payment(
  p_client_id uuid,
  p_description text,
  p_amount_cents integer,
  p_paid_on date default null,
  p_method text default 'other',
  p_project_id uuid default null,
  p_reference text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $m0020x1$
declare
  v_paid_on date := coalesce(p_paid_on, current_date);
  v_currency text;
  v_year text := to_char(v_paid_on, 'YYYY');
  v_next integer;
  v_number text;
  v_invoice uuid;
  v_description text := trim(coalesce(p_description, ''));
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Enter an amount greater than zero';
  end if;
  if length(v_description) = 0 or length(v_description) > 200 then
    raise exception 'Describe what the payment was for (up to 200 characters)';
  end if;
  if p_method not in ('bank_transfer', 'cash', 'card', 'other', 'stripe') then
    raise exception 'Invalid payment method';
  end if;
  if not exists (select 1 from public.clients c where c.id = p_client_id and c.deleted_at is null) then
    raise exception 'Client not found';
  end if;
  if p_project_id is not null
     and not exists (select 1 from public.projects p where p.id = p_project_id and p.client_id = p_client_id) then
    raise exception 'That project does not belong to this client';
  end if;

  select coalesce((select s.default_currency from public.settings s where s.id = 1), 'USD') into v_currency;

  -- Serialise number allocation so two quick saves cannot pick the same number.
  perform pg_advisory_xact_lock(hashtext('invoice-number'));
  select coalesce(max((regexp_match(i.number, '^INV-' || v_year || '-(\d+)$'))[1]::integer), 0) + 1
    into v_next
  from public.invoices i
  where i.number ~ ('^INV-' || v_year || '-\d+$');
  v_number := 'INV-' || v_year || '-' || lpad(v_next::text, 4, '0');

  insert into public.invoices (
    client_id, project_id, number, title, status, issued_on, due_on, currency,
    subtotal_cents, discount_cents, tax_cents, total_cents, deposit_cents, paid_cents, balance_cents
  ) values (
    p_client_id, p_project_id, v_number, v_description, 'sent', v_paid_on, v_paid_on, v_currency,
    p_amount_cents, 0, 0, p_amount_cents, 0, 0, p_amount_cents
  ) returning id into v_invoice;

  insert into public.invoice_line_items (invoice_id, sort_order, description, qty, unit_amount_cents, amount_cents)
  values (v_invoice, 0, v_description, 1, p_amount_cents, p_amount_cents);

  -- The payment trigger recalculates paid/balance and flips the invoice to 'paid'.
  insert into public.payments (invoice_id, amount_cents, paid_on, method, kind, reference)
  values (v_invoice, p_amount_cents, v_paid_on, p_method::public.payment_method, 'full', nullif(trim(coalesce(p_reference, '')), ''));

  return v_invoice;
end;
$m0020x1$;

revoke execute on function public.record_client_payment(uuid, text, integer, date, text, uuid, text) from public, anon;
grant execute on function public.record_client_payment(uuid, text, integer, date, text, uuid, text) to authenticated;

commit;
