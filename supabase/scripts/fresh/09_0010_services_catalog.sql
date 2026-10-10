-- Fresh install step 9: 0010_services_catalog. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0010: service catalogue + recurring revenue inputs
--
-- NUMBERING NOTE (important):
--   Production Supabase already records an out-of-band migration named
--   `0009_sync_client_ready_sales` that is NOT part of this repository. To
--   avoid duplicate migration versions, this repository reserves `0009` for
--   that production-only sync and continues at `0010`. A fresh project
--   applies 0001–0008, skips the reserved 0009, then applies 0010–0013 in
--   numeric order. See supabase/README.md §3 and docs/DATABASE_PLAN.md §13.
--
-- What this migration adds (all additive; 0001–0008 are never altered):
--   A. `services` — default price, billing interval, default estimated time
--      so the catalogue can drive quotes and client assignments.
--   B. `client_services` — interval + interval amount alongside the existing
--      monthly column, with a backfill so existing rows keep their MRR.
--   C. `public.normalized_monthly_cents()` — the single MRR conversion rule
--      (monthly / quarterly / yearly → monthly), used by every read model.
--   D. `quote_line_items.service_id` — quotes can be built from the catalogue.
--   E. `public.get_service_directory()` — one-round-trip service list with
--      assigned clients and MRR per service.
--
-- Recurring revenue definition (documented in docs/DECISIONS.md D-033):
--   an "active recurring client" is a client that is not deleted, is not
--   archived, and has at least one `recurring` client_service row. MRR is the
--   sum of each recurring assignment's normalized monthly amount.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. services: catalogue fields ──────────────────────────────────────────
alter table public.services
  add column if not exists default_price_cents integer;
alter table public.services
  add column if not exists billing_interval text not null default 'monthly';
alter table public.services
  add column if not exists default_estimated_minutes integer;

do $f0010x1$
begin
  if not exists (select 1 from pg_constraint where conname = 'services_default_price_cents_check') then
    alter table public.services add constraint services_default_price_cents_check
      check (default_price_cents is null or default_price_cents >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'services_default_estimated_minutes_check') then
    alter table public.services add constraint services_default_estimated_minutes_check
      check (default_estimated_minutes is null or default_estimated_minutes >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'services_billing_interval_check') then
    alter table public.services add constraint services_billing_interval_check
      check (billing_interval in ('monthly', 'quarterly', 'yearly'));
  end if;
end
$f0010x1$;

comment on column public.services.default_price_cents is
  'Default price in integer minor units (D-012) for the service billing interval.';
comment on column public.services.billing_interval is
  'monthly | quarterly | yearly — interval the default price is billed at.';
comment on column public.services.default_estimated_minutes is
  'Default estimated effort in minutes (D-015) used to prefill tasks/projects.';

-- ── B. client_services: interval + interval amount ─────────────────────────
alter table public.client_services
  add column if not exists billing_interval text not null default 'monthly';
alter table public.client_services
  add column if not exists amount_cents integer;

do $f0010x2$
begin
  if not exists (select 1 from pg_constraint where conname = 'client_services_amount_cents_check') then
    alter table public.client_services add constraint client_services_amount_cents_check
      check (amount_cents is null or amount_cents >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'client_services_billing_interval_check') then
    alter table public.client_services add constraint client_services_billing_interval_check
      check (billing_interval in ('monthly', 'quarterly', 'yearly'));
  end if;
end
$f0010x2$;

-- Backfill: every pre-existing assignment was entered as a monthly amount.
update public.client_services
   set amount_cents = monthly_amount_cents
 where amount_cents is null
   and monthly_amount_cents is not null;

comment on column public.client_services.amount_cents is
  'Amount billed per billing_interval in integer minor units.';
comment on column public.client_services.monthly_amount_cents is
  'Normalized monthly amount (kept in sync by the app) — MRR input, also covers legacy rows.';

-- ── C. MRR conversion helper ───────────────────────────────────────────────
create or replace function public.normalized_monthly_cents(
  p_amount_cents integer,
  p_interval text
)
returns integer
language sql
immutable
set search_path = public
as $f0010x3$
  select case
    when p_amount_cents is null then null
    when p_interval = 'quarterly' then round(p_amount_cents::numeric / 3)::integer
    when p_interval = 'yearly' then round(p_amount_cents::numeric / 12)::integer
    else p_amount_cents
  end;
$f0010x3$;

comment on function public.normalized_monthly_cents(integer, text) is
  'Converts an interval amount into a monthly amount (MRR). Quarterly and yearly divide by 3 and 12.';

revoke execute on function public.normalized_monthly_cents(integer, text) from public, anon;
grant execute on function public.normalized_monthly_cents(integer, text) to authenticated;

-- ── D. Quotes can reference the catalogue ──────────────────────────────────
alter table public.quote_line_items
  add column if not exists service_id uuid references public.services (id) on delete set null;

create index if not exists quote_line_items_service_id_idx
  on public.quote_line_items (service_id);

comment on column public.quote_line_items.service_id is
  'Optional link to the catalogue service this line was built from.';

-- ── E. Service directory read model ────────────────────────────────────────
-- One round trip for /services: catalogue rows plus assignment counts and MRR.
-- security invoker (default) → the owner-only RLS policies from 0005 apply.
create or replace function public.get_service_directory()
returns jsonb
language sql
stable
set search_path = public
as $f0010x4$
  select coalesce(jsonb_agg(entry order by active_rank, name_sort), '[]'::jsonb)
  from (
    select
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'default_billing', s.default_billing,
        'default_price_cents', s.default_price_cents,
        'billing_interval', s.billing_interval,
        'default_estimated_minutes', s.default_estimated_minutes,
        'active', s.active,
        'created_at', s.created_at,
        'assigned_clients', (
          select count(distinct cs.client_id)
          from public.client_services cs
          join public.clients c on c.id = cs.client_id
          where cs.service_id = s.id
            and c.deleted_at is null
            and c.status <> 'archived'
        ),
        'recurring_clients', (
          select count(distinct cs.client_id)
          from public.client_services cs
          join public.clients c on c.id = cs.client_id
          where cs.service_id = s.id
            and cs.billing = 'recurring'
            and c.deleted_at is null
            and c.status <> 'archived'
        ),
        'one_off_clients', (
          select count(distinct cs.client_id)
          from public.client_services cs
          join public.clients c on c.id = cs.client_id
          where cs.service_id = s.id
            and cs.billing = 'one_off'
            and c.deleted_at is null
            and c.status <> 'archived'
        ),
        'mrr_cents', (
          select coalesce(sum(coalesce(
            public.normalized_monthly_cents(cs.amount_cents, cs.billing_interval),
            cs.monthly_amount_cents,
            0
          )), 0)
          from public.client_services cs
          join public.clients c on c.id = cs.client_id
          where cs.service_id = s.id
            and cs.billing = 'recurring'
            and c.deleted_at is null
            and c.status <> 'archived'
        )
      ) as entry,
      (case when s.active then 0 else 1 end) as active_rank,
      lower(s.name) as name_sort
    from public.services s
  ) rows;
$f0010x4$;

comment on function public.get_service_directory() is
  'Service catalogue with assignment counts and normalized MRR per service (one RPC round trip).';

revoke execute on function public.get_service_directory() from public, anon;
grant execute on function public.get_service_directory() to authenticated;

commit;
