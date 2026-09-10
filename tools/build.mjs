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
import { DETERMINISTIC_INIT, stepFrames } from './deterministic.mjs';
import { PRESET_NAMES } from '../shared/controls.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadManifest() {
  return JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
}

// Pull the `defaults: { hue: N, hueB: N, saturation: N, ... }` block out of a
// piece's source. Whitespace-tolerant; returns null if the piece has none.
// Locked to hue/hueB/saturation appearing FIRST and in that exact order —
// same as before — but no longer requires them to be the only keys: the
// colour-picker fields (colorMode/colorA/colorB) that now follow are hidden
// implementation values these hue/hueB numbers still drive exactly, so the
// block ends in `,` (more keys follow) or `}` (old three-key shape) either way.
export function readPieceDefaults(slug) {
  const src = readFileSync(join(ROOT, 'pieces', slug, 'index.html'), 'utf8');
  const m = src.match(
    /defaults:\s*\{\s*hue:\s*(-?[\d.]+)\s*,\s*hueB:\s*(-?[\d.]+)\s*,\s*saturation:\s*([\d.]+)\s*[,}]/
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
    // Page-derived when available; the regex is the fallback for
    // --verify-only, which exits before a browser is launched.
    const actual = p.actualDefaults || readPieceDefaults(p.slug);
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

// `render` returns either a plain result, or `{ result, commit }` where
// `commit` performs the actual filesystem write. When given, the write is
// deferred until AFTER the console-error check below, so a piece that logs
// an error never leaves a corrupt/partial file on disk. Either way the
// context is always closed, including on the error path.
async function withPage(browser, url, render, { deterministic = false, scale = 0.5 } = {}) {
  // Backgrounded tabs throttle requestAnimationFrame, which starves the
  // trail-accumulating pieces. Each page gets its own context and is the
  // active page in it, so nothing is ever backgrounded.
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Scales the raster of every screenshot without touching the CSS viewport
    // the pieces lay their composition out against. 0.5 gives the 640x400
    // thumbnails; swatches pass 0.1875 for 240x150, since sixty of them at
    // full thumbnail size would add ~7MB of committed artifacts.
    deviceScaleFactor: scale,
    acceptDownloads: true,
  });
  // Freezes Math.random and the rAF clock (see tools/deterministic.mjs) so
  // repeated captures of an unchanged piece are byte-identical instead of
  // landing on an arbitrary animation frame — this is capture-only and never
  // touches the piece files themselves. addInitScript re-runs on the reload
  // below, so the seed/clock reset with it.
  if (deterministic) await context.addInitScript(DETERMINISTIC_INIT);
  try {
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
    if (deterministic) await stepFrames(page);
    else await page.waitForTimeout(SETTLE_MS);
    const out = await render(page);
    if (errors.length) {
      throw new Error(`${url} reported console errors:\n  ${errors.join('\n  ')}`);
    }
    if (out && typeof out === 'object' && typeof out.commit === 'function') {
      await out.commit();
      return out.result;
    }
    return out;
  } finally {
    await context.close();
  }
}

// Minimum luminance variance (0-255 scale, squared) a sampled canvas must
// show to count as "rendered". A blank/near-uniform frame — the piece
// failed to render, or the settle wait was too short — sits near 0; any
// piece with actual line-art clears this by a wide margin.
const BLANK_VARIANCE_THRESHOLD = 4;

// Shared by both capture paths. captureSwatches originally lacked this, which
// is how three black-tile swatches shipped with every gate green: the check
// lived in the thumbnail path and in the curation tool, but not in the path
// that writes what the gallery actually displays.
async function assertCanvasRendered(page, label) {
  const variance = await page.evaluate(() => {
    const canvas = document.querySelector('#canvas');
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0, sumSq = 0, n = 0;
    for (let i = 0; i < data.length; i += 4 * 37) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += lum; sumSq += lum * lum; n++;
    }
    const mean = sum / n;
    return sumSq / n - mean * mean;
  });
  if (variance < BLANK_VARIANCE_THRESHOLD) {
    throw new Error(`${label}: canvas looks blank (pixel variance ${variance.toFixed(2)} < ${BLANK_VARIANCE_THRESHOLD})`);
  }
  return variance;
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

      const panelStillVisible = await page.evaluate(() => {
        const el = document.querySelector('[data-lf-panel]');
        return el ? getComputedStyle(el).visibility !== 'hidden' : null;
      });
      if (panelStillVisible === null) {
        throw new Error(`${p.slug}: no [data-lf-panel] element found to hide before capture`);
      }
      if (panelStillVisible) {
        throw new Error(`${p.slug}: [data-lf-panel] is still visible at capture time`);
      }

      const variance = await page.evaluate(() => {
        const canvas = document.querySelector('#canvas');
        const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0, sumSq = 0, n = 0;
        for (let i = 0; i < data.length; i += 4 * 37) {
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
          sum += lum; sumSq += lum * lum; n++;
        }
        const mean = sum / n;
        return sumSq / n - mean * mean;
      });
      if (variance < BLANK_VARIANCE_THRESHOLD) {
        throw new Error(
          `${p.slug}: thumbnail canvas looks blank (pixel variance ${variance.toFixed(2)} < ${BLANK_VARIANCE_THRESHOLD}) — piece may not have rendered or settle wait was too short`
        );
      }

      const buf = await page.locator('#canvas').screenshot();
      return { commit: () => writeFileSync(join(ROOT, 'thumbs', `${p.slug}.png`), buf) };
    }, { deterministic: true });
    console.log(`  thumb: ${p.slug}`);
  }
}

// Read each piece's declared presets and its live default palette off the
// running page. Deliberately NOT parsed out of the HTML: readPieceDefaults is
// a regex locked to key order, ROADMAP records it as a known fragility, and
// extending that to sixty nested preset objects would multiply a problem the
// project already documented. A hand-maintained list that must stay in sync is
// a silent-failure surface, so derive it from the source.
export async function collectPresets(browser, manifest, base) {
  for (const p of manifest) {
    await withPage(browser, `${base}/pieces/${p.slug}/`, async (page) => {
      const info = await page.evaluate(() => ({
        presets: Object.keys(window.__LF_PRESETS__ || {}),
        values: window.__LF_VALUES__ ? { ...window.__LF_VALUES__ } : null,
      }));
      if (!info.presets.length) throw new Error(`${p.slug}: declares no presets`);
      p.presets = info.presets;
      if (info.values) {
        p.actualDefaults = {
          hue: info.values.hue, hueB: info.values.hueB, saturation: info.values.saturation,
        };
      }
      return null;
    });
  }
}

// verifyManifest() runs before a browser exists, so it cannot see page-derived
// data. This is the second gate, run once collectPresets has populated it.
export function verifyPresets(manifest) {
  const errors = [];
  for (const p of manifest) {
    const names = p.presets || [];
    const missing = PRESET_NAMES.filter((n) => !names.includes(n));
    const extra = names.filter((n) => !PRESET_NAMES.includes(n));
    if (missing.length) errors.push(`${p.slug}: missing presets ${missing.join(', ')}`);
    if (extra.length) errors.push(`${p.slug}: unknown presets ${extra.join(', ')}`);
    if (p.actualDefaults) {
      for (const key of ['hue', 'hueB', 'saturation']) {
        if (p.actualDefaults[key] !== p[key]) {
          errors.push(`${p.slug}: manifest ${key}=${p[key]} but the running piece has ${key}=${p.actualDefaults[key]}`);
        }
      }
    }
  }
  if (errors.length) {
    console.error('Preset verification failed:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  console.log(`  presets: ${manifest.length} pieces x ${PRESET_NAMES.length} verified`);
}

// One swatch per preset. Each gets its own deterministic context rather than
// clicking chips in a long-lived page: applying a preset mid-animation would
// capture a transition, and trail-accumulating pieces would still carry ink
// drawn at the previous settings.
export async function captureSwatches(browser, manifest, base) {
  mkdirSync(join(ROOT, 'thumbs'), { recursive: true });
  for (const p of manifest) {
    for (const name of p.presets || []) {
      await withPage(browser, `${base}/pieces/${p.slug}/?preset=${encodeURIComponent(name)}`, async (page) => {
        await page.addStyleTag({ content: '[data-lf-panel] { visibility: hidden; }' });
        await page.waitForTimeout(100);
        const stillVisible = await page.evaluate(() => {
          const el = document.querySelector('[data-lf-panel]');
          return el ? getComputedStyle(el).visibility !== 'hidden' : null;
        });
        if (stillVisible === null) throw new Error(`${p.slug}/${name}: no [data-lf-panel] found to hide before capture`);
        if (stillVisible) throw new Error(`${p.slug}/${name}: [data-lf-panel] still visible at capture time`);
        await assertCanvasRendered(page, `${p.slug}/${name}`);
        const buf = await page.locator('#canvas').screenshot();
        return {
          result: null,
          commit: () => {
            writeFileSync(join(ROOT, 'thumbs', `${p.slug}.${name}.png`), buf);
            console.log(`  swatch: ${p.slug}.${name}`);
          },
        };
      }, { deterministic: true, scale: 0.1875 });
    }
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
      return { commit: () => download.saveAs(join(ROOT, 'downloads', `${p.slug}.html`)) };
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
  // Swatches are links, not a hover-cycle: the card's main frame already swaps
  // to a live preview on hover, and cycling here would fight it.
  const presetStrip = (p.presets || []).map((name) =>
    `<a class="pre" href="pieces/${p.slug}/?preset=${encodeURIComponent(name)}" title="${escapeHtml(p.title)} \u2014 ${escapeHtml(name)}">
        <img src="thumbs/${p.slug}.${encodeURIComponent(name)}.png" alt="" loading="lazy" width="240" height="150" />
        <span>${escapeHtml(name)}</span>
      </a>`).join('');
  return `  <article class="card" data-tags="${escapeHtml(p.tags.join(' '))}" style="--accent:${accent}">
    <a class="frame" href="pieces/${p.slug}/" data-src="pieces/${p.slug}/" aria-label="Open ${escapeHtml(p.title)}">
      <img src="thumbs/${p.slug}.png" alt="${escapeHtml(p.title)} preview" loading="lazy" width="240" height="150" />
    </a>
    <div class="meta">
      <h2 class="name">
        <span class="swatch" style="background:linear-gradient(90deg,${accent},${accentB})"></span>
        ${escapeHtml(p.title)}
      </h2>
      <p class="blurb">${escapeHtml(p.blurb)}</p>
      <div class="tags">${tags}</div>
      <div class="presets">${presetStrip}</div>
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
  // Function replacers so a literal `$&`/`$'`/`` $` ``/`$$` in card markup or
  // JSON is never interpreted as a String.replace substitution pattern.
  // `<` is escaped to `<` (same fix as shared/export.js's bakeHtml) so
  // a title/blurb containing `</script>` can't close the injected script
  // element early.
  // actualDefaults is build-internal scaffolding; shipping it would publish
  // it to every visitor. presets are wanted by the cards.
  const publicManifest = manifest.map(({ actualDefaults, ...rest }) => rest);
  const pieceJson = JSON.stringify(publicManifest, null, 2).replace(/</g, '\\u003c');
  const out = template
    .replace('<!--CARDS-->', () => cards)
    .replace('/*PIECES*/[]', () => pieceJson);
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
    console.log('Collecting presets...');
    await collectPresets(browser, manifest, base);
    verifyPresets(manifest);
    console.log('Capturing thumbnails...');
    await captureThumbnails(browser, manifest, base);
    console.log('Capturing preset swatches...');
    await captureSwatches(browser, manifest, base);
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
