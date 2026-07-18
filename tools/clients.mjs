/* ============================================================
   97 DESIGN — client record pipeline (dev-only, run locally)
   Normalizes the owner's client logo pack into uniform 3:2
   "record wall" tiles: auto-trimmed, each mark kept on its OWN
   background colour (sampled from the source border), padded,
   encoded AVIF+JPEG at exactly 480×320.

   Usage: npm run clients -- --src <path-to-Official-Client-Logo-Pack/Originals>
   Outputs assets/clients/<id>.{avif,jpg} — committed.
   The display list lives in js/data.js (SITE.clients).
   ============================================================ */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'clients');
const srcArg = process.argv.indexOf('--src');
const SRC = srcArg > -1 ? process.argv[srcArg + 1] : null;
if (!SRC) { console.error('usage: npm run clients -- --src <Originals folder>'); process.exit(1); }
mkdirSync(OUT, { recursive: true });

/* one tile per brand — ids must match SITE.clients in js/data.js */
const BRANDS = [
  { id: 'a63',        src: 'A63-Africa/A63-Africa-Original.jpeg' },
  { id: 'accessug',   src: 'AccessUG/AccessUG-C-Mark-Original.jpeg' },
  { id: 'acra',       src: 'ACRA/ACRA-Original.jpeg' },
  { id: 'akright',    src: 'Akright-Summit/Akright-Summit-Original.jpeg' },
  { id: 'biashara',   src: 'Biashara-Trading-Company-Limited/Biashara-Trading-Company-Limited-Original.jpeg' },
  { id: 'caretaker',  src: 'Caretaker-Security-Services-Limited/Caretaker-Security-Services-Limited-Original.jpeg' },
  { id: 'fodman',     src: 'FODMAN-International/FODMAN-International-Original.jpeg' },
  { id: 'markh',      src: 'Honda-MARKH/Honda-Official-Distributor-MARKH-Original-Screenshot.png', pre: { left: .18, top: .28, width: .64, height: .5 } },
  { id: 'khatha',     src: 'KHATHA/KHATHA-Original.jpeg' },
  { id: 'kushite',    src: 'Kushite/Kushite-Original.jpeg' },
  { id: 'lumu',       src: 'Lumu-Group-of-Companies/Lumu-Group-of-Companies-Original.jpeg' },
  { id: 'maya',       src: 'Maya-Nature-Resort/Maya-Nature-Resort-Original.jpeg' },
  { id: 'mwt',        src: 'My-Weekly-Track/My-Weekly-Track-Original.jpeg' },
  { id: 'nilelink',   src: 'Nile-Link/Nile-Link-Original.jpeg' },
  { id: 'socialspot', src: 'Social-Spot/Social-Spot-Bwebajja-Original.png' },
  { id: 'ssuubi',     src: 'Ssuubi-Fellowship/Ssuubi-Fellowship-Original.jpeg' },
  { id: 'sunafrica',  src: 'Sun-Over-Africa/Sun-Over-Africa-Original.jpeg' },
  { id: 'rotarian',   src: 'Walking-Rotarian/Walking-Rotarian-Original.jpeg' },
  { id: 'watp',       src: 'WATP/WATP-Women-Against-Teenage-Pregnancy-Original.jpeg' },
];

const W = 480, H = 320, PAD = 36;

for (const b of BRANDS) {
  const file = join(SRC, b.src);
  try {
    // optional pre-crop (fractions) for screenshot sources with UI chrome
    let src = sharp(file);
    if (b.pre) {
      const meta = await src.metadata();
      src = src.extract({
        left: Math.round(meta.width * b.pre.left), top: Math.round(meta.height * b.pre.top),
        width: Math.round(meta.width * b.pre.width), height: Math.round(meta.height * b.pre.height),
      });
    }
    const preBuf = await src.toBuffer();
    // tile background = the source's own border colour (top-left pixel)
    const corner = await sharp(preBuf).extract({ left: 1, top: 1, width: 1, height: 1 }).raw().toBuffer();
    const bg = { r: corner[0], g: corner[1], b: corner[2], alpha: 1 };
    // trim uniform borders, then pad the mark into the tile on its own colour
    const inner = await sharp(preBuf).trim({ threshold: 18 })
      .resize(W - PAD * 2, H - PAD * 2, { fit: 'contain', background: bg })
      .toBuffer();
    const tile = sharp(inner).extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: bg }).flatten({ background: bg });
    const a = await tile.clone().avif({ quality: 60 }).toFile(join(OUT, b.id + '.avif'));
    const j = await tile.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(join(OUT, b.id + '.jpg'));
    console.log(b.id.padEnd(12), 'avif', (a.size / 1024).toFixed(0) + 'KB', '· jpg', (j.size / 1024).toFixed(0) + 'KB');
  } catch (e) {
    console.error(b.id.padEnd(12), 'FAILED:', e.message);
  }
}
console.log('done — SITE.clients in js/data.js is the display list');
