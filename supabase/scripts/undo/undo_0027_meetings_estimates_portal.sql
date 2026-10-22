-- UNDO 0027 (meeting notes, estimates, client portal). This deletes any meetings, estimate labels and portal links.
begin;
drop function if exists public.get_public_portal(text);
drop table if exists public.meetings;
alter table public.clients drop column if exists portal_token, drop column if exists portal_token_hash, drop column if exists portal_enabled;
create or replace function public.get_public_quote(p_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $u27a$
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
$u27a$;

alter table public.quotes drop column if exists kind;
commit;
