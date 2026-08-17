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

- `/growth/` is light (`assets/growth.css`, `growth/app.js`) and
  self-contained. Everything else is dark (`HOME/style.css` +
  `assets/hub.css`). Don't let the two leak into each other.
- The 14 order pages are **generated** — edit
  `tools/build-order-pages.mjs` and re-run it, never the output files.

## Verification before shipping

Local server plus Playwright at 320/360/390/430/768/1440: no console
errors, no horizontal overflow, no dead anchors. Then commit, push to the
working branch, and fast-forward merge to `main`.
