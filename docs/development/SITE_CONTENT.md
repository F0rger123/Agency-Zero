# Public site — content & assets the owner needs to supply

Everything below is currently a clearly-labelled placeholder. Edit the file named, not the components.

| Need | Where | Notes |
|---|---|---|
| Phone, socials | `src/lib/site-config.ts` (`site`) | Email is set to agencyzeroteam@gmail.com. Social URLs are placeholders. Set `NEXT_PUBLIC_SITE_URL` too (sitemap/OG). |
| Case studies | `src/content/work.ts` | **CrewBoss is real** (screenshots from its public landing page; no results claimed). The two "Example" entries need real projects. Never add invented metrics. |
| Website screenshots for the gallery | `src/content/concepts.ts` | Five fictional concept designs (rendered from `design/mockups`). Swap in real client sites + set `concept: false`. |
| CRM screenshots | `src/components/site/crm-mockup.tsx` | Software section still uses an HTML illustration; CrewBoss shots are used on /work. Consider real screenshots of Agency Zero's own CRM (client data removed). |
| Video / ad creative | `src/content/media.ts` (+ files in `/public`) | Reels and ads are rendered mockups today; add `video`/`poster`/`image` to use real work. Keep videos short, muted, compressed. |
| Founder / team story | `src/app/(site)/about/page.tsx` (TODO(content)) | |
| Service copy review | `src/content/services.ts` | Written to be honest and non-guaranteeing; confirm it matches how you deliver. Add pricing approach if wanted. |
| OG image | add `src/app/opengraph-image.png` | 1200×630. |
| Analytics / cookie consent | not added | Add when you choose a tool. |
| Legal pages | not added | Privacy policy + terms (a contact form collects personal data). |
