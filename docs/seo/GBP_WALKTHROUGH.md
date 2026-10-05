# Google Business Profile walkthrough: hiding your address and targeting local searches

Business: **Agency Zero** (theagencyzero.com, agencyzeroteam@gmail.com). You meet customers mostly in person, so you qualify as a
**service-area business (SAB)**. Google's menus change; follow the intent if a label differs, and re-read Google's guidelines
(support.google.com/business) before submitting.

## Part A: Create it and hide the address
1. Sign in to the Google account you will keep long term (ideally agencyzeroteam@gmail.com). Go to **google.com/business** > **Manage now**
   (or search "Agency Zero" on Google Maps and choose "Add your business").
2. **Business name**: `Agency Zero`, exactly. No keywords in the name ("Agency Zero | Web Design York PA" gets profiles suspended).
3. **Business type / category**: type "Website designer" and select it as the **primary** category (details in Part B).
4. **"Do you want to add a location customers can visit, like a store or office?"** Choose **No**.
   This is the step that makes it a service-area business and keeps your address off the public listing.
   (If you pick Yes, the address is shown publicly.)
5. **Service area**: add **York, PA** first, then the nearby places you will really travel to (see Part B). You can add up to 20.
   Do not draw radius circles; add named cities and counties.
6. **Contact details**: phone (a Google Voice number is fine, as long as you answer it) and website `https://theagencyzero.com`.
7. **Address for verification**: when asked for your business address (for Google only), enter your **real** home or meeting address.
   Make sure the **"Show business address to customers"** (or similar) setting is **OFF**. After creation, check:
   Business Profile > Edit profile > Business location, and confirm the address is not shown on the public card
   (search your business name in an incognito window after it is live).
   - Never use a virtual office, PO box, mail-forwarding address or someone else's address.
8. **Verification**: usually a **video call/recording** (show your surroundings, equipment, a work-related item, and the site/admin
   login) or a postcard code (5-14 days). Follow the on-screen instructions exactly. If verification fails, read the reason; don't create duplicates.
9. If it asks for hours: pick **"Open by appointment only"** or your working hours.

## Part B: Settings that matter for local ranking
**Categories**
- Primary: **Website designer** (best match for "website builder near me" / "web designer York PA").
- Secondary (add up to 9; use real ones): **Internet marketing service**, **Software company**, **Advertising agency**,
  **Search engine optimization service**, **Social media agency**, **Video production service**, **Marketing consultant**, **Computer consultant**.
  The primary category is the strongest signal; keep it as the thing you most want to be found for.

**Service area (named places)**: York, PA; Spring Garden Township; West York; Hanover; Red Lion; Dallastown; Shrewsbury; New Freedom;
Dover; Manchester; Harrisburg; Camp Hill; Mechanicsburg; Carlisle; Lancaster; Gettysburg; Lebanon; Hershey. Pick the 20 you'd truly drive to
(or serve remotely). Keep York first.

**Description (<= 750 chars, no links, no promo language)**
> Agency Zero is a York, PA digital agency run by Luke Knight. I build custom software and CRMs, design fast websites, and handle SEO
> (including local search and AI/answer-engine optimization), Meta ads, social media management and video content for small businesses in
> York County and across Central Pennsylvania. You work with one person from the first conversation to launch, in person around York or
> over video. Everything is built to bring in customers, not just look good.

**Services** (Edit profile > Services; add each with a description under 300 chars)
- Custom software & CRM development: Custom CRMs, internal tools and automations built around how your business runs.
- Website design: Custom, fast, mobile-friendly websites with SEO built in.
- SEO & local SEO: Technical and on-page SEO, Google Business Profile setup, citations and content for local searches.
- AEO / AI search optimization: Structuring your site so Google AI Overviews, ChatGPT and Perplexity can understand and quote you.
- Meta ads (Facebook & Instagram): Creative, targeting, tracking and testing for lead generation.
- Social media management: Content calendar, posts, short-form video and community replies.
- Video & content production: Short-form video, shoots and ad creative.

**Attributes / extras**: "Identifies as ..." and similar only if true. Add "Online appointments" and "On-site services" if offered.
**Appointment link**: your contact page `https://theagencyzero.com/contact`.
**Website link**: `https://theagencyzero.com` (homepage).
**Social profiles**: Instagram (Facebook/LinkedIn once created).

**Photos**: logo, cover image, 5-10 images of real work (the work-page visuals, screenshots of client sites with permission, you at work). Add 1-2 a month. Name files descriptively before uploading (e.g. `custom-crm-dashboard-york-pa.jpg`).

**Q&A / FAQs**: seed from the site's FAQ (answer in your own words): "Do you work with small businesses in York, PA?", "How much does a website cost?", "Do you build custom CRMs?".

## Part C: Reviews, posts and consistency
- **Reviews**: Profile > "Ask for reviews" > copy your link. After each delivered project, send: "Thanks for working with me. If you're happy, a quick Google review helps other York-area businesses find me: <link>". Reply to every review within a few days. Ask for reviews that mention the service and the town naturally; don't script them, buy them or trade for them.
- **Posts**: every 1-2 weeks (what's new, a project, a tip, an offer). Add a button ("Learn more" > the matching service page).
- **NAP-ish consistency**: name `Agency Zero`; website `https://theagencyzero.com`; email `agencyzeroteam@gmail.com`; the same short description on Instagram, Facebook, LinkedIn, Bing Places, Apple Business Connect, Yelp, directories.
- **After verification**: copy the profile's public link (Share > "Share profile") and set it as the Cloudflare **build variable** `NEXT_PUBLIC_GBP_URL`,
  then redeploy. The site adds it to its structured data (`sameAs` / `hasMap`).

## Part D: What the website already does to support this
York, PA keyword-led titles and descriptions on every page; a service-area page (`/areas`); local FAQs on each service page; FAQ and LocalBusiness
structured data (service-area, no street address); `llms.txt` for AI assistants; sitemap and robots for search and AI crawlers. See `SEO_PLAN.md`.

## Part E: Realistic timeline
Verification: days to 2 weeks. Showing up for "near me" searches in your area: weeks to a few months, driven by completeness, reviews and activity.
There are no guarantees; nobody controls Google's ranking.
