-- Read-only: shows which database updates are applied. Safe to run any time. Changes nothing.
select * from (
  select '0020' as migration, 'record_client_payment()' as what,
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'record_client_payment') as ok
  union all
  select '0022', 'Venmo payment method',
         exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'payment_method' and e.enumlabel = 'venmo')
  union all
  select '0023', 'bugs / feature requests (tasks.kind)',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'tasks' and column_name = 'kind')
  union all
  select '0023', 'get_project_work_items()',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'get_project_work_items')
  union all
  select '0024', 'content shoots tables',
         to_regclass('public.shoot_schedules') is not null and to_regclass('public.shoots') is not null
  union all
  select '0024', 'save_shoot_schedule() / generate_shoots()',
         (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('save_shoot_schedule', 'generate_shoots')) = 2
  union all
  select '0025', 'project phases + templates',
         to_regclass('public.project_phases') is not null and to_regclass('public.project_templates') is not null
  union all
  select '0025', 'apply_project_template()',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'apply_project_template')
  union all
  select '0026', 'passkeys tables',
         to_regclass('public.passkeys') is not null and to_regclass('public.passkey_challenges') is not null
  union all
  select '0027', 'meetings table',
         to_regclass('public.meetings') is not null
  union all
  select '0027', 'estimates + client portal (quotes.kind, clients.portal_token)',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quotes' and column_name = 'kind')
         and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'clients' and column_name = 'portal_token')
  union all
  select '0027', 'get_public_portal()',
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'get_public_portal')
  union all
  select '0028', 'phone-only inquiries (leads.email can be empty)',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'leads' and column_name = 'email' and is_nullable = 'YES')
  union all
  select '0029', 'Lock In sessions table',
         to_regclass('public.lock_in_sessions') is not null
  union all
  select '0030', 'service categories (services.category)',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'services' and column_name = 'category')
  union all
  select '0031', 'to-do list table',
         to_regclass('public.todos') is not null
  union all
  select '0032', 'call whiteboards',
         to_regclass('public.whiteboards') is not null
         and exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'get_public_whiteboard')
  union all
  select '0033', 'meeting workspace (meetings.questions, whiteboards.meeting_id)',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'meetings' and column_name = 'questions')
         and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'whiteboards' and column_name = 'meeting_id')
  union all
  select '0034', 'meeting notepad (meetings.scratchpad)',
         exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'meetings' and column_name = 'scratchpad')
) checks
order by migration, what;
