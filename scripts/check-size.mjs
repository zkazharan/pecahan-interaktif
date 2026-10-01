import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 120 * 1024;
const html = readFileSync('dist/index.html', 'utf8');
const sources = [
  ...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
].map((match) => match[1].replace(/^\.?\//, ''));

if (sources.length === 0) {
  console.error('no script or modulepreload sources found in dist/index.html');
  process.exit(1);
}

let total = 0;
for (const source of new Set(sources)) {
  const bytes = gzipSync(readFileSync(join('dist', source))).length;
  total += bytes;
  console.log(`${source}: ${(bytes / 1024).toFixed(1)} KB gzip`);
}
console.log(`initial JS: ${(total / 1024).toFixed(1)} KB gzip (limit ${LIMIT / 1024} KB)`);
if (total > LIMIT) {
  console.error('JS budget exceeded');
  process.exit(1);
}
