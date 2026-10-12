# L&M Tire and Wheel: new website preview (prospect pitch)

A complete static multi-page website for L&M Tire and Wheel (Abbottstown, PA), built as a surprise pitch for the owner.
Served by the Agency Zero site from `public/`, so after deploy it lives at:

- **Pitch page (start here):** https://theagencyzero.com/preview/lm-tire-wheel/compare.html
- **The new website:** https://theagencyzero.com/preview/lm-tire-wheel/

`/preview/` is hidden from search engines (`robots.ts` disallow, `X-Robots-Tag` in `public/_headers`, `noindex` meta on every page)
and skipped by the CRM service worker (`public/sw.js`).

## Pages
| File | What it is |
|---|---|
| `compare.html` | Before/after pitch: drag slider, phone screenshots, measured numbers, "why it sells more", try-it list, launch plan, QR code |
| `index.html` | Home: hero, catalog finder, brand marquee, services, builds gallery + lightbox, staff picks, Google reviews, about, financing/wholesale/apparel promos, hours/map |
| `shop.html` | Wheels / tires / apparel catalog: brand, diameter, tire type, price filters, tire-size search, sort, saved vehicle, product sheet (`#p=<id>` deep links) |
| `checkout.html` | Cart checkout: vehicle, install/pickup + preferred day, contact, payment (pay at shop / Affirm / wholesale) → order reference |
| `services.html` | All services + booking form (blocks weekends) |
| `financing.html` | Affirm explainer, payment calculator, FAQ |
| `contact.html` | Message form (topic pre-select via `?topic=`), hours, map |

Shared: `site.css`, `site.js` (header/footer/cart/product sheet/forms/hours injected on every page), `catalog.js` (data), `home.js`.

## Data sources (pulled 2026-10-10)
- Copy, services, hours, socials, apparel, logo, brand red `#EE2738`, gallery photos: lmtire-wheel.com.
- Catalog (`catalog.js`, 86 wheels, 129 tires, 9 apparel): scraped from their RideStyler store listings by brand, with real prices, finishes, sizes, tire types, warranties and rebates. Product photos re-encoded to WebP in `assets/cat/`.
- Reviews: five real Google reviews + 4.9 / 2,127 from their Maps listing (lightly trimmed, disclosed on page).
- `assets/compare/`: real screenshots of the current site and the new one; numbers on the pitch page were measured with Chromium, cache disabled (old: 238 requests / 5.8 MB / 1.7 MB JS / 22 third-party hosts; new: 15 / 1.1 MB / 0.12 MB / 2).

## Preview mode (honest by design)
Forms and checkout work end to end but nothing leaves the browser (stored in `localStorage` as `lm_submissions`); every success
screen says so, and a top bar on each page says "Preview, not live yet". At launch: wire submissions to the shop (SMS/email),
connect the full catalog/inventory feed, Affirm checkout with their merchant account, move to lmtire-wheel.com.

## Local preview
```
python3 -m http.server 8766 --directory public   # then open http://localhost:8766/preview/lm-tire-wheel/compare.html
```
