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

## Engine
- `css/styles.css` — core: tokens, background FX, nav, footer, shared components
- `css/home.css` / `css/pages.css` — page-specific layers
- `js/data.js` — **all content**: services + prices, process, FAQs, portfolio (mirrors the 97 World Notion hub)
- `js/site.js` — shared: aurora background, cursor, reveals, menu, clocks, money utils
- `js/home.js` / `js/pricing.js` / `js/start.js` — per-page logic
- `assets/` — logo marks, lockups, favicon

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

## Dev tools (run locally, outputs committed)
- `npm run build` — regenerates every page head (critical CSS inline, SEO, JSON-LD from data.js), shared chrome, sitemap; fails on broken internal links and on bad `disp.svc` ids
- `npm run images` — brand icons per the rule above; scene re-encodes only with `-- --src <original-renders>`
- `npm run shots` — screenshots every `Live`+`link` work row via Playwright → `assets/work/<id>.{avif,jpg}`; then set `disp.shot` in data.js
- `npm run fonts -- --src <file>` — converts the licensed Knockout Cruiserweight file to the committed woff2 subset + prints fallback metrics (only the subset is committed, never the desktop original)

Bump `VERSION` in `sw.js` on every deploy — `npm run build` stamps matching `?v=` query strings.
