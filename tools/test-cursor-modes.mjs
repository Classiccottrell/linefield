// tools/test-cursor-modes.mjs — every mode must do something, on every piece.
// Run: node tools/test-cursor-modes.mjs [slug]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DETERMINISTIC_INIT, stepFrames } from './deterministic.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const PORT = 7841;

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

const MODES = ['Grow', 'Shrink', 'Particle Trail', 'Ripples', 'Attract', 'Vortex'];
const slugs = process.argv[2]
  ? [process.argv[2]]
  : readdirSync(join(ROOT, 'pieces'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_template').map((d) => d.name).sort();

const server = await serveRepo(PORT);
const browser = await chromium.launch();
const failures = [];

// Sample the canvas the same way audit-controls does.
async function sample(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#canvas');
    const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    const out = [];
    for (let i = 0; i < data.length; i += 4 * 37) out.push(data[i], data[i + 1], data[i + 2]);
    return out;
  });
}
const diffPct = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 6) n++;
  return (n / a.length) * 100;
};

// Render one configuration deterministically, with the cursor parked at a
// fixed canvas position so runs are reproducible.
async function render(slug, mode, pointerVal) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5 });
  await ctx.addInitScript(DETERMINISTIC_INIT);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/pieces/${slug}/`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(({ mode, pointerVal }) => {
    window.__LF_PANEL__.setValue('cursorInteraction', mode);
    window.__LF_PANEL__.setValue('pointer', pointerVal);
    const c = document.querySelector('#canvas');
    const r = c.getBoundingClientRect();
    c.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    c.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, clientX: r.left + r.width * 0.35, clientY: r.top + r.height * 0.4,
    }));
  }, { mode, pointerVal });
  await stepFrames(page);
  const s = await sample(page);
  await ctx.close();
  return s;
}

for (const slug of slugs) {
  const none = await render(slug, 'None', 1);
  const off = await render(slug, 'Grow', 0);
  if (diffPct(none, off) > 0) failures.push(`${slug}: mode with pointer=0 differs from None — not inert`);
  const seen = {};
  for (const mode of MODES) {
    const s = await render(slug, mode, 1);
    const d = diffPct(none, s);
    if (d < 0.05) failures.push(`${slug}/${mode}: inert (${d.toFixed(3)}% vs None)`);
    seen[mode] = s;
    console.log(`  ${slug.padEnd(18)} ${mode.padEnd(15)} ${d.toFixed(3)}%`);
  }
  // Two modes that render identically are one mode with two names.
  for (let i = 0; i < MODES.length; i++) {
    for (let j = i + 1; j < MODES.length; j++) {
      const d = diffPct(seen[MODES[i]], seen[MODES[j]]);
      if (d < 0.05) failures.push(`${slug}: ${MODES[i]} and ${MODES[j]} render identically (${d.toFixed(3)}%)`);
    }
  }
}

await browser.close();
server.close();
if (failures.length) {
  console.error('\ncursor mode failures:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log('\nevery mode is live and distinct on every piece');
