# Handoff log (newest first)

## 2026-10-10 (2) — Claude — meeting notes, estimates, client portal, fresh-project install scripts

**Migration to apply: `0027_meetings_estimates_portal.sql`** (additive; app degrades to a "needs 0027" hint on each new screen if it is missing; `/app/system` has probes). The owner also said they never created a Supabase project for the CRM and will run SQL later: for a brand-new empty project run **every** migration in order with the generated files in `supabase/scripts/fresh/` (`00_README.txt` has the steps; regenerate with `OWNER_EMAIL=... supabase/scripts/build-fresh-install.sh`). Verified by applying all 28 generated files to an empty database (all checks pass, owner row set). I could not create the Supabase project myself: no Supabase connector is connected to this session (see below).

- **Meetings** (customer hub → Meetings): start a meeting (title, who, where, project, agenda), live notes that autosave (900 ms debounce), voice typing, decisions, action-item checklist, End/Reopen, "turn open items into tasks" (creates tasks on the client/project), delete. Typing with no signal is kept in localStorage and sent when back online. Table `meetings` (owner-only RLS).
- **Estimates**: `quotes.kind` quote|estimate, chosen on the quote form; public page and buttons say Estimate/Proposal accordingly. Set after the atomic `save_quote` RPC (RPC unchanged); a database behind 0027 keeps "quote" and says so.
- **Client portal** (customer hub → Portal): create/turn off/regenerate a private link `/p/<token>`; "Preview as the client". The page lists what is waiting (sent proposals/estimates → `/q/<token>`, sent contracts → `/c/<token>`), invoices to pay, history. It reads only the anonymous `get_public_portal()`; accepting/signing uses the existing secure pages, so responses reach the CRM exactly as before. Home has a new **Client responses** panel (accepted/declined/signed in the last 14 days). `/p/` is disallowed in robots and `noindex`.
- Tests: SQL cases (owner/stranger/anon, portal off/on, drafts never exposed) + vitest for `src/lib/meetings.ts`.
- **Not built yet / limits**: no emailing of the link (the owner does not want email integrations; send it yourself), no online payment from the portal (invoices are read-only there), estimates do not yet show a badge in lists (kept off list queries so a database behind 0027 cannot break them).
- Unverified against real Supabase; browser-smoked against a mock.

## 2026-10-10 — Claude — offline mode, install as app, opening splash, loader, DB check script

**No migrations.** New read-only helper: `supabase/scripts/check-applied.sql` (lists which of 0020/0022–0026 are applied; changes nothing; verified against a fresh database with every migration applied). `/app/system` remains the in-app check.

- **Offline** (`public/sw.js`, `src/components/offline.tsx`, `public/offline.html`, `public/_headers`): service worker caches static assets (cache first) and pages (network first, 4 s timeout, fall back to the last copy on the device). Redirects, `/api`, `/auth`, `/login` and every non-GET request are never touched. After the owner opens the CRM the main sections are quietly saved once per 6 h. Sign-out clears every cached page. Offline bar shows while the device has no connection. Lock In already worked offline (localStorage). Quick note saves a draft on the device when offline and offers it again when back online.
- **Honest limits**: offline is read-only for CRM data (last saved copy). Creating or editing records, payments, and AI organising need a connection (they are server actions on Supabase). A full offline-write queue with sync and conflict handling is a separate project (see "Offline writes" in IDEAS). Pages never opened on the device show `offline.html`.
- **Install as an app**: `src/app/manifest.ts` (start_url `/app`, standalone, black splash colour, icons in `public/icons`). Browser menu → Install / Add to Home Screen.
- **Opening splash** (`AppSplash`, CSS only): the zero draws itself, the name rises letter by letter, fades out (~2.4 s). Plays on a full load, once per browser session; client navigation never replays it. **Loader** (`src/app/app/loading.tsx`) is now a top sweep bar plus a looping zero, replacing the grey skeleton blocks.
- Unverified on real phones/Safari (service worker + standalone install). Verify: open the CRM online, browse a few sections, switch to airplane mode, reopen.

## 2026-10-06 (2) — Claude — CRM redesign: widget home, customer hub, dialogs/wizards, delete, one-time charges, quick note

**No migrations in this round.** Nothing to apply. One optional env var: `ANTHROPIC_API_KEY` (Cloudflare Worker **Secret**, never `NEXT_PUBLIC_`). Without it, Quick note still works with a simple offline organiser.

**Navigation / layout**
- Sidebar removed. Slim top bar (wordmark, Home, Quick note, Menu dialog with every section + sign out). Home (`/app`) is now big widgets: Customers (hero), Calendar, Projects, Tasks, Invoices, Quotes, Contracts, Reminders, Leads, Shoots, Services, Workload, Social, Marketing, plus a Quick note card; revenue cards above, the old detail panels below. Widget list lives in `src/lib/nav.ts` (`homeWidgets`).
- A customer opens as a **hub of big widgets** (Projects, Tasks, Services, Shoots, Quotes, Contracts, Invoices, **Reminders (new)**, Notes, Activity, Files, Profile) with live counts; picking one opens that section with a "← customer" back button. Reminders attach to the client via `reminders.subject_type='client'`.
- Money: dollar sign is green (`--color-money`), amounts and counts animate up on load and when clicked (`src/components/money.tsx`; `moneyNode()` in `money-node.tsx` replaced most `moneyLabel` call sites; strings still use `moneyLabel`). Respects reduced motion. Stat tiles on home/client use `CountUp`.

**Creating things**
- Empty tabs stay empty. Every "add" is now a **button that opens a dialog** (blurred backdrop, X/Esc/click-out cancels, saving closes it): `AddDialog` + `Modal` (`src/components/modal.tsx`). New project, task and service are **step-by-step wizards** (`src/components/wizard.tsx`); quotes, contracts, invoices, payments, notes, uploads, activity, shoots, schedules, events, posts, campaigns, reminders, clients and services use the same dialog. `FormMessage` closes the surrounding dialog on success.
- Wizards ask for essentials only. Task parent/dependency/recurrence/actual time and project currency/actual time are set from **Edit** afterwards.
- Interpretation: "once you exit, it adds the project" = finishing the wizard adds it; X cancels without saving.

**Delete**
- `ConfirmDelete` (`src/components/confirm-delete.tsx`) asks first. New: delete project (cascades tasks/phases/milestones; invoices/quotes/contracts/payments kept, unlinked by existing FKs; redirects to the client), delete task from client/project/global lists, delete shoot, delete recurring schedule (also removes its not-yet-shot planned/confirmed shoots). Existing Remove buttons (notes, activity, files, services) now confirm. Invoices/payments are still never hard-deleted (void).

**One-time charges**
- Assigning a service is a wizard: one-time (no interval) vs recurring (interval + amount). One-time asks for a price and what to do with the money: just log, **already paid** (records a payment via `record_client_payment`, method incl. Venmo) or **send an invoice** (draft-free `sent` invoice via `save_invoice`, number `INV-YYYYMMDD-nnn`). One-time prices are stored in `client_services.amount_cents` but never count toward MRR (all MRR queries filter `billing='recurring'`). Catalogue form hides the interval for one-time. Re-assigning the same service replaces the assignment (existing upsert), so two one-time charges of the same service for one client need the invoice/payment route.

**Quick note (voice)**
- Mic button (browser Web Speech API; Chrome/Edge/Safari, not Firefox) + typing. "Organise" proposes actions (note, task, project progress/status, payment); the owner reviews, edits the client, unticks anything and presses Save. Nothing is written before that (AGENTS.md AI rule). With `ANTHROPIC_API_KEY` a Claude model proposes (`claude-sonnet-5-5`, tool call, ids validated against the clients/projects that were sent); without it a regex organiser keeps the text as a note on a named client and picks out "N%" on a named project and "paid $N". Pure logic + tests: `src/lib/quick-note.ts`. Actions: `src/app/app/quick-note/actions.ts`.
- Unverified: real microphone/speech in a real browser, and the live AI call (no key in this environment).

**Earlier this session (also shipped here)**: project header quick controls (status, progress slider, "set from tasks", dates, auto-save), projects list filters/progress, template at project creation, task quick edit.

**Verified**: lint, tsc, vitest (+quick-note tests), build. Browser smoke against a mock Supabase for home, customer hub, dialogs/wizards, one-time service wizard.
**Unverified**: production data paths for delete project/shoot/schedule and the one-time invoice/payment creation (they use existing tables/RPCs; try each once).
**Next ideas**: same hub pattern inside a project; recurring invoices + expenses; meetings + checklists; per-section animation polish; Reminders delivery.

## 2026-10-06 — Claude — public site copy/positioning pass, contact flow, CRM passkeys

**Database**: the owner's `/app/system` showed 0002–0025 all OK, so **no existing migration is re-run**. The only new SQL is **`0026_passkeys.sql`** (new feature; additive; reversible with `drop table public.passkey_challenges, public.passkeys;`). Passkeys also need the Cloudflare Secret `SUPABASE_SERVICE_ROLE_KEY` (see `docs/DEPLOYMENT.md`); without it the app just shows the password form.

**Public site**
- "Let's talk" glitch fixed. Causes: `/contact` opened with a very tall hero and a scroll-revealed form; the mobile menu faded out over the destination; the page fade (`animation: both`) kept a stacking context that trapped the fixed mobile form under the footer. Now: compact contact header, form on screen immediately, no reveals, menu closes instantly on tap, fade shortened to 0.2s with `backwards` fill, footer hidden under the mobile wizard. A "Let's talk" button was added to the desktop nav (hidden on /contact). Measured ~200ms to a visible, stable form.
- New accessible `SiteSelect` (ARIA select-only combobox, keyboard + typeahead, 52px options, check + inversion for the selected row) used for the mobile wizard's budget/timeline (the native selects were the "poor dropdown").
- Copy audit: services, hero, section headings, About (rewritten), areas, FAQ, footer, work, contact; US spelling; consulting/coaching mentioned where it fits; no invented facts.
- Location: "Based in York, PA. Built to work anywhere." (`WhereSection`, `/areas`, footer, contact, service pages, FAQ, structured data, llms.txt). Service titles/descriptions now target broad intent; `areaServed` includes the United States; no "worldwide".

**CRM**
- Passkeys: `/api/passkey/*` (register options/verify need a signed-in authorized session; login options/verify are public but require a valid signed assertion + `app_owner`/`app_team`), Settings → Security (add/rename/remove), redesigned monochrome login with a keystroke/scan glitch (event-driven; never reads or renders the password; reduced-motion safe), "Use password instead" fallback.
- Red audit: no red brand accents exist in the CRM; the only red is `text-red-700` on a failing row of `/app/system` (a real error, kept).
- Verified end to end with a Chromium virtual authenticator against a mock Supabase (register → sign out → passkey sign-in → /app). Unverified against real Supabase and real devices.

## 2026-10-05 (8) — Claude — project phases + templates per service

**Migration to apply: `0025_project_phases_and_templates.sql`** (after 0023/0024). Additive; the app degrades with a "needs 0025" hint if it is missing, and `/app/system` has probes.
- Project workspace has a new **Phases** tab: apply a template (Software build, Website build, SEO retainer, Meta ads campaign, Social media month, Video content package) to create phases + starter tasks with due dates from a start date; or add phases by hand. Per phase: status (start / complete → next phase starts), reorder up/down, rename, dates, delete (tasks kept), quick "add task", and a place to move loose tasks into a phase. The active phase shows as a chip in the project header.
- `/app/projects/templates`: edit/create templates in a simple text format; linked from Projects and the Phases tab.
- Verified: lint, tsc, vitest, build, `npm run test:db` (apply, due dates, reorder, phase delete keeps tasks, owner/stranger/anon), Playwright smoke against a mock.
- Unverified: real production DB (apply 0025 then check `/app/system`).
- Next ideas: meetings + checklists (ROADMAP 10), recurring invoices/expenses (P2), create-project-from-template at project creation.

## 2026-10-05 (7) — Claude — unified work items + recurring content shoots

**Migrations to apply, in order: `0023_work_items.sql`, then `0024_content_shoots.sql`** (0022 first if not yet applied). Both are additive; the app tolerates a database that is behind (tabs/pages show a "needs 0023/0024" hint; `/app/system` has probes; the dashboard panel hides).
- **Work items (0023)**: `tasks.kind` task/bug/feature_request + severity, requester (contact), source, resolution. Project workspace has new **Bugs** and **Feature requests** tabs (open counts on the tab labels); Tasks page has All/Tasks/Bugs/Feature requests filters and badges. Read model `get_project_work_items()`.
- **Shoots (0024)**: `/app/shoots` (all clients) and a **Shoots** tab in each client workspace. Recurring schedule = weekly / every other week / Nth weekday of the month (incl. "last"), start time, length, location, checklist template; saving plans the next 90 days (`save_shoot_schedule`, `generate_shoots`); per-shoot status, reschedule, notes, tick-able checklist; pause/resume; "Plan next 90 days". Shoots show on the Calendar and a new dashboard **Delivery** panel (next shoots + open bugs).
- Nav: **Shoots** added. Docs: DATABASE_PLAN, DECISIONS D-049/D-050, ROADMAP (item 6 done, 10 partly), IDEAS.
- **Verified**: lint, tsc, vitest (38), build, `npm run test:db` (owner/stranger/anon cases for both migrations incl. weekly/biweekly/monthly/last-weekday generation, idempotence, reset keeps confirmed), and a Playwright smoke of `/app/shoots` and the project Bugs tab against a mock.
- **Unverified**: against the real production database (apply the SQL, then `/app/system`).
- **Next**: project phases + templates per service (ROADMAP 7), create-in-context meetings, recurring invoices/expenses.

## 2026-10-05 (6b) — Claude — verification tag parsing

- Live tag existed but the Cloudflare variable held the whole `<meta ...>` tag, so the rendered content was wrong. `layout.tsx` now extracts the code from a pasted tag (`verificationCode`). Owner should still set the variable to just the code.

## 2026-10-05 (6) — Claude — Search Console verification fix

- Live site had no `google-site-verification` tag: the Cloudflare variable was not a **Build** variable (and a Secret is not exposed to `NEXT_PUBLIC_*`). The owner also chose Google's "HTML file" method, which fails ("file not found"). Added public fallbacks `site.googleVerification` / `site.bingVerification` in `site-config.ts`; checklist now recommends Domain property + Cloudflare DNS TXT record. No migrations.

## 2026-10-05 (5) — Claude — brand-search SEO, CTA "Let's talk"

- CTA is now "Let's talk" everywhere. Brand-search work: `alternateName`/`disambiguatingDescription`/PNG logo (`public/logo.png`) in the JSON-LD graph, PNG favicons (`src/app/icon.png`, `apple-icon.png`), brand-first home description, footer identity line, `llms.txt` identity, sitemap date. Owner actions: `docs/seo/BRAND_SEARCH.md`.
- Owner still to do: Supabase Auth URLs, Search Console + Bing verification, redirects, listings (see SETUP_CHECKLIST.md). No migrations.

## 2026-10-05 (4) — Claude — CTA copy, login moved to footer, typing toggle removed

- Primary CTA is now "Let's talk growth" (hero, nav menu, CTA band, home CTA). Other "project" wording on the public site reworded (band default "Ready to get more customers?", work/about headings, contact meta, email subject "Website inquiry"). Hero eyebrow lists Websites · SEO · Meta ads · Social · Software.
- "Agency login" removed from the top nav (desktop + mobile menu); it lives in the footer. `TypingToggle` removed; typing always plays unless the visitor prefers reduced motion. No migrations.

## 2026-10-05 (3) — Claude — theagencyzero.com, new site email, GBP walkthrough

- Site URL defaults to `https://theagencyzero.com` (canonicals, sitemap, schema, robots). The noindex-until-configured gate was removed. Public email is now `agencyzeroteam@gmail.com` (`site.email`: footer, contact, schema, llms.txt).
- Optional `NEXT_PUBLIC_GBP_URL` build variable adds the Google Business Profile link to structured data (`sameAs`, `hasMap`).
- Docs: `docs/seo/GBP_WALKTHROUGH.md` (hide address, categories, services, description, reviews), `SETUP_CHECKLIST.md` updated.
- **Owner/config**: attach `theagencyzero.com` as a Cloudflare custom domain (+ www redirect); Supabase Auth Site URL/redirects; change Cloudflare variable `LEAD_NOTIFY_EMAIL` to the new email (lead notifications still go to the old one until changed). No migrations.

## 2026-10-05 (2) — Claude — SEO visual: realistic Google Maps phone

- `design/mockups/scenes/seo-search.html` -> `public/images/mockups/seo-search.jpg`: bottom-right phone is now a Google Maps place sheet (status bar, map with pin, bottom sheet with name, rating, Directions/Call/Save/Share, tabs, info rows). Smaller, clear of the bottom edge, rotated 6deg clockwise. Scene text changed from Leeds/UK to York, PA (fictional business). Re-render with `node design/mockups/render.mjs seo-search`. No code or migration changes.

## 2026-10-05 — Claude — total revenue incl. MRR, leads default tab, lead→client, Venmo (0022)

- Dashboard Total revenue = all payments received + this month's MRR (note shows the split). Month card unchanged (received + MRR).
- `/app/leads` now opens on **All** (was New). "Turn into client →" (existing `convert_lead_to_client`, 0019) now redirects to the new client.
- **Migration 0022**: adds `venmo` to `payment_method` and re-creates `record_client_payment` (superset of 0020). Owner must run it (it also fixes "Recording payments needs 0020"). Venmo shows in both payment forms; friendly error if 0022 is missing. SQL test added; `npm run test:db` passes.
- Unverified: dashboard/leads in a live browser against production.

## 2026-10-04 (6) — Claude — MRR in monthly revenue; noindex until domain set; setup checklist

- Dashboard "Revenue this month" = payments received this month + MRR (note shows the split). Caveat: if a recurring client's monthly payment is also recorded as a payment it counts twice; record only one-off fees as payments. UI-only, no migration.
- `src/lib/seo.ts`: removed the `agencyzero.com` fallback (that domain belongs to someone else, registered 2010, expires 2026-12-08). With `NEXT_PUBLIC_SITE_URL` unset the site is `noindex` and `robots.txt` disallows all. Set it as a Cloudflare BUILD variable and redeploy to go live in search.
- `docs/seo/SETUP_CHECKLIST.md`: domain, Cloudflare custom domain, Search Console, Bing, Google Business Profile (service-area, address hidden), listings, email, measurement.

## 2026-10-04 (5) — Claude — dashboard revenue tiles; public-site SEO/AEO for York, PA

- **Dashboard**: revenue tiles no longer show a grey empty cell (Outstanding now spans the row on mobile) and `Stat` tiles fill their cell (`h-full`, wrapping long amounts).
- **SEO/AEO (public site only)**: `src/lib/seo.ts` (URL, area data, JSON-LD builders), `src/content/local-seo.ts` (short answers, local FAQs, titles), `src/content/seo-data.json` (areas/services/modifiers). New `/areas` and `/faq` pages, home "Local to York, PA" section, footer service-area line, local titles/descriptions on every page, `en-US`, richer LocalBusiness graph (service-area, no street address), per-page WebPage/Service/FAQPage/Breadcrumb JSON-LD, `robots.ts` explicit AI/search crawlers, stable sitemap, `/llms.txt` + `/llms-full.txt`, US spelling.
- **Keywords**: `node scripts/generate-keywords.mjs` -> `docs/seo/keywords.csv` (~27k) + `KEYWORDS.md`. Plan and GBP advice: `docs/seo/SEO_PLAN.md`, `docs/seo/LOCAL_SEO.md`.
- **Config needed**: set `NEXT_PUBLIC_SITE_URL` (real domain) in Cloudflare; optional `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`. No migrations (0021 SQL re-given to owner).
- **Unverified**: Google Rich Results test; the "in person around York" wording needs owner confirmation; `/work` concept mockups still have UK-style copy (Leeds, 0800, GBP) that should become US/York-area.

## 2026-10-04 (4) — Claude — carousel: glass lens removed, coverflow instead

- `lens-carousel.tsx` / `globals.css`: removed the centre glass lens (SVG displacement filter, ring, blurred glow blob). Slides now run as a coverflow: the centre slide faces front, side slides tilt in 3D, shrink, fade and blur as they flow in from the edges (per-slide `--o`/`--a` CSS vars set on scroll). Scroll-snap, drag, arrows, dots, auto-advance and lightbox unchanged.
- Verified: lint, tsc, build; desktop and 390px screenshots, no horizontal overflow. No migrations.

## 2026-10-04 (3) — Claude — About story + mobile contact wizard

**Changed**
- `/about`: intro expanded into a personal story (gap in the market, overhead/overcharging, likes helping and saving time, AI as a coworker not a replacement). No invented figures.
- `/contact` on phones (<768px): one-question-per-screen wizard (`contact-wizard.tsx`), 8 steps, native selects, Next/Back, progress bar, no scrolling. Ends on a full-screen decode animation ("Signal sent. / We begin at zero.") and a "Back to home" button. Desktop keeps the long form. Both post the same `submitLeadAction` / `submit_lead` fields.
- The site header is hidden while the wizard is mounted (CSS `:has([data-contact-wizard])`) because the page-fade template creates a stacking context that put the nav above the wizard.

**Verified**: lint, tsc, tests, build; Playwright 390x780 through every step against a mock Supabase.
**Unverified**: real submission against production, real iOS keyboard/viewport behaviour.
**Migrations/config**: none (0020/0021 still need applying if not already).

## 2026-10-04 (2) — Claude — feedback round: lens carousel, lead-gen ads, reframed sections
Home nav link row restored (logo still omitted on home). `LensCarousel` (`lens-carousel.tsx`) replaces the website slider on home + Work: snap-scroll row, centre glass lens (Chromium refracts via SVG `feDisplacementMap` backdrop-filter with RGB split; other browsers get a frosted ring), drag/arrows/dots/keys, slow auto-advance until touched, click-to-zoom lightbox, blurred glow behind the active slide. The 21st.dev page does not expose source (it is WebGL/three/GSAP), so this is an original CSS/SVG take. Subtle global background texture (`.site-texture`: faint grid + two slow light pools). Websites cards: 4th card now a plain checklist. SEO visual re-rendered at 2x with larger text. Content section: reel phones zoom+swing on hover (`.phone-hover`), ads block now shows lead-gen (Meta "work with us" and "register" ads, an Instagram DM thread, comments → sign-ups: `lead-*.html`, `ad-work/register.html`), pipeline simplified to 4 plain cards (shoot day, planning, on schedule, consistency); calendar + call sheet kept. Process section reframed ("You run your business. I will bring in the customers."). Work: CrewBoss gets automations / AI assistant / calendar+invoices / growth copy, field screenshot removed, "Short videos and ads that bring in customers." No migrations.

## 2026-10-04 — Claude — owner feedback round: text effects, home hero, glass carousel, SEO visual, FAQs, contact form
**Typing** is now rare and optional: footer toggle "Typing animation: On/Off" (localStorage `az-typing`, `<html data-typing>`); `TypedText` renders in normal flow (typed chars visible, rest transparent) so it can no longer overlap neighbours (the old overlay/placeholder approach was the cause of the "covers the text then fixes itself" reports). Typing remains only on the hero rotator, Process heading and Services hero. Other headings use `TextEffect` (words / mask / blur) and `ScrambleText` for labels. About: "Hi, I'm Luke Knight" plain; `PersonMoment` is now a scroll-linked word highlight. **Home**: no logo/link row, hero h1 "Agency Zero" (not typed), Menu button opens the overlay at all widths; nav gains "Home" on inner pages. **Liquid-glass carousel** (`glass-carousel.tsx`, left→right loop) for concept websites (home + Work) and video/ads (Work). **Work**: CrewBoss CRM header + hero screenshot first, story and two other screenshots beneath; "View live product"/live card/steps image removed. **SEO section**: new rendered visual `public/images/mockups/seo-search.jpg` (scene `seo-search.html`) + three explainers. **FAQs**: richer answers (+2 per service) in an animated accessible accordion (`faq.tsx`). **Contact form**: four numbered sections, chip radios for budget/timeline, website + social profile fields each with a "none" tick-box, mobile-friendly inputs; presence info is appended to the lead's `details` (no migration), so it shows in /app/leads. No migrations this round (0020/0021 still to apply if not yet done).

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
