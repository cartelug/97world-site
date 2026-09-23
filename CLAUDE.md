# 97 World — working notes

## Standing instruction: animate everything

Every new or edited component gets motion. Not decoration — motion that
communicates state: what was tapped, what changed, what just became
available. If you add a button, card, step, sheet or value that changes,
give it its animation in the same edit.

Use the shared layer, never a fourth reveal engine:

- **`assets/motion.css`** — the vocabulary. Reveal primitives (`.m-up`,
  `.m-fade`, `.m-scale`, `.m-left`, `.m-right` + `.is-in`), stagger via
  `[data-stagger]`, touch feel (`.m-press`, `.m-lift`, `.m-arrow`), value
  changes (`.m-roll`, `.m-swap`, `.m-pop-in`, `.m-flash`).
- **`assets/motion.js`** — the one engine. IntersectionObserver reveal,
  stagger indexing, counters, sticky headers (`data-motion-header`).
  Exposes `window.Motion.observe/roll/flash/swap/countUp`. It also picks up
  nodes rendered at runtime, so re-rendered UI animates without extra work.

Both are loaded on every page. The legacy class names still in the markup
(`.fade-up`/`.is-visible` on the dark pages, `.r-up`/`.is-in` on the order
and growth pages) are handled by the same engine — don't rename them.

### Rules

- **160–420ms**, natural easing. Nothing bounces for its own sake, no
  confetti, no parallax on interactive surfaces.
- **Only `opacity`, `transform`, `filter`.** Never animate a property that
  forces layout — scrolling has to stay on the compositor.
- **Never delay interaction** for a decorative animation.
- **Reveal is one-shot.** Content does not re-hide when scrolling back up.
- **Every animation needs a `prefers-reduced-motion` escape**, and it must
  leave the content fully visible and usable.
- **Animate the value, not the container** — a price rolls inside a bar that
  stays put.

## Honesty rules (these outrank everything else)

- Never invent a price, a package, a platform, a review, a statistic or a
  delivery guarantee. `assets/pricing.js` is the single source of truth and
  its numbers come from the customer's own price list.
- Quantities we don't sell are never offered. The quantity stepper walks
  real tiers; a typed amount snaps to a real one and says so.
- Refill applies only to services that can actually drop (followers,
  subscribers, members) — never a blanket claim.
- A discount must be arithmetically true: subtotal − saving = total, shown
  in the same currency it was calculated in.

## Layout

- Two light order panels share one design: **`/growth/`** and **`/subs/`**.
  Both use `assets/growth.css` for styling and `assets/panel.js` (`K97Panel`)
  for the shared machinery — searchable dropdown, bottom sheets, the phone
  order bar, the payment picker with MoMo codes, and a WhatsApp button that
  resets itself. Each page keeps its own data and flow in `growth/app.js` /
  `subs/app.js`. Change shared behaviour in `panel.js`, and re-check both.
- The home page and `/business/` are dark (`HOME/style.css` +
  `assets/hub.css`). Don't let dark and light leak into each other.
- The per-product order pages (`/growth/<platform>/`, `/subs/<product>/`,
  `/growth/bundle/`, `/business/website/`) use `assets/order.css` +
  `assets/wizard.js`. They're still live as deep links, but the panels no
  longer navigate to them. They're **generated** — edit
  `tools/build-order-pages.mjs` and re-run it, never the output files.
- `/subs/` sells two kinds of thing and must keep them apart: subscriptions
  (`SUBSCRIPTIONS`, priced for UG and SS only, paid in full) and digital
  goods (`DIGITAL_PRODUCTS`, UG prices only, stock checked before payment).
  No price for the region, or a tier with `orderable: false`, is a quote
  request — never a converted or guessed number.

## Proof screenshots

- The panels' "Recently delivered" slots read `/IMAGES/proof/recent-1.webp`
  … `recent-6.webp` (growth only — boost screenshots aren't proof for a
  subscription). A missing file leaves a dashed placeholder; drop real,
  redacted images in at those names and they appear with no code change.
- The retired offer page (`growth/offer.js`, `K97Pricing.GROWTH_OFFER`) is
  gone; `GROWTH_OFFER` in `pricing.js` is unused. The rules below were
  written for its `PROOF` records and apply to every screenshot we publish.
- The six `case-*`/`offer-*` files in `/IMAGES/proof/` came from two real conversations,
  served from `/IMAGES/proof/`. Every file was **re-encoded after solid
  rectangles were painted over the private parts** — redaction, never a blur
  over an intact original — and EXIF was dropped. Removed: the client's name,
  photographs, date of birth, spouse's name and bio; both contact names; the
  amounts; 97 World's own Mobile Money number; the mobile-money balance and
  transaction ID; the client's name in the receipt and its filename; and two
  third-party reference accounts. The regeneration script lives outside the
  repo — if the originals are re-processed, check the output by eye before
  shipping it.
- Things `PROOF` is not allowed to say, enforced by the renderer and by the
  data: `country` is `null` everywhere, because a name is not a country and
  paying in shillings is not a residence; nothing is `stage: 'complete'`,
  because 97 World's own message on the last frame reads "Boost nearly done";
  and `orderId` groups frames so six screenshots are shown as the two orders
  they came from. The three stages are `process` (a sales chat), `progress`
  (delivery running) and `complete` — never rounded up.
- The old `/IMAGES/` screenshots (`trust1-5.png`, `1-5.png`) are **not**
  publishable: they are Netflix and Spotify conversations carrying real names,
  phone numbers, a shared account password, a PIN and a Mobile Money number.
  Two records from the growth package are withheld for the same reason.
- Payment terms across the site read **"balance after completion"** — the
  balance is due once the agreed delivery is finished, not when it is
  "visibly running". `terms-of-service/`, `trust/`, `assets/wizard.js` and
  `tools/build-order-pages.mjs` all say this; keep them together.

## Verification before shipping

Local server plus Playwright at 320/360/390/430/768/1440: no console
errors, no horizontal overflow, no dead anchors. Then commit, push to the
working branch, and fast-forward merge to `main`.
