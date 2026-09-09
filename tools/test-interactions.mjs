// Browser QA for pointer response and 3D camera controls.
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
const POINTER_PIECES = ['accretion', 'event-horizon', 'rainfall', 'synapse', 'tether'];
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

async function setControl(page, label, value) {
  await page.evaluate(({ label, value }) => {
    const row = [...document.querySelectorAll('.lf-panel .lf-row')]
      .find((candidate) => candidate.querySelector('label')?.textContent.trim() === label);
    if (!row) throw new Error(`control not found: ${label}`);
    const input = row.querySelector('input');
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, { label, value });
}

async function placeCursor(page, x = 440, y = 300) {
  await page.evaluate(({ x, y }) => {
    const canvas = document.querySelector('#canvas');
    const rect = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    canvas.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      clientX: rect.left + x,
      clientY: rect.top + y,
    }));
  }, { x, y });
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
  await page.waitForSelector('.lf-panel .lf-row');
}

async function variant(page, base, slug, { pointer = 0, speed, cursor, controls = {} } = {}) {
  await openPiece(page, base, slug);
  await setControl(page, 'Pointer', pointer);
  if (speed !== undefined) await setControl(page, 'Speed', speed);
  for (const [label, value] of Object.entries(controls)) await setControl(page, label, value);
  if (cursor) await placeCursor(page, cursor.x, cursor.y);
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
    await stepFrames(page, 40);
    const first = await sample(page);
    await stepFrames(page, 40);
    const second = await sample(page);
    const motion = changedPercent(first, second);
    assert.ok(variance(second) > 4, `${slug}: blank canvas`);
    assert.ok(motion >= 0.05, `${slug}: no visible animation (${motion.toFixed(3)}%)`);
    console.log(`  render ${slug.padEnd(18)} variance=${variance(second).toFixed(1)} animation=${motion.toFixed(3)}%`);
  }

  for (const slug of POINTER_PIECES) {
    const baseline = await variant(page, base, slug, { pointer: 0 });
    const pointerOff = await variant(page, base, slug, { pointer: 0, cursor: { x: 440, y: 300 } });
    const pointerOn = await variant(page, base, slug, { pointer: 1, cursor: { x: 440, y: 300 } });
    const pointerOnNoCursor = await variant(page, base, slug, { pointer: 1 });
    const speedZero = await variant(page, base, slug, { pointer: 1, speed: 0, cursor: { x: 440, y: 300 } });
    const speedZeroNoCursor = await variant(page, base, slug, { pointer: 1, speed: 0 });
    const offDiff = changedPercent(baseline, pointerOff);
    const onDiff = changedPercent(pointerOnNoCursor, pointerOn);
    const zeroDiff = changedPercent(speedZeroNoCursor, speedZero);
    assert.equal(offDiff, 0, `${slug}: Pointer 0 changed canvas (${offDiff.toFixed(3)}%)`);
    assert.ok(onDiff >= 0.05, `${slug}: Pointer response not visible (${onDiff.toFixed(3)}%)`);
    assert.ok(zeroDiff >= 0.05, `${slug}: Pointer response died at Speed 0 (${zeroDiff.toFixed(3)}%)`);
    await page.evaluate(() => document.querySelectorAll('[data-lf-panel]').forEach((element) => { element.style.display = 'none'; }));
    await page.screenshot({ path: join(SHOTS, `${slug}-pointer.png`) });
    console.log(`  pointer ${slug.padEnd(18)} off=${offDiff.toFixed(3)}% on=${onDiff.toFixed(3)}% speed0=${zeroDiff.toFixed(3)}%`);
  }

  for (const slug of ORBIT_PIECES) {
    const baseImage = await variant(page, base, slug, { speed: 0 });
    const angle = await variant(page, base, slug, { speed: 0, controls: { Angle: 37 } });
    const pitch = await variant(page, base, slug, { speed: 0, controls: { Pitch: -23 } });
    const yaw = await variant(page, base, slug, { speed: 0, controls: { Yaw: 61 } });
    const angleDiff = changedPercent(baseImage, angle);
    const pitchDiff = changedPercent(baseImage, pitch);
    const yawDiff = changedPercent(baseImage, yaw);
    assert.ok(angleDiff >= 0.05, `${slug}: Angle not visible`);
    assert.ok(pitchDiff >= 0.05, `${slug}: Pitch not visible`);
    assert.ok(yawDiff >= 0.05, `${slug}: Yaw not visible`);
    assert.ok(changedPercent(angle, pitch) >= 0.05 && changedPercent(pitch, yaw) >= 0.05, `${slug}: camera controls not independent`);

    await openPiece(page, base, slug, false);
    await setControl(page, 'Speed', 0);
    await setControl(page, 'Pointer', 0);
    await stepFrames(page);
    const beforeDrag = await sample(page);
    await drag(page);
    const afterDrag = await sample(page);
    const directDrag = changedPercent(beforeDrag, afterDrag);
    assert.ok(directDrag >= 0.05, `${slug}: direct-page drag did not orbit`);

    await openPiece(page, base, slug, true);
    await setControl(page, 'Speed', 0);
    await setControl(page, 'Pointer', 0);
    await stepFrames(page);
    const beforePreviewDrag = await sample(page);
    await drag(page);
    const afterPreviewDrag = await sample(page);
    const previewDrag = changedPercent(beforePreviewDrag, afterPreviewDrag);
    assert.equal(previewDrag, 0, `${slug}: preview drag changed orientation (${previewDrag.toFixed(3)}%)`);

    for (const controls of [
      { Angle: 0, Pitch: -90, Yaw: -180, Density: 0.1, Scale: 0, Pointer: 2 },
      { Angle: 360, Pitch: 90, Yaw: 180, Density: 2, Scale: 2, Pointer: 2 },
    ]) {
      const image = await variant(page, base, slug, { speed: 0, cursor: { x: 440, y: 300 }, controls });
      assert.ok(variance(image) > 4, `${slug}: blank at control extremes ${JSON.stringify(controls)}`);
    }
    console.log(`  orbit   ${slug.padEnd(18)} angle=${angleDiff.toFixed(3)}% pitch=${pitchDiff.toFixed(3)}% yaw=${yawDiff.toFixed(3)}% drag=${directDrag.toFixed(3)}% preview-drag=${previewDrag.toFixed(3)}%`);
  }

  for (const { slug } of pieces) {
    await page.goto(`file://${join(ROOT, 'downloads', `${slug}.html`)}`, { waitUntil: 'load' });
    assert.equal(await page.locator('#btn-source').count(), 0, `${slug}: baked artifact exposes Source`);
    assert.equal(await page.locator('[data-lf-panel]').count(), 0, `${slug}: baked artifact exposes controls`);
  }

  assert.deepEqual(errors, [], `browser errors:\n${errors.join('\n')}`);
  console.log(`\ninteraction QA passed; screenshots: ${SHOTS}`);
} finally {
  await browser.close();
  server.close();
}
