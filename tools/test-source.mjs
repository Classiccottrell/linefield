// tools/test-source.mjs — every Source button downloads exact, unbaked bytes.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pieces = JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

const server = createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel.endsWith('/')) rel += 'index.html';
  const path = join(ROOT, rel);
  if (!path.startsWith(ROOT) || !existsSync(path)) return res.writeHead(404).end('not found');
  res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
  res.end(readFileSync(path));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const { slug } of pieces) {
    const sourcePath = join(ROOT, 'pieces', slug, 'index.html');
    await page.goto(`http://127.0.0.1:${server.address().port}/pieces/${slug}/?preview=1`);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btn-source'),
    ]);
    const actual = readFileSync(await download.path());
    const expected = readFileSync(sourcePath);
    if (!actual.equals(expected)) throw new Error(`${slug}: Source download differs from index.html`);
    console.log(`  ok   ${slug}`);
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`\nall ${pieces.length} Source downloads match their unbaked index.html`);
