# 97 World — Design Sector (Website)

A multi-page static site. No build step — open `index.html`, or host the folder anywhere (GitHub Pages works out of the box, including `404.html`).

## Pages
- `index.html` — home: mega hero, bento overview, featured work, process, manifesto
- `services.html` — full service catalog with deliverables (rendered from `js/data.js`)
- `work.html` — case studies
- `pricing.html` — live quote calculator (UGX/USD, saves your quote)
- `start.html` — WhatsApp order form (picks up the saved quote)
- `about.html` — the sector story, nations, principles
- `404.html` — not-found page

## Engine (v4 — "Kinetic")
- `css/fonts-v4.css` — self-hosted @font-face: Space Grotesk (display), Fraunces italic (editorial accent), Manrope (body), Space Mono (labels)
- `css/v4.css` — the whole design system: tokens, layout, components, motion (mesh background, glass cards, marquee, gate/live pricing states, etc.) — single stylesheet for every page, including home
- `js/data.js` — **all content**: services + prices, process, FAQs, portfolio (mirrors the 97 World Notion hub) — unchanged by the v4 rebuild
- `js/render.js` — renders `window.SITE` into the v4 markup (catalog, work cards, FAQ, process rail, client marquee, partners grid, nation clocks, principles); also owns money formatting + country state (`window.K97`)
- `js/motion.js` — the animation layer: custom cursor, magnetic buttons, card tilt, scroll-reveal with stagger, animated counters, glass nav-on-scroll, mobile menu, marquee duplication, scroll progress bar
- `js/pricing.js` / `js/start.js` — per-page logic (quote totals, country gate, WhatsApp message building) against `window.K97`
- `assets/` — logo marks, lockups, favicon, self-hosted font subsets

## Edit content
Change prices, services, FAQs or portfolio in `js/data.js` — the services page, pricing calculator and start page all render from it. The same content lives in the Notion hub ("97 World — Design Sector HQ") so you can keep both in sync.

## How ordering works
The pricing page saves the visitor's quote (localStorage) and hands it to `start.html`, which opens WhatsApp to +256 708 735 878 with the order pre-filled. Log incoming orders in the Notion "Orders & Leads" pipeline.

## Brand rule: the mark never sits on a background
The 97 mark is always free-floating — no tiles, chips, panels or boxes behind it, anywhere (glows and drop-shadows are light, not surfaces, and are fine). `tools/images.mjs` generates every icon to this rule:
- `favicon.svg` — scheme-adaptive mark (white on dark UI, inverted on light), transparent
- `favicon.png` — gradient-filled mark on transparency (fallback)
- `icon-512.png` — white mark on transparency (manifest `purpose:"any"`)

Two **spec-forced platform exceptions**, deliberately rendered as near-black site canvas so they read as canvas, never as a chip:
- `icon-maskable-512.png` — Android maskable icons REQUIRE full bleed (transparency gets composited onto white, which is worse)
- `apple-touch-icon.png` — iOS composites transparency onto black and rounds corners itself

## The v4 design language ("Kinetic")
Dark violet/pink gradient system on glass surfaces — the opposite end of the spectrum from the earlier black/yellow poster look. Stay in this vocabulary when adding UI:
- **Palette:** near-black canvas (`--bg`), a fixed drifting gradient mesh behind everything (`.mesh`), glass cards (`.card4` — translucent fill + blur + hairline border), gradient CTA (`--grad-cta`, violet→pink) as the one loud accent. WhatsApp green (`--wa`) stays reserved for actual WhatsApp affordances — never used decoratively.
- **Type:** Space Grotesk for display/headings, Fraunces italic for the one accent word per headline (`<em>`), Manrope for body copy, Space Mono for labels/eyebrows/numerals.
- **Motion (`js/motion.js`):** every animated element opts in via a class/attribute — `.rv` (scroll reveal, stagger with `data-group`), `[data-magnetic]` (magnetic pull), `.tilt` (mouse-driven card tilt), `[data-count]` (animated counters), `[data-marquee]` (auto-duplicating scroll ticker). All are `prefers-reduced-motion`-aware and disabled on touch.
- **Old assets kept but unused:** the licensed Knockout font trio and Inter/JetBrains Mono files are still in `assets/fonts/` (paid assets, not deleted) even though nothing currently references them — a future revert wouldn't need to re-license them.

## Dev tools (run locally, outputs committed)
- `npm run build` — regenerates every page head (SEO, JSON-LD from data.js), shared nav/mmenu/footer chrome, sitemap; fails on broken internal links and on bad `disp.svc` ids
- `npm run images` — brand icons per the mark rule above; scene re-encodes only with `-- --src <original-renders>`
- `npm run shots` — screenshots every `Live`+`link` work row via Playwright → `assets/work/<id>.{avif,jpg}`; then set `disp.shot` in data.js so `js/render.js` uses the real screenshot instead of the gradient-monogram placeholder
- `npm run og` — regenerates OG share cards (`assets/og/og-<page>.jpg`) — **still generates the old fight-bill-poster look**; due for a v4 pass to match the new gradient system
- `npm run fonts -- --dir <folder>` — converts a licensed desktop font file to a committed woff2 subset + prints fallback metrics (only the subset is committed, never the desktop original)

Bump `VERSION` in `sw.js` on every deploy — `npm run build` stamps matching `?v=` query strings.
