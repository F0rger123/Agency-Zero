-- Fresh install step 17: 0017_invoice_summary. Run in the Supabase SQL editor. One transaction: all or nothing.
begin;
-- ═══════════════════════════════════════════════════════════════════════════
-- Agency Zero — 0017: invoice KPIs as a server-side aggregate
--
-- The invoices page computed its KPIs by summing the rows it had loaded. Once
-- the list is bounded (audit B-008) that would understate revenue, and it also
-- counted void/draft invoices as "outstanding". This read model computes the
-- totals over ALL invoices in Postgres:
--   revenue     = money actually received (sum of non-voided payments, which is
--                 invoices.paid_cents, on every invoice including void ones)
--   outstanding = unpaid balance on issued, non-void invoices (draft excluded)
--   overdue     = issued, non-void, balance > 0 and past due
-- Security invoker: RLS (owner-only) applies.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_invoice_summary(p_today date default null)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $f0017x1$
  select jsonb_build_object(
    'invoice_count', count(*),
    'revenue_cents', coalesce(sum(i.paid_cents), 0),
    'outstanding_cents', coalesce(sum(i.balance_cents) filter (where i.status not in ('draft', 'void')), 0),
    'overdue_count', count(*) filter (
      where i.status not in ('draft', 'void', 'paid')
        and i.balance_cents > 0
        and i.due_on < coalesce(p_today, current_date)
    ),
    'currency', coalesce((select i2.currency from public.invoices i2 order by i2.created_at desc limit 1), 'USD')
  )
  from public.invoices i;
$f0017x1$;

revoke execute on function public.get_invoice_summary(date) from public, anon;
grant execute on function public.get_invoice_summary(date) to authenticated;

commit;
