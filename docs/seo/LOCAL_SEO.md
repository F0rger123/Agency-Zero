# Google Business Profile and local listings: should Agency Zero have one?

Short answer: **yes, probably, as a service-area business with your home address hidden, but only if it fits Google's
rules.** Check Google's current guidelines before you start, because they change.

## What Google allows (as of this writing; verify at support.google.com/business)
- A Business Profile is for businesses that **interact with customers in person**, either at a location or by travelling to them.
  A purely online business with no in-person contact is generally **not eligible**.
- **Service-area businesses** (you go to customers, or meet them) may list with the **address hidden** and a service area
  instead (for example "York, PA" plus nearby towns). A home-based business can do this, and your home address is then not public.
- You must use a **real** address you can receive verification at (usually a postcard or video call). Do **not** use a
  virtual office, mail-forwarding box or someone else's address: Google suspends those profiles, and that is hard to undo.
- The business name must be your real name as used everywhere (Agency Zero), with no keywords added ("Agency Zero | Web Design York PA"
  is a violation).
- One profile per business, and one for each real location. Don't create several profiles for several towns.

## Recommendation
Owner confirmed: customers are met mostly in person, some online. That qualifies as a service-area business, so **create the profile**. Full steps: `SETUP_CHECKLIST.md` section 4.

1. If you meet clients in person around York (coffee shop meetings, on-site visits, shoots), you qualify as a service-area business.
   Create the profile, **hide the address**, set the service area to York County plus the nearby towns you really travel to.
2. If everything is genuinely remote, don't force it. Skip Google and use the "no address needed" listings below, and
   revisit if you start meeting people in person.
3. Either way, the website is already set up as a **York, PA service-area business** (structured data with no street address).

## If you create the profile
- Primary category: **Website designer** (or **Marketing agency** / **Software company**, whichever you want most).
  Add secondary categories: Internet marketing service, Advertising agency, Software company, Video production service, Search engine optimization service.
- Services: add each of the six services with a one-line description (use the wording on the site).
- Description (750 characters max): the "short answer" on the home page is a good base. No URLs or promotions in it.
- Add your website URL, hours (or "by appointment"), Instagram link, photos of the work (the mockups) and a logo.
- Posts: share a project or tip every couple of weeks.
- **Reviews**: ask every happy client to leave a Google review using your profile's review link. Reply to all of them. Do not
  buy or incentivise reviews, and do not review yourself.
- Keep **name, address (or "service area"), phone and website identical** everywhere (NAP consistency).

## Other listings that need no storefront
Bing Places, Apple Business Connect, Facebook page, Instagram (already), LinkedIn company page, Yelp, Clutch, DesignRush,
Nextdoor business, York County Chamber of Commerce / local business directories, Alignable, and local Facebook business groups.
Each is a link back to the site plus a consistency signal. Use the same business description and name.

## Search Console and Bing Webmaster Tools (do this first, 15 minutes)
1. Set `NEXT_PUBLIC_SITE_URL` in Cloudflare to the real production domain (with `https://`, no trailing slash). **All canonical
   URLs, the sitemap and structured data are built from it.**
2. Add the property in Google Search Console. Choose the HTML tag method, copy the `content` value into the
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var, redeploy, click Verify. Do the same in Bing Webmaster Tools with
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
3. Submit `https://<your-domain>/sitemap.xml` in both.
4. Request indexing for `/`, each `/services/*` page, `/areas`, `/faq`.
