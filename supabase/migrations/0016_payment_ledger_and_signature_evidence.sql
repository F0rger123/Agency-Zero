-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0016: permanent payment ledger + e-signature evidence
-- (audit BUGS B-011, finding S3)
--
--   A. Payments are never deleted or edited. A mistaken payment is VOIDED
--      (`voided_at` + mandatory `void_reason`); voided rows stay in the ledger,
--      are excluded from invoice totals, and a void cannot be undone (record a
--      new payment instead). Enforced by a trigger, so it holds for every
--      client, not just this app.
--   B. Invoice status is re-derived correctly when a payment is voided
--      (e.g. `paid` → `partially_paid`/`sent`).
--   C. The client and project workspace read models also return `voided_at`
--      for each payment (patched in place so 0012/0013 stay untouched).
--   D. Contract signatures now capture evidence: IP address, user agent, the
--      exact consent statement shown, and a SHA-256 of the signed body.
--      Signed contracts remain immutable, including the new columns.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. payment ledger ──────────────────────────────────────────────────────
alter table public.payments
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text;

alter table public.payments drop constraint if exists payments_void_reason_check;
alter table public.payments
  add constraint payments_void_reason_check
  check (voided_at is null or length(trim(coalesce(void_reason, ''))) > 0);

create or replace function public.protect_payment_ledger()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Payments are permanent records and cannot be deleted. Void the payment instead.';
  end if;
  if new.invoice_id is distinct from old.invoice_id
    or new.amount_cents is distinct from old.amount_cents
    or new.paid_on is distinct from old.paid_on
    or new.method is distinct from old.method
    or new.kind is distinct from old.kind
    or new.reference is distinct from old.reference
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Payment details cannot be edited. Void the payment and record a new one.';
  end if;
  if old.voided_at is not null
    and (new.voided_at is distinct from old.voided_at or new.void_reason is distinct from old.void_reason)
  then
    raise exception 'A voided payment cannot be changed or restored. Record a new payment instead.';
  end if;
  return new;
end;
$$;

drop trigger if exists payments_protect_ledger on public.payments;
create trigger payments_protect_ledger
  before update or delete on public.payments
  for each row execute function public.protect_payment_ledger();

revoke execute on function public.protect_payment_ledger() from public, anon, authenticated;

-- ── B. recalculation ignores voided payments and un-sticks invoice status ──
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
  from public.payments p where p.invoice_id = invoice_uuid and p.voided_at is null;
  update public.invoices
  set paid_cents = paid,
      balance_cents = total - paid,
      status = case
        when current_status = 'void' then 'void'::invoice_status
        when total > 0 and paid >= total then 'paid'::invoice_status
        when paid > 0 then 'partially_paid'::invoice_status
        when current_status in ('paid', 'partially_paid') then 'sent'::invoice_status
        when due < current_date and current_status in ('sent', 'overdue') then 'overdue'::invoice_status
        else current_status
      end
  where id = invoice_uuid;
  return coalesce(new, old);
end;
$$;

revoke execute on function public.recalculate_invoice_payment() from public, anon, authenticated;

-- ── C. read models expose voided_at ────────────────────────────────────────
do $$
declare
  fn text;
  def text;
  patched text;
begin
  foreach fn in array array['public.get_client_workspace(uuid)', 'public.get_project_workspace(uuid)']
  loop
    def := pg_get_functiondef(fn::regprocedure);
    patched := replace(def, '''method'', pm.method, ''kind'', pm.kind', '''method'', pm.method, ''kind'', pm.kind, ''voided_at'', pm.voided_at');
    if patched = def then
      raise exception '0016: could not patch % (payments projection changed)', fn;
    end if;
    execute patched;
  end loop;
end
$$;

-- ── D. signature evidence ──────────────────────────────────────────────────
alter table public.contracts
  add column if not exists signer_ip text,
  add column if not exists signer_user_agent text,
  add column if not exists consent_text text,
  add column if not exists signed_body_sha256 text;

create or replace function public.protect_signed_contract()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'signed'::public.contract_status then
    if tg_op = 'DELETE' then
      raise exception 'Signed contracts cannot be deleted; they are a permanent record.';
    end if;
    if new.status is distinct from old.status
      or new.client_id is distinct from old.client_id
      or new.title is distinct from old.title
      or new.body is distinct from old.body
      or new.template_id is distinct from old.template_id
      or new.version is distinct from old.version
      or new.viewed_at is distinct from old.viewed_at
      or new.signed_at is distinct from old.signed_at
      or new.signer_name is distinct from old.signer_name
      or new.signed_snapshot is distinct from old.signed_snapshot
      or new.signed_file_path is distinct from old.signed_file_path
      or new.signer_ip is distinct from old.signer_ip
      or new.signer_user_agent is distinct from old.signer_user_agent
      or new.consent_text is distinct from old.consent_text
      or new.signed_body_sha256 is distinct from old.signed_body_sha256
    then
      raise exception 'Signed contracts are immutable.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

-- Replace the 2-argument signer with one that records evidence.
drop function if exists public.sign_public_contract(text, text);

create or replace function public.sign_public_contract(
  p_token_hash text,
  p_signer_name text,
  p_signer_ip text default null,
  p_signer_user_agent text default null,
  p_consent_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if length(trim(p_signer_name)) < 2 or length(trim(p_signer_name)) > 160 then
    raise exception 'Enter a valid signer name';
  end if;
  update public.contracts
  set status = 'signed'::contract_status,
      signer_name = trim(p_signer_name),
      signed_at = now(),
      signed_snapshot = body,
      signed_body_sha256 = encode(sha256(convert_to(body, 'UTF8')), 'hex'),
      signer_ip = left(nullif(trim(p_signer_ip), ''), 64),
      signer_user_agent = left(nullif(trim(p_signer_user_agent), ''), 400),
      consent_text = left(nullif(trim(p_consent_text), ''), 1000),
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

revoke execute on function public.sign_public_contract(text, text, text, text, text) from public;
grant execute on function public.sign_public_contract(text, text, text, text, text) to anon, authenticated;
