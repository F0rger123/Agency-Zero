# Deployment and live-test setup

Agency Zero is prepared for Cloudflare Workers through the OpenNext adapter. This
repository does not deploy anything or create external accounts. The first live
test still requires one Supabase project and one Cloudflare Worker owned by you.

## Environment variables

The app has exactly three application environment variables:

| Variable | Value | Where it is used |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project URL** from Project Settings → API | Browser, server, and auth session refresh |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **publishable** key (the legacy `anon` key is also supported) | Browser, server, and auth session refresh; RLS remains the security boundary |
| `NEXT_PUBLIC_SITE_URL` | The canonical deployed origin, with no trailing slash, such as `https://agency.example.com` | Production public quote/contract links and the Supabase Auth URL configuration |

For local Next.js development, copy `.env.example` to `.env.local`. For a
Cloudflare Workers Build, add all three names under the project's **Build
variables and secrets** and add the same three names under the deployed
Worker's **Settings → Variables and Secrets** for the production environment.
`NEXT_PUBLIC_*` values must be available during the build because Next.js
inlines public values into the built application; the Worker settings cover
runtime reads such as auth session refresh. Use a secret binding for the
Supabase key if the dashboard asks you to classify it, even though the key is
intended for browser use. Do not put real values in `wrangler.jsonc`, Git, or
this repository.

There is no service-role key, Stripe key, Google credential, or other secret
required by the current application. Do not add one just to deploy this phase.

## Supabase production configuration

1. Create a new Supabase project.
2. Apply migrations `0001` through `0007` in numeric order. The preferred
   repeatable path is:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --linked
   ```

   `supabase/config.toml` is committed so the CLI has a project definition.
   The command applies each migration once and records migration history. On a
   truly fresh project, do not use `--include-all` unless the CLI reports that
   the migration history needs reconciliation.

3. If the dashboard SQL editor is used instead, run each file exactly once in
   this order: `0001_profiles_and_settings.sql`, `0002_clients.sql`,
   `0003_projects.sql`, `0004_tasks.sql`, `0005_crm_core.sql`,
   `0006_sales.sql`, and `0007_planning_and_reminders.sql`. Do not mix a
   manually applied set with `db push` until the Supabase migration history has
   been reconciled.
4. In Authentication → URL Configuration, set **Site URL** to the exact value
   of `NEXT_PUBLIC_SITE_URL`. Add the exact callback URL as an additional
   redirect URL:

   ```text
   https://your-domain.example/auth/callback
   ```

   Keep `http://localhost:3000/auth/callback` as a separate local-development
   redirect only if local email-link testing is needed.
5. In Authentication → Sign In / Providers → Email, keep email/password
   enabled and disable public sign-ups. Create the single owner in
   Authentication → Users, confirm the email as appropriate for the test, and
   sign in through `/login`. The migration trigger creates the matching
   `profiles` and single `settings` row.
6. Verify that an unauthenticated request reaches `/login`, an authenticated
   owner can use the private app, and a copied `/q/<token>` or `/c/<token>` link
   only exposes the intended narrow public RPC result. The app does not use a
   service-role key in the browser or Worker.

Every application table has RLS enabled. Internal policies are authenticated
owner policies; public quote and contract access is limited to hashed-token
security-definer functions in migration `0006`. The private `client-files`
Storage bucket and its authenticated policies are created in migration `0005`.

## Cloudflare Workers / OpenNext

The committed configuration is intentionally manual, which is the current
Cloudflare guidance for keeping an existing Next.js app on OpenNext:

- `open-next.config.ts` uses `defineCloudflareConfig()`.
- `wrangler.jsonc` points to `.open-next/worker.js`, binds
  `.open-next/assets` as `ASSETS`, enables `nodejs_compat`, and uses the
  compatibility date `2026-09-17`.
- `@opennextjs/cloudflare` and Wrangler are pinned by the lockfile through the
  current package ranges used for this pass (`1.20.6` and `4.134.0`).
- `cloudflare-env.d.ts` is generated from the Wrangler configuration and has no
  secrets.

Use these commands locally before any deployment:

```bash
npm install
npm run cf-typegen
npx opennextjs-cloudflare build
npm run preview
```

`npm run preview` builds and runs the Worker in Wrangler's local Workers
runtime. It is not a deployment. The deploy command is deliberately separate:

```bash
npm run deploy
```

The current OpenNext build completes with Next.js `16.3.5`; it reports that
Node.js middleware support is experimental in Cloudflare. This app's Next.js 16
`src/proxy.ts` is therefore covered by the build check, but an OpenNext or
Next.js upgrade must not be made without rerunning `npx opennextjs-cloudflare build`
and testing auth in preview. The official Cloudflare OpenNext guide remains the
reference for adapter changes:
<https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/>.

## Cloudflare live-test sequence

After the local checks pass:

1. Create or select the Worker in your Cloudflare account.
2. Add the three exact names above, with production values, to Workers Builds
   → Build variables and secrets **and** to the deployed Worker → Settings →
   Variables and Secrets. Never commit them to Wrangler config.
3. Run the deploy command from a machine with the Cloudflare account connected,
   or configure the Cloudflare Workers Build to run the repository's build.
4. Set the production `NEXT_PUBLIC_SITE_URL` and Supabase Auth Site URL to the
   final custom domain before testing email links or sharing public documents.
5. Test owner sign-in, a CRUD flow, a private file upload/download, a quote
   response, a contract signature, an invoice payment, calendar/workload data,
   and a reminder. Use real Supabase rows only; no mock data is part of this
   deployment.

## References

- [Cloudflare OpenNext adapter](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/)
- [Cloudflare Workers environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Supabase CLI migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase Auth URL configuration](https://supabase.com/docs/guides/auth/redirect-urls)
