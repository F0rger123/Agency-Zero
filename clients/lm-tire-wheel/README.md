# L&M Tire and Wheel: landing page redesign (prospect pitch)

Static one-page redesign of https://www.lmtire-wheel.com/ built as a pitch for a prospective client.
Plain HTML/CSS/JS, no build step. **Not deployed by the Agency Zero app**: this folder sits outside
`public/` and `src/`, so Next.js / Cloudflare never serves it.

## Preview
```
python3 -m http.server 8765 --directory clients/lm-tire-wheel
# open http://localhost:8765
```
Or open `index.html` directly. The Google Map embed needs a network connection; without one the
section shows their own dark map image instead.

## Where the content came from (pulled 2026-10-10)
- **Copy, services, hours, phone, address, socials, apparel, financing (Affirm), service areas**:
  lmtire-wheel.com home, /about-us, /offered-services, /financing, /apparel, /contact-us.
- **Photos** (`assets/builds`, `hero`, `shop`, `lift`): their vehicle gallery (RideStyler media CDN),
  re-encoded to WebP (800px grid + 1600px lightbox).
- **Logo + brand red `#EE2738`**: their RideStyler company logo files.
- **Featured products + "starting at" prices**: their "Tires/Wheels We Like" homepage section.
  Product images are from RideStyler's catalog. Prices go stale, so re-check them before showing the page.
- **Reviews**: five real Google reviews plus the 4.9 rating from 2,127 reviews, from their Google Maps listing
  (`https://share.google/DiG5vSC5TweEVVtUW`). Lightly trimmed for length, with a note saying so on the page.

## What's live vs. linked out
Shopping (by vehicle/size, product pages), the contact form, financing and apparel link to their existing
RideStyler store at lmtire-wheel.com, so nothing on this page is fake. Open/closed status is
calculated live in America/New_York time from their posted hours.

## Before using this publicly
It uses L&M's name, logo, photos and reviews, so get the owner's OK before publishing it anywhere public.
