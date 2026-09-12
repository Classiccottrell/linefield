// tools/audit-controls.mjs
//
// Empirically checks every control (14 shared + each piece's own) on every
// piece: drive it between its extremes, render a fixed number of
// deterministic frames, and diff sampled canvas pixels. A dead control
// (reads a value, changes nothing visible) shows ~zero diff; a live one
// doesn't. Determinism (seeded Math.random, a manually-stepped rAF/clock)
// means two renders at identical settings diff to exactly zero, so there is
// no noise floor to reason about — any nonzero diff on a changed control is
// real signal from that control alone.
//
// This does not replace human judgement: a control can move pixels while
// being imperceptible (see the phase/rotational-symmetry note below), or
// redundant with another control. Read the printed table, don't just take
// the pass/fail.
//
// Usage: node tools/audit-controls.mjs [slug ...]

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { chromium } from 'playwright';
import { DETERMINISTIC_INIT, STEPS, stepFrames } from './deterministic.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serveRepo(port) {
  const server = createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const path = join(ROOT, rel);
    if (!path.startsWith(ROOT) || !existsSync(path)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(readFileSync(path));
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

// Reads the control specs off window.__LF_SPECS__ instead of the DOM, so an
// addressing scheme survives whatever widget renders a control. Discriminate
// on `kind` (boolean/number/color/enum/hidden), never on `type`. 'hidden'
// (hue/hueB) is filtered out here: it has no panel row and is not a control a
// user can drive — colorA/colorB are its user-facing surface and are audited
// instead.
async function getControls(page) {
  return page.evaluate(() =>
    (window.__LF_SPECS__ || [])
      .filter((spec) => spec.kind !== 'hidden')
      .map((spec, i) => ({
        i,
        name: spec.name,
        label: spec.label,
        kind: spec.kind,
        min: spec.kind === 'number' ? Number(spec.min) : null,
        max: spec.kind === 'number' ? Number(spec.max) : null,
        options: spec.kind === 'enum' ? spec.options : null,
      }))
  );
}

async function setControl(page, name, value) {
  await page.evaluate(
    ({ name, value }) => window.__LF_PANEL__.setValue(name, value),
    { name, value }
  );
}

// Sampled RGB triplets — same stride build.mjs uses for its blank-canvas
// check, cheap and dense enough (~28k samples on a 1280x800 canvas) to catch
// any global or regional change. Full RGB, not a grayscale-luminance
// average: a hue rotation at constant HSL lightness barely moves
// (R+G+B)/3, so a luminance-only diff systematically under-reports
// chromatic controls (hue, hueB, saturation) as dead when they aren't.
async function sample(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('#canvas');
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const out = [];
    for (let i = 0; i < data.length; i += 4 * 37) {
      out.push(data[i], data[i + 1], data[i + 2]);
    }
    return out;
  });
}

// Percentage of sampled PIXELS (not channels) whose combined |dR|+|dG|+|dB|
// clears PIXEL_DIFF_MIN. A plain mean-absolute-diff over all channels
// dilutes sparse pieces to near-zero: most of a piece like synapse or
// tether's canvas is empty background, so even a stark, obviously-visible
// recolour of the line-art averages out across a mostly-unchanged canvas.
// Counting *how much of the canvas actually changed* survives that dilution.
const PIXEL_DIFF_MIN = 12;

function diffScore(a, b) {
  const n = Math.min(a.length, b.length) / 3;
  let changed = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d > PIXEL_DIFF_MIN) changed++;
  }
  return (changed / n) * 100; // percent of sampled pixels that visibly changed
}

const LIVE_THRESHOLD = 0.05; // % of sampled pixels changed, below this = no visible change

// colorMode's mechanism (blend two stops vs. lock to stop A) is universal,
// but whether flipping it MOVES PIXELS is bounded by how far apart a given
// piece's own colorA/colorB happen to be — rainfall's are only 10deg apart
// at saturation 0.18 by deliberate design ("quiet rain"), so the two modes
// differ by ~2/255 per channel there: real, but under any noise-floor a
// human or this script would call visible. That conflates "is colorMode
// wired correctly" (a piece-independent question) with "are this piece's
// default stops far apart" (a palette-authoring choice, already covered by
// the hue/hueB manifest gate). Pin both stops to two maximally distinct
// colours before probing colorMode specifically, so its own test isolates
// the mechanism rather than inheriting a piece's palette choice.
//
// Same conflation for `pointer`/`cursorInteraction`: a piece's cursor
// response is gated on BOTH being non-default at once (modeFactor in
// shared/cursor-modes.js returns 0 unless cursorInteraction !== 'None' AND
// pointer > 0, by design — pointer=0 or None must be fully inert). Probing
// either control alone leaves the other at ITS default (pointer=0,
// cursorInteraction='None'), so the response is zero regardless of what the
// probed control does. Pin the other one on, same fix as colorMode above.
//
// Pinned to 'Particle Trail', not a per-piece mode like 'Attract': Particle
// Trail is the shared overlay in shared/cursor-modes.js — one
// implementation, already covered by tools/test-cursor-modes.mjs, that
// per-piece work (Tasks 2/3 rewriting Attract/Grow/Shrink/Vortex on eleven
// pieces) does not touch. Pinning to a per-piece mode would make this
// PROBE's own result ride on whatever that mode currently happens to do —
// `pointer` could read DEAD from a regression in Attract's rewrite, a
// failure that belongs to Attract, misattributed to Pointer instead.
//
// What "Pointer LIVE" asserts, since this pin changes it: NOT "moving the
// pointer slider alone, everything else at its own default, changes
// pixels" — that reads DEAD by design at cursorInteraction='None'. It
// asserts "with cursor response already active via the overlay, sliding
// pointer's strength up changes pixels." The interaction as a whole is what
// PREREQS.cursorInteraction (below) exercises the reverse of.
//
// Mirror statement for PREREQS.cursorInteraction, since it is easy to
// overclaim here: pinning `pointer` to 1 makes "zero DEAD for
// cursorInteraction" assert that the MODE-SELECTION MECHANISM is wired —
// switching the dropdown changes what the shared overlay / a piece's own
// branch does, given that pointer strength is already nonzero. It does
// NOT assert "every mode is visible at this piece's shipped defaults":
// pointer defaults to 0 on every piece, so an unpinned sweep of
// cursorInteraction would read DEAD unconditionally regardless of whether
// mode selection works at all, and this prereq exists to stop that
// unconditional failure, not to certify any particular mode's look.
// tools/test-cursor-modes.mjs is the gate that exercises THAT claim — every
// mode, live and visually distinct, on every piece.
const PREREQS = {
  colorMode: { colorA: '#ff2d2d', colorB: '#2de0ff' },
  pointer: { cursorInteraction: 'Particle Trail' },
  cursorInteraction: { pointer: 1 },
};

async function renderVariant(page, base, slug, name, value) {
  await page.goto(`${base}/pieces/${slug}/?preview=1`, { waitUntil: 'load' });
  await page.waitForSelector('.lf-panel .lf-row');
  // No cursor exists in a headless audit, so pointer response would measure
  // as DEAD on every piece. Place one at a fixed canvas-relative position —
  // a constant, so two runs stay pixel-identical — and let influence settle.
  await page.evaluate(() => {
    const c = document.querySelector('#canvas');
    const r = c.getBoundingClientRect();
    c.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    c.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true,
      clientX: r.left + r.width * 0.35,
      clientY: r.top + r.height * 0.4,
    }));
  });
  const prereq = name !== null ? PREREQS[name] : null;
  if (prereq) {
    for (const [n, v] of Object.entries(prereq)) await setControl(page, n, v);
  }
  if (name !== null) await setControl(page, name, value);
  await stepFrames(page);
  return sample(page);
}

// A single lo/hi comparison aliases on any control whose effect is periodic
// across its own range — hue/angle wrap at 360, tether's `phase` maps to a
// sin() argument that's a full 2*PI cycle over [0,2]. Sample 5 points across
// the range instead and take the largest pairwise diff, so a control is only
// called DEAD if it produces near-zero change between EVERY pair of test
// points, not just the two that happened to alias.

// Fixed, distinct hex points for a colour control — includes one grey
// (achromatic: max===min channel) so hexToHue's "leave hue untouched on an
// achromatic pick" guard (shared/color.js) is exercised here rather than
// only in human testing.
const COLOR_SAMPLE_POINTS = ['#ff2d2d', '#ffe22d', '#2dff5c', '#2de0ff', '#7a2dff', '#808080'];

function samplePoints(control) {
  if (control.kind === 'boolean') return [false, true];
  if (control.kind === 'enum') return control.options;
  if (control.kind === 'color') return COLOR_SAMPLE_POINTS;
  const { min, max } = control;
  // Uneven fractions avoid aliasing discrete symmetries too: event-horizon's
  // 36 spokes repeat every 10deg, so quarter-turn samples all looked equal.
  return [0, 0.19, 0.43, 0.71, 1].map((f) => min + f * (max - min));
}

async function auditPiece(page, base, p) {
  await page.goto(`${base}/pieces/${p.slug}/?preview=1`, { waitUntil: 'load' });
  await page.waitForSelector('.lf-panel .lf-row');
  const controls = await getControls(page);

  // Determinism sanity check: two default renders must diff to zero.
  const d1 = await renderVariant(page, base, p.slug, null, null);
  const d2 = await renderVariant(page, base, p.slug, null, null);
  const baseline = diffScore(d1, d2);

  const results = [];
  for (const control of controls) {
    const points = samplePoints(control);
    const renders = [];
    for (const v of points) renders.push(await renderVariant(page, base, p.slug, control.name, v));
    let best = 0;
    for (let x = 0; x < renders.length; x++) {
      for (let y = x + 1; y < renders.length; y++) {
        best = Math.max(best, diffScore(renders[x], renders[y]));
      }
    }
    results.push({ label: control.label, points, score: best, live: best >= LIVE_THRESHOLD });
  }
  return { slug: p.slug, baseline, results };
}

async function main() {
  const only = process.argv.slice(2);
  const targets = only.length ? manifest.filter((p) => only.includes(p.slug)) : manifest;

  const PORT = 5798;
  const base = `http://localhost:${PORT}`;
  const server = await serveRepo(PORT);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(DETERMINISTIC_INIT);
    const page = await context.newPage();

    const report = [];
    for (const p of targets) {
      process.stderr.write(`auditing ${p.slug}...\n`);
      const r = await auditPiece(page, base, p);
      report.push(r);
      const flag = r.baseline >= LIVE_THRESHOLD ? `  [WARN non-deterministic baseline: ${r.baseline.toFixed(2)}]` : '';
      console.log(`\n== ${r.slug} ==${flag}`);
      for (const row of r.results) {
        console.log(`  ${row.live ? 'LIVE' : 'DEAD'}  ${row.label.padEnd(16)} changed=${row.score.toFixed(3)}%`);
      }
    }

    console.log('\n\n--- summary of DEAD controls ---');
    let deadCount = 0;
    for (const r of report) {
      for (const row of r.results) {
        if (!row.live) { console.log(`${r.slug}: ${row.label}`); deadCount++; }
      }
    }
    if (deadCount > 0) process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main();
