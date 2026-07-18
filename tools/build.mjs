/* ============================================================
   97 DESIGN — SITE BUILD TOOL (dev-only, run locally, output committed)
   `npm run build` after any change to heads/chrome/data.

   What it owns (single source of truth):
   - <head> of every page: critical CSS inline, async full CSS,
     SEO (title/description/canonical/OG/Twitter), JSON-LD built
     FROM js/data.js so schema never drifts, font+LCP preloads,
     speculation rules, manifest link, ?v= cache stamping.
   - Shared chrome: nav (with aria-current), mobile menu, footer,
     deferred script tails.
   - sitemap.xml.
   - Post-build link check: every internal href/src must resolve.

   Page BODY content (<main>) stays hand-authored in each file.
   Swap BASE below when the custom domain lands — one line.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://cartelug.github.io/97world-site/'; // ← custom-domain swap point
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
    title: '97 Design — Websites, Brands & Fliers · Uganda & South Sudan',
    desc: "97 Design builds websites, campaign fliers and brands across Uganda & South Sudan. Priced upfront, ordered on WhatsApp, delivered in days. Build your quote in 30 seconds.",
    scripts: ['data', 'site', 'kinetic', 'scenes', 'pricing', 'intro'],
    home: true,
  },
  {
    file: 'services.html', page: 'services', og: 'og-services', ogTitle: 'THE CARD.', crumb: 'Services',
    title: 'Services & Prices — 97 Design',
    desc: 'Websites from $500, landing pages, logos, brand kits, fliers, business cards and social packs — with real prices in UGX & USD and honest turnarounds.',
    scripts: ['data', 'site', 'kinetic'], jsonld: ['services', 'faq'],
  },
  {
    file: 'work.html', page: 'work', og: 'og-work', ogTitle: 'REAL WORK. LIVE.', crumb: 'Work',
    title: 'Work & Case Studies — 97 Design',
    desc: 'Live websites and builds in progress from 97 Design — AFRICA63, Maya Nature Resort and more. Proof, not hype.',
    scripts: ['data', 'site', 'kinetic'],
  },
  {
    file: 'partners.html', page: 'partners', og: 'og-partners', ogTitle: 'THE RECORD. IN FULL.', crumb: 'Partners',
    title: 'Previous Partners — 97 Design',
    desc: 'The full record: 19 real brands shipped by 97 Design across Uganda & South Sudan — AFRICA63, Maya Nature Resort, KHATHA, Kushite, Nile Link and more.',
    scripts: ['data', 'site', 'kinetic'],
  },
  {
    file: 'pricing.html', page: 'pricing', og: 'og-pricing', ogTitle: 'THE PURSE.', crumb: 'Pricing',
    title: 'Instant Quote Calculator — 97 Design',
    desc: 'Pick what you need and get a real price instantly in UGX or USD. Every project starts with a 50% deposit — the balance on delivery.',
    scripts: ['data', 'site', 'kinetic', 'pricing'], jsonld: ['services', 'faq'],
  },
  {
    file: 'start.html', page: 'start', og: 'og-start', ogTitle: 'THE CONTRACT.', crumb: 'Start a project',
    title: 'Start a Project — 97 Design',
    desc: 'Send your project brief straight to 97 Design on WhatsApp — your quote comes with you. The first deposit confirms your slot.',
    scripts: ['data', 'site', 'kinetic', 'pricing', 'start'],
  },
  {
    file: 'about.html', page: 'about', og: 'og-about', ogTitle: 'TWO NATIONS. ONE BAR.', crumb: 'About',
    title: 'About the Studio — 97 Design',
    desc: "The design studio of 97 World — one studio serving Kampala and Juba with websites, branding and campaign design. Proof isn't fabricated. It's built.",
    scripts: ['data', 'site', 'kinetic'],
  },
  {
    file: '404.html', page: '404',
    title: 'Page not found — 97 Design',
    desc: "This page isn't built yet. Head back to 97 Design.",
    scripts: ['data', 'site', 'kinetic'], noindex: true,
    headExtra: `<script>
/* 404 is served for any missing path — anchor relative URLs to the site root */
(function(){var p=location.pathname.split("/");var root=(location.hostname.slice(-10)===".github.io"&&p[1])?"/"+p[1]+"/":"/";var b=document.createElement("base");b.href=root;document.head.appendChild(b);})();
</script>`,
  },
];

/* ---------- JSON-LD builders (from SITE — never hand-written) ---------- */
const ldBusiness = () => ({
  '@context': 'https://schema.org', '@type': 'ProfessionalService',
  name: '97 Design', url: BASE, image: BASE + 'assets/og/og-default.jpg',
  logo: BASE + 'assets/icon-512.png', foundingDate: '2026',
  telephone: '+' + SITE.whatsapp, priceRange: '$35 - $500',
  slogan: "Proof isn't fabricated. It's built.",
  areaServed: SITE.nations.map((n) => ({ '@type': 'Country', name: n.name })),
  address: [{ '@type': 'PostalAddress', addressLocality: 'Kampala', addressCountry: 'UG' },
            { '@type': 'PostalAddress', addressLocality: 'Juba', addressCountry: 'SS' }],
  sameAs: ['https://wa.me/' + SITE.whatsapp],
});
const ldServices = () => ({
  '@context': 'https://schema.org', '@type': 'OfferCatalog',
  name: '97 Design services',
  itemListElement: SITE.services.map((s) => ({
    '@type': 'Offer', priceCurrency: 'USD', price: s.usd,
    itemOffered: { '@type': 'Service', name: s.name, description: s.short, provider: { '@type': 'ProfessionalService', name: '97 Design' } },
  })),
});
const ldCrumbs = (p) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    { '@type': 'ListItem', position: 2, name: p.crumb, item: BASE + p.file },
  ],
});
const ldFaq = () => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: SITE.faqs.map((f) => ({
    '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/* ---------- critical CSS: critical.css + fonts.css, root-relative ---------- */
const criticalCss = (read('css/fonts.css') + '\n' + read('css/critical.css'))
  .split('../assets/').join('assets/');

/* ---------- head template ---------- */
function head(p) {
  const canon = BASE + (p.page === 'home' ? '' : p.file);
  const og = BASE + 'assets/og/' + (p.og && existsSync(join(ROOT, 'assets/og', p.og + '.jpg')) ? p.og : 'og-default') + '.jpg';
  const asyncCss = (href) => {
    const u = v(href);
    return `<link rel="preload" href="${u}" as="style">
<link rel="stylesheet" href="${u}" media="print" onload="this.media='all';this.onload=null">`;
  };
  const sheets = ['css/styles.css', 'css/kinetic.css', p.home ? 'css/home.css' : 'css/pages.css'];
  const lds = [
    ...(p.home || p.page === 'about' ? [ldBusiness()] : []),
    ...((p.jsonld || []).includes('services') ? [ldServices()] : []),
    ...((p.jsonld || []).includes('faq') ? [ldFaq()] : []),
    ...(p.crumb && !p.noindex ? [ldCrumbs(p)] : []),
  ];
  return `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${p.title}</title>
<meta name="description" content="${p.desc}">
<meta name="theme-color" content="#050506">
<meta name="theme-color" media="(prefers-color-scheme:light)" content="#050506">
${p.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${canon}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="97 Design">
<meta property="og:title" content="${p.title}">
<meta property="og:description" content="${p.desc}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${(p.ogTitle || '97 DESIGN').replace(/"/g, '&quot;')} — 97 Design fight-bill poster card">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${p.title}">
<meta name="twitter:description" content="${p.desc}">
<meta name="twitter:image" content="${og}">
${p.headExtra ? p.headExtra + '\n' : ''}<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preload" href="assets/fonts/knockout-cruiserweight.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/knockout-jr-middleweight.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
${p.home ? `<link rel="preload" href="assets/fonts/knockout-ultimate-sumo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="assets/bg/bg1-desktop.avif" media="(min-width:821px)" fetchpriority="high">
<link rel="preload" as="image" href="assets/bg/bg1-mobile.avif" media="(max-width:820px)" fetchpriority="high">
` : ''}<style>
${criticalCss}</style>
${sheets.map(asyncCss).join('\n')}
<noscript>${sheets.map((s) => `<link rel="stylesheet" href="${v(s)}">`).join('')}</noscript>
${p.home ? `<script>try{if(sessionStorage.getItem("i97"))document.documentElement.classList.add("no-intro")}catch(e){}</script>
` : ''}<script type="speculationrules">
{"prerender":[{"where":{"selector_matches":"nav.links a, .mmenu-links a, .foot-col a"},"eagerness":"moderate"},{"where":{"selector_matches":"a[href^='pricing'], a[href^='start']"},"eagerness":"conservative"}]}
</script>
${lds.map((l) => `<script type="application/ld+json">${JSON.stringify(l)}</script>`).join('\n')}
</head>`;
}

/* ---------- shared chrome ---------- */
const navChrome = (page) => {
  const on = (k, label, href) =>
    `<a href="${href}"${k === page ? ' class="on" aria-current="page"' : ''}>${label}</a>`;
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="nav" id="nav">
  <a href="index.html" class="brand" aria-label="97 Design home">
    <span class="mono"><img src="assets/mark-white.png" alt="97 Design" width="40" height="40"></span>
  </a>
  <nav class="links">
    ${on('work', 'Work', 'work.html')}
    ${on('services', 'Services', 'services.html')}
    ${on('pricing', 'Pricing', 'pricing.html')}
    ${on('about', 'About', 'about.html')}
  </nav>
  <a href="start.html" class="nav-cta">Start a project</a>
  <button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" onclick="toggleMenu()">
    <span></span><span></span><span></span>
  </button>
</header>`;
};

const mmenuChrome = (page) => {
  const on = (k) => (k === page ? ' class="on"' : '');
  return `<div class="mmenu" id="mmenu" aria-hidden="true">
  <nav class="mmenu-links">
    <a href="index.html"${on('home')} style="--i:0"><small>01</small> Home</a>
    <a href="work.html"${on('work')} style="--i:1"><small>02</small> Work</a>
    <a href="partners.html"${on('partners')} style="--i:2"><small>03</small> Partners</a>
    <a href="services.html"${on('services')} style="--i:3"><small>04</small> Services</a>
    <a href="pricing.html"${on('pricing')} style="--i:4"><small>05</small> Pricing</a>
    <a href="about.html"${on('about')} style="--i:5"><small>06</small> About</a>
  </nav>
  <div class="mmenu-foot">
    <a class="btn wa full" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">Chat on WhatsApp</a>
    <a class="btn ghost full" href="start.html">Start a project →</a>
    <div class="mmenu-nations">
      <div class="flagline">
        <i style="background:var(--ink)"></i><i style="background:var(--ug-y)"></i><i style="background:var(--ug-r)"></i>
        <i style="background:var(--ss-b)"></i><i style="background:var(--ss-g)"></i>
      </div>
      <span class="cap">Uganda · South Sudan</span>
    </div>
  </div>
</div>`;
};

const footerChrome = () => `<footer>
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand">
        <a href="index.html" class="brand"><span class="mono"><img src="assets/mark-white.png" alt="97 Design" width="40" height="40" loading="lazy"></span><span class="brand-txt">97 DESIGN<small>UG · SS</small></span></a>
        <p>The design studio of 97 World. Websites, fliers, brands and everything your idea needs — built, not fabricated.</p>
        <div class="flagline mt">
          <i style="background:var(--ink)"></i><i style="background:var(--ug-y)"></i><i style="background:var(--ug-r)"></i>
          <i style="background:var(--ss-b)"></i><i style="background:var(--ss-g)"></i>
        </div>
      </div>
      <div class="foot-col">
        <h5>Studio</h5>
        <a href="index.html">Home</a><a href="work.html">Work</a><a href="partners.html">Partners</a><a href="services.html">Services</a><a href="pricing.html">Pricing</a><a href="about.html">About</a>
      </div>
      <div class="foot-col">
        <h5>Build</h5>
        <a href="services.html#web">Websites</a><a href="services.html#landing">Landing Pages</a><a href="services.html#brand">Brand Kits</a><a href="services.html#flier">Fliers &amp; Posters</a>
      </div>
      <div class="foot-col">
        <h5>Talk to us</h5>
        <a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
        <a href="tel:+${SITE.whatsapp}">${SITE.phonePretty}</a>
        <a href="start.html">Start a project</a>
      </div>
    </div>
    <div class="foot-bottom">
      <div class="tblock">
        <div><small>Project</small><b>97 DESIGN</b></div>
        <div><small>Location</small><b>Kampala — Juba</b></div>
        <div><small>Date</small><b>© <span id="yr"></span></b></div>
        <div><small>Scale</small><b>1:1 — no templates</b></div>
        <div><small>Sheet</small><b>01 / 01</b></div>
        <div><small>Note</small><span class="stamp">Built ✦ Approved</span></div>
      </div>
    </div>
    <span class="foot-wm">97 DESIGN</span>
  </div>
</footer>`;

const scriptsChrome = (list) =>
  list.map((s) => `<script src="${v('js/' + s + '.js')}" defer></script>`).join('\n') + '\n</body>';

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
  html = html.replace(/<header class="nav"[\s\S]*?<\/header>/, navChrome(p.page));
  html = html.replace(/<div class="mmenu"[\s\S]*?<\/div>\n\n<main/, mmenuChrome(p.page) + '\n\n<main');
  html = html.replace(/<footer>[\s\S]*?<\/footer>/, footerChrome());
  html = html.replace(/<script src="js\/data\.js[\s\S]*?<\/body>/, scriptsChrome(p.scripts));
  writeFileSync(join(ROOT, p.file), html);

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

/* ---------- sitemap ---------- */
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.filter((p) => !p.noindex).map((p) =>
    `  <url><loc>${BASE + (p.page === 'home' ? '' : p.file)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${
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
