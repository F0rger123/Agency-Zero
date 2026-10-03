# Handoff log (newest first)

## 2026-10-03 (13) — Claude — typing text + more motion; animated mobile menus
New `TypedText` / `TypeRotator` (`src/components/site/typed-text.tsx`): types once when scrolled into view; full text stays in the DOM once (sr-only) and typed characters are painted from a `data-typed` attribute via CSS, so SEO/screen readers/no-JS see normal text; reduced motion shows text instantly. Wired into every public section/page heading + eyebrow, hero (h1, eyebrow, rotating "Right now I'm building …" line), CTA sections/bands. Also: page fade transition (`(site)/template.tsx`, `app/template.tsx`; opacity-only so sticky scenes keep working), CSS scroll-progress line, disciplines `Marquee`, `lift` hover on work cards, staggered animated **public mobile menu** (slide/fade + links stagger + morphing icon) and **CRM mobile drawer** (overlay fade, slide in/out, nav items stagger, Escape closes, press feedback). Removed the empty "Planned" nav label. Verified in a real browser (desktop hero typing, mobile menus); lint/tsc/tests/build pass. No migrations.

## 2026-10-03 (12) — Claude — real revenue entry, Marketing + Social built, button text
**Revenue**: Total Revenue is still *payments received*, but a one-time fee had no way in unless an invoice existed. Migration **0020** adds `record_client_payment()` (paid invoice + payment in one transaction; tested owner/stranger/anon). UI: client workspace → Invoices & payments → "Record a payment" (`RecordClientPaymentForm`, `recordClientPaymentAction`); dashboard card explains how when the total is 0. **Marketing / Social**: migration **0021** (`marketing_campaigns`, `social_posts`, owner-only RLS, SQL tests) + working pages (campaign tracker with spend/leads/cost per lead; content calendar idea→posted). Nav "Planned" tags removed for both. **Buttons**: `SubmitButton` now always renders black with white text; the many "quiet" overrides (`bg-background text-muted-foreground`) conflicted with `bg-inverted` and produced dark text on black — overrides are reduced to sizing.
**Owner must apply 0020 then 0021** (SQL page given in chat; files in `supabase/scripts/apply/`). Until then the new forms/pages show an honest "database update" message.
**Not done / ideas**: live ad-platform and social-API data (integrations phase); linking campaigns to invoices; per-client Marketing/Social tabs.

## 2026-10-03 (11) — Claude — client workspace: no Contacts tab, create everything inside the client
Owner request: a client IS the contact. Removed the Contacts tab (the `contacts` table and `get_client_workspace().contacts` remain, unused by the UI). "Settings" is now **Profile** (prefilled edit form + an "Edit profile" button in the header). Projects, Tasks, Quotes, Contracts and Invoices tabs each end with the normal create form with the client locked (`lockedClientId` prop on `NewProjectForm/NewTaskForm/NewQuoteForm/NewContractForm/NewInvoiceForm`; hidden `client_id` input, no picker). Option lists come from the workspace payload (`client-workspace-options.ts`); contract templates are fetched in `clients/[id]/page.tsx`. Global pages are unchanged cross-cutting views. Not browser-tested against a real database (types, lint, tests, build pass). No migrations.

## 2026-10-03 (10) — Claude — "JWT issued at future" on the dashboard
Owner saw `JWT issued at future` (PGRST303: database clock behind the clock that minted the token; transient). Added `src/lib/supabase/retry.ts` (`retryOnClockSkew`, 4 attempts, 1.5 s apart, only for that error) and used it for the dashboard summary/revenue reads and the `is_owner()` access check; the dashboard failure message now explains the cause. Other pages still show the raw error if it persists — apply the same helper there if it recurs. Not verified against a real skewed database. No migrations.

## 2026-10-03 (9) — Claude — richer About / Work / Services pages; Cloudflare build status
About: dot-field hero, new `PersonMoment` sticky scroll scene ("ONE PERSON. THE WHOLE JOB."), glyph service grid, bars divider, four-step "how a project runs", layered-text closing (`CtaSection` now takes copy props). Work: dot-field hero, CrewBoss case study, concept website gallery (BrowserGallery), reels + ads (MediaFrame), closing. Services: dot-field hero + bars divider. **Deploy note**: since commit 5c6a96d the Cloudflare check shows `failure` on every push (the owner still saw the old About). Pushing the same SHA to `main` AND a feature branch back-to-back is the only difference from the last green run (dc7c274) — from here on push to `main` only and watch the "Workers Builds" check; if it still fails, read the build log in the Cloudflare dashboard (build ids are in the check-run `details_url`).

## 2026-10-03 (8) — Claude — first-person copy
Site copy (services, process, contact, form messages, CTAs) switched from "we/us/our" to "I/me/my" because Agency Zero is run solely by Luke Knight. Mockup images show fictional businesses and keep their own voice. No migrations.

## 2026-10-03 (7) — Claude — clearer concept-site copy, plain-language Websites cards, "Concept" labels, SEO, Instagram button
Concept-site mockups re-written in plain language (what the business does, who for, clear buttons); the four jargon cards (colour palette, performance budget, focus ring, search markup) replaced by "Easy to use on a phone / Loads quickly / Readable and simple / Easy to find on Google". Work cards say **Concept** (not Example) with "The brief / What it shows". Nav + page renamed **About Luke** ("Hi, I'm Luke Knight."), no team/studio wording. `InstagramButton` (inline logo, opens https://www.instagram.com/agency.zer0/) in footer, About and Contact; LinkedIn/YouTube removed. SEO: site-wide JSON-LD (ProfessionalService + Person + WebSite), BreadcrumbList on service pages, OG/Twitter image (`public/og.jpg`, from `design/mockups/scenes/og.html`), canonical + absolute title on home, sitemap lastModified; the home SEO section is retitled "SEO optimisation". No migrations.

## 2026-10-03 (6) — Claude — About rewritten for a solo owner; real Instagram
About page now names Luke Knight as sole owner (first person, no "team/studio" claims); home CTA no longer says "one studio". Footer socials reduced to the real Instagram (https://www.instagram.com/agency.zer0/); placeholder LinkedIn/YouTube removed. Reel mockups show @agency.zer0. `site.owner` / `site.instagram` in `src/lib/site-config.ts`. No migrations.

## 2026-10-03 (5) — Claude — calendar defaults to month view
Owner confirmed migrations 0014–0019 applied and website leads arrive in the CRM. `/app/calendar` now opens in **month** view (`?view=week|day` still work). No migrations.

## 2026-10-03 (4) — Claude — owner could not run the SQL; CRM errors; leads without email
**Reported**: owner ran `pending-migrations.sql` in the Supabase editor → `42P13 no function body specified`; dashboard shows the generic
"Something went wrong (ref …)"; many CRM errors. Cannot reproduce in Postgres (the old script runs cleanly as one simple query on a scratch DB),
so the suspect is the editor / copy-paste mangling a bare `$$`.
**Changed**: the build script now emits **named dollar tags** (`$m0014x1$` …) and **one file per migration** in `supabase/scripts/apply/`
(`0014`, `0014b_set_owner`, `0015`…`0019`), each its own transaction; the combined file is kept. All variants verified on a scratch DB.
New **`/app/system` Database status** page: read-only probe per dependency with the database's exact error and the migration it belongs to;
linked from the error boundary and the "Database update pending" banner. Dashboard no longer throws when the revenue read model fails.
Leads: no Resend needed — `submit_lead` → `leads` → `/app/leads` already works once 0019 is applied; email notify stays optional/off.
**Owner to-do**: run `supabase/scripts/apply/*.sql` in order (0014, 0014b, 0015 … 0019), reload, open `/app/system` and send me any red rows.
**Unverified**: why the editor produced 42P13; the real production DB state (it may be partially migrated if earlier statements ran separately).

## 2026-10-03 (3) — Claude — mockup redesign, CrewBoss captures, "Website design" naming
**Done**: five concept sites re-rendered with genuinely different designs (Halden = warm editorial serif; Northline = blue/yellow lead-gen with
quote form; Ember & Oak = moody amber serif; Kairo = acid-lime brutalist; Atlas & Reed = green/cream serif + data panel). Device lineup now shows
one Northline design laid out per breakpoint (`dev-tablet`, `dev-phone` scenes) so tablet/phone fit their screens. Reels have like / comment /
share rail; the "Same business. Better site." reel (previously caption hidden by blend mode) is rebuilt on a solid scrim. Ads recoloured.
Browser-bar `.com` text removed from the gallery. Service is now named **"Website design"** everywhere it is a label (nav, section, footer,
metadata). CrewBoss case study re-captured at 2x from the live site (hero + dashboard, full feature grid, field portal, onboarding steps);
the old low-res dashboard/phone crops were deleted. The two "Example" work cards now use composite images (`work-site`, `work-campaign`).
**Verified**: lint, tsc, 25 tests, build; no horizontal overflow on /, /services, /services/websites, /work, /about, /contact at 360/390/768/834/1024.
**Not verified**: real devices; Lighthouse. **No migrations or env changes.**
**Lead routing (answer to owner)**: form → `submit_lead` RPC → `leads` table → CRM `/app/leads` (+ dashboard strip); optional email via Resend.

## 2026-10-03 (2) — Claude — access fix, mockup imagery, CrewBoss case study, copy, lead email
**Why the owner saw "No access"**: Cloudflare Workers Builds builds every push; the new `/app` layout called `is_owner()` against a production DB
that did not have migrations 0014+ yet → RPC missing → treated as "no access". My earlier "apply migrations before you deploy" advice was
wrong because pushing already deploys (see AGENTS.md "A push is a deploy").
**Fix**: `src/lib/access.ts` now returns ok / denied / **legacy** (RPC missing → CRM stays usable + "Database update pending" banner) / error
(real failures are never reported as "no access"). The denied page shows the user's id and the exact one-line SQL to claim ownership.
`supabase/scripts/pending-migrations.sql` (generated by `build-pending-migrations.sh`) applies 0014→0019 in one transaction and **explicitly
sets drummerforger@gmail.com as owner** (tested on a scratch DB incl. the "wrong user is oldest profile" case).
**Owner to-do now**: run `supabase/scripts/pending-migrations.sql` in the Supabase SQL editor (aborts safely if that email has no auth user).
**Content**: Websites section (5 concept sites + device lineup + 4 detail cards), SEO section (SERP, AI answer with citations, local map pack,
skills, workflow), Content section (3 reels, 2 Meta ads, pipeline, sample content week, shoot-day call sheet), Work (CrewBoss as a real case
study with real screenshots; two clearly-labelled examples), Process retitled "From first call to launch, in four steps.", About rewritten
(short, non-redundant). Mockups are rendered from `design/mockups` (`npm run mockups`).
**Contact form**: leads → `leads` table → `/app/leads`; optional Resend email notification (`RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`) — setup in
docs/DEPLOYMENT.md. "Prefer email?" and footer use drummerforger@gmail.com with a subject line.
**Verified**: lint, tsc, 25 unit tests (adds access states + lead email), build, screenshots of home/work/about at desktop. **Not verified**: real
Supabase/Resend/Cloudflare; the access states against a real DB; mobile pass of the new sections; Lighthouse.
**Next**: owner applies migrations + (optionally) Resend; replace example work; P1 CRM model (migration 0020+).

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
