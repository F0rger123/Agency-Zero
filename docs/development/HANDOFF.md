# Handoff log (newest first)

## 2026-10-03 — Claude — public site (Stages 1–4), /app routing, Total Revenue, leads
**Did**
- **Stage 1**: CRM moved from `/` to `/app/**` (`src/lib/routes.ts`; all links/revalidations updated; DB-provided hrefs go through `crmHref`).
  Proxy now only runs for `/app` and `/login`; unauthenticated → `/login?next=…` (same-site paths only). CRM layout also requires
  `is_owner()` (new `NoAccess` page); migration `0018` adds `app_team` so the owner can authorise others via SQL.
  Dashboard **Total Revenue / Revenue this month / MRR / Outstanding** from `get_revenue_summary()` (non-voided payments only).
  Public design system, nav, footer, ASCII reaction hero.
- **Stage 2**: brand parallax moment, services wheel, software section (code spotlight + CRM mockup), websites (dot lattice +
  3D unfurling gallery), SEO (Google / AI search / local), content (media placeholders), work cards, process (gateway flow), CTA (layered text, particles).
- **Stage 3**: `/services`, `/services/<6 slugs>` (real long-form copy, FAQ + JSON-LD), `/work`, `/about`, `/contact`; contact form →
  `submit_lead()` → CRM **Leads** page (`/app/leads`: filter, mark contacted/dismissed, convert to client + contact) + dashboard "new leads" strip; sitemap/robots/404.
- **Stage 4**: reduced-motion, keyboard, no-JS fallback, mobile pass, performance pass (see below).
**Verified (locally, production build)**: lint, tsc, 18 unit tests, `next build`, SQL suite (adds team access, revenue, leads cases).
HTTP check with Supabase configured but unreachable: all public routes 200; `/app`, `/app/clients`, `/app/leads`, `/app/invoices/123` → 307 to `/login?next=…`.
Playwright (headless Chromium): desktop + 390px mobile screenshots of every section (no horizontal overflow, no page errors); tab order sane
(skip link → wordmark → nav → login → CTAs); reduced-motion renders static compositions with 0 hidden reveals; honeypot path and
graceful form failure verified. Perf (software-rendered, so pessimistic): CLS 0, LCP ≈1.3 s desktop / ≈2.3 s at 4× CPU throttle;
long-task blocking 55→~20 ms desktop; scroll frames over 33 ms cut ~64%.
**NOT verified / not claimed**: anything against real Supabase or Cloudflare (no production deploy was done); an authenticated owner
logging in and an authenticated-but-unauthorised user seeing "No access" (logic covered by SQL tests + code, not an end-to-end browser run);
real-device/GPU scroll feel, Safari/Firefox, screen-reader pass, Lighthouse scores; the lead form actually writing to the DB.
**Migration/deploy requirements (order matters)**: apply `0014`→`0019` to production, THEN deploy. CRM URLs changed (`/app/...`) —
update bookmarks and Supabase Auth Site/redirect URLs. Set `NEXT_PUBLIC_SITE_URL`. Add Cloudflare rate-limit for `POST /contact`.
Smoke test after deploy: submit the contact form → lead appears in `/app/leads`; sign in → `/app` loads; Total Revenue matches the sum of
recorded payments; a second (non-team) account gets "No access".
**Owner to-do**: replace placeholder content (docs/development/SITE_CONTENT.md): real email/socials, case studies, screenshots, video,
about story, OG image, privacy/terms pages; decide analytics. Not done: subtle CRM dashboard background motion (skipped to protect performance).
**Branch note**: all work (audit fixes + site) is on `claude/compassionate-faraday-kixpre`, **not merged to main** — no PR exists yet.
**Next**: owner review of the site; then P1 CRM model (migration `0020`+).

## 2026-10-01 (2) — Claude — audit remediation pass 2
**Did**: migration `0016` (payments become a void-only ledger — trigger blocks delete/edit/un-void, void needs a
reason; invoice status un-sticks after a void; workspace read models expose `voided_at`; contract signature
evidence: IP, user agent, consent text, SHA-256, immutable) and `0017` (`get_invoice_summary()`; fixes void/draft
balances counted as outstanding). App: `voidPaymentAction` + Void UI (replaces delete), voided payments shown struck
through in invoice/client/project views, signature capture in `signContractAction`, evidence panel on the contract
page, `getClaims()` in proxy/layout/settings (one fewer Auth round trip per navigation), bounded lists/pickers with
`LimitNotice`, nav "Planned" group, workspace components split per tab, minified page/form files reformatted.
**Verified**: lint, tsc, `npm test`, `next build`, `supabase/tests/run.sh` (adds ledger, evidence and summary cases).
NOT verified: real Supabase, browser (void form, signing a contract, tab switching after the split, list notices).
**Migration/deploy requirements**: apply `0014`, `0015`, `0016`, `0017` in order, THEN deploy the app. App code calls
`save_*`, `sign_public_contract` (5 args), `get_invoice_summary` and reads `payments.voided_at`, so deploying first breaks
those flows. `0016` patches `get_client_workspace`/`get_project_workspace` in place and aborts loudly if the payments
projection text differs from the repo's (e.g. if the missing `0009` redefined them) — send me that error if it happens.
**Owner to-do (cannot be done in code)**: Cloudflare WAF rate-limit rules (docs/DEPLOYMENT.md), delete the stale
`recovery/sidebar-payments-quotes-20260922` branch, prod schema dump for `0009`, keep sign-ups off.
**Next**: P1 starting at migration `0018`.

## 2026-10-01 — Claude — P0 hardening
**Did**: migrations `0014` (owner-only RLS via `app_owner`/`is_owner()`, incl. Storage) and `0015`
(`save_quote`/`save_invoice` atomic RPCs, payments RESTRICT, non-draft invoices undeletable);
`src/lib/actions.ts` shared layer + all action files moved onto it, reformatted, affected-row checks;
file delete resolves path from DB; invoice/quote create/update use the RPCs; public "viewed" now
via `ViewBeacon`; vitest (14 tests) + `supabase/tests` SQL suite + CI (app + database jobs);
`supabase/scripts/check-schema-drift.sh`.
**Verified**: lint, tsc, `npm test`, `next build`, and `supabase/tests/run.sh` (fresh Postgres 16 +
Supabase stub) all pass. NOT verified: against real Supabase, in a browser (forms posting to the
new RPCs, public pages beacon), or Cloudflare build.
**Migration/deploy requirements** (in order, only after `0001–0008,0010–0013` are in prod):
1. Check owner is oldest profile: `select id, full_name, created_at from public.profiles order by created_at;`
2. Apply `0014`, then `0015` (backup first). If login breaks: `update public.app_owner set user_id='<owner id>' where id=1;`
3. Deploy the app (it calls `save_quote`/`save_invoice`, so deploy AFTER 0015).
4. Smoke test: create+edit a quote and an invoice, record a payment, try deleting a sent invoice (should refuse),
   open a public quote link and confirm it flips to "viewed" after a few seconds.
5. Still disable public sign-ups in Supabase Auth.
**Blocked on owner**: prod schema dump for the missing `0009` (B-002) — run
`supabase db dump --linked --schema public -f prod.sql` then `supabase/scripts/check-schema-drift.sh prod.sql`.
Unknown risk: `0009` may contain objects/columns 0014/0015 interact with (e.g. extra policies — 0014 rewrites ALL
matching policies dynamically, which should cover them).
**Next**: P1 (work-item model with bugs/feature requests, phases) starting at migration `0016`.

## 2026-09-28 — Claude — audit & doc system
**Did**: full audit of main (see AUDIT.md); created AGENTS.md and docs/development/
(VISION, ROADMAP, ACTIVE, BUGS, IDEAS [moved from docs/IDEAS_BACKLOG.md], HANDOFF,
AUDIT); added CI workflow; fixed doc links to IDEAS.
**Verified**: `npm ci`, eslint, `tsc --noEmit`, `next build` pass on main.
**Not verified**: live Supabase, prod sign-up setting, Cloudflare deploy, browser UX.
**Migrations/deploy required**: none. (Next migration number is 0014.)
**Next**: owner reviews AUDIT.md/ROADMAP.md; then P0 (owner-only RLS, 0009 drift).
Do not refactor before that review.
