// tools/build.mjs
// Builds the linefield gallery from pieces.json.
//
// The pieces themselves have no dependencies and no build step — that is the
// product, and this script never rewrites them. This tooling exists for the
// microsite only: it reads the pieces and emits site artifacts.
//
// Usage:
//   node tools/build.mjs               verify, then generate everything
//   node tools/build.mjs --verify-only verify and stop

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadManifest() {
  return JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
}

// Pull the `defaults: { hue: N, hueB: N, saturation: N }` block out of a
// piece's source. Whitespace-tolerant; returns null if the piece has none.
export function readPieceDefaults(slug) {
  const src = readFileSync(join(ROOT, 'pieces', slug, 'index.html'), 'utf8');
  const m = src.match(
    /defaults:\s*\{\s*hue:\s*(-?[\d.]+)\s*,\s*hueB:\s*(-?[\d.]+)\s*,\s*saturation:\s*([\d.]+)\s*\}/
  );
  if (!m) return null;
  return { hue: Number(m[1]), hueB: Number(m[2]), saturation: Number(m[3]) };
}

// Slugs the README's Pieces list claims, from lines like:
//   - `synapse` — drifting nodes ...
export function readReadmeSlugs() {
  const src = readFileSync(join(ROOT, 'README.md'), 'utf8');
  return [...src.matchAll(/^- `([a-z0-9-]+)`/gm)].map((m) => m[1]);
}

export function verifyManifest() {
  const manifest = loadManifest();
  const errors = [];

  // `_template` is a scaffold for forking, not a piece — it is excluded here
  // deliberately, even though it carries its own defaults block.
  const dirs = readdirSync(join(ROOT, 'pieces'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .sort();

  const slugs = manifest.map((p) => p.slug).sort();

  for (const slug of dirs) {
    if (!slugs.includes(slug)) {
      errors.push(`pieces/${slug}/ exists but is missing from pieces.json`);
    }
  }
  for (const slug of slugs) {
    if (!dirs.includes(slug)) {
      errors.push(`pieces.json lists "${slug}" but pieces/${slug}/ does not exist`);
    }
  }

  for (const p of manifest) {
    if (!dirs.includes(p.slug)) continue;
    const actual = readPieceDefaults(p.slug);
    if (!actual) {
      errors.push(`pieces/${p.slug}/index.html has no defaults block`);
      continue;
    }
    for (const key of ['hue', 'hueB', 'saturation']) {
      if (actual[key] !== p[key]) {
        errors.push(
          `${p.slug}: manifest ${key}=${p[key]} but the piece ships ${key}=${actual[key]}`
        );
      }
    }
    if (!Array.isArray(p.tags) || p.tags.length === 0) {
      errors.push(`${p.slug}: manifest has no tags`);
    }
    if (!p.title || !p.blurb) {
      errors.push(`${p.slug}: manifest is missing a title or blurb`);
    }
  }

  const readme = readReadmeSlugs().sort();
  for (const slug of slugs) {
    if (!readme.includes(slug)) {
      errors.push(`README.md's Pieces list is missing "${slug}"`);
    }
  }
  for (const slug of readme) {
    if (!slugs.includes(slug)) {
      errors.push(`README.md lists "${slug}", which is not in pieces.json`);
    }
  }

  if (errors.length) {
    console.error(`\nManifest verification failed (${errors.length}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nFix pieces.json, the piece, or the README so they agree.\n');
    process.exit(1);
  }

  console.log(`Verified ${manifest.length} pieces against pieces/ and README.md.`);
  return manifest;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// A minimal static server so the build never depends on an external one.
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

// Several pieces build their look over many frames — accretion's spiral arms
// and flow-field's ribbons are trail-accumulated — so a first-frame capture
// misrepresents them. Wait long enough for the image to establish.
const SETTLE_MS = 4000;

async function withPage(browser, url, fn) {
  // Backgrounded tabs throttle requestAnimationFrame, which starves the
  // trail-accumulating pieces. Each page gets its own context and is the
  // active page in it, so nothing is ever backgrounded.
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Halves the raster of every screenshot (thumbs and downloads share this
    // context factory) without touching the CSS viewport the pieces lay
    // their composition out against.
    deviceScaleFactor: 0.5,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text());
  });
  await page.goto(url, { waitUntil: 'load' });
  // Stale saved values outrank a piece's defaults, so clear and reload.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(SETTLE_MS);
  const result = await fn(page);
  if (errors.length) {
    throw new Error(`${url} reported console errors:\n  ${errors.join('\n  ')}`);
  }
  await context.close();
  return result;
}

export async function captureThumbnails(browser, manifest, base) {
  mkdirSync(join(ROOT, 'thumbs'), { recursive: true });
  for (const p of manifest) {
    await withPage(browser, `${base}/pieces/${p.slug}/`, async (page) => {
      // The controls panel and export row are fixed-position chrome painted
      // on top of the full-viewport canvas, so an element screenshot of
      // #canvas still composites them in. Hide via visibility (not
      // display:none) so no layout/resize event fires and the
      // trail-accumulated image on canvas survives untouched.
      await page.addStyleTag({ content: '[data-lf-panel] { visibility: hidden; }' });
      await page.waitForTimeout(100);
      const buf = await page.locator('#canvas').screenshot();
      writeFileSync(join(ROOT, 'thumbs', `${p.slug}.png`), buf);
    });
    console.log(`  thumb: ${p.slug}`);
  }
}

export async function captureDownloads(browser, manifest, base) {
  mkdirSync(join(ROOT, 'downloads'), { recursive: true });
  for (const p of manifest) {
    await withPage(browser, `${base}/pieces/${p.slug}/`, async (page) => {
      // Click the piece's OWN bake button and keep what it produces, so the
      // download can never drift from the in-piece export.
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('#btn-baked'),
      ]);
      await download.saveAs(join(ROOT, 'downloads', `${p.slug}.html`));
    });
    console.log(`  download: ${p.slug}`);
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cardHtml(p) {
  const accent = `hsl(${p.hue} ${Math.round(p.saturation * 100)}% 60%)`;
  const accentB = `hsl(${p.hueB} ${Math.round(p.saturation * 100)}% 60%)`;
  const tags = p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  return `  <article class="card" data-tags="${escapeHtml(p.tags.join(' '))}" style="--accent:${accent}">
    <a class="frame" href="pieces/${p.slug}/" data-src="pieces/${p.slug}/" aria-label="Open ${escapeHtml(p.title)}">
      <img src="thumbs/${p.slug}.png" alt="${escapeHtml(p.title)} preview" loading="lazy" width="640" height="400" />
    </a>
    <div class="meta">
      <h2 class="name">
        <span class="swatch" style="background:linear-gradient(90deg,${accent},${accentB})"></span>
        ${escapeHtml(p.title)}
      </h2>
      <p class="blurb">${escapeHtml(p.blurb)}</p>
      <div class="tags">${tags}</div>
      <div class="actions">
        <a class="btn" href="pieces/${p.slug}/">Open</a>
        <button class="btn" type="button" data-embed="pieces/${p.slug}/">Copy embed</button>
        <a class="btn" href="downloads/${p.slug}.html" download>Download</a>
      </div>
      <p class="note">Download ships this piece's default settings. Baking from inside the piece captures your own.</p>
    </div>
  </article>`;
}

export function buildGallery(manifest) {
  const template = readFileSync(join(ROOT, 'tools', 'templates', 'gallery.html'), 'utf8');
  const cards = manifest.map(cardHtml).join('\n');
  const out = template
    .replace('<!--CARDS-->', cards)
    .replace('/*PIECES*/[]', JSON.stringify(manifest, null, 2));
  writeFileSync(join(ROOT, 'index.html'), out);
  console.log(`  gallery: index.html (${manifest.length} cards)`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const manifest = verifyManifest();
  if (process.argv.includes('--verify-only')) process.exit(0);

  const { chromium } = await import('playwright');
  const PORT = 5799;
  const base = `http://localhost:${PORT}`;
  const server = await serveRepo(PORT);
  const browser = await chromium.launch();
  try {
    console.log('Capturing thumbnails...');
    await captureThumbnails(browser, manifest, base);
    console.log('Baking downloads...');
    await captureDownloads(browser, manifest, base);
    console.log('Building gallery...');
    buildGallery(manifest);
  } finally {
    await browser.close();
    server.close();
  }
  console.log('Done.');
}
