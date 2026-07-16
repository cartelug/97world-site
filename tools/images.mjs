/* ============================================================
   97 DESIGN — image pipeline (dev-only, run locally)
   Encodes the cinematic scene backgrounds to AVIF (+ JPEG
   fallback), generates the missing portrait crops, compresses
   the about-page lockup and emits the PWA maskable icon.
   Outputs are committed; GitHub Pages stays a static host.

   Usage: npm run images [-- --src <dir-with-original-pngs>]
   Without --src it re-encodes from the committed JPGs.
   ============================================================ */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BG = join(ROOT, 'assets', 'bg');
const srcArg = process.argv.indexOf('--src');
const SRC = srcArg > -1 ? process.argv[srcArg + 1] : null;

/** original ChatGPT renders (higher-res PNG) when available, else committed JPGs */
const SCENES = [
  { id: 1, desktop: '11_29_14 AM (1)', mobile: '11_28_56 AM (1)' },
  { id: 2, desktop: '11_29_15 AM (2)', mobile: '11_28_57 AM (3)' },
  { id: 3, desktop: '11_29_16 AM (3)', mobile: null },
  { id: 4, desktop: '11_29_16 AM (4)', mobile: null },
  { id: 5, desktop: '11_29_17 AM (5)', mobile: '11_28_56 AM (2)' },
];

const srcFor = (stamp, fallback) => {
  if (SRC && stamp) {
    const p = join(SRC, `ChatGPT Image Jul 16, 2026, ${stamp}.png`);
    if (existsSync(p)) return p;
  }
  return fallback;
};

async function encode(input, out, { width, height, avifQ = 50, jpgQ = 68 }) {
  const base = sharp(input).resize(width, height, { fit: 'cover', position: 'attention' });
  const avif = await base.clone().avif({ quality: avifQ }).toFile(out + '.avif');
  const jpg = await base.clone().jpeg({ quality: jpgQ, progressive: true, mozjpeg: true }).toFile(out + '.jpg');
  console.log(out.split('/').pop().padEnd(16), `${avif.width}x${avif.height}`,
    'avif', (avif.size / 1024).toFixed(0) + 'KB', '· jpg', (jpg.size / 1024).toFixed(0) + 'KB');
}

mkdirSync(BG, { recursive: true });

// Scenes re-encode ONLY from original renders (--src): re-encoding the
// committed JPGs would compound generational loss and collide input/output.
if (SRC) {
  for (const s of SCENES) {
    // desktop 1600w (source 1672x941 PNG or committed 1600x900 jpg)
    await encode(
      srcFor(s.desktop, join(BG, `bg${s.id}-desktop.jpg`)),
      join(BG, `bg${s.id}-desktop`), { width: 1600, height: 900 });
    // mobile portrait — real portrait render when it exists, else a center
    // crop of the desktop frame (sits behind a heavy scrim, fidelity uncritical)
    const mobileSrc = s.mobile
      ? srcFor(s.mobile, join(BG, `bg${s.id}-mobile.jpg`))
      : srcFor(s.desktop, join(BG, `bg${s.id}-desktop.jpg`));
    await encode(mobileSrc, join(BG, `bg${s.id}-mobile`), { width: 760, height: 1350 });
  }
} else {
  console.log('scenes'.padEnd(16), 'skipped (no --src; committed encodes kept)');
}

/* ---------- brand icons ----------
   BRAND RULE: the 97 mark never sits on a background box. The two
   platform exceptions below are spec-forced and deliberately read
   as "canvas", never "chip":
   - icon-maskable-512.png — the maskable spec REQUIRES full bleed
     (Android composites transparent maskables onto white, worse);
   - apple-touch-icon.png — iOS composites transparency onto black
     and rounds corners itself, so solid site-canvas is intentional. */
const { writeFileSync } = await import('node:fs');
const mark = join(ROOT, 'assets', 'mark-white.png');
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// palette-crush the mark (also used as a CSS mask source -> stays PNG)
const crushed = await sharp(mark).png({ palette: true, colors: 16 }).toBuffer();
writeFileSync(mark, crushed);
console.log('mark-white'.padEnd(16), 'palette PNG', (crushed.length / 1024).toFixed(0) + 'KB');

/** the mark centred on a transparent square canvas */
async function markLayer(canvas, markSize) {
  const m = await sharp(mark).resize(markSize, markSize, { fit: 'inside' }).toBuffer();
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background: TRANSPARENT } })
    .composite([{ input: m, gravity: 'centre' }]).png().toBuffer();
}

// favicon.png — the mark filled with the UG gradient on TRANSPARENCY
// (a plain white mark disappears on light tab bars; the gradient
// survives both without ever adding a background tile)
const gradSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffce00"/><stop offset=".55" stop-color="#ffb100"/><stop offset="1" stop-color="#e33326"/>
  </linearGradient></defs><rect width="256" height="256" fill="url(#g)"/></svg>`);
const fav = await sharp(gradSvg)
  .composite([{ input: await markLayer(256, 216), blend: 'dest-in' }])
  .png({ palette: true })
  .toFile(join(ROOT, 'assets', 'favicon.png'));
console.log('favicon'.padEnd(16), '256', (fav.size / 1024).toFixed(0) + 'KB');

// favicon.svg — scheme-adaptive: white mark on dark browser UI,
// inverted (ink) mark on light UI; zero background either way
const markB64 = (await sharp(mark).resize(216, 216, { fit: 'inside' }).png().toBuffer()).toString('base64');
writeFileSync(join(ROOT, 'assets', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
<style>@media (prefers-color-scheme:light){.m{filter:invert(1)}}</style>
<image class="m" href="data:image/png;base64,${markB64}" x="20" y="20" width="216" height="216"/>
</svg>`);
console.log('favicon.svg'.padEnd(16), 'scheme-adaptive');

// icon-512.png — white mark on transparency (manifest purpose:"any")
const any = await sharp(await markLayer(512, 400)).png({ palette: true })
  .toFile(join(ROOT, 'assets', 'icon-512.png'));
console.log('icon-512'.padEnd(16), '512', (any.size / 1024).toFixed(0) + 'KB');

// icon-maskable-512.png — spec-forced bleed as near-black canvas
// (subtle radial so launchers read depth, not a flat chip)
const radialSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><radialGradient id="r" cx=".5" cy=".42" r=".75">
    <stop offset="0" stop-color="#0d0d16"/><stop offset="1" stop-color="#050506"/>
  </radialGradient></defs><rect width="512" height="512" fill="url(#r)"/></svg>`);
const maskable = await sharp(radialSvg)
  .composite([{ input: await sharp(mark).resize(300).toBuffer(), gravity: 'centre' }])
  .png({ palette: true })
  .toFile(join(ROOT, 'assets', 'icon-maskable-512.png'));
console.log('icon-maskable'.padEnd(16), '512', (maskable.size / 1024).toFixed(0) + 'KB');

// apple-touch-icon.png — 180px, solid site canvas (see brand rule above)
const apple = await sharp({
  create: { width: 180, height: 180, channels: 4, background: { r: 5, g: 5, b: 6, alpha: 1 } },
})
  .composite([{ input: await sharp(mark).resize(116).toBuffer(), gravity: 'centre' }])
  .png({ palette: true })
  .toFile(join(ROOT, 'assets', 'apple-touch-icon.png'));
console.log('apple-touch'.padEnd(16), '180', (apple.size / 1024).toFixed(0) + 'KB');
console.log('done');
