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
from `0001` through `0008`. A manually applied set does not automatically
reconcile the CLI migration history, so do not run `db push` afterward until
that history has been reconciled. Never run the same migration twice.

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
