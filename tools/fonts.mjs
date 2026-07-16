/* ============================================================
   97 DESIGN — display font pipeline (dev-only, run locally)
   Converts the licensed Knockout Cruiserweight file (any of
   OTF/TTF/WOFF/WOFF2) into the committed web subset and prints
   the metrics needed for the zero-CLS fallback overrides.

   Usage: npm run fonts -- --src <path-to-font-file>

   Output: assets/fonts/knockout-cruiserweight.woff2
   Only the subset ships — the desktop original is never
   committed (licensing: the owner's H&Co web license covers
   self-hosted serving of the web subset).
   ============================================================ */
import subsetFont from 'subset-font';
import * as fontkit from 'fontkit';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcArg = process.argv.indexOf('--src');
const SRC = srcArg > -1 ? process.argv[srcArg + 1] : null;
if (!SRC) {
  console.error('usage: npm run fonts -- --src <path-to-knockout-file>');
  process.exit(1);
}

// every character the site's display surfaces can render, plus the
// symbols used in headings/CTAs — anything outside this falls back
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
const EXTRAS = '’‘“”–—·•→↓↗↺°✓✕✦×⇄%';
const TEXT = ASCII + EXTRAS;

const src = readFileSync(SRC);
const woff2 = await subsetFont(src, TEXT, { targetFormat: 'woff2' });
const out = join(ROOT, 'assets', 'fonts', 'knockout-cruiserweight.woff2');
writeFileSync(out, woff2);
console.log('subset'.padEnd(14), (src.length / 1024).toFixed(0) + 'KB →', (woff2.length / 1024).toFixed(0) + 'KB woff2');

// metrics report → size-adjust / ascent-override / descent-override for
// the Arial Narrow fallback face in css/fonts.css (CLS-free swap)
const font = fontkit.create(src);
const upm = font.unitsPerEm;
const pct = (v) => ((v / upm) * 100).toFixed(2) + '%';
console.log('family'.padEnd(14), font.familyName, '·', font.subfamilyName);
console.log('unitsPerEm'.padEnd(14), upm);
console.log('ascent'.padEnd(14), font.ascent, '→ ascent-override:', pct(font.ascent));
console.log('descent'.padEnd(14), font.descent, '→ descent-override:', pct(Math.abs(font.descent)));
console.log('lineGap'.padEnd(14), font.lineGap, '→ line-gap-override:', pct(font.lineGap));
console.log('capHeight'.padEnd(14), font.capHeight, '(' + pct(font.capHeight) + ')');
if (font.capHeight / upm < 0.62)
  console.log('note: low cap-height — check kinetic clip wrappers for cropping');
// avg advance of the caps — rough size-adjust hint vs Arial Narrow (~0.44em avg)
const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const run = font.layout(caps);
const avg = run.positions.reduce((a, p) => a + p.xAdvance, 0) / caps.length / upm;
console.log('avg cap adv'.padEnd(14), avg.toFixed(3) + 'em — size-adjust hint vs Arial Narrow: ~' + ((avg / 0.52) * 100).toFixed(0) + '%');
console.log('\nnext: css/fonts.css @font-face swap → remove font-stretch → npm run build (see plan PART A)');
