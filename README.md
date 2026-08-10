# 97 World — Design Sector (Website)

A multi-page static site, served at **the97.world**. No build step to view it — open `index.html`, or host the folder anywhere (GitHub Pages works out of the box via the `CNAME` file, including `404.html`).

URLs are clean (no `.html`): every page besides home and 404 lives at `<slug>/index.html` on disk and is served at `/<slug>/` by GitHub Pages' default directory→index.html resolution. `tools/build.mjs` also writes thin `<slug>.html` redirect stubs at the root so old bookmarks and links land on the clean URL.

## Pages
- `index.html` — home (`/`): mega hero, bento overview, featured work, process, manifesto
- `services/index.html` — full service catalog with deliverables (rendered from `js/data.js`) — `/services/`
- `work/index.html` — case studies — `/work/`
- `partners/index.html` — the full client record — `/partners/`
- `pricing/index.html` — live quote calculator (UGX/USD, saves your quote) — `/pricing/`
- `start/index.html` — WhatsApp order form (picks up the saved quote) — `/start/`
- `about/index.html` — the sector story, nations, principles — `/about/`
- `privacy-policy/index.html` — data practices — `/privacy-policy/`
- `terms-of-service/index.html` — deposits, delivery, ownership terms — `/terms-of-service/`
- `404.html` — not-found page (must stay at the root for GitHub Pages)

## Engine (v4 — "Kinetic")
- `css/fonts-v4.css` — self-hosted @font-face: Space Grotesk (display), Fraunces italic (editorial accent), Manrope (body), Space Mono (labels)
- `css/v4.css` — the whole design system: tokens, layout, components, motion (mesh background, glass cards, marquee, gate/live pricing states, etc.) — single stylesheet for every page, including home
- `js/data.js` — **all content**: services + prices, process, FAQs, portfolio (mirrors the 97 World Notion hub) — unchanged by the v4 rebuild
- `js/render.js` — renders `window.SITE` into the v4 markup (catalog, work cards, FAQ, process rail, client marquee, partners grid, nation clocks, principles); also owns money formatting + country state (`window.K97`)
- `js/vendor/gsap.min.js` + `ScrollTrigger.min.js` + `SplitText.min.js` — GSAP core + plugins, self-hosted (npm `gsap` package, 100%-free license since 2025 — see gsap.com/standard-license). Not linked from a CDN, so it's cached by the service worker like everything else.
- `js/motion.js` — the animation engine, GSAP-powered: custom cursor + magnetic buttons + card tilt via `quickTo` (real spring physicality, not raw CSS transforms), a cursor-follow spotlight glow on `.card4`, a sliding nav indicator, `ScrollTrigger.batch` reveals with real stagger, scroll-scrubbed mesh parallax, animated counters, and the hero-entrance timeline (SplitText word/char reveal) that plays once `js/transitions.js` fires `"k97:entrance"`.
- `js/transitions.js` — the preloader (cold load only, once per session) and cross-page curtain transition. Internal link clicks are intercepted, a gradient curtain wipes the page away, then the browser does a real navigation (this stays a plain multi-page site, no client-side router) — the arriving page reads a sessionStorage flag (checked synchronously in `<head>`, before first paint, via the inline snippet `head()` emits) to skip the long preloader and just wipe the curtain into its own entrance instead.
- `js/pricing.js` / `js/start.js` — per-page logic (quote totals, country gate, WhatsApp message building) against `window.K97`
- `assets/` — logo marks, lockups, favicon, self-hosted font subsets

**Script load order matters** and is owned by `tools/build.mjs`'s `VENDOR` + `scripts` arrays: GSAP → data → render (populates the DOM) → motion (queries that DOM, registers the `"k97:entrance"` listener) → transitions (fires that event) → page-specific. Motion.js must register its listener before transitions.js fires the event, or the hero entrance never plays.

## Edit content
Change prices, services, FAQs or portfolio in `js/data.js` — the services page, pricing calculator and start page all render from it. The same content lives in the Notion hub ("97 World — Design Sector HQ") so you can keep both in sync.

## How ordering works
The pricing page saves the visitor's quote (localStorage) and hands it to `/start/`, which validates name/phone/terms-agreement, then hands off to WhatsApp (+256 708 735 878, via `location.href` — not `window.open`, for reliability on mobile) with the order pre-filled. `js/start.js` also has a dormant order-log hook (`SITE.orderLogUrl` in `js/data.js`) for mirroring orders into a Google Sheet via Apps Script — a no-op until that URL is set. Log incoming orders in the Notion "Orders & Leads" pipeline.

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
- `npm run build` — regenerates every page head (SEO, JSON-LD from data.js), shared nav/mmenu/footer chrome, sitemap, and the legacy `<slug>.html` → `/<slug>/` redirect stubs; fails on broken internal links and on bad `disp.svc` ids. The home page (`index.html`) owns its nav/mmenu/footer by hand; `404.html` uses the shared chrome.
- `npm run images` — brand icons per the mark rule above; scene re-encodes only with `-- --src <original-renders>`
- `npm run shots` — screenshots every `Live`+`link` work row via Playwright → `assets/work/<id>.{avif,jpg}`; then set `disp.shot` in data.js so `js/render.js` uses the real screenshot instead of the gradient-monogram placeholder
- `npm run og` — regenerates OG share cards (`assets/og/og-<page>.jpg`) — **still generates the old fight-bill-poster look**; due for a v4 pass to match the new gradient system
- `npm run fonts -- --dir <folder>` — converts a licensed desktop font file to a committed woff2 subset + prints fallback metrics (only the subset is committed, never the desktop original)

Bump `VERSION` in `sw.js` on every deploy — `npm run build` stamps matching `?v=` query strings.

## Codex design tooling
The project-level `.codex/config.toml` registers the current 21st.dev MCP endpoint without committing a secret. Create an API key at `https://21st.dev/mcp`, set it as the `TWENTY_FIRST_API_KEY` environment variable, then restart Codex to activate the server.

The installed UI/design skills are intentionally global Codex skills, not repository dependencies. They become available in new tasks after Codex restarts.
