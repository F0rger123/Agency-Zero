-- Makes 'drummerforger@gmail.com' the Agency Zero owner. Aborts if no such sign-in exists yet.
begin;
do $own$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower('drummerforger@gmail.com') limit 1;
  if v_id is null then
    raise exception 'No auth user with email drummerforger@gmail.com — sign in once (or create the user) first, then re-run';
  end if;
  insert into public.app_owner (id, user_id) values (1, v_id)
  on conflict (id) do update set user_id = excluded.user_id;
end
$own$;
commit;
