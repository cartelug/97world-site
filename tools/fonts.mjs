/* ============================================================
   97 DESIGN — display font pipeline (dev-only, run locally)
   Subsets the licensed Knockout web fonts to the site's charset
   and prints the metrics used by the zero-CLS fallback overrides
   in css/fonts.css.

   Usage: npm run fonts -- --dir <folder-with-knockout-woff2s>
   (matches files by name: *Cruiserweight*, *JuniorMiddleweight*,
    *UltimateSumo*)

   Only subsets are committed — desktop originals never are
   (licensing: the owner's H&Co web license covers self-hosted
   serving of the web subsets).
   ============================================================ */
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirArg = process.argv.indexOf('--dir');
const DIR = dirArg > -1 ? process.argv[dirArg + 1] : null;
if (!DIR) {
  console.error('usage: npm run fonts -- --dir <folder-with-knockout-woff2 files>');
  process.exit(1);
}

/* the three faces the site uses (Knockout numbering):
   52 Cruiserweight — core display · 31 Junior Middlewt — mid headings
   94 Ultmt Sumo — brand stamps (footer watermark, intro DESIGN) */
const FACES = [
  { match: /cruiserweight/i, out: 'knockout-cruiserweight.woff2' },
  { match: /juniormiddleweight|junior.?middlewt/i, out: 'knockout-jr-middleweight.woff2' },
  { match: /ultimatesumo|ultmt.?sumo/i, out: 'knockout-ultimate-sumo.woff2' },
];

// every character display surfaces can render; symbols outside this
// intentionally fall back (Knockout carries no arrows/checks)
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const TEXT = ASCII + '’‘“”–—·•°×%';

const files = readdirSync(DIR);
for (const face of FACES) {
  const name = files.find((f) => face.match.test(f) && /\.(woff2?|otf|ttf)$/i.test(f));
  if (!name) { console.error('MISSING source for', face.out); process.exit(1); }
  const src = readFileSync(join(DIR, name));
  const woff2 = await subsetFont(src, TEXT, { targetFormat: 'woff2' });
  const smaller = woff2.length < src.length ? woff2 : src; // never ship a bigger file
  writeFileSync(join(ROOT, 'assets', 'fonts', face.out), smaller);

  const font = fontkit.create(src);
  const upm = font.unitsPerEm;
  const pct = (v) => ((v / upm) * 100).toFixed(1) + '%';
  const caps = 'HAMBURGEFONTSIV';
  const avg = font.layout(caps).positions.reduce((a, p) => a + p.xAdvance, 0) / caps.length / upm;
  console.log(face.out.padEnd(34), (src.length / 1024).toFixed(0) + 'KB →', (smaller.length / 1024).toFixed(0) + 'KB',
    '| ' + font.familyName, '| asc', pct(font.ascent), 'desc', pct(Math.abs(font.descent)),
    'cap', pct(font.capHeight), '| avgCapAdv', avg.toFixed(3) + 'em');
}
console.log('\nfallback overrides for css/fonts.css: ascent-override:80%;descent-override:20%;line-gap-override:0%');
console.log('next: npm run build (heads re-inline the token swap), bump sw.js VERSION');
