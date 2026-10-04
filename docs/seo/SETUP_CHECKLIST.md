# Agency Zero: go-live and SEO setup checklist (do in this order)

Menu names in Google/Cloudflare change; if a label differs, look for the closest one. Estimated total: 2-3 hours, spread over a week
(verification steps have waiting periods).

## 0. Domain
- `agencyzero.com` is **already registered by someone else** (since 2010, registration expires 2026-12-08, currently a parked "lander"
  page). It is not available to register. Options: wait for it to drop and backorder it (no guarantee), or contact the owner through
  the registrar to ask for a price (premium aftermarket prices are often $1,000+), or pick another domain.
- Cloudflare Registrar sells at wholesale cost, no markup (prices as published 2026-10, per year): .com $10.46, .net $11.86,
  .dev $12.20, .agency $24.20, .pro $21.20, .us $6.50, .io $32 (renews $50), .tech $9.99 (renews $49.20).
- Looked unregistered when checked on 2026-10-04 (confirm at checkout): `agencyzerohq.com`, `agencyzeropa.com`, `agencyzeroyork.com`,
  `agencyzero.dev`, `agencyzero.app`, `agencyzero.pro`, `agencyzero.tech`. `agencyzero.net`, `agencyzer0.com` and `agencyzero.digital` are taken.
- Recommendation: a **.com** (customers type .com). `agencyzerohq.com` or `agencyzeropa.com` at about $10.46/yr keeps the brand and adds a
  local signal. Avoid hyphens, and avoid `agencyzer0.com` (zero-for-o gets mistyped).
- Buy: Cloudflare dashboard > Domain Registration > Register Domains > search > purchase. Turn on auto-renew and WHOIS privacy (free).

## 1. Point the site at the domain (Cloudflare)
1. Workers & Pages > `agency-zero` > Settings > **Domains & Routes** > Add > **Custom domain** > enter `yourdomain.com` (add `www.` too and redirect www to the root).
   If the domain is registered at Cloudflare, DNS and the certificate are created automatically.
2. Settings > **Build** > Variables and secrets > add **build** variable `NEXT_PUBLIC_SITE_URL` = `https://yourdomain.com` (no trailing slash).
   It is a build-time variable, so trigger a new deploy afterwards. Until it is set, the site stays hidden from search engines.
3. Supabase > Authentication > URL Configuration: set Site URL to the domain and add `https://yourdomain.com/**` to Redirect URLs (the CRM login needs it).
4. Visit `https://yourdomain.com/robots.txt`, `/sitemap.xml`, `/llms.txt`: all three should load and show your domain.
5. Optional but worth it: Cloudflare > SSL/TLS > Edge Certificates > turn on **Always Use HTTPS**.

## 2. Google Search Console (free; this is how you see what you rank for)
1. search.google.com/search-console > Add property > **URL prefix** > `https://yourdomain.com`.
2. Choose **HTML tag** verification, copy only the `content="..."` value.
3. Cloudflare build variable `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = that value, redeploy, click Verify.
4. Sitemaps > add `sitemap.xml`.
5. URL Inspection > paste each of: `/`, `/services`, each `/services/*`, `/areas`, `/faq`, `/work`, `/about`, `/contact` > **Request indexing**.
6. Check back weekly: Pages (indexed or not and why), Performance (queries, clicks, positions).

## 3. Bing Webmaster Tools (free; also feeds ChatGPT search, Copilot, DuckDuckGo)
1. bing.com/webmasters > Import from Google Search Console (fastest), or add manually with an HTML meta tag in
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
2. Submit the sitemap. Bing also supports IndexNow for instant updates (optional).

## 4. Google Business Profile (you meet customers mostly in person, so you qualify as a service-area business)
Before you start: have your **home or meeting address** ready to receive verification, a profile photo/logo, and 5+ work photos.
1. Go to google.com/business > **Manage now**. Sign in with a Google account you will keep long term (a dedicated one for the business is better than personal).
2. **Business name**: `Agency Zero` exactly. Adding "York PA web design" to the name is against the rules and gets profiles suspended.
3. **Category**: primary **Website designer** (or Marketing agency). Add secondary: Internet marketing service, Software company,
   Advertising agency, Video production service, Search engine optimization service.
4. When asked "Do you want to add a location customers can visit?", answer **No** if you do not run an open-door office
   (you meet at cafes or their sites). Then choose **service area**: York, PA first, then York County towns and the nearby cities
   you will actually travel to (Hanover, Harrisburg, Lancaster, Gettysburg, Carlisle, etc.). Up to 20 areas.
5. Provide your **real address** for verification only. Keep **"Show business address to customers" off** (hidden). Never use a
   virtual office, PO box or a friend's address.
6. Phone: a number you will answer (a Google Voice number is fine) and your website `https://yourdomain.com`.
7. **Verification**: usually a video recording (show your location, your equipment/laptop, and proof such as a work-related document or
   website admin) or a postcard with a code (5-14 days). Follow Google's prompts exactly. Do not start a second profile if it is slow.
8. After verifying, complete everything: hours (or "by appointment"), services (one entry per service with a short description from the
   site), attributes, business description (750 chars; use the "short answer" from the home page; no links, no promos), logo, cover
   photo, 5-10 photos of your work, and your Instagram link.
9. **Reviews**: in the profile click "Ask for reviews" to copy your review link. Send it to every happy client right after delivery
   with a personal message. Reply to every review. Never buy, trade or fake reviews, and don't review yourself.
10. **Posts**: every 1-2 weeks, a project, tip or offer. Keeps the profile active.
11. Keep name, phone, website and service area **identical** everywhere (site, Instagram, Facebook, directories).
12. Rules change: re-read Google's Business Profile guidelines at support.google.com/business before submitting.

## 5. Other listings (30 minutes each batch; all free)
- Bing Places for Business (can import from Google).
- Apple Business Connect (shows in Apple Maps/Siri).
- Facebook Business Page, LinkedIn Company Page, Instagram (already) — same name, description, website link.
- Yelp for Business, Nextdoor Business, Alignable, Clutch and DesignRush (agency directories), York County/York Chamber of Commerce,
  local "Made in York"-type directories, and any local Facebook business groups (follow their rules on self-promotion).
- Wherever possible, a link back to your site. Local, relevant links beat many random ones.

## 6. Business email on your domain
Email like `luke@yourdomain.com` looks more credible than Gmail and builds trust. Cloudflare Email Routing (free) can forward
`luke@yourdomain.com` to your Gmail, and Gmail can "send as" it. Then update `src/lib/site-config.ts` (`site.email`) and the
contact page. Ask me and I will make the change.

## 7. Measure
- Google Search Console (above) is the main one. Review monthly: which queries show you, which pages get clicks.
- Analytics: not installed (no cookies or tracking on the site today). If you want it, a privacy-friendly option (Plausible,
  Cloudflare Web Analytics, which is free and cookieless) can be added. Ask me.
- PageSpeed Insights (pagespeed.web.dev) on `/` and a service page: aim for green on mobile.
- Rich results test (search.google.com/test/rich-results) on `/services/seo` and `/faq`: should show FAQ and Breadcrumb items valid.

## 8. Ongoing (what actually moves rankings)
- **Real work shown on the site**: replace concept examples on `/work` with real York-area projects and short case studies
  (what the problem was, what you built, the result), with the client's permission.
- **Reviews**: aim for 10+ Google reviews in the first few months.
- **Links**: ask clients to link back ("Website by Agency Zero"), get listed in local directories, offer a local business a free guest tip.
- **Content**: one helpful post or page every month answering a real local question (see the question list in `KEYWORDS.md`):
  "How much does a website cost for a York PA contractor?", "Do I need a CRM?", "How do Meta ads work for local businesses?"
- **Consistency**: same name/description/links everywhere.
- Expect first results in 2-3 months and real traction in 6-12. Nobody can guarantee a ranking.
