#!/usr/bin/env bash
# Compare the schema produced by the repo migrations with the live production
# schema, to reconcile the missing `0009_sync_client_ready_sales` migration
# (see docs/development/AUDIT.md §5, BUGS B-002).
#
# Usage:
#   1. Dump production (read-only):
#        supabase db dump --linked --schema public -f /tmp/prod-public.sql
#      (or: pg_dump --schema-only --no-owner --no-privileges -n public "$PROD_DB_URL" > /tmp/prod-public.sql)
#   2. With a local Postgres reachable via PG* env vars:
#        supabase/scripts/check-schema-drift.sh /tmp/prod-public.sql
#   3. Review the diff. Anything present only in production must be captured
#      in a NEW migration (0016+) written idempotently (`if not exists`,
#      `create or replace`) so applying it to production is a no-op and applying
#      it to a fresh database reproduces production.
set -euo pipefail
PROD_DUMP="${1:?path to the production schema dump (see header)}"
cd "$(dirname "$0")/.."
DB=agency_zero_drift
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
export PGDATABASE=$DB
psql -v ON_ERROR_STOP=1 -q -f tests/bootstrap.sql
for f in migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -f "$f" >/dev/null; done

norm() {  # strip noise that differs between dumps
  grep -v -E '^(--|SET |SELECT pg_catalog|\\restrict|\\unrestrict|COMMENT ON EXTENSION)' "$1" \
    | sed -E 's/[[:space:]]+$//' | grep -v '^$'
}
pg_dump --schema-only --no-owner --no-privileges -n public "$DB" > /tmp/repo-public.sql
diff -u <(norm /tmp/repo-public.sql | sort) <(norm "$PROD_DUMP" | sort) || true
echo "---- lines prefixed '+' exist only in production (missing from migrations);"
echo "---- lines prefixed '-' exist only in the repo (never applied to production?)."
