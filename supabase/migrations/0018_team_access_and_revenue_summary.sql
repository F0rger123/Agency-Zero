-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0018: authorised team access + real revenue read model
--
--   A. `public.app_team` — users the owner explicitly authorises to use the
--      CRM. `public.is_owner()` (the single check behind every RLS policy and
--      the /app layout) now returns true for the owner OR a team member, so no
--      policy needs rewriting. The table has RLS enabled with no policies:
--      nobody can add themselves through the API. Grant access with SQL, e.g.
--        insert into public.app_team (user_id) select id from auth.users where email = 'person@example.com';
--      and revoke with `delete from public.app_team where user_id = '…';`.
--   B. `public.get_revenue_summary(p_today)` — money actually RECEIVED:
--        total_revenue_cents       = sum of every non-voided payment (one-time
--                                    jobs, deposits, installments, recurring)
--        revenue_this_month_cents  = same, paid_on within p_today's month
--        outstanding_cents         = unpaid balance on issued, non-void invoices
--      Quoted values, drafts and unpaid invoices never count as revenue.
--      Security invoker: RLS applies. `mixed_currency` is true when payments
--      exist in more than one currency (amounts are then not directly addable).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. team access ─────────────────────────────────────────────────────────
create table if not exists public.app_team (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('member')),
  granted_at timestamptz not null default now()
);

comment on table public.app_team is
  'Users explicitly authorised (by the owner, via SQL) to use the CRM. Not readable or writable through the API.';

alter table public.app_team enable row level security;
revoke all on public.app_team from anon, authenticated;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_owner o where o.user_id = (select auth.uid()))
      or exists (select 1 from public.app_team t where t.user_id = (select auth.uid()));
$$;

revoke execute on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ── B. revenue summary ─────────────────────────────────────────────────────
create or replace function public.get_revenue_summary(p_today date default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select date_trunc('month', coalesce(p_today, current_date))::date as month_start,
           (date_trunc('month', coalesce(p_today, current_date)) + interval '1 month')::date as month_end
  ),
  received as (
    select
      coalesce(sum(p.amount_cents), 0)::bigint as total_cents,
      coalesce(sum(p.amount_cents) filter (
        where p.paid_on >= b.month_start and p.paid_on < b.month_end
      ), 0)::bigint as month_cents,
      count(distinct i.currency) as currencies
    from public.payments p
    join public.invoices i on i.id = p.invoice_id
    cross join bounds b
    where p.voided_at is null
  ),
  owed as (
    select coalesce(sum(i.balance_cents), 0)::bigint as outstanding_cents
    from public.invoices i
    where i.status not in ('draft', 'void')
  )
  select jsonb_build_object(
    'total_revenue_cents', r.total_cents,
    'revenue_this_month_cents', r.month_cents,
    'outstanding_cents', o.outstanding_cents,
    'mixed_currency', r.currencies > 1,
    'currency', coalesce(
      (select i2.currency from public.invoices i2 order by i2.created_at desc limit 1),
      (select s.default_currency from public.settings s where s.id = 1),
      'USD')
  )
  from received r cross join owed o;
$$;

revoke execute on function public.get_revenue_summary(date) from public, anon;
grant execute on function public.get_revenue_summary(date) to authenticated;
