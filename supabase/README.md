# Supabase setup (Agency Zero)

The app is built against Supabase (Postgres + Auth + Storage). This folder holds
the SQL migrations. Nothing here requires the Supabase CLI — you can apply
everything from the dashboard SQL editor.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com) (or self-host).
2. Copy **Project Settings → API**: the **Project URL** and the **anon/public key**.

## 2. Configure the app

```bash
cp .env.example .env.local
# fill in:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3. Apply the migrations

Run each file in `supabase/migrations/` **in numeric order**, exactly once:

- **Option A — SQL editor:** Supabase dashboard → SQL Editor → paste the file
  contents → Run. Repeat for `0001` → `0007`.
- **Option B — Supabase CLI:**
  ```bash
  npx supabase login
  npx supabase link --project-ref <your-project-ref>
  npx supabase db push
  ```

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

Migration `0005` also seeds the seven Agency Zero services (software development, custom CRMs/software, websites, SEO, Meta ads, social media management, and social video creation). Client files are private and are served by expiring signed URLs. Migration `0006` creates the public `/q/[token]` and `/c/[token]` surfaces; those links use random tokens and narrow security-definer functions, not broad anonymous table access. Stripe and Google Calendar remain intentionally unconnected.

All tables have **row-level security** enabled: only the authenticated owner can
read/write (see `docs/DECISIONS.md` D-014). Future public token surfaces (quote /
contract links) will get their own narrow policies.

## 4. Create the owner account

Agency Zero has **no sign-up page by design** (private app, D-003):

1. Supabase dashboard → **Authentication → Users → Add user**.
2. Enter email + password, enable **Auto Confirm User**.
3. Sign in at the app's `/login` with those credentials.

A profile row and the workspace settings row are created automatically by the
`on_auth_user_created` trigger.

## 5. Lock it down (recommended)

- **Authentication → Sign In / Providers → Email**: disable **Allow new users to
  sign up** so nobody else can create accounts.
- Configure the **Site URL** (Authentication → URL Configuration) to your
  deployed domain so auth links/redirects work; set `NEXT_PUBLIC_SITE_URL` in
  your hosting environment to match.

## 6. Verify

```bash
npm run dev
```

Sign in → the dashboard should show zeros (not a migration error). Settings
should show your account email. Create a client, quote, contract, invoice, task,
calendar item, capacity override, and custom reminder to verify the owner flows.
Set a quote to Sent and open `/q/<token>` in a private browser window to verify
viewed/accept/reject. Set a contract to Sent and open `/c/<token>` to verify the
signer name, timestamp, and preserved snapshot. If you see "Migrations are not
applied yet", step 3 was skipped or partially applied.
