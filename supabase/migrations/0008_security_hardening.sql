-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0008: security hardening + client-ready sales documents
--
-- Two concerns, one additive migration (0001–0007 are never altered):
--
-- A. Function hardening (Supabase security-lint findings):
--    - `set_updated_at()` from 0001 is pinned to search_path = public.
--    - EXECUTE is revoked on the trigger functions `handle_new_user()` and
--      `recalculate_invoice_payment()`. Trigger invocation does not check
--      EXECUTE privilege, so the triggers keep working; this only blocks
--      direct RPC/sql calls from API roles.
--
-- B. Client-ready quotes, contracts, and immutable acceptance:
--    - quote line items gain packages/options (`option_group`, `selection`)
--      and richer `details`; quotes store the customer's selection snapshot.
--    - the public quote RPCs expose the new fields and `respond_public_quote`
--      records a validated selection + server-computed accepted totals.
--    - contract views are marked via a new narrow public RPC; a starter
--      services-agreement template is seeded.
--    - trigger-level immutability: accepted quotes, their line items, signed
--      contracts, and contract version history cannot be altered or removed
--      by any role, including the owner.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A1. Pin set_updated_at() to the intended schema ─────────────────────────
alter function public.set_updated_at() set search_path = public;

-- ── A2. These functions exist only to be fired as triggers ─────────────────
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.recalculate_invoice_payment() from public, anon, authenticated;

-- ── B1. Quotes: packages/options, optional items, selection snapshots ──────

-- A line item is: `fixed` (always part of the proposal), `optional` (an
-- add-on the customer toggles on the public page), or `choice` (one of
-- several mutually exclusive package alternatives inside an `option_group`,
-- e.g. "Package selection" = Basic / Standard / Premium, pick at most one).
alter table public.quote_line_items add column details text;
alter table public.quote_line_items add column option_group text;
alter table public.quote_line_items add column selection text not null default 'fixed';
alter table public.quote_line_items
  add constraint quote_line_items_selection_check
  check (selection in ('fixed', 'optional', 'choice'));
alter table public.quote_line_items
  add constraint quote_line_items_choice_needs_group
  check (selection <> 'choice' or nullif(trim(option_group), '') is not null);

-- Set by the customer response: which optional/choice items were accepted
-- and the server-computed totals for that selection.
alter table public.quotes add column responded_by text;
alter table public.quotes add column selected_item_ids uuid[] not null default '{}';
alter table public.quotes add column accepted_subtotal_cents integer;
alter table public.quotes add column accepted_total_cents integer;

-- ── B2. Public quote RPCs reflect the richer document ──────────────────────
create or replace function public.get_public_quote(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', q.id, 'number', q.number, 'title', q.title, 'notes', q.notes,
    'status', q.status,
    'issued_on', q.issued_on, 'valid_until', q.valid_until, 'currency', q.currency,
    'subtotal_cents', q.subtotal_cents, 'discount_cents', q.discount_cents,
    'tax_rate', q.tax_rate, 'tax_cents', q.tax_cents, 'total_cents', q.total_cents,
    'viewed_at', q.viewed_at, 'accepted_at', q.accepted_at, 'rejected_at', q.rejected_at,
    'responded_by', q.responded_by,
    'selected_item_ids', q.selected_item_ids,
    'accepted_subtotal_cents', q.accepted_subtotal_cents,
    'accepted_total_cents', q.accepted_total_cents,
    'client_name', c.name, 'company', c.company,
    'business_name', (select s.business_name from public.settings s where s.id = 1),
    'line_items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', li.id, 'sort_order', li.sort_order,
        'description', li.description, 'details', li.details,
        'qty', li.qty, 'unit_amount_cents', li.unit_amount_cents,
        'is_recurring', li.is_recurring, 'billing_period', li.billing_period,
        'amount_cents', li.amount_cents,
        'option_group', li.option_group, 'selection', li.selection
      ) order by li.sort_order)
      from public.quote_line_items li where li.quote_id = q.id
    ), '[]'::jsonb)
  )
  from public.quotes q
  join public.clients c on c.id = q.client_id
  where q.public_token_hash = p_token_hash
    and q.status in ('sent', 'viewed', 'accepted', 'rejected')
    and (q.token_expires_at is null or q.token_expires_at > now());
$$;

-- The response RPC gains the (server-validated) selection and responder name.
-- The old two-argument identity is dropped so calls stay unambiguous.
drop function if exists public.respond_public_quote(text, text);

create or replace function public.respond_public_quote(
  p_token_hash text,
  p_decision text,
  p_selected_item_ids uuid[] default null,
  p_responded_by text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.quotes%rowtype;
  selected uuid[];
  bad integer;
  conflicts integer;
  subtotal integer;
  discount integer;
  tax integer;
  responder text;
  result jsonb;
begin
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'Invalid quote decision';
  end if;

  responder := nullif(trim(coalesce(p_responded_by, '')), '');
  if responder is not null and length(responder) > 160 then
    raise exception 'Responder name must be 160 characters or fewer';
  end if;

  select * into q from public.quotes
  where public_token_hash = p_token_hash
    and (token_expires_at is null or token_expires_at > now())
  for update;

  if not found then
    raise exception 'This quote is no longer available for a response';
  end if;
  if q.status not in ('sent', 'viewed') then
    raise exception 'This quote is no longer available for a response';
  end if;

  if p_decision = 'rejected' then
    update public.quotes
    set status = 'rejected'::quote_status,
        viewed_at = coalesce(viewed_at, now()),
        rejected_at = now(),
        responded_by = responder
    where id = q.id;
    return jsonb_build_object('status', 'rejected', 'rejected_at', now());
  end if;

  -- Accepted: validate the customer's selection against the line item rules.
  selected := null;
  if p_selected_item_ids is not null then
    select coalesce(array_agg(distinct item), '{}') into selected
    from unnest(p_selected_item_ids) as item;

    select count(*) into bad
    from unnest(selected) as item
    where not exists (
      select 1 from public.quote_line_items li
      where li.quote_id = q.id
        and li.id = item
        and li.selection in ('optional', 'choice')
    );
    if bad > 0 then
      raise exception 'The selection contains items that cannot be selected';
    end if;

    select count(*) into conflicts
    from (
      select li.option_group
      from public.quote_line_items li
      where li.quote_id = q.id
        and li.selection = 'choice'
        and li.id = any (selected)
      group by li.option_group
      having count(*) > 1
    ) picks;
    if conflicts > 0 then
      raise exception 'Choose at most one item per package option';
    end if;
  end if;

  -- Server-computed snapshot: every fixed item plus the validated selection.
  select coalesce(sum(li.amount_cents), 0)::integer into subtotal
  from public.quote_line_items li
  where li.quote_id = q.id
    and (li.selection = 'fixed' or (selected is not null and li.id = any (selected)));

  discount := least(q.discount_cents, subtotal);
  tax := round((subtotal - discount) * q.tax_rate / 100)::integer;

  update public.quotes
  set status = 'accepted'::quote_status,
      viewed_at = coalesce(viewed_at, now()),
      accepted_at = now(),
      responded_by = responder,
      selected_item_ids = coalesce(selected, '{}'),
      accepted_subtotal_cents = subtotal,
      accepted_total_cents = subtotal - discount + tax
  where id = q.id;

  select jsonb_build_object(
    'status', status, 'accepted_at', accepted_at,
    'accepted_subtotal_cents', accepted_subtotal_cents,
    'accepted_total_cents', accepted_total_cents
  ) into result from public.quotes where id = q.id;
  return result;
end;
$$;

revoke execute on function public.respond_public_quote(text, text, uuid[], text) from public;
grant execute on function public.respond_public_quote(text, text, uuid[], text) to anon, authenticated;

-- ── B3. Mark contract views (quotes already had this hardening pattern) ────
create or replace function public.mark_public_contract_viewed(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  update public.contracts
  set viewed_at = coalesce(viewed_at, now())
  where public_token_hash = p_token_hash
    and (token_expires_at is null or token_expires_at > now())
    and status = 'sent';
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke execute on function public.mark_public_contract_viewed(text) from public;
grant execute on function public.mark_public_contract_viewed(text) to anon, authenticated;

-- ── B4. Immutability: accepted quotes and signed contracts ─────────────────
-- Owner edits are allowed while a document is in play; from the moment a
-- customer accepts/signs it, the financial/legal content is frozen for every
-- role. Only bookkeeping columns stay writable: updated_at, token rotation,
-- quote → project conversion, and quote/project association links.

create or replace function public.protect_accepted_quote()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status = 'accepted'::public.quote_status then
    if tg_op = 'DELETE' then
      raise exception 'Accepted quotes cannot be deleted; they are a permanent record.';
    end if;
    if new.status is distinct from old.status
      or new.client_id is distinct from old.client_id
      or new.number is distinct from old.number
      or new.title is distinct from old.title
      or new.notes is distinct from old.notes
      or new.currency is distinct from old.currency
      or new.issued_on is distinct from old.issued_on
      or new.valid_until is distinct from old.valid_until
      or new.subtotal_cents is distinct from old.subtotal_cents
      or new.discount_cents is distinct from old.discount_cents
      or new.tax_rate is distinct from old.tax_rate
      or new.tax_cents is distinct from old.tax_cents
      or new.total_cents is distinct from old.total_cents
      or new.viewed_at is distinct from old.viewed_at
      or new.accepted_at is distinct from old.accepted_at
      or new.rejected_at is distinct from old.rejected_at
      or new.responded_by is distinct from old.responded_by
      or new.selected_item_ids is distinct from old.selected_item_ids
      or new.accepted_subtotal_cents is distinct from old.accepted_subtotal_cents
      or new.accepted_total_cents is distinct from old.accepted_total_cents
    then
      raise exception 'Accepted quotes are immutable. Create a new quote instead.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger quotes_protect_accepted
  before update or delete on public.quotes
  for each row execute function public.protect_accepted_quote();

create or replace function public.protect_accepted_quote_items()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select q.status from public.quotes q
      where q.id = coalesce(new.quote_id, old.quote_id)) = 'accepted'::public.quote_status then
    raise exception 'Line items of an accepted quote are immutable.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger quote_line_items_protect_accepted
  before insert or update or delete on public.quote_line_items
  for each row execute function public.protect_accepted_quote_items();

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
    then
      raise exception 'Signed contracts are immutable.';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger contracts_protect_signed
  before update or delete on public.contracts
  for each row execute function public.protect_signed_contract();

create or replace function public.protect_contract_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Contract version history is immutable.';
end;
$$;

create trigger contract_versions_protect
  before update or delete on public.contract_versions
  for each row execute function public.protect_contract_version();

-- The protection functions are trigger-only internals.
revoke execute on function public.protect_accepted_quote() from public, anon, authenticated;
revoke execute on function public.protect_accepted_quote_items() from public, anon, authenticated;
revoke execute on function public.protect_signed_contract() from public, anon, authenticated;
revoke execute on function public.protect_contract_version() from public, anon, authenticated;

-- ── B5. Seed a starter template so the catalogue works out of the box ──────
-- Rendered with the placeholders supported by the app: {{business_name}},
-- {{client_name}}, {{client_company}}, {{contract_title}}, {{quote_number}},
-- {{date}}.
insert into public.contract_templates (name, body, active)
values (
  'Standard services agreement',
  'SERVICES AGREEMENT

This Services Agreement ("{{contract_title}}") is entered into on {{date}} between {{business_name}} (the "Agency") and {{client_name}}{{client_company}} (the "Client"). It relates to proposal {{quote_number}}, whose scope and pricing form part of this agreement.

1. Services. The Agency will provide the services described in the referenced proposal. Changes to scope must be agreed by both parties in writing.

2. Fees and payment. The Client will pay the fees stated in the referenced proposal. Recurring services are invoiced for each agreed billing period until either party ends the engagement in writing.

3. Timeline. The Agency will use commercially reasonable efforts to meet the milestones in the referenced proposal. Dates may shift when the Client does not provide required materials, decisions, or access in time.

4. Client responsibilities. The Client will provide timely access to information, materials, approvals, and third-party accounts reasonably required to deliver the services.

5. Intellectual property. On full payment, deliverables created specifically for the Client are assigned to the Client. The Agency retains its pre-existing tools, methods, and reusable components.

6. Confidentiality. Each party will keep the other party''s non-public business information confidential and use it only for this engagement.

7. Liability. Neither party is liable for indirect or consequential damages. The Agency''s total liability under this agreement is limited to the fees paid for the services giving rise to the claim.

8. Termination. Either party may end this agreement with 30 days written notice. The Client pays for work performed and committed recurring periods up to the effective end date.

9. Governing terms. This agreement and the referenced proposal are the entire agreement between the parties for the services, and replace prior discussions.

Agreed and accepted by the signature recorded with the Agency.',
  true
)
on conflict (name) do nothing;
