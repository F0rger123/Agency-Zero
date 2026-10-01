# Supabase setup (Agency Zero)

The app is built against Supabase (Postgres + Auth + Storage). This folder holds
the ordered SQL migrations and the committed `config.toml` used by the Supabase
CLI. The complete Cloudflare and production environment checklist is in
[`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com) (or self-host).
2. Copy **Project Settings → API**: the **Project URL** and the
   **publishable** key (the legacy `anon` key is also supported).

## 2. Configure the app

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and NEXT_PUBLIC_SITE_URL for the local or deployed origin
```

## 3. Apply the migrations

Run each file in `supabase/migrations/` **in numeric order**, exactly once. The
preferred path records migration history for future updates:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push --linked
```

The dashboard SQL editor is a fallback: paste and run the files one at a time,
from `0001` through `0008`, then `0010` through `0015`. A manually applied set
does not automatically reconcile the CLI migration history, so do not run
`db push` afterward until that history has been reconciled. Never run the same
migration twice.

> **Migration numbering.** There is intentionally **no `0009`** file in this
> repository. The production project already has an out-of-band migration
> `0009_sync_client_ready_sales` that was applied directly to the live database
> (client/service sync used by the sales flow) and was never committed here.
> Reusing that version number would collide with the live migration history and
> could cause `supabase db push` to skip or duplicate work, so the next
> committed migration is `0010`. Production schema sync: if the live database
> already contains the objects from `0010`–`0015` (service catalogue columns,
> `project_notes`, `project_files`, and the read-model functions), do not re-run
> those files; reconcile `supabase_migrations.schema_migrations` instead and
> record the applied versions there. A fresh project applies `0001`–`0008` and
> then `0010`–`0015` in numeric order.

**Before applying `0014` to production**, confirm the owner's profile is the oldest
row (`select id, full_name, created_at from public.profiles order by created_at;`).
If it is not, apply the migration and then run
`update public.app_owner set user_id = '<owner auth.users id>' where id = 1;`.
Also still disable public sign-ups — `0014` makes them harmless to data, but there
is no reason to leave them on.

**Local SQL tests.** `supabase/tests/run.sh` applies every migration to a scratch
Postgres (PG* env vars, superuser) with a minimal Supabase stub and runs
`supabase/tests/*.test.sql` (owner vs stranger vs anon access, atomic saves, invoice
protection). CI runs it on every PR. To reconcile the missing `0009`, run
`supabase/scripts/check-schema-drift.sh <prod-schema-dump>`.

For a local Docker-backed verification environment, run `npx supabase start`
then `npx supabase db reset --local --no-seed`; `npx supabase db lint --local`
checks the resulting schema. This repository's live-readiness pass does not
start Docker or connect to an external project.

What gets created:

| Migration | Contents |
|---|---|
| `0001_profiles_and_settings.sql` | `profiles` (owner), `settings` (single row), auto-create trigger on sign-up, `updated_at` helper |
| `0002_clients.sql` | `clients` + `client_status` enum |
| `0003_projects.sql` | `projects` + `project_status` enum |
| `0004_tasks.sql` | `tasks` + `task_status` / `task_priority` enums |
| `0005_crm_core.sql` | CRM detail tables, milestones, task extensions, dependencies, recurring-task architecture, time entries, and private `client-files` Storage bucket |
| `0006_sales.sql` | Quotes, quote line items, secure public quote RPCs, contract templates/contracts/version history/signing RPCs, invoices, invoice line items, payments, derived balances/statuses |
| `0007_planning_and_reminders.sql` | Planned task dates, weekly/date-specific capacity, calendar events, and custom reminder rows |
| `0008_security_hardening.sql` | Function hardening (pinned `set_updated_at()` search path, EXECUTE revocations on trigger functions), quote packages/options + customer selection snapshots, contract view marking, a seeded "Standard services agreement" template, and immutable accepted-quote / signed-contract / version-history triggers |
| `0010_services_catalog.sql` | Custom service catalogue: `services.default_price_cents`, `services.billing_interval` (`monthly`/`quarterly`/`yearly`), `services.default_estimated_minutes`; `client_services.billing_interval` + `amount_cents` (backfilled from `monthly_amount_cents`); `public.normalized_monthly_cents(amount, interval)`; `quote_line_items.service_id`; `public.get_service_directory()` |
| `0011_dashboard_summary.sql` | `public.get_dashboard_summary(p_today date default null)` — one read for every dashboard number: tasks due today, overdue tasks, active projects, clients, waiting-on-client tasks, upcoming deadlines, recent activity, and the recurring-revenue block (MRR, ARR, recurring clients/services, per-service breakdown) |
| `0012_client_workspace.sql` | `public.get_client_directory()` (services, MRR, outstanding balance, active projects, waiting tasks, last activity per client) and `public.get_client_workspace(p_client_id uuid)` (client + contacts, projects, tasks, services, catalogue, quotes, contracts, invoices, payments, notes, communications, files) |
| `0013_project_workspace.sql` | `project_notes` and `project_files` (owner-only RLS, updated-at triggers) plus `public.get_project_workspace(p_project_id uuid)` (project, client, totals, tasks, milestones, time entries, notes, files, quotes, contracts, invoices, payments, services, activity) |

Migrations `0010`–`0015` are additive read models plus the service/project
columns and tables the redesigned UI needs. Every function is `security
invoker` (so RLS still applies to the owner), pins `search_path = public`, and
revokes EXECUTE from `public`/`anon` while granting it to `authenticated`. The
overdue state of an unpaid invoice is now **derived at read time** (see
`docs/DECISIONS.md` D-033) instead of being written during page render;
`public.refresh_invoice_statuses()` is kept for scheduled/back-office use, for
example a Supabase scheduled query running
`select public.refresh_invoice_statuses();` once a day.

Migration `0005` also seeds the seven Agency Zero services (software development, custom CRMs/software, websites, SEO, Meta ads, social media management, and social video creation). Client files are private and are served by expiring signed URLs. Migration `0006` creates the public `/q/[token]` and `/c/[token]` surfaces; those links use random tokens and narrow security-definer functions, not broad anonymous table access. Migration `0008` extends those functions (selection-aware quote responses, contract view marking) and freezes accepted quotes and signed contracts at the database level. Stripe and Google Calendar remain intentionally unconnected.

All application tables have **row-level security** enabled: only the
authenticated owner can read/write (see `docs/DECISIONS.md` D-014). Public quote
and contract access uses the narrow hashed-token functions created in `0006`,
not broad anonymous table policies.

## 4. Configure production Auth and create the owner

Agency Zero has **no sign-up page by design** (private app, D-003):

1. In Authentication → URL Configuration, set **Site URL** to the exact value
   of `NEXT_PUBLIC_SITE_URL` and add `https://your-domain.example/auth/callback`
   as an allowed redirect URL. Keep local callback URLs separate and only while
   local testing is needed.
2. In Authentication → Sign In / Providers → Email, keep email/password enabled
   and disable **Allow new users to sign up**.
3. Supabase dashboard → **Authentication → Users → Add user**. Enter the owner
   email and password, and confirm the email as appropriate for the test.
4. Sign in at the app's `/login` with those credentials.

A profile row and the workspace settings row are created automatically by the
`on_auth_user_created` trigger. The Next.js proxy calls `auth.getUser()` to
refresh the cookie session, while protected layouts and server actions verify
ownership again. No service-role key is used by the app.

## 5. Verify

Before calling the project live-ready, run `npx supabase db lint --linked` and
check that the migrations created the private `client-files` bucket, RLS on
every application table, and the narrow public quote/contract RPCs. Then
exercise the owner and tokenized customer flows described below.

## 6. End-to-end verification

```bash
npm run dev
```

Sign in → the dashboard should show zeros (not a migration error). Settings
should show your account email and save profile/workspace edits. Create a
client, quote, contract, invoice, task, calendar item, capacity override, and
custom reminder to verify the owner flows. Set a quote with an optional add-on
and a package choice to Sent and open `/q/<token>` in a private browser window
to verify viewed tracking, option selection, and accept/reject with the frozen
accepted total. Create a contract from the seeded template (placeholders fill
in), set it to Sent, and open `/c/<token>` to verify view tracking, the signer
name, timestamp, and the preserved immutable snapshot. Confirm afterwards that
the accepted quote and signed contract can no longer be edited. If you see
"Migrations are not applied yet", step 3 was skipped or partially applied.
