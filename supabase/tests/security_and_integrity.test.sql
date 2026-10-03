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

-- ── payment ledger (0016) ──────────────────────────────────────────────────
update public.invoices set status = 'sent';   -- back from the draft used above
select id as pay_id from public.payments limit 1 \gset
select pg_temp.expect_error('delete from public.payments', 'permanent records');
select pg_temp.expect_error(format('update public.payments set amount_cents = 1 where id = %L', :'pay_id'), 'cannot be edited');
select pg_temp.expect_error(format('update public.payments set voided_at = now() where id = %L', :'pay_id'), 'payments_void_reason_check');
update public.payments set voided_at = now(), void_reason = 'entered twice' where id = :'pay_id';
do $$ begin
  assert (select paid_cents from public.invoices) = 0, 'voided payment excluded from paid';
  assert (select balance_cents from public.invoices) = 1000, 'balance restored after void';
  assert (select status from public.invoices) = 'sent', 'status un-sticks after void';
  assert (select count(*) from public.payments) = 1, 'voided payment stays in ledger';
  assert (public.get_client_workspace('10000000-0000-0000-0000-000000000001') -> 'payments' -> 0 ->> 'voided_at') is not null, 'workspace exposes voided_at';
end $$;
select pg_temp.expect_error(format('update public.payments set voided_at = null where id = %L', :'pay_id'), 'cannot be changed');

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

-- ── contract signature evidence (0016) ─────────────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
insert into public.contracts (client_id, title, status, body, public_token, public_token_hash)
values ('10000000-0000-0000-0000-000000000001', 'MSA', 'sent', 'Terms v1', 'ctok', 'ctokhash');
reset request.jwt.claim.sub;
set role anon;
select public.sign_public_contract('ctokhash', 'Jane Doe', '203.0.113.9', 'UA/1.0', 'I agree') is not null as signed;
reset role;
do $$ begin
  assert (select signer_ip from public.contracts) = '203.0.113.9', 'ip recorded';
  assert (select signer_user_agent from public.contracts) = 'UA/1.0', 'ua recorded';
  assert (select consent_text from public.contracts) = 'I agree', 'consent recorded';
  assert (select signed_body_sha256 from public.contracts) = encode(sha256('Terms v1'::bytea), 'hex'), 'body hash recorded';
end $$;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select pg_temp.expect_error($q$update public.contracts set signer_ip = '1.1.1.1'$q$, 'immutable');
reset role;

-- ── invoice summary (0017) ─────────────────────────────────────────────────
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$
declare s jsonb := public.get_invoice_summary('2026-12-01');
begin
  assert (s ->> 'invoice_count')::int = 1, 'one invoice';
  assert (s ->> 'revenue_cents')::int = 0, 'voided payment is not revenue';
  assert (s ->> 'outstanding_cents')::int = 1000, 'sent invoice outstanding';
  assert (s ->> 'overdue_count')::int = 1, 'past-due invoice counted overdue';
end $$;
update public.invoices set status = 'void';
do $$
declare s jsonb := public.get_invoice_summary('2026-12-01');
begin
  assert (s ->> 'outstanding_cents')::int = 0, 'void invoice is not outstanding';
  assert (s ->> 'overdue_count')::int = 0, 'void invoice is not overdue';
end $$;
reset role;

-- ── team access + revenue summary (0018) ───────────────────────────────────
reset role;
reset request.jwt.claim.sub;
truncate public.payments cascade;
set session_replication_role = replica;  -- bypass the issued-invoice delete guard for test cleanup
delete from public.invoices;
reset session_replication_role;
insert into public.invoices (id, client_id, number, title, status, issued_on, due_on, currency, subtotal_cents, total_cents, balance_cents)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'INV-9', 'Rev', 'sent', '2026-10-01', '2026-10-30', 'USD', 5000, 5000, 5000),
       ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'INV-10', 'Draft', 'draft', '2026-10-01', '2026-10-30', 'USD', 900, 900, 900);
insert into public.payments (invoice_id, amount_cents, paid_on, kind) values
  ('20000000-0000-0000-0000-000000000001', 1500, '2026-10-02', 'deposit'),
  ('20000000-0000-0000-0000-000000000001', 700, '2026-09-15', 'partial');
insert into public.payments (invoice_id, amount_cents, paid_on, kind, voided_at, void_reason) values
  ('20000000-0000-0000-0000-000000000001', 9999, '2026-10-03', 'partial', now(), 'mistake');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
do $$
declare s jsonb := public.get_revenue_summary('2026-10-20');
begin
  assert (s ->> 'total_revenue_cents')::int = 2200, 'total revenue = received, non-voided payments only';
  assert (s ->> 'revenue_this_month_cents')::int = 1500, 'this month only';
  assert (s ->> 'outstanding_cents')::int = 2800, 'outstanding excludes drafts: 5000 - 2200';
  assert (s ->> 'mixed_currency')::boolean = false, 'single currency';
end $$;

-- stranger sees zero until the owner authorises them
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
do $$ begin assert (public.get_revenue_summary('2026-10-20') ->> 'total_revenue_cents')::int = 0, 'stranger sees no revenue'; end $$;
reset role;
insert into public.app_team (user_id) values ('00000000-0000-0000-0000-0000000000b2');
set role authenticated;
do $$ begin
  assert public.is_owner(), 'team member passes is_owner()';
  assert (public.get_revenue_summary('2026-10-20') ->> 'total_revenue_cents')::int = 2200, 'team member sees revenue';
end $$;
select pg_temp.expect_error($q$insert into public.app_team (user_id) values (gen_random_uuid())$q$, 'permission denied');
reset role;
delete from public.app_team;

-- ── website leads (0019) ───────────────────────────────────────────────────
reset role;
reset request.jwt.claim.sub;
set role anon;
select public.submit_lead('Pat Example', 'Example Co', 'Pat@Example.com', null, array['software','websites'], '$5k–$15k', 'Need a CRM', 'hash-1') as lead_id \gset
select pg_temp.expect_error($q$select public.submit_lead('', null, 'a@b.co', null, '{}', null, null)$q$, 'Please enter your name');
select pg_temp.expect_error($q$select public.submit_lead('X', null, 'not-an-email', null, '{}', null, null)$q$, 'valid email');
select pg_temp.expect_error($q$select public.submit_lead('X', null, 'x@y.co', null, array['hacking'], null, null)$q$, 'Invalid service');
do $$ begin assert (select count(*) from public.leads) = 0, 'anon cannot read leads'; end $$;
reset role;
select public.submit_lead('B', null, 'pat@example.com', null, '{}', null, null);
select public.submit_lead('C', null, 'pat@example.com', null, '{}', null, null);
set role anon;
select pg_temp.expect_error($q$select public.submit_lead('D', null, 'PAT@example.com', null, '{}', null, null)$q$, 'Too many requests');
reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';   -- stranger (not on the team any more)
do $$ begin assert (select count(*) from public.leads) = 0, 'stranger cannot read leads'; end $$;
select pg_temp.expect_error(format('select public.convert_lead_to_client(%L)', :'lead_id'), 'Lead not found');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';   -- owner
select public.convert_lead_to_client(:'lead_id') as new_client \gset
do $$ begin
  assert (select status from public.leads where id = (select id from public.leads order by created_at limit 1)) = 'converted', 'lead converted';
  assert (select count(*) from public.contacts where client_id = (select client_id from public.leads where status = 'converted')) = 1, 'primary contact created';
  assert (select source from public.clients order by created_at desc limit 1) = 'website', 'client source';
end $$;
reset role;

-- ── record a payment in one step (0020) ────────────────────────────────────
reset role;
reset request.jwt.claim.sub;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';   -- owner
select public.record_client_payment('10000000-0000-0000-0000-000000000001', 'Website build (one-time)', 250000, '2026-10-05', 'bank_transfer') as paid_inv \gset
select set_config('t.paid_inv', :'paid_inv', false);
do $$
declare s jsonb; inv uuid := current_setting('t.paid_inv')::uuid;
begin
  assert (select status from public.invoices where id = inv) = 'paid', 'one-step payment invoice is paid';
  assert (select balance_cents from public.invoices where id = inv) = 0, 'no balance left';
  assert (select count(*) from public.payments where invoice_id = inv and amount_cents = 250000) = 1, 'payment recorded';
  assert (select number from public.invoices where id = inv) ~ '^INV-2026-\d{4}$', 'invoice number allocated';
  s := public.get_revenue_summary('2026-10-20');
  assert (s ->> 'total_revenue_cents')::int = 252200, 'one-time fee counts toward Total Revenue';
end $$;
select pg_temp.expect_error($q$select public.record_client_payment('10000000-0000-0000-0000-000000000001', 'x', 0)$q$, 'greater than zero');
select pg_temp.expect_error($q$select public.record_client_payment('10000000-0000-0000-0000-000000000001', '', 100)$q$, 'Describe what');
select pg_temp.expect_error($q$select public.record_client_payment('20000000-0000-0000-0000-000000000002', 'x', 100)$q$, 'Client not found');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';   -- stranger: RLS hides the client
select pg_temp.expect_error($q$select public.record_client_payment('10000000-0000-0000-0000-000000000001', 'x', 100)$q$, 'Client not found');
reset role;
set role anon;
select pg_temp.expect_error($q$select public.record_client_payment('10000000-0000-0000-0000-000000000001', 'x', 100)$q$, 'permission denied');
reset role;

-- ── marketing campaigns + social posts (0021) ──────────────────────────────
reset role;
reset request.jwt.claim.sub;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';   -- owner
insert into public.marketing_campaigns (client_id, name, channel, budget_cents)
  values ('10000000-0000-0000-0000-000000000001', 'Spring promo', 'meta_ads', 150000);
insert into public.social_posts (client_id, platform, format, caption)
  values ('10000000-0000-0000-0000-000000000001', 'instagram', 'reel', 'Before / after');
do $$ begin
  assert (select count(*) from public.marketing_campaigns) = 1, 'owner reads campaigns';
  assert (select count(*) from public.social_posts) = 1, 'owner reads posts';
end $$;
select pg_temp.expect_error($q$insert into public.marketing_campaigns (client_id, name, spend_cents) values ('10000000-0000-0000-0000-000000000001', 'x', -1)$q$, 'spend_cents');
select pg_temp.expect_error($q$insert into public.marketing_campaigns (client_id, name, starts_on, ends_on) values ('10000000-0000-0000-0000-000000000001', 'x', '2026-10-10', '2026-10-01')$q$, 'check');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';   -- stranger
do $$ begin
  assert (select count(*) from public.marketing_campaigns) = 0, 'stranger cannot read campaigns';
  assert (select count(*) from public.social_posts) = 0, 'stranger cannot read posts';
end $$;
select pg_temp.expect_error($q$insert into public.social_posts (client_id) values ('10000000-0000-0000-0000-000000000001')$q$, 'row-level security');
reset role;
set role anon;
do $$ begin
  assert (select count(*) from public.marketing_campaigns) = 0, 'anon cannot read campaigns';
  assert (select count(*) from public.social_posts) = 0, 'anon cannot read posts';
end $$;
reset role;
