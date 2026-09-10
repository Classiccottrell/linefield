// tools/test-baked.mjs — every baked download must render standalone.
// Run: node tools/test-baked.mjs
// This is the check that would have caught project.js being missing from the
// bake list, which shipped blank exports for two pieces for a whole
// sub-project while every other gate reported green.
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VARIANCE_MIN = 4;

const files = readdirSync(join(ROOT, 'downloads')).filter((f) => f.endsWith('.html'));
if (!files.length) {
  console.error('no downloads/*.html — run `npm run build` first');
  process.exit(1);
}

const browser = await chromium.launch();
const failures = [];
try {
  for (const file of files) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text()); });
    // Loaded over file:// with no server, from a directory that has no
    // shared/ sibling — the promise a baked export makes.
    await page.goto(`file://${join(ROOT, 'downloads', file)}`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const variance = await page.evaluate(() => {
      const c = document.querySelector('#canvas');
      if (!c) return -1;
      const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
      let s = 0, sq = 0, n = 0;
      for (let i = 0; i < data.length; i += 4 * 37) {
        const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
        s += l; sq += l * l; n++;
      }
      const m = s / n;
      return sq / n - m * m;
    });
    if (variance < 0) failures.push(`${file}: no #canvas element`);
    else if (variance < VARIANCE_MIN) failures.push(`${file}: rendered blank (variance ${variance.toFixed(2)} < ${VARIANCE_MIN})`);
    else if (errors.length) failures.push(`${file}: ${errors.join('; ')}`);
    else console.log(`  ok   ${file} (variance ${variance.toFixed(1)})`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (failures.length) {
  console.error('\nbaked exports failed:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`\nall ${files.length} baked exports render standalone`);
