-- Read-only. Shows what the Agency Zero 0027/0028 scripts left behind in a project. Changes nothing.
select 'leads column' as kind, column_name || ' (' || data_type || ', nullable=' || is_nullable || ')' as detail
from information_schema.columns where table_schema = 'public' and table_name = 'leads'
union all
select 'leads constraint', conname || ': ' || pg_get_constraintdef(oid)
from pg_constraint where conrelid = to_regclass('public.leads')
union all
select 'function', p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('submit_lead', 'get_public_quote', 'get_public_portal')
union all
select 'table', table_name from information_schema.tables where table_schema = 'public' and table_name = 'meetings'
union all
select 'added column', table_name || '.' || column_name
from information_schema.columns
where table_schema = 'public' and ((table_name = 'quotes' and column_name = 'kind') or (table_name = 'clients' and column_name like 'portal\_%'))
order by 1, 2;
