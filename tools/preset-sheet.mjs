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

const shots = [];
const ctx0 = await browser.newContext({ viewport: { width: 640, height: 400 } });
const probe = await ctx0.newPage();
await probe.goto(`http://localhost:${PORT}/pieces/${slug}/`, { waitUntil: 'load' });
// Saved settings outrank a piece's defaults; clear and reload before reading
// so a prior run's persisted values can't shadow what this piece declares.
await probe.evaluate(() => localStorage.clear());
await probe.reload({ waitUntil: 'load' });
const names = await probe.evaluate(() => Object.keys(window.__LF_PRESETS__ || {}));
await ctx0.close();
if (!names.length) { console.error(`${slug} declares no presets`); process.exit(1); }

for (const name of names) {
  const ctx = await browser.newContext({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(DETERMINISTIC_INIT);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/pieces/${slug}/?preset=${name}`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await stepFrames(page);
  await page.addStyleTag({ content: '[data-lf-panel] { visibility: hidden; }' });
  await page.waitForTimeout(80);
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
await browser.close();
server.close();
console.log(`  sheet: ${out} (${shots.length} presets)`);
