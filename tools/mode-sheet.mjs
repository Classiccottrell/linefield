// tools/mode-sheet.mjs — renders cursor-mode evidence for the Task 5
// collection review: does the same named mode read as the same idea across
// pieces that mechanically implement it differently (per-mark scaling vs.
// single-path deflection)? No automated gate can answer that; this is the
// instrument for looking at it. Writes outside the repo — a review
// instrument, not a build artifact.
//
// Two artifacts per mode:
//   <mode>-full.png    all 12 pieces, full 1280x800 frame, 3-column grid —
//                       answers "does this mode wreck the composition?"
//   <mode>-pairs-1.png  6 pieces, None vs. mode, 420x420 crop centred on the
//   <mode>-pairs-2.png  parked cursor, at 1:1 — answers "is the effect even
//                       visible?" A full-frame tile squeezed into a grid
//                       column can hide a local effect entirely; cropping to
//                       where the effect lives is what makes it judgeable.
//
// Run: node tools/mode-sheet.mjs [outDir]   (default /tmp/mode-sheets)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DETERMINISTIC_INIT, stepFrames, FRAME_MS, STEPS } from './deterministic.mjs';
import { CURSOR_MODES } from '../shared/cursor-modes.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const PORT = 7803;
const OUT_DIR = process.argv[2] || '/tmp/mode-sheets';

// Same viewport the build ships. preset-sheet.mjs once rendered at 640x400
// while the build shipped 1280x800 and every preset was judged against
// images roughly four times denser than reality — never repeat that.
const VIEWPORT = { width: 1280, height: 800 };

// Consistent canvas-relative park position, so tiles are comparable across
// pieces and across sheets.
const PARK_FX = 0.35, PARK_FY = 0.4;
const PARK_X = Math.round(VIEWPORT.width * PARK_FX);
const PARK_Y = Math.round(VIEWPORT.height * PARK_FY);

// 420x420 centred on the parked cursor, at 1:1 — big enough to show a
// local effect's full falloff radius on the sparsest pieces, small enough
// that a six-row sheet stays a viewable size.
const CROP_SIZE = 420;
const CROP = {
  x: PARK_X - CROP_SIZE / 2,
  y: PARK_Y - CROP_SIZE / 2,
  width: CROP_SIZE,
  height: CROP_SIZE,
};

// Same threshold as tools/build.mjs and tools/preset-sheet.mjs.
const BLANK_VARIANCE_THRESHOLD = 4;

// 3 columns so all twelve full-frame tiles fit in one frame at a normal
// zoom level — the review question is explicitly cross-piece (does Grow on
// rainfall read as Grow on meridian), which a 1-tile-per-row sheet would
// bury nine screens of scrolling apart. Still native pixel size, no
// display downscale — 3 columns is a layout choice, not a downscale.
const COLS = 3;

// Pairs sheets split into two of six: twelve rows of 420x420-pair tiles
// would be enormous again, and the fix for "too big to judge" is fewer
// rows, not smaller tiles.
const PAIR_SPLIT = 6;

const slugs = readdirSync(join(ROOT, 'pieces'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== '_template').map((d) => d.name).sort();

function serveRepo(port) {
  const server = createServer((req, res) => {
    let p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

// Renders one piece under one mode and returns both a full-frame capture
// and a 1:1 crop around the parked cursor. Same settle + interleaved
// cursor-drive sequence regardless of mode (including 'None'), so a
// None-vs-mode pair differs ONLY in cursorInteraction — same seed, same
// frame count, same cursor position.
async function renderTile(browser, slug, mode) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await ctx.addInitScript(DETERMINISTIC_INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text());
  });

  await page.goto(`http://localhost:${PORT}/pieces/${slug}/`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });

  // Let the piece's own animation establish before the cursor arrives —
  // trail-accumulated pieces (accretion, flow-field) look unrepresentative
  // on frame one. Same settle length build.mjs and test-cursor-modes use.
  await stepFrames(page);

  // Drive the cursor the way a real pointer would: one pointermove
  // interleaved with one frame step, repeated, so the deterministic clock
  // actually advances between moves. A synchronous burst of moves against a
  // frozen clock (no steps between them) collapses Particle Trail/Ripples to
  // a single mark and tells you nothing about how the mode reads.
  await page.evaluate(
    ({ mode, parkFx, parkFy, iters, frameMs }) => {
      window.__LF_PANEL__.setValue('cursorInteraction', mode);
      window.__LF_PANEL__.setValue('pointer', 1); // middle of the range, not max
      const c = document.querySelector('#canvas');
      const r = c.getBoundingClientRect();
      const clientX = r.left + r.width * parkFx;
      const clientY = r.top + r.height * parkFy;
      c.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      for (let i = 0; i < iters; i++) {
        c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY }));
        window.__step(frameMs);
      }
    },
    { mode, parkFx: PARK_FX, parkFy: PARK_FY, iters: STEPS, frameMs: FRAME_MS }
  );

  await page.addStyleTag({ content: '[data-lf-panel] { visibility: hidden; }' });
  await page.waitForTimeout(80);

  // Same verification as tools/build.mjs: confirm the hide actually took.
  const panelStillVisible = await page.evaluate(() => {
    const el = document.querySelector('[data-lf-panel]');
    return el ? getComputedStyle(el).visibility !== 'hidden' : null;
  });
  if (panelStillVisible === null) {
    throw new Error(`${slug}/${mode}: no [data-lf-panel] element found to hide before capture`);
  }
  if (panelStillVisible) {
    throw new Error(`${slug}/${mode}: [data-lf-panel] is still visible at capture time`);
  }
  if (errors.length) {
    throw new Error(`${slug}/${mode} reported console errors:\n  ${errors.join('\n  ')}`);
  }

  // Same guard tools/build.mjs and tools/preset-sheet.mjs use: any new
  // capture path needs it, and it's exactly the check that would make a
  // blank/misrendered tile self-detecting instead of silently shipping in
  // the sheet the judge reviews.
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
      `${slug}/${mode}: canvas looks blank (pixel variance ${variance.toFixed(2)} < ${BLANK_VARIANCE_THRESHOLD})`
    );
  }

  const full = (await page.locator('#canvas').screenshot()).toString('base64');
  // The canvas fills the viewport at (0,0) (`canvas{width:100vw;height:100vh}`
  // in every piece), so a page-level clip IS a canvas-relative crop.
  const crop = (await page.screenshot({ clip: CROP })).toString('base64');
  await ctx.close();
  return { full, crop };
}

function figureHtml(b64, w, h, caption) {
  return `<figure><img src="data:image/png;base64,${b64}" style="width:${w}px;height:${h}px">${
    caption ? `<figcaption>${caption}</figcaption>` : ''
  }</figure>`;
}

async function renderFullSheet(browser, mode, tiles, outPath) {
  const sheetW = VIEWPORT.width * COLS + 80;
  const ctxS = await browser.newContext({ viewport: { width: sheetW, height: 900 } });
  const sheet = await ctxS.newPage();
  await sheet.setContent(`<!doctype html><html><head><style>
  body{margin:0;background:#101014;font:12px ui-monospace,Menlo,monospace;color:#c8c8d2}
  h1{font:600 15px system-ui;margin:14px 20px 2px;color:#e8e8ec}
  p.meta{margin:0 20px 14px;color:#8a8a96}
  main{display:grid;grid-template-columns:repeat(${COLS},${VIEWPORT.width}px);gap:20px;padding:0 20px 20px}
  figure{margin:0}
  img{display:block;border:1px solid #26262f}
  figcaption{padding:6px 2px;text-transform:uppercase;letter-spacing:.08em;font-size:12px}
</style></head><body>
  <h1>cursor mode — ${mode} — full frame</h1>
  <p class="meta">1280x800 native, deviceScaleFactor 1 — pointer=1, parked at (${PARK_FX}, ${PARK_FY}) of canvas — ${tiles.length} pieces — does this mode wreck the composition?</p>
  <main>${tiles.map((t) => figureHtml(t.full, VIEWPORT.width, VIEWPORT.height, t.slug)).join('\n    ')}</main>
</body></html>`);
  await sheet.waitForTimeout(300);
  writeFileSync(outPath, await sheet.screenshot({ fullPage: true }));
  await ctxS.close();
}

// One row per piece: None crop | mode crop, side by side, column-headed.
// Answers "is the effect visible at all", which a full-frame tile can hide.
async function renderPairsSheet(browser, mode, rows, outPath, part, totalParts) {
  const sheetW = CROP_SIZE * 2 + 100;
  const ctxS = await browser.newContext({ viewport: { width: sheetW, height: 900 } });
  const sheet = await ctxS.newPage();
  await sheet.setContent(`<!doctype html><html><head><style>
  body{margin:0;background:#101014;font:12px ui-monospace,Menlo,monospace;color:#c8c8d2}
  h1{font:600 15px system-ui;margin:14px 20px 2px;color:#e8e8ec}
  p.meta{margin:0 20px 14px;color:#8a8a96}
  .row{padding:0 20px 22px}
  .row .piece{text-transform:uppercase;letter-spacing:.08em;font-size:12px;margin-bottom:6px;color:#e8e8ec}
  .pair{display:grid;grid-template-columns:repeat(2,${CROP_SIZE}px);gap:20px}
  figure{margin:0}
  img{display:block;border:1px solid #26262f}
  figcaption{padding:6px 2px;text-transform:uppercase;letter-spacing:.08em;font-size:11px;color:#8a8a96}
</style></head><body>
  <h1>cursor mode — ${mode} — paired crops (${part}/${totalParts})</h1>
  <p class="meta">${CROP_SIZE}x${CROP_SIZE} native crop centred on the parked cursor (${PARK_FX}, ${PARK_FY}) — left: None, right: ${mode}, pointer=1 — same seed/frame count, mode is the only difference</p>
  ${rows.map((r) => `<div class="row"><div class="piece">${r.slug}</div><div class="pair">${
    figureHtml(r.none.crop, CROP_SIZE, CROP_SIZE, 'None')
  }${figureHtml(r.mode.crop, CROP_SIZE, CROP_SIZE, mode)}</div></div>`).join('\n  ')}
</body></html>`);
  await sheet.waitForTimeout(300);
  writeFileSync(outPath, await sheet.screenshot({ fullPage: true }));
  await ctxS.close();
}

const server = await serveRepo(PORT);
const browser = await chromium.launch();
let exitCode = 0;

try {
  mkdirSync(OUT_DIR, { recursive: true });
  const written = [];

  // Single render pass: data[mode][slug] = { full, crop }. Built once,
  // reused for both artifacts — no piece/mode combination is rendered twice.
  const data = {};
  for (const mode of CURSOR_MODES) {
    console.log(`rendering ${mode}...`);
    data[mode] = {};
    for (const slug of slugs) {
      data[mode][slug] = await renderTile(browser, slug, mode);
      console.log(`  ${slug}`);
    }
  }

  for (const mode of CURSOR_MODES) {
    const key = mode.toLowerCase().replace(/\s+/g, '-');
    const tiles = slugs.map((slug) => ({ slug, full: data[mode][slug].full }));
    const outFull = join(OUT_DIR, `${key}-full.png`);
    await renderFullSheet(browser, mode, tiles, outFull);
    written.push(outFull);
    console.log(`  sheet: ${outFull}`);

    if (mode === 'None') continue; // None has no baseline to pair against itself

    const halves = [slugs.slice(0, PAIR_SPLIT), slugs.slice(PAIR_SPLIT)];
    for (let i = 0; i < halves.length; i++) {
      const rows = halves[i].map((slug) => ({ slug, none: data.None[slug], mode: data[mode][slug] }));
      const outPairs = join(OUT_DIR, `${key}-pairs-${i + 1}.png`);
      await renderPairsSheet(browser, mode, rows, outPairs, i + 1, halves.length);
      written.push(outPairs);
      console.log(`  sheet: ${outPairs}`);
    }
  }

  console.log(`\n${written.length} sheets written to ${OUT_DIR}`);
} catch (err) {
  console.error(err.message || err);
  exitCode = 1;
} finally {
  await browser.close();
  server.close();
}

process.exit(exitCode);
