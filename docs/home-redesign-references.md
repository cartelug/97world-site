# The Fix Bill — home page references

Research file for the `index.html` redesign. Companion to the visual board.

The poster system isn't the problem. The problem is that it's hiding in the dark,
and that every piece of information on the page is dressed as machine output.

---

## What's actually wrong

Read directly from `index.html`, `css/home.css` and a rendered screenshot.

**1. We built a photo set, then painted over it.**
`.scenes-veil` covers the left edge at `rgba(4,4,6,.96)`, fading only to `.82` at 30% —
exactly the strip where every headline, button and label sits. The real AVIF scenes with
the Ken Burns drift are 96% erased precisely where a visitor looks. This one value does
more damage than any other line in the stylesheet.

**2. The headline is a wireframe, not a headline.**
`h1.mega .thin` is `color:transparent` with a `2px` stroke at 60% white. At 150px on
near-black, "NOT THE HYPE." reads as a faint grey ghost. The loudest line on the page is
the quietest thing on screen. One of the three rows can be hollow — not the punchline.

**3. The mark collides with the copy.**
The watermark 97 (`right:-6vw; top:50%`, 5.5% opacity) plus the lockup and scene art stack
behind the same band as the headline, lead and CTA row. On a 1440 screenshot the mark lands
directly across "NOT THE HYPE." and the buttons. Not a transparency problem — a collision.

**4. Everything is dressed as telemetry.**
Dual live clocks, a coordinate rail, a marquee ticker and a four-cell stat strip at `9.5px`
uppercase mono with `.18em` tracking. Each detail is nice alone; stacked in one viewport
they read as a server monitoring dashboard. This is the precise source of "robotic."

**5. The proof is 5,000px below the sale.**
First real project image is far below the fold. The first screen offers abstract counters
(2 sites live, 4 in build) that make a young studio look small rather than sharp.

---

## The five

Ranked by what they'd fix first.

### 01 · Designjoy — https://www.designjoy.co/
**Highest-earning reference. Copy the skeleton 1:1.**

One person, no employees. Reported at roughly $3.1M across 2024 and around $145K/month in
2025, on a flat subscription and about $176/month of tools. Not beautiful — legible and
decided. Price on the home page. No "let's chat", no contact form. Founder's face and name
everywhere.

Steal:
- Price above the fold. "From $95" belongs next to the headline at full size, not as a 10px tape label.
- One CTA, repeated. "See the work ↓" and "or WhatsApp us ↗" currently compete in the same row.
- A face. A named human beats any stamp or counter for trust on a deposit-first, WhatsApp-ordered service.
- Testimonials with faces and names, or none. The `SITE.testimonials` honesty gate is right — now go get two real ones.

Copy at 99%: the structure, wholesale. Not the look.

### 02 · Obys Agency — https://obys.agency/
**Best design match. Typography-led editorial.**

Awwwards Studio of the Year 2023; four-time CSS Design Awards Studio of the Year. Closest
living relative of what 97 is going for — enormous display type, editorial grid, hard rules,
grain — except readable. Direct antidote to faults 1 and 2.

Steal:
- How to run 150px display type without hiding it: solid fills, real contrast, texture instead of darkness for atmosphere.
- Grain and paper as warmth. The blueprint layer is the right idea on the wrong ground.
- Editorial pacing — big type, then quiet, then image. Not five loud systems in one viewport.

### 03 · basement studio — https://basement.studio/
**Cure for "robotic". Voice and personality.**

"A digital studio making cool shit that performs." Awwwards-honoured, including KidSuper
World. Proof that a technically serious studio can be funny, colourful and human on its own site.

Steal:
- Voice. "WE BUILD PROOF, NOT THE HYPE" is a good line trapped in a cold room.
- Faces of the people who do the work, on the home page.
- Colour at scale. `--ug-y` and `--ug-r` are sitting unused in the tokens.

### 04 · Exo Ape — https://www.exoape.com/
**Photography done right. Silver Lovie winner for site craft.**

Full-bleed cinematic photography allowed to be bright — text sits on top via placement and
small local scrims, never a blanket blackout. We already built the hard part; it's switched
off by the veil.

Steal:
- Local scrims, not global ones — a soft gradient behind the text block only.
- Let one scene carry a whole viewport at full brightness before any copy arrives.
- Image-first case study openers for `work.html`.

Copy at 99%: the veil strategy. A handful of CSS values, biggest visual win available.

### 05 · Design Pickle — https://designpickle.com/pricing
**Pricing-page model. Do not copy the look.**

Included because it sells tiers and we sell tiers. $499 / $995 / $2,049 — a ladder that lets
a small client in and gives a bigger one somewhere to climb. Much closer to "sites from $95"
plus a calculator than Designjoy's single $5K price. Homepage aesthetic is ordinary SaaS.

Steal:
- Three named tiers, middle one marked popular. The quote calculator lives underneath.
- Turnaround as a promise next to each price — our 2–10 working days is under-used.
- What's included and what isn't, in plain words, before anyone opens WhatsApp.

---

## Also worth raiding

| Site | Why |
| --- | --- |
| https://locomotive.ca/ | Won Awwwards Site of the Month for its own studio site. Best model for case-study architecture — makes six builds read as a body of work, not a count. |
| https://thirtysixstudio.com/ | Progressive production studio. How far you can push type and motion before it tips over. |
| https://www.superside.com/ | Enterprise end of productized design. Read for how they justify price on the page. |
| https://reelunlimited.com/ | Budget end of the same model, entry around $699/month. Closest to our price sensitivity. |
| https://www.awwwards.com/awwwards/collections/agency-portfolios/ | Curated running collection of agency portfolios. |
| https://nanoglobals.com/productized-service-websites/ | The written argument behind #01: the best productized sites "look more like stores than agency sites — pricing on the homepage, subscribe now instead of let's chat." |

---

## Order of operations

1. **Lift the veil.** `.scenes-veil` from a flat 96% wash to a local gradient behind the copy block only. One rule in `css/home.css`.
2. **Fill the headline.** Make "NOT THE HYPE." solid. If a row must be outlined, give it to "WE BUILD" — the setup, not the punchline.
3. **Cut four of the five instruments.** Keep the live capacity line; retire the dual clocks, coordinate rail and abstract stat strip from the first viewport.
4. **Put the price and the work above the fold.** Real project imagery plus "from $95" at display size.
5. **Add a human.** One photo, one name, one sentence.

---

## Sourcing note

The five sites and their figures were verified through search results — the sites themselves
refuse automated fetches, so descriptions come from published write-ups, awards listings and
the studios' own copy rather than a rendered page. Open each one directly. The fault list is
different: read straight from this repository and from a rendered screenshot of the page.
