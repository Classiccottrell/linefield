// tools/browser-matrix.mjs
// Loads every piece and the gallery in each installed engine and records
// what actually works. The README's browser-support table is written from
// this output — claims in that table must come from a real run.
//
// Usage: node tools/browser-matrix.mjs

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5811;
const BASE = `http://localhost:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function serveRepo(port) {
  const server = createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const path = join(ROOT, rel);
    if (!path.startsWith(ROOT) || !existsSync(path)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(readFileSync(path));
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

// Did the canvas actually draw something, and did it change over time?
async function pieceWorks(page, url) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text());
  });

  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const sample = () =>
    page.evaluate(() => {
      const c = document.getElementById('canvas');
      if (!c) return null;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 997) sum += d[i];
      return sum;
    });

  const a = await sample();
  await page.waitForTimeout(1200);
  const b = await sample();

  return {
    rendered: a !== null && a > 0,
    animated: a !== null && b !== null && a !== b,
    errors,
  };
}

const PIECES = JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8')).map((p) => p.slug);

const server = await serveRepo(PORT);
const results = {};

for (const engineName of ['chromium', 'firefox', 'webkit']) {
  let engine;
  try {
    ({ [engineName]: engine } = await import('playwright'));
  } catch (err) {
    results[engineName] = { unavailable: `import failed: ${err.message}` };
    continue;
  }

  let browser;
  try {
    browser = await engine.launch();
  } catch (err) {
    results[engineName] = { unavailable: `launch failed: ${err.message}` };
    continue;
  }

  const version = browser.version();
  const pieceResults = {};

  for (const slug of PIECES) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      pieceResults[slug] = await pieceWorks(page, `${BASE}/pieces/${slug}/`);
    } catch (err) {
      pieceResults[slug] = { rendered: false, animated: false, errors: [String(err)] };
    }
    await context.close();
  }

  // The gallery: cards present, and the features that use engine-specific APIs.
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const galleryErrors = [];
  page.on('pageerror', (e) => galleryErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) galleryErrors.push(m.text());
  });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  const cards = await page.locator('article.card').count();
  const chips = await page.locator('.chip').count();
  const hasHoverQuery = await page.evaluate(
    () => typeof window.matchMedia === 'function' && 'matches' in window.matchMedia('(hover: hover)')
  );
  const hasClipboard = await page.evaluate(() => !!(navigator.clipboard && navigator.clipboard.writeText));
  await context.close();

  await browser.close();
  results[engineName] = {
    version,
    pieces: pieceResults,
    gallery: { cards, chips, hasHoverQuery, hasClipboard, errors: galleryErrors },
  };
}

server.close();

// Print a summary a human can transcribe into the README.
for (const [engine, r] of Object.entries(results)) {
  if (r.unavailable) {
    console.log(`\n${engine}: UNAVAILABLE — ${r.unavailable}`);
    continue;
  }
  const ok = Object.values(r.pieces).filter((p) => p.rendered && p.animated && !p.errors.length).length;
  console.log(`\n${engine} ${r.version}`);
  console.log(`  pieces fully working: ${ok}/${PIECES.length}`);
  for (const [slug, p] of Object.entries(r.pieces)) {
    if (!p.rendered || !p.animated || p.errors.length) {
      console.log(`  ISSUE ${slug}: rendered=${p.rendered} animated=${p.animated} errors=${p.errors.join('; ')}`);
    }
  }
  console.log(`  gallery: ${r.gallery.cards} cards, ${r.gallery.chips} chips, hover-query=${r.gallery.hasHoverQuery}, clipboard=${r.gallery.hasClipboard}, errors=${r.gallery.errors.length}`);
}
