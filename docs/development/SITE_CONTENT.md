# Public site — content & assets the owner needs to supply

Everything below is currently a clearly-labelled placeholder. Edit the file named, not the components.

| Need | Where | Notes |
|---|---|---|
| Real contact email, phone, socials | `src/lib/site-config.ts` (`site`) | `hello@agencyzero.com` and social URLs are placeholders. Set `NEXT_PUBLIC_SITE_URL` too (sitemap/OG). |
| Real case studies | `src/content/work.ts` | Replace each entry, set `placeholder: false`. Never add invented metrics. |
| Website screenshots for the gallery | `src/components/site/browser-gallery.tsx` (`frames`) | Currently abstract wireframes. |
| CRM screenshots | `src/components/site/crm-mockup.tsx` | Currently an HTML illustration. Use real screenshots with client data removed. |
| Video / image reel | `src/content/media.ts` (+ files in `/public`) | Add `video`/`poster`/`image`; placeholders vanish. Keep videos short, muted, compressed. |
| Founder / team story | `src/app/(site)/about/page.tsx` (TODO(content)) | |
| Service copy review | `src/content/services.ts` | Written to be honest and non-guaranteeing; confirm it matches how you deliver. Add pricing approach if wanted. |
| OG image | add `src/app/opengraph-image.png` | 1200×630. |
| Analytics / cookie consent | not added | Add when you choose a tool. |
| Legal pages | not added | Privacy policy + terms (a contact form collects personal data). |
