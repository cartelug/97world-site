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
