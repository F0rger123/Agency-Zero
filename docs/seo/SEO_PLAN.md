# Public-site SEO / AEO: what is built, and what you do next

Scope: the **public marketing site only** (not the CRM, which is `noindex` and blocked in `robots.txt`).

## Built into the site
| Area | What |
|---|---|
| Titles and descriptions | Every page has a unique, local title (<= ~45 chars + "| Agency Zero") and description with the primary keyword first ("web design York PA", "custom software", "SEO services York PA", "Meta ads manager"...). |
| Structured data | Site-wide `ProfessionalService` + `LocalBusiness` (service-area, York PA, no street address), `Person` (Luke Knight), `WebSite`; per page `WebPage` (with `speakable`), `Service`, `FAQPage`, `BreadcrumbList`. Only facts that are on the pages. No fake reviews, ratings or addresses. |
| AEO (answer engines) | Each service page opens with a quotable "short answer"; 3-4 local, answer-first FAQs per service (`src/content/local-seo.ts`); a site-wide `/faq` page; `/llms.txt` and `/llms-full.txt` plain-text summaries; `robots.txt` explicitly welcomes search and AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, etc.) on public pages. |
| Local | `/areas` page listing York County towns and nearby cities; "Local to York, PA" home section; footer service-area line; `en-US` locale; geo meta tags. |
| Technical | Canonical URLs, stable sitemap dates, `max-snippet` / `max-image-preview` robots directives, CRM `noindex`, US spelling ("optimization"). |
| Keywords | `docs/seo/keywords.csv` (27,000 York/PA keywords with cluster, tier, target page, intent) and `KEYWORDS.md` (summary). Regenerate with `node scripts/generate-keywords.mjs`. |

## Deliberately not done
- **No keyword stuffing and no `keywords` meta tag.** Google ignores the tag and stuffed pages are demoted. The big list is for
  planning and targeting; the live pages use a natural subset.
- **No one-page-per-town "doorway" pages** with swapped town names. Google treats them as spam. Add a real local page only when
  you have something true to say about that place (a client, a project, a local event). `/areas` covers the towns in the meantime.
- **No rankings promises.** No fake review/rating markup.

## Do next (owner)
1. (Done) Domain `theagencyzero.com` bought and used as the default site URL. Connect it in Cloudflare, then follow `SETUP_CHECKLIST.md` and `GBP_WALKTHROUGH.md`.
2. Search Console + Bing verification and sitemap submission (see `LOCAL_SEO.md`).
3. Decide on a Google Business Profile (see `LOCAL_SEO.md`).
4. (Done) Owner confirmed customers are met mostly in person, so the "in person around York" wording stands.
5. Replace the placeholder concept designs on `/work` with real York-area projects when you have them. Real, local client work
   (with permission), testimonials and case studies are the strongest ranking and conversion signals you can add.
6. Get reviews and links: Google reviews, local directories, chamber of commerce, client sites linking back ("Website by Agency Zero").
7. Publish helpful local content now and then (e.g. "What a website costs for a York, PA contractor") using the question list in `KEYWORDS.md`.

## 2026-10-06 update: positioning and remote clients
The site now says "Based in York, PA. Built to work anywhere." Service pages and titles target broad intent (custom CRM development, SEO and AEO,
Meta ads management, etc.); York/PA stays in descriptions, the `/areas` page and structured data (`areaServed` includes the United States). For
local searches the Google Business Profile service area still lists York and nearby places; remote clients come from the broad service pages.
Brand work is in `BRAND_SEARCH.md`.
