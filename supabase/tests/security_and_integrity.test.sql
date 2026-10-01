-- Run by supabase/tests/run.sh after all migrations are applied.
-- Fails (ON_ERROR_STOP) on the first broken expectation.
\set ON_ERROR_STOP on

create or replace function pg_temp.expect_error(sql text, fragment text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'EXPECTED ERROR containing "%" but statement succeeded: %', fragment, sql;
exception when others then
  if sqlerrm like 'EXPECTED ERROR%' then raise; end if;
  if position(fragment in sqlerrm) = 0 then
    raise exception 'wrong error for [%]: got "%", wanted "%"', sql, sqlerrm, fragment;
  end if;
end $$;

-- Two users: the first inserted becomes owner, the second is a stranger.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.com'),
  ('00000000-0000-0000-0000-0000000000b2', 'stranger@example.com');

do $$ begin
  assert (select user_id from public.app_owner) = '00000000-0000-0000-0000-0000000000a1', 'first user must be owner';
end $$;

-- ── owner can work ─────────────────────────────────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';

insert into public.clients (id, name) values ('10000000-0000-0000-0000-000000000001', 'Acme');
do $$ begin assert public.is_owner(), 'owner is_owner'; end $$;

-- atomic quote save
select public.save_quote(null,
  '{"client_id":"10000000-0000-0000-0000-000000000001","number":"Q-1","title":"Site","status":"draft","issued_on":"2026-10-01","currency":"USD","subtotal_cents":1000,"discount_cents":0,"tax_rate":0,"tax_cents":0,"total_cents":1000}'::jsonb,
  '[{"sort_order":0,"description":"Design","qty":1,"unit_amount_cents":1000,"amount_cents":1000,"selection":"fixed","is_recurring":false}]'::jsonb,
  'tok', 'tokhash') as quote_id \gset
do $$ begin assert (select count(*) from public.quote_line_items) = 1, 'quote line inserted'; end $$;

-- a failing line set must roll back the whole save (header AND lines untouched)
select pg_temp.expect_error($q$
  select public.save_quote(
    (select id from public.quotes), 
    '{"client_id":"10000000-0000-0000-0000-000000000001","number":"Q-1","title":"CHANGED","status":"draft","issued_on":"2026-10-01","currency":"USD","subtotal_cents":5,"discount_cents":0,"tax_rate":0,"tax_cents":0,"total_cents":5}'::jsonb,
    '[{"sort_order":0,"description":"","qty":1,"unit_amount_cents":1,"amount_cents":1,"selection":"fixed"}]'::jsonb)
$q$, 'description_check');
do $$ begin
  assert (select title from public.quotes) = 'Site', 'quote header rolled back';
  assert (select count(*) from public.quote_line_items) = 1, 'quote lines preserved after failed save';
end $$;

-- invoice: save, pay, protect
select public.save_invoice(null,
  '{"client_id":"10000000-0000-0000-0000-000000000001","number":"INV-1","title":"Inv","status":"sent","issued_on":"2026-10-01","due_on":"2026-10-15","currency":"USD","subtotal_cents":1000,"discount_cents":0,"tax_cents":0,"total_cents":1000,"deposit_cents":0}'::jsonb,
  '[{"sort_order":0,"description":"Work","qty":1,"unit_amount_cents":1000,"amount_cents":1000}]'::jsonb) as inv_id \gset
insert into public.payments (invoice_id, amount_cents) values (:'inv_id', 400);
do $$ begin assert (select balance_cents from public.invoices) = 600, 'balance derived'; end $$;

select pg_temp.expect_error(format('select public.save_invoice(%L, %L::jsonb, %L::jsonb)', :'inv_id',
  '{"client_id":"10000000-0000-0000-0000-000000000001","number":"INV-1","title":"Inv","status":"sent","issued_on":"2026-10-01","due_on":"2026-10-15","currency":"USD","subtotal_cents":100,"discount_cents":0,"tax_cents":0,"total_cents":100,"deposit_cents":0}',
  '[{"sort_order":0,"description":"Work","qty":1,"unit_amount_cents":100,"amount_cents":100}]'),
  'lower than payments');
select pg_temp.expect_error(format('delete from public.invoices where id = %L', :'inv_id'), 'Only draft invoices');
update public.invoices set status = 'draft';
select pg_temp.expect_error('delete from public.invoices', 'violates foreign key');

-- ── stranger sees and does nothing ─────────────────────────────────────────
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
do $$ begin
  assert not public.is_owner(), 'stranger is not owner';
  assert (select count(*) from public.clients) = 0, 'stranger reads no clients';
  assert (select count(*) from public.invoices) = 0, 'stranger reads no invoices';
  assert (select count(*) from public.settings) = 0, 'stranger reads no settings';
end $$;
select pg_temp.expect_error($q$insert into public.clients (name) values ('Evil')$q$, 'row-level security');
select pg_temp.expect_error($q$select * from public.app_owner$q$, 'permission denied');
select pg_temp.expect_error($q$select public.convert_quote_to_project('00000000-0000-0000-0000-000000000000')$q$, 'Authentication required');

-- ── anonymous visitors ─────────────────────────────────────────────────────
reset request.jwt.claim.sub;
set role anon;
do $$ begin
  assert (select count(*) from public.clients) = 0, 'anon reads no clients';
  assert public.get_public_quote('nope') is null, 'unknown public token yields nothing';
end $$;
select pg_temp.expect_error($q$select public.refresh_invoice_statuses()$q$, 'Authentication required');
reset role;
