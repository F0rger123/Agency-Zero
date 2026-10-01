#!/usr/bin/env bash
# Applies every migration to a throwaway Postgres database and runs the SQL
# tests in supabase/tests/*.test.sql. Requires a local Postgres reachable via
# the standard PG* environment variables (superuser).
#   PGDATABASE is ignored; a scratch DB named agency_zero_test is (re)created.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=agency_zero_test
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
export PGDATABASE=$DB
psql -v ON_ERROR_STOP=1 -q -f tests/bootstrap.sql
for f in migrations/*.sql; do
  echo "apply $f"
  psql -v ON_ERROR_STOP=1 -q -f "$f"
done
for t in tests/*.test.sql; do
  echo "test  $t"
  psql -v ON_ERROR_STOP=1 -q -f "$t"
done
echo "OK"
