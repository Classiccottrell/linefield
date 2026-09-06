// tools/test-presets.mjs — gate for the preset mechanism.
// Run: node tools/test-presets.mjs [slug]   (default: flow-field)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };

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

const slug = process.argv[2] || 'flow-field';
const PORT = 7801;
const base = `http://localhost:${PORT}`;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) console.log(`  PASS  ${name}`);
  else { console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); failures.push(name); }
};

const server = await serveRepo(PORT);
const browser = await chromium.launch();

async function open(query = '') {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 600 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/pieces/${slug}/${query}`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { ctx, page };
}

// 1. The global exposes the declared vocabulary.
{
  const { ctx, page } = await open();
  const names = await page.evaluate(() => Object.keys(window.__LF_PRESETS__ || {}));
  check('exposes __LF_PRESETS__ with 5 names', names.length === 5, `got ${names.length}: ${names}`);
  check('vocabulary is the shared five',
    ['whisper', 'ink', 'neon', 'drift', 'dense'].every((n) => names.includes(n)), String(names));

  // 2. A preset map is partial — at least one preset omits at least one control.
  const partial = await page.evaluate(() => {
    const p = window.__LF_PRESETS__;
    const total = (window.__LF_SPECS__ || []).length;
    return Object.values(p).every((m) => Object.keys(m).length < total);
  });
  check('preset maps are partial, not full snapshots', partial);
  await ctx.close();
}

// 3. Clicking a chip changes what is drawn.
{
  const { ctx, page } = await open();
  const before = await page.evaluate(() => document.querySelector('#canvas').toDataURL());
  await page.click('.lf-chip[data-preset="ink"]');
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => document.querySelector('#canvas').toDataURL());
  check('clicking a chip changes the render', before !== after);
  check('active chip is marked',
    await page.getAttribute('.lf-chip[data-preset="ink"]', 'aria-pressed') === 'true');
  await ctx.close();
}

// 4. Two different presets render differently from each other.
{
  const { ctx, page } = await open();
  await page.click('.lf-chip[data-preset="whisper"]');
  await page.waitForTimeout(900);
  const a = await page.evaluate(() => document.querySelector('#canvas').toDataURL());
  await page.click('.lf-chip[data-preset="neon"]');
  await page.waitForTimeout(900);
  const b = await page.evaluate(() => document.querySelector('#canvas').toDataURL());
  check('two presets render differently', a !== b);
  await ctx.close();
}

// 5. Switching A -> B strands no value from A. neon and drift have
// asymmetric key sets (neon declares saturation/glow, which drift omits;
// drift declares speed/motion, which neon omits), so this is the pair that
// can actually catch a merge-only `applyValues` that fails to fall back a
// key the incoming preset omits to the piece's own default.
{
  const { ctx, page } = await open();
  await page.click('.lf-reset');
  await page.waitForTimeout(200);
  const defaults = await page.evaluate(() => ({ ...window.__LF_VALUES__ }));
  await page.click('.lf-chip[data-preset="neon"]');
  await page.waitForTimeout(300);
  await page.click('.lf-chip[data-preset="drift"]');
  await page.waitForTimeout(300);
  const stranded = await page.evaluate((defaults) => {
    const declaredDrift = window.__LF_PRESETS__.drift;
    const declaredNeon = window.__LF_PRESETS__.neon;
    const live = window.__LF_VALUES__;
    const wrongApplied = Object.entries(declaredDrift)
      .filter(([k, v]) => live[k] !== v)
      .map(([k]) => k);
    const notReset = Object.keys(declaredNeon)
      .filter((k) => !(k in declaredDrift))
      .filter((k) => live[k] !== defaults[k]);
    return [...wrongApplied, ...notReset];
  }, defaults);
  check('switching presets strands no control', stranded.length === 0, `stranded: ${stranded}`);
  await ctx.close();
}

// 6. ?preset= applies on load; an unknown name opens normally.
{
  const { ctx, page } = await open('?preset=ink');
  const applied = await page.evaluate(() => {
    const declared = window.__LF_PRESETS__.ink;
    const live = window.__LF_VALUES__;
    return Object.entries(declared).every(([k, v]) => live[k] === v);
  });
  check('?preset=ink applies on load', applied);
  await ctx.close();

  const bogus = await open('?preset=not-a-preset');
  const errs = [];
  bogus.page.on('pageerror', (e) => errs.push(String(e)));
  await bogus.page.waitForTimeout(400);
  const drew = await bogus.page.evaluate(() => document.querySelector('#canvas').toDataURL().length > 5000);
  check('unknown ?preset opens the piece normally', drew && errs.length === 0, errs.join(','));
  await bogus.ctx.close();
}

// 7. Moving a slider clears the active chip.
{
  const { ctx, page } = await open();
  await page.click('.lf-chip[data-preset="ink"]');
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.lf-row input[type=range]')][0];
    el.value = String(Number(el.value) === 0 ? 1 : 0);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const still = await page.$$eval('.lf-chip[aria-pressed="true"]', (e) => e.length);
  check('moving a slider clears the active chip', still === 0);
  await ctx.close();
}

// 8. Every preset value names a real control and sits within its declared
// range. applyValues writes the raw preset number straight into the values
// object the render reads; the range input only clamps its own displayed
// position, so a preset can silently draw past what the control claims is
// possible unless something checks this independently of the panel UI.
{
  const { ctx, page } = await open();
  const violations = await page.evaluate(() => {
    const specs = window.__LF_SPECS__ || [];
    const specByName = Object.fromEntries(specs.map((s) => [s.name, s]));
    const out = [];
    for (const [presetName, map] of Object.entries(window.__LF_PRESETS__ || {})) {
      for (const [key, value] of Object.entries(map)) {
        const spec = specByName[key];
        if (!spec) { out.push(`${presetName}.${key}: no control named "${key}"`); continue; }
        const hasBounds = typeof spec.min === 'number' && typeof spec.max === 'number';
        if (!hasBounds) {
          if (typeof value === 'number') {
            out.push(`${presetName}.${key}=${value}: control "${key}" declares no numeric min/max, cannot range-check`);
          }
          continue;
        }
        if (typeof value === 'number' && (value < spec.min || value > spec.max)) {
          out.push(`${presetName}.${key}=${value} outside [${spec.min}, ${spec.max}]`);
        }
      }
    }
    return out;
  });
  check('preset values are within control ranges', violations.length === 0,
    violations.map((v) => `${slug}.${v}`).join('; '));
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} FAILED` : '\nall preset checks passed');
process.exit(failures.length ? 1 : 0);
