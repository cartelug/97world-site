#!/usr/bin/env python3
"""Generate /proof/followers/index.html from tools/proof/manifest.json.

The page is static HTML (no fetch, no render step) so the first screenshot
is in the very first response. Styles, the sprite and the viewer script are
taken from /proof/index.html so the two pages can't drift apart.
"""
import io, re, json, base64, html, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
fast = lambda n: os.path.join(ROOT, 'IMAGES', 'proof', 'fast', n)
M = json.load(open(os.path.join(ROOT, 'tools/proof/manifest.json')))
base = open(os.path.join(ROOT, 'proof/index.html')).read()

css = re.search(r'<style>\n(.*?)</style>', base, re.S).group(1)
sprite = re.search(r'(<svg width="0".*?</svg>)', base, re.S).group(1)
js = re.search(r'<script>\n(\(function \(\) \{.*?)</script>', base, re.S).group(1)
wa_href = re.search(r'class="btn btn--wa m-press" href="([^"]+)"', base).group(1)
viewer = re.search(r'(<div class="pv" id="pv".*?\n</div>)\n\n<script>', base, re.S).group(1)

STAGES = {'process': ('Order process', ' stage--process'),
          'progress': ('Delivery in progress', ''),
          'complete': ('Completed order', ' stage--done')}
EXTRA = """
.stage--done{background:rgba(0,255,178,.1);color:var(--accent);box-shadow:inset 0 0 0 1px rgba(0,255,178,.3)}
.hero{padding-bottom:18px}
.legend{display:grid;gap:8px;margin:22px 0 0;padding:0;list-style:none;max-width:560px}
.legend li{display:flex;gap:10px;align-items:baseline;font-size:14px;color:#c4c4cb}
.legend .stage{flex:none}
.subnav{position:sticky;top:56px;z-index:15;background:rgba(5,5,5,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.subnav .wrap{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-top:10px;padding-bottom:10px}
.subnav .wrap::-webkit-scrollbar{display:none}
.subnav a{flex:none;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 15px;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;color:#d4d4da;box-shadow:inset 0 0 0 1px var(--line);transition:transform .16s var(--m-out,ease),background .26s,color .26s}
.subnav a:active{transform:scale(.975)}
.subnav a b{font-size:12px;color:var(--muted);font-weight:700}
.subnav a.is-on{background:var(--accent);color:var(--accent-ink);box-shadow:none}
.subnav a.is-on b{color:var(--accent-ink)}
.grp{scroll-margin-top:112px}
.grp-blurb{color:#c4c4cb;margin:10px 0 0;max-width:60ch}
.order .order-head{margin-bottom:14px}
.inc{display:grid;gap:10px;margin-top:16px}
@media (min-width:700px){.inc{grid-template-columns:repeat(3,1fr)}}
.inc div{padding:16px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.inc b{display:block;font-size:15px}
.inc span{display:block;color:var(--muted);font-size:13.5px;margin-top:3px}
.ns{margin-top:18px;color:var(--muted);font-size:14px;max-width:62ch}
@media (prefers-reduced-motion:reduce){.subnav a{transition:none!important}}
"""

def lqip(slug):
    im = Image.open(fast(f'{slug}-320.webp')).convert('RGB').resize((10, 22), Image.BOX)
    b = io.BytesIO(); im.save(b, 'WEBP', quality=30)
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()

first = [True]
def shot(sh, n):
    slug = sh['slug']
    for ext in ('avif', 'webp'):
        for w in (320, 720):
            assert os.path.exists(fast(f'{slug}-{w}.{ext}')), f'missing {slug}-{w}.{ext}'
    eager = first[0]; first[0] = False
    attrs = 'fetchpriority="high" decoding="async"' if eager else 'loading="lazy" decoding="async"'
    e = html.escape
    return f'''        <li>
          <button type="button" class="shot m-press" data-slug="{slug}" data-title="{e(sh['title'])}" data-body="{e(sh['body'])}">
            <span class="frame" style="background-image:url({lqip(slug)})">
              <picture>
                <source type="image/avif" srcset="/IMAGES/proof/fast/{slug}-320.avif">
                <img src="/IMAGES/proof/fast/{slug}-320.webp" width="320" height="693" alt="{e(sh['alt'])}" {attrs}>
              </picture>
              <span class="step">{n}</span>
              <span class="zoom" aria-hidden="true"><svg class="ic"><use href="#i-zoom"/></svg></span>
            </span>
            <span class="cap"><b>{e(sh['title'])}</b><span>{e(sh['body'])}</span></span>
          </button>
        </li>'''

groups = [g for g in M['groups'] if g['orders']]       # empty platforms never render
n_shots = lambda g: sum(len(o['shots']) for o in g['orders'])
total = sum(n_shots(g) for g in groups)
first_slug = groups[0]['orders'][0]['shots'][0]['slug']

nav = ''.join(f'<a href="#{g["id"]}" data-g="{g["id"]}">{html.escape(g["label"])} <b>{n_shots(g)}</b></a>' for g in groups)
body = ''
for g in groups:
    orders = ''
    for o in g['orders']:
        label, cls = STAGES[o['stage']]
        lis = '\n'.join(shot(sh, i + 1) for i, sh in enumerate(o['shots']))
        orders += f'''
      <div class="order-head m-up" style="margin-top:26px">
        <div><span class="kicker">{html.escape(o['kicker'])}</span><h2>{o['title']}</h2></div>
        <span class="stage{cls}">{label}</span>
      </div>
      <ol class="strip{' strip--2' if len(o['shots']) == 2 else ''}" data-stagger data-group="{g['id']}-{o['id']}">
{lis}
      </ol>
      <p class="note m-fade"><svg class="ic"><use href="#i-info"/></svg><span>{o['note']}</span></p>'''
    body += f'''
  <section class="order grp" id="{g['id']}" data-grp>
    <div class="wrap">
      <div class="m-up"><span class="kicker">Followers</span><h2>{html.escape(g['label'])}</h2><p class="grp-blurb">{html.escape(g['blurb'])}</p></div>{orders}
    </div>
  </section>
'''
ns = ', '.join(M['not_shown'])

scroll_spy = """
  /* Highlight the platform you're reading. Colour only; nothing reflows. */
  var links = document.querySelectorAll('.subnav a');
  var secs = document.querySelectorAll('[data-grp]');
  if (links[0]) links[0].classList.add('is-on');
  if ('IntersectionObserver' in window && secs.length > 1) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-g') === e.target.id); });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
  }
"""
js = js.replace("  /* The bar slides up", scroll_spy + "\n  /* The bar slides up", 1)

page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#050505">
<title>Follower proof | 97 World</title>
<meta name="description" content="Every follower order we have screenshots for, sorted by platform and labelled for what it actually shows. Private details painted over.">
<link rel="canonical" href="https://the97.world/proof/followers/">
<meta property="og:title" content="Follower proof | 97 World">
<meta property="og:description" content="Real follower-order screenshots, sorted by platform. Private details painted over.">
<meta property="og:image" content="https://the97.world/IMAGES/proof/fast/case-fb-after-720.webp">
<link rel="icon" href="/IMAGES/logo.png" type="image/png">
<link rel="preload" as="image" href="/IMAGES/proof/fast/{first_slug}-320.avif" type="image/avif" fetchpriority="high">
<link rel="stylesheet" href="/assets/motion.css">
<script>document.documentElement.className+=' js'</script>
<style>
{css}{EXTRA}</style>
</head>
<body>
<a class="skip" href="#{groups[0]['id']}">Skip to the screenshots</a>

{sprite}

<header class="top" data-motion-header>
  <div class="wrap">
    <a class="brand" href="/"><img src="/IMAGES/logo.png" alt="" width="28" height="28">97 WORLD</a>
    <a class="top-link" href="/proof/"><svg class="ic"><use href="#i-left"/></svg> All proof</a>
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap">
      <span class="eyebrow m-swap">Proof · Followers</span>
      <h1 class="m-swap" style="animation-delay:60ms">Every follower order, <em>as it happened.</em></h1>
      <p class="lede m-swap" style="animation-delay:120ms">{total} screenshots from real orders, sorted by platform. Each order carries a label saying what it shows, so a sales chat is never passed off as a result.</p>
      <ul class="legend m-swap" style="animation-delay:180ms">
        <li><span class="stage stage--process">Order process</span>How an order is agreed. No result shown.</li>
        <li><span class="stage">Delivery in progress</span>Followers arriving. Not finished yet.</li>
      </ul>
    </div>
  </section>

  <nav class="subnav" aria-label="Platforms" data-motion-header>
    <div class="wrap">{nav}</div>
  </nav>
{body}
  <section class="sec" aria-labelledby="inc-title">
    <div class="wrap">
      <div class="m-up">
        <span class="kicker">Every follower order</span>
        <h2 id="inc-title">The terms <em>don't change</em></h2>
      </div>
      <div class="inc" data-stagger>
        <div><b>No password</b><span>We deliver to your public link. We never ask for a login.</span></div>
        <div><b>Half to start</b><span>The balance is due after the agreed delivery is finished.</span></div>
        <div><b>30-day refill</b><span>Anything that drops off inside 30 days is topped back up.</span></div>
      </div>
      <p class="ns m-fade">No screenshots yet for {ns}. We only show what we actually have, so those platforms aren't padded out with stand-ins. Ask us on WhatsApp if you'd like to see one.</p>
    </div>
  </section>

  <section class="sec" aria-labelledby="more-title">
    <div class="wrap">
      <div class="m-up"><span class="kicker">Still not sure?</span><h2 id="more-title">Ask someone who <em>isn't us</em></h2></div>
      <div class="more" data-stagger>
        <a class="m-lift" href="/proof/"><svg class="ic"><use href="#i-shield"/></svg><span><b>Back to all proof</b><span>The short version</span></span><svg class="ic go"><use href="#i-right"/></svg></a>
        <a class="m-lift" href="https://www.facebook.com/share/1C9cjQCknW/?mibextid=wwXIfr" target="_blank" rel="noopener"><svg class="ic"><use href="#i-users"/></svg><span><b>Our VIP group</b><span>Ask past customers directly</span></span><svg class="ic go"><use href="#i-right"/></svg></a>
        <a class="m-lift" href="tel:+256762193386"><svg class="ic"><use href="#i-phone"/></svg><span><b>Call us</b><span>+256 762 193 386</span></span><svg class="ic go"><use href="#i-right"/></svg></a>
        <a class="m-lift" href="/trust/"><svg class="ic"><use href="#i-shield"/></svg><span><b>Trust Centre</b><span>How to check any seller</span></span><svg class="ic go"><use href="#i-right"/></svg></a>
      </div>
    </div>
  </section>
</main>

<footer class="wrap foot">
  <span>© 2026 97 World · Kampala</span>
  <a href="/terms-of-service/">Terms</a>
  <a href="/privacy-policy/">Privacy</a>
</footer>

<div class="wa-bar" id="waBar">
  <div class="wrap">
    <p><b>Seen enough?</b>Pick up where we left off.</p>
    <a class="btn btn--wa m-press" href="{wa_href}" target="_blank" rel="noopener">
      <svg class="ic"><use href="#i-wa"/></svg> Back to WhatsApp
    </a>
  </div>
</div>

{viewer}

<script>
{js}</script>
<script src="/assets/motion.js" defer></script>
</body>
</html>
'''
os.makedirs(os.path.join(ROOT, 'proof/followers'), exist_ok=True)
open(os.path.join(ROOT, 'proof/followers/index.html'), 'w').write(page)
print('proof/followers/index.html', len(page.encode()), 'B')
