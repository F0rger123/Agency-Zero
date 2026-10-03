# Public site design system

Applies to the marketing site (`src/app/(site)`, `src/components/site`). The CRM keeps its own light
system (MASTER_SPEC §3); they share identity (black/white/grayscale, hairlines, weight-led type), never components.

## Principles
One designer, one system. Three signature interactive moments, everything else quiet. Interaction supports the
content; it never replaces it. Every effect: pauses off-screen and during scroll, respects
`prefers-reduced-motion`, and has a non-interactive fallback.

## Tokens (`src/app/globals.css`, "PUBLIC SITE DESIGN SYSTEM")
| | |
|---|---|
| Palette | `ink #000` · `coal #070707` · `char #101010` · `graphite #1a1a1a` · `bone #f4f4f2` · `mist #b3b3b3` · `ash #7c7c7c` · `rule` (white 13%) · `rule-strong` (white 30%) |
| Type | Geist Sans (display/body) + Geist Mono (labels), self-hosted via the `geist` package. Classes: `.t-mega .t-display .t-title .t-lead .t-body .t-label` |
| Border | 1px hairline `border-rule` (strong = `border-rule-strong`) |
| Radius | 0. Only dots/indicators are round |
| Motion | `--ease-out: cubic-bezier(.22,1,.36,1)`; 350 ms hover, 900 ms reveal; nothing bounces |
| Hover | links draw an underline in (`.u-link`); buttons wipe a fill up (`.btn`, `.btn-solid`) |
| Depth | `.depth-top/.depth-bottom` (barely-there charcoal pools), `.grain` (fixed noise; off on phones) |
| Layout | `.site-wrap` (max 1560, fluid padding), `Section` / `SectionHeading` primitives |

## Primitives (`src/components/site`)
`Reveal` (scroll entrance) · `ScrollScene` (writes `--p`/`--s` scroll progress CSS vars, no re-renders) ·
`useCanvasLoop` (visibility + scroll aware rAF) · `PageHero` · `CtaBand` · `Section/SectionHeading` · `MediaFrame`
(video/image placeholder architecture) · `WorkCard` · `ServiceGlyph` · `SiteNav` / `SiteFooter` / `SiteWordmark`.

## The interactive moments (original implementations — see "Inspiration & sources")
1. **Hero — ASCII reaction field** (`ascii-reaction.tsx`): Gray–Scott reaction–diffusion drawn as thin ASCII
   contours; the pointer seeds new fronts. ≤14k cells, 30 fps, idle-built, code-split.
2. **Brand moment — AGENCY ZER0 in depth** (`brand-moment.tsx`): sticky 320svh scene, three type layers travel at
   different speeds, statement resolves. CSS-only after `ScrollScene` sets `--s`.
3. **Services wheel** (`services-wheel.tsx`): draggable/keyboard ring; selected service rests at 3 o'clock with
   its full text in a fixed panel; plain list below `md`. Never hijacks scroll.
4. **Closing — layered text** (`layered-text.tsx`): "systems." in 6 CSS-3D layers tilting with the pointer.
Supporting, quiet: code-field spotlight (software), reactive dot lattice (websites), 3D unfurling gallery,
gateway-flow particle streams (process, deliberately ~40 s per traversal), sparse particles (CTA), bars divider.

## Inspiration & sources (nothing copied)
The 21st.dev components require an API key to install and several have no stated licence, so none were imported.
Each idea was re-implemented from its described behaviour: ASCII hero (reaction–diffusion front), parallax scrolling
(GSAP+Lenis in the original → CSS scroll vars here), works wheel (drag/rotate ring), gateway flow (three.js in the
original → 2D canvas), layered text (GSAP → CSS 3D), vertical bars, code background, fluid particles, ASMR-style
reactive lattice. **New dependencies: `geist` (fonts, OFL). No animation libraries.**

## Performance rules (measured, see HANDOFF)
No CSS `mask-image` over canvases (use gradient overlays); canvases pause off-screen, in background tabs and while
scrolling; no `backdrop-filter` except the scrolled nav; images/video via `MediaFrame` are lazy (`preload="none"`).
