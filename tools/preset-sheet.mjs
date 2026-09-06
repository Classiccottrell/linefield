// tools/preset-sheet.mjs — renders one piece's presets side by side for
// curation review. Presets cannot be authored correctly by reasoning about
// numbers; this is the instrument for looking at them.
// Run: node tools/preset-sheet.mjs flow-field [/tmp/out.png]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DETERMINISTIC_INIT, stepFrames } from './deterministic.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

// Same threshold as tools/build.mjs: a blank/near-uniform frame — the piece
// failed to render, or a bad preset value threw mid-draw — sits near 0; any
// piece with actual line-art clears this by a wide margin.
const BLANK_VARIANCE_THRESHOLD = 4;

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

const slug = process.argv[2];
if (!slug) { console.error('usage: node tools/preset-sheet.mjs <slug> [outPath]'); process.exit(1); }
const out = process.argv[3] || `/tmp/preset-sheet-${slug}.png`;
const PORT = 7802;

const server = await serveRepo(PORT);
const browser = await chromium.launch();
let exitCode = 0;

// Every exit path — the no-presets branch, a thrown capture error, or a
// clean run — must close both the browser and the static server. Tasks 3
// and 4 run this against eleven pieces that declare no presets yet, so the
// no-presets branch is not a rare edge case; it is most runs.
try {
  const ctx0 = await browser.newContext({ viewport: { width: 640, height: 400 } });
  const probe = await ctx0.newPage();
  await probe.goto(`http://localhost:${PORT}/pieces/${slug}/`, { waitUntil: 'load' });
  // Saved settings outrank a piece's defaults; clear and reload before
  // reading so a prior run's persisted values can't shadow what this piece
  // declares.
  await probe.evaluate(() => localStorage.clear());
  await probe.reload({ waitUntil: 'load' });
  const names = await probe.evaluate(() => Object.keys(window.__LF_PRESETS__ || {}));
  await ctx0.close();

  if (!names.length) {
    console.error(`${slug} declares no presets`);
    exitCode = 1;
  } else {
    const shots = [];
    for (const name of names) {
      const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
      await ctx.addInitScript(DETERMINISTIC_INIT);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text());
      });

      await page.goto(`http://localhost:${PORT}/pieces/${slug}/?preset=${name}`, { waitUntil: 'load' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'load' });
      await stepFrames(page);
      await page.addStyleTag({ content: '[data-lf-panel] { visibility: hidden; }' });
      await page.waitForTimeout(80);

      // Same verification as tools/build.mjs: confirm the hide actually
      // took, rather than assuming it did. A renamed data attribute or a
      // specificity conflict on any of the eleven unseen pieces would
      // otherwise bake the panel into the judged image without failing.
      const panelStillVisible = await page.evaluate(() => {
        const el = document.querySelector('[data-lf-panel]');
        return el ? getComputedStyle(el).visibility !== 'hidden' : null;
      });
      if (panelStillVisible === null) {
        throw new Error(`${slug}/${name}: no [data-lf-panel] element found to hide before capture`);
      }
      if (panelStillVisible) {
        throw new Error(`${slug}/${name}: [data-lf-panel] is still visible at capture time`);
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
          `${slug}/${name}: canvas looks blank (pixel variance ${variance.toFixed(2)} < ${BLANK_VARIANCE_THRESHOLD}) — preset may not have rendered`
        );
      }

      if (errors.length) {
        throw new Error(`${slug}/${name} reported console errors:\n  ${errors.join('\n  ')}`);
      }

      shots.push({ name, buf: (await page.locator('#canvas').screenshot()).toString('base64') });
      await ctx.close();
    }

    // Compose the sheet in a page, so no image library is needed.
    const ctxS = await browser.newContext({ viewport: { width: 1360, height: 640 } });
    const sheet = await ctxS.newPage();
    await sheet.setContent(`<style>
  body{margin:0;background:#101014;font:11px ui-monospace,Menlo,monospace;color:#c8c8d2}
  h1{font:600 13px system-ui;margin:10px 12px;color:#e8e8ec}
  main{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 12px 12px}
  figure{margin:0}img{width:100%;display:block;border:1px solid #26262f}
  figcaption{padding:4px 2px;text-transform:uppercase;letter-spacing:.08em}
</style><h1>${slug} — presets</h1><main>${
      shots.map((s) => `<figure><img src="data:image/png;base64,${s.buf}"><figcaption>${s.name}</figcaption></figure>`).join('')
    }</main>`);
    await sheet.waitForTimeout(300);
    writeFileSync(out, await sheet.screenshot({ fullPage: true }));
    await ctxS.close();
    console.log(`  sheet: ${out} (${shots.length} presets)`);
  }
} finally {
  await browser.close();
  server.close();
}

process.exit(exitCode);
