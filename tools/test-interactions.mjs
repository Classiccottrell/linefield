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
// modeFactor (shared/cursor-modes.js) is the sole gate on cursor response
// now, wired into every piece across Tasks 1-3 — there is no piece left
// that legitimately sits outside this coverage, so this is all twelve, not
// a hand-picked subset.
const POINTER_PIECES = pieces.map((p) => p.slug);
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

// Addresses a control by its `name` (e.g. 'pointer', 'cursorInteraction',
// 'rotX') via the panel's own API, exactly like audit-controls.mjs and
// test-cursor-modes.mjs do — survives whatever widget renders a control,
// unlike setControl's label/DOM lookup above.
async function setValue(page, name, value) {
  await page.evaluate(
    ({ name, value }) => window.__LF_PANEL__.setValue(name, value),
    { name, value }
  );
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
  await page.waitForSelector('.lf-panel .lf-row');
}

// `mode` sets cursorInteraction; left unset, a piece keeps its 'None'
// default, which is correct for the render/orbit checks below that have
// nothing to do with cursor response.
async function variant(page, base, slug, { pointer = 0, speed, mode, cursor, controls = {} } = {}) {
  await openPiece(page, base, slug);
  await setValue(page, 'pointer', pointer);
  if (mode !== undefined) await setValue(page, 'cursorInteraction', mode);
  if (speed !== undefined) await setValue(page, 'speed', speed);
  for (const [name, value] of Object.entries(controls)) await setValue(page, name, value);
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

  // Pointer/cursorInteraction are two separate controls with two separate
  // claims, each needing its own pin so a failure attributes to the right
  // one — same shape as audit-controls.mjs's PREREQS, deliberately kept in
  // sync with it:
  //
  // - Pointer-as-number (offDiff/onDiff): pinned to 'Particle Trail', the
  //   shared overlay in shared/cursor-modes.js, never a per-piece mode.
  //   Tasks 2/3 rewrote Attract/Grow/Shrink/Vortex per piece; a regression
  //   in one of those would surface here as "Pointer response not
  //   visible", misattributed to Pointer instead of to the mode that
  //   actually broke (the bug b6d7242 fixed by repinning the audit the
  //   same way).
  // - Speed-0 survival (zeroDiff) is a different claim (db53b38: the
  //   response must not route through values.speed) and Particle Trail
  //   can't test it — it's driven by performance.now(), never touches
  //   values.speed, so pinning it here would pass this assertion
  //   unconditionally regardless of whether a piece's own mode has that
  //   bug. Pin to 'Attract' instead, implemented on all twelve pieces (see
  //   tools/test-cursor-modes.mjs's MODES).
  // - cursorInteraction-as-enum (modeDiff): reusing pointerOn (Particle
  //   Trail) against a second render under 'Grow' proves the dropdown
  //   actually branches behaviour, not just that some mode is on. This is
  //   a basic sanity check, not the full per-mode battery — that's
  //   tools/test-cursor-modes.mjs's job, exercised there mode-by-mode,
  //   piece-by-piece; this file doesn't reassert it.
  for (const slug of POINTER_PIECES) {
    const baseline = await variant(page, base, slug, { pointer: 0, mode: 'Particle Trail' });
    const pointerOff = await variant(page, base, slug, { pointer: 0, mode: 'Particle Trail', cursor: { x: 440, y: 300 } });
    const pointerOn = await variant(page, base, slug, { pointer: 1, mode: 'Particle Trail', cursor: { x: 440, y: 300 } });
    const pointerOnNoCursor = await variant(page, base, slug, { pointer: 1, mode: 'Particle Trail' });
    const speedZero = await variant(page, base, slug, { pointer: 1, mode: 'Attract', speed: 0, cursor: { x: 440, y: 300 } });
    const speedZeroNoCursor = await variant(page, base, slug, { pointer: 1, mode: 'Attract', speed: 0 });
    const modeB = await variant(page, base, slug, { pointer: 1, mode: 'Grow', cursor: { x: 440, y: 300 } });
    const offDiff = changedPercent(baseline, pointerOff);
    const onDiff = changedPercent(pointerOnNoCursor, pointerOn);
    const zeroDiff = changedPercent(speedZeroNoCursor, speedZero);
    const modeDiff = changedPercent(pointerOn, modeB);
    assert.equal(offDiff, 0, `${slug}: Pointer 0 changed canvas (${offDiff.toFixed(3)}%)`);
    // Margin note: Particle Trail is deliberately faint (density carries
    // its visibility, not size/opacity — shared/cursor-modes.js), so this
    // reads ~0.08-0.15% on most full-clear pieces against a 0.05% floor —
    // real signal, thin margin. If this assertion fails on MANY pieces at
    // once, suspect a retune of the overlay's own tuning (particle count,
    // size, alpha), not a per-piece Pointer regression.
    assert.ok(onDiff >= 0.05, `${slug}: Pointer response not visible (${onDiff.toFixed(3)}%)`);
    assert.ok(zeroDiff >= 0.05, `${slug}: Pointer response died at Speed 0 under Attract (${zeroDiff.toFixed(3)}%)`);
    assert.ok(modeDiff >= 0.05, `${slug}: cursorInteraction has no effect (Particle Trail vs Grow, ${modeDiff.toFixed(3)}%)`);
    await page.evaluate(() => document.querySelectorAll('[data-lf-panel]').forEach((element) => { element.style.display = 'none'; }));
    await page.screenshot({ path: join(SHOTS, `${slug}-pointer.png`) });
    console.log(`  pointer ${slug.padEnd(18)} off=${offDiff.toFixed(3)}% on=${onDiff.toFixed(3)}% speed0=${zeroDiff.toFixed(3)}% mode=${modeDiff.toFixed(3)}%`);
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
    await setValue(page, 'pointer', 0);
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
    await setValue(page, 'pointer', 0);
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
      { angle: 0, rotX: -90, rotY: -180, density: 0.1, scale: 0, pointer: 2 },
      { angle: 360, rotX: 90, rotY: 180, density: 2, scale: 2, pointer: 2 },
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
