-- Makes 'drummerforger@gmail.com' the Agency Zero owner. The sign-in must already exist
-- (Supabase dashboard > Authentication > Users > Add user), or this stops with a clear message.
begin;
do $own$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower('drummerforger@gmail.com') limit 1;
  if v_id is null then
    raise exception 'No sign-in found for drummerforger@gmail.com. Create the user in Authentication > Users first, then run this again.';
  end if;
  insert into public.app_owner (id, user_id) values (1, v_id)
    on conflict (id) do update set user_id = excluded.user_id;
end
$own$;
commit;
