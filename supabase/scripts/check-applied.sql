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
) checks
order by migration, what;
