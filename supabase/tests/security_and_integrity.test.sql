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

-- ── Venmo payment method (0022) ────────────────────────────────────────────
reset role;
reset request.jwt.claim.sub;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';   -- owner
select public.record_client_payment('10000000-0000-0000-0000-000000000001', 'Logo refresh', 5000, '2026-10-05', 'venmo') as venmo_inv \gset
select set_config('t.venmo_inv', :'venmo_inv', false);
do $$
begin
  assert (select method::text from public.payments where invoice_id = current_setting('t.venmo_inv')::uuid) = 'venmo', 'venmo payment stored';
end $$;
select pg_temp.expect_error($q$select public.record_client_payment('10000000-0000-0000-0000-000000000001', 'x', 100, null, 'bitcoin')$q$, 'Invalid payment method');
reset role;

-- ── unified work items (0023) ──────────────────────────────────────────────
reset role;
reset request.jwt.claim.sub;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';   -- owner
insert into public.projects (id, client_id, name) values ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Site build');
insert into public.contacts (id, client_id, name, is_primary) values ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Jo Client', true);
insert into public.tasks (project_id, title) values ('30000000-0000-0000-0000-000000000003', 'Plain task');
insert into public.tasks (project_id, title, kind, severity, requester_contact_id, source)
  values ('30000000-0000-0000-0000-000000000003', 'Login fails on Safari', 'bug', 'critical', '40000000-0000-0000-0000-000000000004', 'client');
insert into public.tasks (project_id, title, kind, source)
  values ('30000000-0000-0000-0000-000000000003', 'Add dark mode', 'feature_request', 'client');
select pg_temp.expect_error($q$insert into public.tasks (project_id, title, kind, severity) values ('30000000-0000-0000-0000-000000000003', 'x', 'task', 'high')$q$, 'tasks_severity_only_for_bugs');
select pg_temp.expect_error($q$insert into public.tasks (project_id, title, source) values ('30000000-0000-0000-0000-000000000003', 'x', 'carrier-pigeon')$q$, 'tasks_source_check');
do $$
declare w jsonb := public.get_project_work_items('30000000-0000-0000-0000-000000000003');
begin
  assert jsonb_array_length(w -> 'items') = 2, 'plain tasks are not work items; bug + feature are';
  assert (w ->> 'open_bugs')::int = 1 and (w ->> 'open_critical')::int = 1 and (w ->> 'open_feature_requests')::int = 1, 'counts';
  assert (w -> 'items' -> 0 ->> 'title') = 'Login fails on Safari', 'critical bug sorts first';
  assert (w -> 'items' -> 0 ->> 'requester_name') = 'Jo Client', 'requester name joined';
  assert jsonb_array_length(w -> 'contacts') = 1, 'client contacts offered as requesters';
end $$;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';   -- stranger
do $$ begin assert jsonb_array_length(public.get_project_work_items('30000000-0000-0000-0000-000000000003') -> 'items') = 0, 'stranger sees no work items'; end $$;
reset role;
set role anon;
select pg_temp.expect_error($q$select public.get_project_work_items('30000000-0000-0000-0000-000000000003')$q$, 'permission denied');
reset role;

-- ── recurring shoot schedules (0024) ───────────────────────────────────────
reset role;
reset request.jwt.claim.sub;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';   -- owner
insert into public.shoot_schedules (id, client_id, title, frequency, weekday, starts_on, ends_on, checklist)
  values ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Weekly Tuesday shoot', 'weekly', 2, '2026-10-06', '2026-11-30', '["Charge batteries","Shot list"]');
insert into public.shoot_schedules (id, client_id, title, frequency, weekday, starts_on, ends_on)
  values ('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Every other Tuesday', 'biweekly', 2, '2026-10-06', '2026-11-30');
insert into public.shoot_schedules (id, client_id, title, frequency, weekday, week_of_month, starts_on, ends_on)
  values ('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'First Tuesday', 'monthly', 2, 1, '2026-10-06', '2026-11-30');
insert into public.shoot_schedules (id, client_id, title, frequency, weekday, week_of_month, starts_on, ends_on)
  values ('50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Last Friday', 'monthly', 5, 5, '2026-10-01', '2026-12-31');
select pg_temp.expect_error($q$insert into public.shoot_schedules (client_id, title, frequency, weekday) values ('10000000-0000-0000-0000-000000000001', 'x', 'monthly', 2)$q$, 'shoot_schedules_check');
do $$ begin
  assert public.generate_shoots('50000000-0000-0000-0000-000000000005', '2026-11-03', false, '2026-10-05') = 5, 'weekly Tuesdays Oct 6,13,20,27 + Nov 3';
  assert public.generate_shoots('50000000-0000-0000-0000-000000000005', '2026-11-03', false, '2026-10-05') = 0, 'generating twice creates no duplicates';
  assert public.generate_shoots('50000000-0000-0000-0000-000000000006', '2026-11-30', false, '2026-10-05') = 4, 'every other Tuesday: Oct 6, Oct 20, Nov 3, Nov 17';
  assert public.generate_shoots('50000000-0000-0000-0000-000000000007', '2026-11-30', false, '2026-10-05') = 2, 'first Tuesday: Oct 6, Nov 3';
  assert public.generate_shoots('50000000-0000-0000-0000-000000000008', '2026-12-31', false, '2026-10-05') = 3, 'last Friday: Oct 30, Nov 27, Dec 25';
  assert (select jsonb_array_length(checklist) from public.shoots where schedule_id = '50000000-0000-0000-0000-000000000005' limit 1) = 2, 'checklist template copied';
  assert (select (checklist -> 0 ->> 'done')::boolean from public.shoots where schedule_id = '50000000-0000-0000-0000-000000000005' limit 1) = false, 'checklist starts unticked';
end $$;
-- confirmed shoots survive a reset; planned ones are regenerated
update public.shoots set status = 'confirmed' where schedule_id = '50000000-0000-0000-0000-000000000005' and shoot_date = '2026-10-13';
do $$ begin
  assert public.generate_shoots('50000000-0000-0000-0000-000000000005', '2026-11-03', true, '2026-10-05') = 4, 'reset recreates only the planned ones';
  assert (select status from public.shoots where schedule_id = '50000000-0000-0000-0000-000000000005' and shoot_date = '2026-10-13') = 'confirmed', 'confirmed shoot kept';
end $$;
update public.shoot_schedules set active = false where id = '50000000-0000-0000-0000-000000000006';
do $$
declare o jsonb := public.get_shoots_overview('10000000-0000-0000-0000-000000000001', '2026-10-05');
begin
  assert public.generate_shoots('50000000-0000-0000-0000-000000000006', '2026-12-31', false, '2026-10-05') = 0, 'paused schedule generates nothing';
  assert jsonb_array_length(o -> 'schedules') = 4, 'overview lists schedules';
  assert jsonb_array_length(o -> 'upcoming') > 0, 'overview lists upcoming shoots';
  assert (o -> 'schedules' -> 0 ->> 'next_shoot') is not null, 'next shoot reported';
end $$;
-- atomic save: create, then edit (reset rebuilds planned shoots only)
select (public.save_shoot_schedule(null, jsonb_build_object(
  'client_id', '10000000-0000-0000-0000-000000000001', 'title', 'Reels day', 'frequency', 'weekly',
  'weekday', extract(dow from current_date)::int, 'starts_on', current_date, 'ends_on', current_date + 28,
  'checklist', jsonb_build_array('Charge batteries'))) ->> 'id')::uuid as saved_id \gset
select set_config('t.saved_id', :'saved_id', false);
do $$ begin
  assert (select count(*) from public.shoots where schedule_id = current_setting('t.saved_id')::uuid) >= 1, 'save_shoot_schedule generated shoots';
end $$;
select pg_temp.expect_error(format('select public.save_shoot_schedule(null, %L::jsonb)', '{"client_id":"10000000-0000-0000-0000-000000000001","title":"Bad","frequency":"monthly","weekday":2}'), 'shoot_schedules_check');
select pg_temp.expect_error(format('select public.save_shoot_schedule(%L, %L::jsonb)', gen_random_uuid(), '{"client_id":"10000000-0000-0000-0000-000000000001","title":"x","frequency":"weekly","weekday":1}'), 'Schedule not found');
select pg_temp.expect_error($q$select public.generate_shoots(gen_random_uuid())$q$, 'Schedule not found');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';   -- stranger
do $$ begin
  assert (select count(*) from public.shoots) = 0 and (select count(*) from public.shoot_schedules) = 0, 'stranger sees no shoots';
  assert jsonb_array_length(public.get_shoots_overview() -> 'upcoming') = 0, 'stranger overview empty';
end $$;
select pg_temp.expect_error($q$insert into public.shoots (client_id, title, shoot_date) values ('10000000-0000-0000-0000-000000000001', 'x', '2026-12-01')$q$, 'row-level security');
reset role;
set role anon;
select pg_temp.expect_error($q$select public.generate_shoots('50000000-0000-0000-0000-000000000005')$q$, 'permission denied');
select pg_temp.expect_error($q$select public.get_shoots_overview()$q$, 'permission denied');
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
