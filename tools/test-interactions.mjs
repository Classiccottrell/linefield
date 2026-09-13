// Browser QA for render, colour, and 3D camera controls.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { DETERMINISTIC_INIT, stepFrames } from './deterministic.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = '/private/tmp/linefield-qa';
const pieces = JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
const FORBIDDEN_CURSOR_SOURCE = [
  'cursorInteraction', 'createCursorOverlay', 'modeFactor',
];

for (const { slug } of pieces) {
  const source = readFileSync(join(ROOT, 'pieces', slug, 'index.html'), 'utf8');
  for (const token of FORBIDDEN_CURSOR_SOURCE) {
    assert.equal(source.includes(token), false, `${slug}: still contains ${token}`);
  }
}
const ORBIT_PIECES = ['event-horizon', 'wireframe-lattice'];
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function serveRepo() {
  const server = createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const path = join(ROOT, rel);
    if (!path.startsWith(ROOT) || !existsSync(path)) return res.writeHead(404).end('not found');
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(readFileSync(path));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// DOM-driven, by label text — kept ONLY for the colour-picker block below,
// which deliberately exercises the real <input>/<select> path a human drag
// would use. Everywhere else in this file addresses controls by name via
// setValue(), never by label or DOM position (see CONTRIBUTING.md).
async function setControl(page, label, value) {
  await page.evaluate(({ label, value }) => {
    const row = [...document.querySelectorAll('.lf-panel .lf-row')]
      .find((candidate) => candidate.querySelector('label')?.textContent.trim() === label);
    if (!row) throw new Error(`control not found: ${label}`);
    const input = row.querySelector('input, select');
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, { label, value });
}

// Addresses a control by its `name` (e.g. 'rotX') via the panel's own API,
// surviving whatever widget renders a control,
// unlike setControl's label/DOM lookup above.
async function setValue(page, name, value) {
  await page.evaluate(
    ({ name, value }) => window.__LF_PANEL__.setValue(name, value),
    { name, value }
  );
}

async function orbitValues(page) {
  return page.evaluate(() => ({ rotX: window.__LF_VALUES__.rotX, rotY: window.__LF_VALUES__.rotY }));
}

async function sample(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#canvas');
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const out = [];
    for (let i = 0; i < data.length; i += 4 * 37) out.push(data[i], data[i + 1], data[i + 2]);
    return out;
  });
}

function changedPercent(a, b) {
  assert.equal(a.length, b.length);
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) {
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 12) changed++;
  }
  return (changed / (a.length / 3)) * 100;
}

function variance(sampled) {
  let sum = 0;
  let square = 0;
  const n = sampled.length / 3;
  for (let i = 0; i < sampled.length; i += 3) {
    const light = (sampled[i] + sampled[i + 1] + sampled[i + 2]) / 3;
    sum += light;
    square += light * light;
  }
  return square / n - (sum / n) ** 2;
}

async function openPiece(page, base, slug, preview = true) {
  await page.goto(`${base}/pieces/${slug}/${preview ? '?preview=1' : ''}`, { waitUntil: 'load' });
  await page.waitForSelector('.lf-panel .lf-row', { state: 'attached' });
}

async function variant(page, base, slug, { speed, controls = {} } = {}) {
  await openPiece(page, base, slug);
  if (speed !== undefined) await setValue(page, 'speed', speed);
  for (const [name, value] of Object.entries(controls)) await setValue(page, name, value);
  await stepFrames(page);
  return sample(page);
}

async function drag(page) {
  await page.mouse.move(400, 280);
  await page.mouse.down();
  await page.mouse.move(700, 470, { steps: 5 });
  await page.mouse.up();
  await stepFrames(page, 1);
}

const server = await serveRepo();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
mkdirSync(SHOTS, { recursive: true });

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.addInitScript(DETERMINISTIC_INIT);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) errors.push(message.text());
  });

  for (const { slug } of pieces) {
    await openPiece(page, base, slug);
    const controlNames = await page.evaluate(() => window.__LF_SPECS__.map((spec) => spec.name));
    assert.equal(controlNames.includes('cursorInteraction'), false, `${slug}: exposes cursorInteraction`);
    assert.equal(controlNames.includes('pointer'), false, `${slug}: exposes pointer`);
    await stepFrames(page, 40);
    const first = await sample(page);
    await stepFrames(page, 40);
    const second = await sample(page);
    const motion = changedPercent(first, second);
    assert.ok(variance(second) > 4, `${slug}: blank canvas`);
    assert.ok(motion >= 0.05, `${slug}: no visible animation (${motion.toFixed(3)}%)`);
    console.log(`  render ${slug.padEnd(18)} variance=${variance(second).toFixed(1)} animation=${motion.toFixed(3)}%`);
  }

  // Colour picker: every gate elsewhere drives the panel through
  // window.__LF_PANEL__.setValue, bypassing the DOM entirely — which is
  // exactly how a real `parseFloat(input.value)` bug on the color/select
  // input path (NaN on any hex string) shipped unnoticed until this stage
  // added a widget that actually exercised it. This is the one check that
  // drives the picker the way a human dragging it would: dispatch a raw DOM
  // `input` event on the real <input type=color> and <select>, never
  // setValue directly.
  {
    const slug = 'flow-field';
    await openPiece(page, base, slug, false);
    const before = await page.evaluate(() => ({ ...window.__LF_VALUES__ }));
    await setControl(page, 'Color A', '#00ff00');
    await setControl(page, 'Color Mode', 'solid');
    const after = await page.evaluate(() => ({ ...window.__LF_VALUES__ }));
    assert.equal(after.colorA, '#00ff00', `${slug}: Color A DOM input did not write colorA`);
    assert.notEqual(after.hue, before.hue, `${slug}: Color A pick did not drive the linked hue field`);
    assert.equal(after.colorMode, 'solid', `${slug}: Color Mode DOM select did not write colorMode`);
    console.log(`  picker  ${slug.padEnd(18)} colorA->hue=${before.hue.toFixed(1)}->${after.hue.toFixed(1)} colorMode->${after.colorMode}`);
  }

  for (const slug of ORBIT_PIECES) {
    const baseImage = await variant(page, base, slug, { speed: 0 });
    const angle = await variant(page, base, slug, { speed: 0, controls: { angle: 37 } });
    const pitch = await variant(page, base, slug, { speed: 0, controls: { rotX: -23 } });
    const yaw = await variant(page, base, slug, { speed: 0, controls: { rotY: 61 } });
    const angleDiff = changedPercent(baseImage, angle);
    const pitchDiff = changedPercent(baseImage, pitch);
    const yawDiff = changedPercent(baseImage, yaw);
    assert.ok(angleDiff >= 0.05, `${slug}: Angle not visible`);
    assert.ok(pitchDiff >= 0.05, `${slug}: Pitch not visible`);
    assert.ok(yawDiff >= 0.05, `${slug}: Yaw not visible`);
    assert.ok(changedPercent(angle, pitch) >= 0.05 && changedPercent(pitch, yaw) >= 0.05, `${slug}: camera controls not independent`);

    await openPiece(page, base, slug, false);
    await setValue(page, 'speed', 0);
    await stepFrames(page);
    const beforeDrag = await sample(page);
    const beforeDragValues = await orbitValues(page);
    await drag(page);
    const afterDrag = await sample(page);
    const afterDragValues = await orbitValues(page);
    const directDrag = changedPercent(beforeDrag, afterDrag);
    assert.ok(directDrag >= 0.05, `${slug}: direct-page drag did not orbit`);
    assert.notEqual(afterDragValues.rotX, beforeDragValues.rotX, `${slug}: drag did not write back rotX`);
    assert.notEqual(afterDragValues.rotY, beforeDragValues.rotY, `${slug}: drag did not write back rotY`);

    await openPiece(page, base, slug, true);
    await setValue(page, 'speed', 0);
    await stepFrames(page);
    const beforePreviewDrag = await sample(page);
    const beforePreviewValues = await orbitValues(page);
    await drag(page);
    const afterPreviewDrag = await sample(page);
    const afterPreviewValues = await orbitValues(page);
    const previewDrag = changedPercent(beforePreviewDrag, afterPreviewDrag);
    assert.equal(previewDrag, 0, `${slug}: preview drag changed orientation (${previewDrag.toFixed(3)}%)`);
    assert.deepEqual(afterPreviewValues, beforePreviewValues, `${slug}: preview drag changed rotX/rotY values`);

    for (const controls of [
      { angle: 0, rotX: -90, rotY: -180, density: 0.1, scale: 0 },
      { angle: 360, rotX: 90, rotY: 180, density: 2, scale: 2 },
    ]) {
      const image = await variant(page, base, slug, { speed: 0, controls });
      assert.ok(variance(image) > 4, `${slug}: blank at control extremes ${JSON.stringify(controls)}`);
    }
    console.log(`  orbit   ${slug.padEnd(18)} angle=${angleDiff.toFixed(3)}% pitch=${pitchDiff.toFixed(3)}% yaw=${yawDiff.toFixed(3)}% drag=${directDrag.toFixed(3)}% preview-drag=${previewDrag.toFixed(3)}%`);
  }

  for (const { slug } of pieces) {
    await page.goto(`file://${join(ROOT, 'downloads', `${slug}.html`)}`, { waitUntil: 'load' });
    assert.equal(await page.locator('#btn-source').count(), 0, `${slug}: baked artifact exposes Source`);
    assert.equal(await page.locator('[data-lf-panel]').count(), 0, `${slug}: baked artifact exposes controls`);
  }

  await page.goto(`${base}/interactions/wake/`, { waitUntil: 'load' });
  assert.equal(await page.locator('[data-lf-wake]').count(), 1, 'Wake overlay missing');

  const overlayVariance = () => page.locator('[data-lf-wake]').evaluate((canvas) => {
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    let sum = 0, square = 0, n = 0;
    for (let i = 0; i < data.length; i += 4 * 37) {
      const light = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += light; square += light * light; n++;
    }
    return square / n - (sum / n) ** 2;
  });

  assert.equal(await overlayVariance(), 0, 'disabled Wake drew pixels');
  await page.locator('#wake-enabled').check();
  await page.mouse.move(200, 300);
  await page.mouse.move(760, 360, { steps: 12 });
  await stepFrames(page, 12);
  assert.ok(await overlayVariance() > 0, 'enabled Wake drew nothing');
  await page.evaluate(() => window.__LF_WAKE__.setStrength(0));
  await stepFrames(page, 1);
  assert.equal(await overlayVariance(), 0, 'zero-strength Wake drew pixels');
  await page.evaluate(() => window.__LF_WAKE__.setStrength(0.65));
  const beforeResize = await page.locator('[data-lf-wake]').evaluate((canvas) => [canvas.width, canvas.height]);
  await page.setViewportSize({ width: 960, height: 640 });
  await page.waitForTimeout(50);
  const afterResize = await page.locator('[data-lf-wake]').evaluate((canvas) => [canvas.width, canvas.height]);
  assert.notDeepEqual(afterResize, beforeResize, 'Wake overlay did not resize');
  assert.equal(await overlayVariance(), 0, 'resize retained stale Wake history');
  await page.evaluate(() => window.__LF_WAKE__.setEnabled(false));
  assert.equal(await overlayVariance(), 0, 'disabling Wake did not clear it');
  const badTarget = await page.evaluate(async () => {
    const { createWake } = await import('/interactions/wake.js');
    try { createWake({ target: document.body }); return ''; }
    catch (error) { return String(error); }
  });
  assert.match(badTarget, /Wake target must be a canvas element/);
  await page.evaluate(() => window.__LF_WAKE__.destroy());
  assert.equal(await page.locator('[data-lf-wake]').count(), 0, 'destroy left overlay attached');

  assert.deepEqual(errors, [], `browser errors:\n${errors.join('\n')}`);
  console.log(`\ninteraction QA passed; screenshots: ${SHOTS}`);
} finally {
  await browser.close();
  server.close();
}
