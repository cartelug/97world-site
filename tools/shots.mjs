/* ============================================================
   97 DESIGN — live-site capture (dev-only, run locally)
   Screenshots every work row that is Live with a link and
   encodes it for the browser-chrome mocks on home + work pages.
   Outputs are committed; the site never needs a browser at
   serve time.

   Usage: npm run shots
   New Live+link rows in js/data.js are picked up automatically.
   ============================================================ */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'work');
mkdirSync(OUT, { recursive: true });

const win = {};
new Function('window', readFileSync(join(ROOT, 'js/data.js'), 'utf8'))(win);
const live = win.SITE.work.filter((w) => w.status === 'Live' && w.link);
if (!live.length) {
  console.log('no Live work rows with links — nothing to capture');
  process.exit(0);
}

const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
  : undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

for (const w of live) {
  const id = (w.disp && w.disp.id) || w.project.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  try {
    await page.goto(w.link, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200); // settle entrance animations
    const png = await page.screenshot({ type: 'png' });
    const a = await sharp(png).resize(1200).avif({ quality: 55 }).toFile(join(OUT, `${id}.avif`));
    const j = await sharp(png).resize(1200).jpeg({ quality: 72, progressive: true, mozjpeg: true }).toFile(join(OUT, `${id}.jpg`));
    console.log(id.padEnd(16), w.link, 'avif', (a.size / 1024).toFixed(0) + 'KB', '· jpg', (j.size / 1024).toFixed(0) + 'KB');
    console.log(`  → add to data.js disp: shot: "assets/work/${id}.jpg"`);
  } catch (e) {
    console.error(id.padEnd(16), 'FAILED:', e.message.split('\n')[0]);
  }
}
await browser.close();
console.log('done');
