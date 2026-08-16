/**
 * Collapses worker/src/* into one paste-ready file for the Cloudflare
 * dashboard, so deploying needs no terminal at all.
 *   node tools/bundle-worker.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const cat = read('worker/src/catalogue.js').replace(/export const/g, 'const');
const idx = read('worker/src/index.js')
  .replace("import { CATALOGUE, BUNDLES, PLATFORMS } from './catalogue.js';\n", '');

writeFileSync(join(ROOT, 'worker/worker.bundled.js'),
  read('worker/worker.bundled.js').split('\n').slice(0, 15).join('\n') + '\n\n' +
  cat.trim() + '\n\n' + idx.trim() + '\n');
console.log('worker/worker.bundled.js rebuilt');
