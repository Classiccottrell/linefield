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

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, rmSync, utimesSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DETERMINISTIC_INIT, stepFrames } from './deterministic.mjs';
import { PRESET_NAMES } from '../shared/controls.js';
import { serveRepo } from './serve.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadManifest() {
  return JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
}

// Presentation-only grouping (ROADMAP Phase 3.4). pieces.json itself stays
// untouched — collections.json is a second manifest the gallery reads
// alongside it, ordered array = display order.
export function loadCollections() {
  return JSON.parse(readFileSync(join(ROOT, 'collections.json'), 'utf8'));
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
//   - `relay` — drifting nodes ...
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

  // Every piece must belong to exactly one collection, and collections.json
  // must never name a slug that doesn't exist — this fails loudly under
  // --verify-only, before a browser is ever launched, same tier as the
  // README/pieces.json agreement checks above.
  // null only when the file failed to load. An empty array still runs the
  // checks below, so `[]` flags every piece as unclaimed instead of
  // passing and building a gallery with no cards.
  let collections = null;
  try {
    collections = loadCollections();
  } catch (err) {
    errors.push(`collections.json is missing or invalid JSON: ${err.message}`);
  }
  if (collections) {
    const ownerOf = new Map(); // slug -> collection id that already claimed it
    for (const c of collections) {
      for (const slug of c.slugs) {
        if (!slugs.includes(slug)) {
          errors.push(`collections.json's "${c.id}" names "${slug}", which is not in pieces.json`);
          continue;
        }
        if (ownerOf.has(slug)) {
          errors.push(`"${slug}" is in two collections: "${ownerOf.get(slug)}" and "${c.id}"`);
        } else {
          ownerOf.set(slug, c.id);
        }
      }
    }
    for (const slug of slugs) {
      if (!ownerOf.has(slug)) {
        errors.push(`"${slug}" has no collection in collections.json`);
      }
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

// Several pieces build their look over many frames — infall's spiral arms
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

// Guards the thumbnail capture path. The lesson it encodes outlives the code
// that prompted it: a capture path without this check once shipped three
// black-tile images with every gate reporting green, because the check lived
// in the curation tool and the thumbnail path but not in the path that wrote
// what the gallery displayed. Any new capture path needs it too.
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

// Square stills pack (ROADMAP Phase 5.1): one square PNG per piece at its
// defaults, cropped from the center of the 1280x800 capture viewport
// (1280-800=480, so x=240 centers an 800x800 square). Reuses
// assertCanvasRendered — captureThumbnails duplicates that check inline
// instead of calling it (a pre-existing wart, out of scope here); this new
// path calls the real helper rather than adding a third copy.
export async function captureStills(browser, manifest, base) {
  // Start empty: a renamed or removed piece's old PNG must not survive in
  // stills/ or in the zip (`zip -r` adds to an existing archive, never
  // removes from it).
  rmSync(join(ROOT, 'stills'), { recursive: true, force: true });
  rmSync(join(ROOT, 'stills.zip'), { force: true });
  mkdirSync(join(ROOT, 'stills'), { recursive: true });
  for (const p of manifest) {
    await withPage(browser, `${base}/pieces/${p.slug}/`, async (page) => {
      await page.addStyleTag({ content: '[data-lf-panel] { visibility: hidden; }' });
      await page.waitForTimeout(100);
      await assertCanvasRendered(page, `${p.slug} still`);
      const buf = await page.screenshot({ clip: { x: 240, y: 0, width: 800, height: 800 } });
      return { commit: () => writeFileSync(join(ROOT, 'stills', `${p.slug}.png`), buf) };
    // scale: 1, not withPage's thumbnail-oriented 0.5 default — a real
    // 800x800 deliverable, not a thumbnail-resolution crop.
    }, { deterministic: true, scale: 1 });
    console.log(`  still: ${p.slug}`);
  }
  // One download: zip the stills directory. `zip` is a standard macOS/Linux/CI
  // CLI tool — no archiver dependency added for this. Committed (not built
  // on-demand) because GitHub Pages serves static files only.
  // Pinned mtimes and a sorted file list keep the zip byte-identical across
  // rebuilds when no still changed (CONTRIBUTING promises an unrelated
  // build is a no-op). ponytail: zip stores local-time stamps, so the bytes
  // match per timezone, which is enough since the build never runs in CI.
  const { execFileSync } = await import('node:child_process');
  const dir = join(ROOT, 'stills');
  const files = readdirSync(dir).sort();
  const epoch = new Date('2000-01-01T00:00:00Z');
  for (const f of files) utimesSync(join(dir, f), epoch, epoch);
  execFileSync('zip', ['-q', '-X', '../stills.zip', ...files], { cwd: dir, stdio: 'inherit' });
  console.log('  stills.zip');
}

// catalogue.md (ROADMAP Phase 5.2): one entry per piece, generated from
// pieces.json plus the live control list collectPresets() already pulled off
// window.__LF_SPECS__ — so it can't drift, and it's in our own words, not
// Filament's catalogue layout or wording.
export function generateCatalogue(manifest) {
  const lines = [
    '# Catalogue',
    '',
    'Generated by `tools/build.mjs` from `pieces.json` — do not hand-edit.',
    '',
  ];
  for (const p of manifest) {
    lines.push(`## ${p.title}`);
    lines.push('');
    lines.push(p.blurb);
    lines.push('');
    lines.push(`- **Tags:** ${p.tags.join(', ')}`);
    lines.push(`- **Text-safe zone:** ${p.safeZone}`);
    lines.push(`- **Anchor:** ${p.anchor}`);
    const controlNames = (p.controlSpecs || []).map((s) => s.label).join(', ');
    lines.push(`- **Controls:** ${controlNames}`);
    lines.push('');
  }
  writeFileSync(join(ROOT, 'catalogue.md'), lines.join('\n'));
  console.log(`  catalogue.md (${manifest.length} entries)`);
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
        // Full control set (shared + piece-specific), for catalogue.mjs —
        // __LF_SPECS__ already exists for shared/controls.js's own tests,
        // this just reads it rather than re-deriving it.
        specs: (window.__LF_SPECS__ || []).map((s) => ({ name: s.name, label: s.label })),
      }));
      if (!info.presets.length) throw new Error(`${p.slug}: declares no presets`);
      p.presets = info.presets;
      if (info.values) {
        p.actualDefaults = {
          hue: info.values.hue, hueB: info.values.hueB, saturation: info.values.saturation,
        };
      }
      p.controlSpecs = info.specs;
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

// Art-first card (ROADMAP Phase 3.1): the square thumbnail dominates, name
// plus one small mono collection label sit below it, and Open/Copy embed/
// Download live in an overlay revealed on hover/focus (CSS only — see
// tools/templates/gallery.html's .stage/.actions rules). `collectionTitle`
// is the human-readable label; `collectionId` drives the chip filter via
// data-collection, same attribute the filter script reads.
function cardHtml(p, collectionId, collectionTitle) {
  return `  <article class="card" data-collection="${escapeHtml(collectionId)}">
    <div class="stage">
      <a class="frame" href="pieces/${p.slug}/" data-src="pieces/${p.slug}/" aria-label="Open ${escapeHtml(p.title)}">
        <img src="thumbs/${p.slug}.png" alt="${escapeHtml(p.title)} preview" loading="lazy" width="300" height="300" />
      </a>
      <div class="actions">
        <a class="btn" href="pieces/${p.slug}/">Open</a>
        <button class="btn" type="button" data-embed="pieces/${p.slug}/">Copy embed</button>
        <a class="btn" href="downloads/${p.slug}.html" download>Download</a>
      </div>
    </div>
    <div class="meta">
      <h2 class="name">${escapeHtml(p.title)}</h2>
      <p class="collection-label">${escapeHtml(collectionTitle)}</p>
    </div>
  </article>`;
}

export function buildGallery(manifest) {
  const template = readFileSync(join(ROOT, 'tools', 'templates', 'gallery.html'), 'utf8');
  const collections = loadCollections();

  // Cards render grouped, in collections.json's own order — a full-width
  // heading per group, then that group's cards. verifyManifest() already
  // guarantees every manifest slug has exactly one collection and every
  // collection slug exists, so every piece lands in exactly one group here.
  const bySlug = new Map();
  for (const c of collections) for (const slug of c.slugs) bySlug.set(slug, c);
  const pieceById = new Map(manifest.map((p) => [p.slug, p]));
  const cardBlocks = [];
  for (const c of collections) {
    const pieces = c.slugs.map((slug) => pieceById.get(slug)).filter(Boolean);
    if (!pieces.length) continue;
    cardBlocks.push(`  <h3 class="group-head" data-collection="${escapeHtml(c.id)}">${escapeHtml(c.title)}</h3>`);
    cardBlocks.push(...pieces.map((p) => cardHtml(p, c.id, c.title)));
  }
  const cards = cardBlocks.join('\n');

  // Function replacers so a literal `$&`/`$'`/`` $` ``/`$$` in card markup or
  // JSON is never interpreted as a String.replace substitution pattern.
  // `<` is escaped to `<` (same fix as shared/export.js's bakeHtml) so
  // a title/blurb containing `</script>` can't close the injected script
  // element early.
  // actualDefaults and controlSpecs are build-internal scaffolding (the
  // latter only for generateCatalogue()); shipping either would publish
  // dead weight to every visitor. presets are wanted by the cards.
  const publicManifest = manifest.map(({ actualDefaults, controlSpecs, ...rest }) => ({ ...rest, collection: bySlug.get(rest.slug)?.id }));
  const pieceJson = JSON.stringify(publicManifest, null, 2).replace(/</g, '\\u003c');
  const collectionsJson = JSON.stringify(
    collections.map(({ id, title }) => ({ id, title })), null, 2
  ).replace(/</g, '\\u003c');
  const out = template
    .replace('<!--CARDS-->', () => cards)
    .replace('/*PIECES*/[]', () => pieceJson)
    .replace('/*COLLECTIONS*/[]', () => collectionsJson)
    .split('{{PIECE_COUNT}}').join(String(manifest.length));
  writeFileSync(join(ROOT, 'index.html'), out);
  console.log(`  gallery: index.html (${manifest.length} cards, ${collections.length} collections)`);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const manifest = verifyManifest();
  if (process.argv.includes('--verify-only')) process.exit(0);

  const { chromium } = await import('playwright');
  // LF_BUILD_PORT pins an explicit port (CI, or a human who wants a stable
  // URL); unset, the default 5799 is tried first and falls back to an
  // OS-assigned ephemeral port on collision (multiple agents sharing a
  // worktree — see docs/roadmap-history.md, Chunk 11).
  const pinned = process.env.LF_BUILD_PORT != null;
  const requestedPort = pinned ? Number(process.env.LF_BUILD_PORT) : 5799;
  const { server, port, base } = await serveRepo(ROOT, requestedPort, { pinned });
  console.log(`  serving ${ROOT} on ${base}${port !== requestedPort ? ` (${requestedPort} was in use)` : ''}`);
  const browser = await chromium.launch();
  try {
    console.log('Collecting presets...');
    await collectPresets(browser, manifest, base);
    verifyPresets(manifest);
    console.log('Capturing thumbnails...');
    await captureThumbnails(browser, manifest, base);
    console.log('Capturing stills...');
    await captureStills(browser, manifest, base);
    console.log('Baking downloads...');
    await captureDownloads(browser, manifest, base);
    console.log('Building gallery...');
    buildGallery(manifest);
    console.log('Writing catalogue...');
    generateCatalogue(manifest);
  } finally {
    await browser.close();
    server.close();
  }
  console.log('Done.');
}
