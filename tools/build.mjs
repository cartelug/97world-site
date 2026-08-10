/* ============================================================
   97 WORLD — SITE BUILD TOOL (dev-only, run locally, output committed)
   `npm run build` after any change to heads/chrome/data.

   What it owns (single source of truth):
   - <head> of every page: SEO (title/description/canonical/OG/
     Twitter), JSON-LD built FROM js/data.js so schema never
     drifts, font preloads, speculation rules, manifest link,
     ?v= cache stamping.
   - Shared chrome: nav (with aria-current), mobile menu, footer,
     deferred script tails.
   - sitemap.xml.
   - Post-build link check: every internal href/src must resolve.

   Page BODY content (<main>) stays hand-authored in each file.
   The home page owns its own full chrome (hero is bespoke enough
   that regenerating it from a shared template isn't worth it) —
   its nav/mobile-menu/footer must be kept in sync by hand.

   URLs are clean (no .html): every page other than home and 404
   lives at <root>/<slug>/index.html and is served at /<slug>/ by
   GitHub Pages' default directory→index.html resolution. All
   asset/internal-link references are root-absolute so they work
   regardless of directory depth.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://the97world.com/';
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

// keep asset versioning in lockstep with the service worker
const V = (read('sw.js').match(/VERSION = "v(\d+)"/) || [, '1'])[1];
const v = (path) => `${path}?v=${V}`;

/* ---------- data.js loaded into Node (it's a browser global file) ---------- */
const win = {};
new Function('window', read('js/data.js'))(win);
const SITE = win.SITE;

/* ---------- per-page config ---------- */
const PAGES = [
  {
    file: 'index.html', page: 'home', og: 'og-home', ogTitle: 'WE BUILD PROOF.',
    title: '97 World — Websites, Brands, Growth & Systems',
    desc: '97 World builds websites, brands, audience growth plans and custom systems for ambitious businesses in Uganda, South Sudan and beyond.',
    scripts: ['data', 'render', 'motion', 'transitions'],
    home: true,
  },
  {
    file: 'services/index.html', page: 'services', og: 'og-services', ogTitle: 'EVERYTHING YOUR BRAND NEEDS.', crumb: 'Services',
    title: 'Services & Prices — 97 World',
    desc: 'Websites from $500, landing pages, logos, brand kits, fliers, business cards, growth and systems — with real prices in UGX & USD and honest turnarounds.',
    scripts: ['data', 'render', 'motion', 'transitions'], jsonld: ['services', 'faq'],
  },
  {
    file: 'work/index.html', page: 'work', og: 'og-work', ogTitle: 'REAL WORK. LIVE.', crumb: 'Work',
    title: 'Work & Case Studies — 97 World',
    desc: 'Live websites and builds in progress from 97 World — AFRICA63, Maya Nature Resort and more. Proof, not hype.',
    scripts: ['data', 'render', 'motion', 'transitions'],
  },
  {
    file: 'partners/index.html', page: 'partners', og: 'og-partners', ogTitle: 'THE RECORD. IN FULL.', crumb: 'Partners',
    title: 'Previous Partners — 97 World',
    desc: 'The full record: 19 real brands shipped by 97 World across Uganda & South Sudan — AFRICA63, Maya Nature Resort, KHATHA, Kushite, Nile Link and more.',
    scripts: ['data', 'render', 'motion', 'transitions'],
  },
  {
    file: 'pricing/index.html', page: 'pricing', og: 'og-pricing', ogTitle: 'PICK. TOTAL. START.', crumb: 'Pricing',
    title: 'Instant Quote Calculator — 97 World',
    desc: 'Pick what you need and get a real price instantly in UGX or USD. Every project starts with a 50% deposit — the balance on delivery.',
    scripts: ['data', 'render', 'motion', 'transitions', 'pricing'], jsonld: ['services', 'faq'],
  },
  {
    file: 'start/index.html', page: 'start', og: 'og-start', ogTitle: 'SEND IT. WE BUILD.', crumb: 'Start a project',
    title: 'Start a Project — 97 World',
    desc: 'Send your project brief straight to 97 World on WhatsApp — your quote comes with you. The first deposit confirms your slot.',
    scripts: ['data', 'render', 'motion', 'transitions', 'start'],
  },
  {
    file: 'about/index.html', page: 'about', og: 'og-about', ogTitle: 'TWO NATIONS. ONE BAR.', crumb: 'About',
    title: 'About the Studio — 97 World',
    desc: "The design sector of 97 World — one studio serving Kampala and Juba with websites, branding and campaign design. Proof isn't fabricated. It's built.",
    scripts: ['data', 'render', 'motion', 'transitions'],
  },
  {
    file: 'privacy-policy/index.html', page: 'privacy-policy', og: 'og-default', ogTitle: 'PRIVACY POLICY.', crumb: 'Privacy Policy',
    title: 'Privacy Policy — 97 World',
    desc: 'How 97 World collects, uses and protects the information you share with us — plain language, no fine print.',
    scripts: ['data', 'render', 'motion', 'transitions'],
  },
  {
    file: 'terms-of-service/index.html', page: 'terms-of-service', og: 'og-default', ogTitle: 'TERMS OF SERVICE.', crumb: 'Terms of Service',
    title: 'Terms of Service — 97 World',
    desc: 'The terms that govern every project 97 World builds — deposits, delivery, revisions and ownership, in plain language.',
    scripts: ['data', 'render', 'motion', 'transitions'],
  },
  {
    file: '404.html', page: '404',
    title: 'Page not found — 97 World',
    desc: "This page isn't built yet. Head back to 97 World.",
    scripts: ['data', 'render', 'motion', 'transitions'], noindex: true,
  },
];

// URL path for a page: '' for home, '404.html' for 404, else 'slug/'
const urlPath = (p) => (p.home ? '' : p.page === '404' ? '404.html' : p.page + '/');

/* ---------- JSON-LD builders (from SITE — never hand-written) ---------- */
const ldBusiness = () => ({
  '@context': 'https://schema.org', '@type': 'ProfessionalService',
  name: '97 World', url: BASE, image: BASE + 'assets/og/og-default.jpg',
  logo: BASE + 'assets/icon-512.png', foundingDate: '2026',
  telephone: '+' + SITE.whatsapp, priceRange: '$35 - $1,650',
  slogan: "Proof isn't fabricated. It's built.",
  areaServed: SITE.nations.map((n) => ({ '@type': 'Country', name: n.name })),
  address: [{ '@type': 'PostalAddress', addressLocality: 'Kampala', addressCountry: 'UG' },
            { '@type': 'PostalAddress', addressLocality: 'Juba', addressCountry: 'SS' }],
  sameAs: ['https://wa.me/' + SITE.whatsapp],
});
const ldServices = () => ({
  '@context': 'https://schema.org', '@type': 'OfferCatalog',
  name: '97 World services',
  itemListElement: SITE.services.map((s) => ({
    '@type': 'Offer', priceCurrency: 'USD', price: s.usd,
    itemOffered: { '@type': 'Service', name: s.name, description: s.short, provider: { '@type': 'ProfessionalService', name: '97 World' } },
  })),
});
const ldCrumbs = (p) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    { '@type': 'ListItem', position: 2, name: p.crumb, item: BASE + urlPath(p) },
  ],
});
const ldFaq = () => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: SITE.faqs.map((f) => ({
    '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/* ---------- head template ---------- */
function head(p) {
  const canon = BASE + urlPath(p);
  const og = BASE + 'assets/og/' + (p.og && existsSync(join(ROOT, 'assets/og', p.og + '.jpg')) ? p.og : 'og-default') + '.jpg';
  const lds = [
    ...(p.home || p.page === 'about' ? [ldBusiness()] : []),
    ...((p.jsonld || []).includes('services') ? [ldServices()] : []),
    ...((p.jsonld || []).includes('faq') ? [ldFaq()] : []),
    ...(p.crumb && !p.noindex ? [ldCrumbs(p)] : []),
  ];
  return `<head>
<meta charset="UTF-8">
<script>try{if(sessionStorage.getItem("k97-nav"))document.documentElement.classList.add("is-nav")}catch(e){}</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<meta name="theme-color" content="#0a0a12">
${p.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${canon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="97 World">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${(p.ogTitle || '97 World').replace(/"/g, '&quot;')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.title}">
<meta name="twitter:description" content="${p.desc}">
<meta name="twitter:image" content="${og}">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="icon" type="image/png" href="/assets/favicon.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/assets/fonts/spacegrotesk-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/manrope-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${v('/css/fonts-v4.css')}">
<link rel="stylesheet" href="${v('/css/v4.css')}">
<script type="speculationrules">
{"prerender":[{"where":{"selector_matches":"nav.links a, .mmenu4-links a, .foot4-col a"},"eagerness":"moderate"},{"where":{"selector_matches":"a[href^='/pricing'], a[href^='/start']"},"eagerness":"conservative"}]}
</script>
${lds.map((l) => `<script type="application/ld+json">${JSON.stringify(l)}</script>`).join('\n')}
</head>`;
}

/* ---------- shared chrome ---------- */
const preloaderChrome = () => {
  const letters = '97 WORLD'.split('').map((ch) => ch === ' ' ? '<span>&nbsp;</span>' : `<span>${ch}</span>`).join('');
  return `<div id="preloader" aria-hidden="true">
  <img class="pl-mark" src="/assets/favicon.png" alt="">
  <div class="pl-word">${letters}</div>
  <div class="pl-bar"><i></i></div>
</div>
<div id="curtain" aria-hidden="true"></div>`;
};

const navChrome = (page) => {
  const on = (k, label, href) =>
    `<a href="${href}"${k === page ? ' class="on" aria-current="page"' : ''}>${label}</a>`;
  return `<header class="nav4" id="nav4">
  <div class="nav4-inner">
    <a href="/" class="brand" aria-label="97 World home">
      <img src="/assets/favicon.png" alt="" width="26" height="26">97 WORLD
    </a>
    <nav class="nav4-links">
      ${on('work', 'Work', '/work/')}
      ${on('services', 'Services', '/services/')}
      ${on('pricing', 'Pricing', '/pricing/')}
      ${on('about', 'About', '/about/')}
    </nav>
    <a href="/start/" class="nav4-cta" data-magnetic>Start a project</a>
    <button class="burger4" id="burger4" type="button" aria-label="Open menu" aria-expanded="false" onclick="toggleMenu4()">
      <span></span>
    </button>
  </div>
</header>`;
};

const mmenuChrome = (page) => {
  const on = (k) => (k === page ? ' class="on"' : '');
  return `<div class="mmenu4" id="mmenu4" aria-hidden="true">
  <nav class="mmenu4-links">
    <a href="/"${on('home')} style="--i:0"><small>01</small> Home</a>
    <a href="/work/"${on('work')} style="--i:1"><small>02</small> Work</a>
    <a href="/partners/"${on('partners')} style="--i:2"><small>03</small> Partners</a>
    <a href="/services/"${on('services')} style="--i:3"><small>04</small> Services</a>
    <a href="/pricing/"${on('pricing')} style="--i:4"><small>05</small> Pricing</a>
    <a href="/about/"${on('about')} style="--i:5"><small>06</small> About</a>
  </nav>
  <div class="mmenu4-foot">
    <a class="btn4 wa full" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">Chat on WhatsApp</a>
    <a class="btn4 grad full" href="/start/">Start a project →</a>
    <div class="nations4" style="justify-content:center;margin-top:4px">
      <i style="background:var(--ink)"></i><i style="background:var(--ug-y)"></i><i style="background:var(--ug-r)"></i>
      <i style="background:var(--ss-b)"></i><i style="background:var(--ss-g)"></i>
    </div>
  </div>
</div>`;
};

const footerChrome = () => `<footer class="foot4">
  <div class="wrap">
    <div class="foot4-cta rv">
      <div class="eyebrow4" style="justify-content:center">Ready when you are</div>
      <h2>Let's build <em>something real.</em></h2>
      <p>Tell us what you need. We reply on WhatsApp with a fixed quote — no long forms, no silence.</p>
      <div class="row">
        <a href="/start/" class="btn4 grad" data-magnetic>Start a project →</a>
        <a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" class="btn4 ghost" data-magnetic>Chat on WhatsApp</a>
      </div>
    </div>
    <div class="foot4-grid">
      <div class="foot4-brand">
        <a href="/" class="brand"><img src="/assets/favicon.png" alt="" width="24" height="24">97 WORLD</a>
        <p>The design sector of 97 World. Websites, brands, growth and systems for businesses ready to move.</p>
        <div class="nations4"><i style="background:var(--ink)"></i><i style="background:var(--ug-y)"></i><i style="background:var(--ug-r)"></i><i style="background:var(--ss-b)"></i><i style="background:var(--ss-g)"></i></div>
      </div>
      <div class="foot4-col">
        <h5>Studio</h5>
        <a href="/">Home</a><a href="/work/">Work</a><a href="/partners/">Partners</a><a href="/services/">Services</a><a href="/pricing/">Pricing</a><a href="/about/">About</a>
      </div>
      <div class="foot4-col">
        <h5>Build</h5>
        <a href="/services/">Websites</a><a href="/services/">Brand kits</a><a href="/services/">Growth</a><a href="/services/">Systems</a>
      </div>
      <div class="foot4-col">
        <h5>Talk to us</h5>
        <a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="tel:+${SITE.whatsapp}">${SITE.phonePretty}</a>
        <a href="/start/">Start a project</a>
      </div>
    </div>
    <div class="foot4-bottom">
      <span>© <span data-year></span> 97 World · Kampala — Juba</span>
      <span class="foot4-legal"><a href="/privacy-policy/">Privacy Policy</a> · <a href="/terms-of-service/">Terms of Service</a></span>
      <span>Built, not fabricated.</span>
    </div>
  </div>
  <span class="foot4-wm" aria-hidden="true">97 WORLD</span>
</footer>`;

// GSAP must load before motion.js (uses it), motion.js must register its
// "k97:entrance" listener before transitions.js fires that event.
const VENDOR = ['vendor/gsap.min', 'vendor/ScrollTrigger.min', 'vendor/SplitText.min'];
const scriptsChrome = (list) =>
  [...VENDOR, ...list].map((s) => `<script src="${v('/js/' + s + '.js')}" defer></script>`).join('\n') + '\n</body>';

/* ---------- build every page ---------- */
const problems = [];

// funnel guard: every work row's "Build like this" prefill must point at
// real service ids, or the pricing page silently drops the selection
const svcIds = new Set(SITE.services.map((s) => s.id));
for (const w of SITE.work) {
  for (const id of (w.disp && w.disp.svc) || []) {
    if (!svcIds.has(id)) problems.push(`data.js: work "${w.project}" disp.svc "${id}" is not a service id`);
  }
}
for (const p of PAGES) {
  let html = read(p.file);
  html = html.replace(/<head>[\s\S]*?<\/head>/, head(p));
  html = html.replace(/<div id="preloader"[\s\S]*?<div id="curtain"[^>]*><\/div>/, preloaderChrome());
  html = html.replace(/<script src="\/?js\/vendor\/gsap\.min\.js[\s\S]*?<\/body>/, scriptsChrome(p.scripts));
  if (!p.home) {
    html = html.replace(/(?:<a class="skip-link"[^>]*>[\s\S]*?<\/a>\s*)*<header class="nav4"[\s\S]*?<\/header>/, navChrome(p.page));
    html = html.replace(/<div class="mmenu4"[\s\S]*?<\/div>\n\n<main/, mmenuChrome(p.page) + '\n\n<main');
    html = html.replace(/<footer class="foot4">[\s\S]*?<\/footer>/, footerChrome());
  }
  const outFile = join(ROOT, p.file);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html);

  // link check: every internal href/src resolves to a real file
  for (const m of html.matchAll(/(?:href|src|srcset)="([^"#]+)"/g)) {
    const u = m[1].split('?')[0];
    if (/^(https?:|mailto:|tel:|data:|\{)/.test(u) || u === '' || u.startsWith('#')) continue;
    for (const part of u.split(',').map((x) => x.trim().split(' ')[0])) {
      if (part && !existsSync(join(ROOT, part))) problems.push(`${p.file}: missing ${part}`);
    }
  }
  console.log('built', p.file);
}

/* ---------- legacy .html redirect stubs (old bookmarks -> clean URLs) ---------- */
const REDIRECTS = PAGES.filter((p) => !p.home && p.page !== '404').map((p) => ({ from: `${p.page}.html`, to: `/${p.page}/` }));
for (const r of REDIRECTS) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<title>97 World</title>
<link rel="canonical" href="${BASE}${r.to.slice(1)}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${r.to}">
<script>location.replace(${JSON.stringify(r.to)});</script>
</head><body>Moved to <a href="${r.to}">${r.to}</a>.</body></html>
`;
  writeFileSync(join(ROOT, r.from), html);
  console.log('redirect stub', r.from, '->', r.to);
}

/* ---------- sitemap ---------- */
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.filter((p) => !p.noindex).map((p) =>
    `  <url><loc>${BASE + urlPath(p)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${
      p.page === 'home' ? '1.0' : (p.page === 'work' || p.page === 'pricing') ? '0.9' : p.page === 'services' ? '0.8' : '0.5'
    }</priority></url>`).join('\n')}
</urlset>
`);
console.log('built sitemap.xml');

if (problems.length) {
  console.error('\nLINK CHECK FAILURES:\n' + problems.join('\n'));
  process.exit(1);
}
console.log(`\nOK · version v${V} · ${PAGES.length} pages · links verified`);
