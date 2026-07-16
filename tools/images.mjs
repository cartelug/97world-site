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

// about-page lockup: 300KB PNG -> sized AVIF/WebP pair
const lockup = join(ROOT, 'assets', 'logo-full.png');
if (existsSync(lockup)) {
  const a = await sharp(lockup).resize(640).avif({ quality: 60 }).toFile(join(ROOT, 'assets', 'logo-full.avif'));
  const w = await sharp(lockup).resize(640).webp({ quality: 80 }).toFile(join(ROOT, 'assets', 'logo-full.webp'));
  console.log('logo-full'.padEnd(16), '640w', 'avif', (a.size / 1024).toFixed(0) + 'KB', '· webp', (w.size / 1024).toFixed(0) + 'KB');
}

// palette-crush the mark (also used as a CSS mask source -> stays PNG)
const mark = join(ROOT, 'assets', 'mark-white.png');
const crushed = await sharp(mark).png({ palette: true, colors: 16 }).toBuffer();
const { writeFileSync } = await import('node:fs');
writeFileSync(mark, crushed);
console.log('mark-white'.padEnd(16), 'palette PNG', (crushed.length / 1024).toFixed(0) + 'KB');

// PWA maskable icon: mark centered on brand-dark tile with safe padding
const icon = await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 14, g: 14, b: 18, alpha: 1 } },
})
  .composite([{ input: await sharp(mark).resize(300).toBuffer(), gravity: 'centre' }])
  .png({ palette: true })
  .toFile(join(ROOT, 'assets', 'icon-maskable-512.png'));
console.log('icon-maskable'.padEnd(16), '512', (icon.size / 1024).toFixed(0) + 'KB');
console.log('done');
