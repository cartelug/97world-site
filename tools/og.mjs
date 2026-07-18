/* ============================================================
   97 DESIGN — OG share-card engine (dev-only, run locally)
   Renders per-page 1200×630 fight-bill poster cards. Knockout
   text is converted to SVG *paths* via fontkit (no fontconfig,
   no system-font roulette — pixel-identical everywhere).

   Usage: npm run og     → assets/og/og-<page>.jpg (+ og-default)
   tools/build.mjs picks any existing og-<page>.jpg per page.
   ============================================================ */
import sharp from 'sharp';
import * as fontkit from 'fontkit';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'og');
mkdirSync(OUT, { recursive: true });

const cruiser = fontkit.openSync(join(ROOT, 'assets/fonts/knockout-cruiserweight.woff2'));
const jr = fontkit.openSync(join(ROOT, 'assets/fonts/knockout-jr-middleweight.woff2'));

/** typeset a string as SVG paths at (x, baselineY); returns {svg, width} */
function set(font, text, size, x, y, attrs, tracking = 0) {
  const scale = size / font.unitsPerEm;
  const run = font.layout(text);
  let cx = x, paths = '';
  for (const [i, g] of run.glyphs.entries()) {
    const pos = run.positions[i];
    const d = g.path.toSVG();
    if (d) paths += `<path transform="translate(${(cx + pos.xOffset * scale).toFixed(1)},${(y - pos.yOffset * scale).toFixed(1)}) scale(${scale.toFixed(5)},${(-scale).toFixed(5)})" d="${d}"/>`;
    cx += pos.xAdvance * scale + tracking;
  }
  return { svg: `<g ${attrs}>${paths}</g>`, width: cx - x };
}

/* Knockout carries no ✦ — draw the star ourselves between tape segments */
function tapeSet(font, text, size, x, y, attrs, tracking) {
  const parts = text.split('✦').map((t) => t.trim());
  let cx = x, svg = '';
  parts.forEach((part, i) => {
    if (i > 0) {
      const r = size * 0.34;
      svg += `<path transform="translate(${(cx + r + size * 0.3).toFixed(1)},${(y - size * 0.32).toFixed(1)})" fill="#ffce00"
        d="M0 ${-r} Q${r * 0.22} ${-r * 0.22} ${r} 0 Q${r * 0.22} ${r * 0.22} 0 ${r} Q${-r * 0.22} ${r * 0.22} ${-r} 0 Q${-r * 0.22} ${-r * 0.22} 0 ${-r}Z"/>`;
      cx += r * 2 + size * 1.2;
    }
    const s = set(font, part, size, cx, y, attrs, tracking);
    svg += s.svg;
    cx += s.width;
  });
  return { svg, width: cx - x };
}

const grid = () => {
  let out = '';
  for (let x = 0; x <= 1200; x += 30) out += `<line x1="${x}" y1="0" x2="${x}" y2="630" stroke="rgba(255,255,255,.035)"/>`;
  for (let y = 0; y <= 630; y += 30) out += `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="rgba(255,255,255,.035)"/>`;
  return out;
};

function card({ tape, rows, foot }) {
  const size = rows.length === 3 ? 118 : 146;
  const gap = rows.length === 3 ? 120 : 158;
  const y0 = rows.length === 3 ? 268 : 312;
  const rowSvg = rows.map((r, i) => set(cruiser, r.t, size, 80, y0 + i * gap,
    r.y ? 'fill="#ffce00"' : r.o ? 'fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2.2"' : 'fill="#f4f4f6"'
  ).svg).join('');
  const tapeSvg = tapeSet(jr, tape, 27, 80, 118, 'fill="#8a8a93"', 9).svg;
  const footSvg = set(jr, foot, 25, 80, 568, 'fill="#f4f4f6"', 6).svg;
  const wa = set(jr, 'WHATSAPP DIRECT', 25, 0, 568, 'fill="#ffce00"', 6);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#050506"/>
  ${grid()}
  <rect x="0" y="0" width="1200" height="8" fill="#f4f4f6"/>
  <rect x="0" y="14" width="1200" height="2" fill="rgba(255,255,255,.25)"/>
  ${tapeSvg}
  <line x1="80" y1="150" x2="1120" y2="150" stroke="rgba(255,255,255,.22)"/>
  ${rowSvg}
  <line x1="80" y1="522" x2="1120" y2="522" stroke="rgba(255,255,255,.22)"/>
  ${footSvg}
  <g transform="translate(${1120 - wa.width},0)">${wa.svg}</g>
  <rect x="0" y="614" width="1200" height="2" fill="rgba(255,255,255,.25)"/>
  <rect x="0" y="622" width="1200" height="8" fill="#ffce00"/>
</svg>`);
}

const CARDS = [
  { out: 'og-default', tape: '97 DESIGN ✦ KAMPALA — JUBA', rows: [{ t: 'WE BUILD' }, { t: 'PROOF.', y: 1 }, { t: 'NOT THE HYPE.', o: 1 }], foot: '97 DESIGN · UGANDA — SOUTH SUDAN' },
  { out: 'og-home', tape: '97 DESIGN PRESENTS', rows: [{ t: 'WE BUILD' }, { t: 'PROOF.', y: 1 }, { t: 'NOT THE HYPE.', o: 1 }], foot: 'SITES · FLIERS · BRANDS — PRICED UPFRONT' },
  { out: 'og-work', tape: 'ROUND 01 ✦ THE PROOF', rows: [{ t: 'REAL WORK.' }, { t: 'LIVE', y: 1 }, { t: '& LOADING.', o: 1 }], foot: 'EVERY CASE REAL — 97 DESIGN' },
  { out: 'og-services', tape: 'ROUND 02 ✦ THE CARD', rows: [{ t: 'SEVEN' }, { t: 'SERVICES.', y: 1 }, { t: 'ONE STUDIO.', o: 1 }], foot: 'PRICES YOU CAN SEE — 97 DESIGN' },
  { out: 'og-pricing', tape: 'ROUND 03 ✦ THE PURSE', rows: [{ t: 'PICK.' }, { t: 'TOTAL.', y: 1 }, { t: 'START.', o: 1 }], foot: '30 SECONDS · UGX OR USD · 50—50' },
  { out: 'og-start', tape: 'THE MAIN EVENT ✦ FINAL CALL', rows: [{ t: 'SEND IT.' }, { t: 'WE BUILD.', y: 1 }], foot: '50% TO START · BALANCE ON DELIVERY' },
  { out: 'og-partners', tape: 'THE FULL RECORD ✦ 19 BRANDS', rows: [{ t: 'THE RECORD.' }, { t: 'IN FULL.', y: 1 }], foot: 'EVERY MARK REAL — 97 DESIGN' },
  { out: 'og-about', tape: 'EST. 2026 ✦ THE STUDIO', rows: [{ t: 'TWO NATIONS.' }, { t: 'ONE BAR.', y: 1 }], foot: 'THE DESIGN STUDIO OF 97 WORLD' },
];

for (const c of CARDS) {
  const jpg = await sharp(card(c)).jpeg({ quality: 82, mozjpeg: true }).toFile(join(OUT, c.out + '.jpg'));
  console.log(c.out.padEnd(12), (jpg.size / 1024).toFixed(0) + 'KB');
}
console.log('done — rebuild (npm run build) to wire og:image per page');
