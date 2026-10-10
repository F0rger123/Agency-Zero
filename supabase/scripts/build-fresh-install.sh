#!/usr/bin/env bash
# Builds the paste-able scripts for a BRAND-NEW, EMPTY Supabase project (every migration from 0001 to the latest):
#   supabase/scripts/fresh/NN_<name>.sql   one file per migration, each its own transaction, in the order to run them
#   supabase/scripts/fresh/00_README.txt   the exact steps
#
#   OWNER_EMAIL=you@example.com supabase/scripts/build-fresh-install.sh
#
# Dollar-quote tags are rewritten from $$ to unique named tags ($az1$, …) because some editors mangle a bare "$$".
# Run the files in numeric order in the Supabase SQL editor. Do NOT use this on a project that already has data:
# it is for a fresh project (existing projects only need the migrations they are missing; see /app/system).
set -euo pipefail
cd "$(dirname "$0")/.."
OWNER_EMAIL="${OWNER_EMAIL:-drummerforger@gmail.com}"
DIR=scripts/fresh
rm -rf "$DIR"; mkdir -p "$DIR"

retag() {
  python3 - "$1" "$2" <<'PY'
import sys
src, tag = open(sys.argv[1]).read(), sys.argv[2]
parts = src.split("$$")
if len(parts) % 2 == 0:
    sys.exit("odd number of $$ delimiters in " + sys.argv[1])
out = [parts[0]]
for i in range(1, len(parts)):
    out.append(f"${tag}{(i + 1) // 2}$" + parts[i])
sys.stdout.write("".join(out))
PY
}

owner_sql() {
  cat <<SQL
-- Makes '$OWNER_EMAIL' the Agency Zero owner. The sign-in must already exist
-- (Supabase dashboard > Authentication > Users > Add user), or this stops with a clear message.
begin;
do \$own\$
declare v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower('$OWNER_EMAIL') limit 1;
  if v_id is null then
    raise exception 'No sign-in found for $OWNER_EMAIL. Create the user in Authentication > Users first, then run this again.';
  end if;
  insert into public.app_owner (id, user_id) values (1, v_id)
    on conflict (id) do update set user_id = excluded.user_id;
end
\$own\$;
commit;
SQL
}

n=0
for f in migrations/*.sql; do
  base=$(basename "$f" .sql)
  num=${base%%_*}
  n=$((n + 1))
  out="$DIR/$(printf '%02d' "$n")_${base}.sql"
  {
    echo "-- Fresh install step $n: $base. Run in the Supabase SQL editor. One transaction: all or nothing."
    echo "begin;"
    retag "$f" "f${num}x"
    echo
    echo "commit;"
  } > "$out"
  if [ "$num" = "0014" ]; then
    n=$((n + 1))
    owner_sql > "$DIR/$(printf '%02d' "$n")_set_owner.sql"
  fi
done

cat > "$DIR/00_README.txt" <<TXT
Fresh Supabase project for Agency Zero
======================================
1. Create the project at https://supabase.com/dashboard (note the database password).
2. Authentication > Users > Add user: create the sign-in for $OWNER_EMAIL (auto-confirm), choose a strong password.
3. SQL editor: open each file in this folder IN ORDER (01, 02, 03 ...), paste, Run. Each must say "Success".
   The set_owner file must come right after the 0014 file.
4. Project Settings > API: copy the Project URL and the publishable (anon) key into the Cloudflare Worker variables
   NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Build variables), and the service_role key as the
   Secret SUPABASE_SERVICE_ROLE_KEY. Redeploy.
5. Authentication > URL Configuration: Site URL = your site; add Redirect URLs for it.
6. Open the CRM /app/system. Every row should say OK.
TXT
echo "wrote $(ls $DIR | wc -l) files in supabase/$DIR for owner $OWNER_EMAIL"
