// Measures the collection's colour/density spread from the committed
// thumbnails and prints ROADMAP.md's "Collection constraints" table.
//
// Reads `thumbs/<slug>.png`, NOT the live piece — so a piece tuned without a
// subsequent `npm run build` is measured as it last rendered, not as it reads
// today. Run `npm run build` first if anything under `pieces/` changed.
//
// Three metrics, matching the definitions ROADMAP's prose has always used:
//   Hue  — colourfulness-weighted circular mean of the marked pixels' hue,
//          weighted by chroma (max-min channel) so a near-grey mark barely
//          votes and a vivid one votes fully.
//   Sat  — mean HSV saturation of the marked pixels.
//   Ink  — fraction of the frame the piece marks at all.
//
// A pixel counts as MARKED when its brightest channel exceeds MARK_LEVEL.
// Every piece clears to #0a0a0d (brightest channel 13), so the threshold sits
// just above the background — high enough to ignore the near-black haze the
// two accumulator pieces (`flow-field`, `infall`) leave behind, which is
// canvas fade, not a mark. This reproduces the twelve values published in
// ROADMAP before this tool existed, to within one unit in the last printed
// digit on 34 of 36 numbers (`wireframe-lattice` ink, `funnel` sat).
//
// No pass/fail gate — this is a curation instrument, like tools/mode-sheet.mjs.
// Not run in CI.

// Conformance check (`--check`, i.e. `npm run collection-check`) — the one
// exception to "No pass/fail gate" above, added for v2 Phase 2 (ROADMAP
// Chunk 2.2). With the flag, the same measurements are held against
// docs/house-look.md and the tool exits 1, listing every failing piece, if
// any committed thumbnail breaks it. Without the flag the table above prints
// exactly as before. Not run in CI yet: CI wiring waits until Phase 2 has
// converted the pieces, or it would go red on day one.
// `--self-test` runs the threshold logic against synthetic rows only (no
// PNGs) and exits 0 if it holds.

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MARK_LEVEL = 15;

// Minimal PNG reader for exactly what tools/build.mjs writes: 8-bit
// truecolour, non-interlaced. Anything else is a build change, not a file
// this tool should guess at — so it throws rather than mis-measure.
function decodePng(path) {
  const buf = readFileSync(path);
  let off = 8, width = 0, height = 0, channels = 0;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(off + 8);
      height = buf.readUInt32BE(off + 12);
      const depth = buf[off + 16], colour = buf[off + 17], interlace = buf[off + 20];
      if (depth !== 8 || (colour !== 2 && colour !== 6) || interlace !== 0) {
        throw new Error(`${path}: unsupported PNG (depth ${depth}, colour type ${colour}, interlace ${interlace})`);
      }
      channels = colour === 2 ? 3 : 4;
    } else if (type === 'IDAT') {
      idat.push(buf.subarray(off + 8, off + 8 + len));
    }
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const row = raw.subarray(p, p + stride);
    p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = row[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const est = a + b - c;
        const pa = Math.abs(est - a), pb = Math.abs(est - b), pc = Math.abs(est - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
  }
  return { width, height, channels, data: out };
}

// The ground `#0a0a0d` is faintly blue (chroma 3). A faint near-white hairline
// anti-aliased over it lands at pixels like (22,22,25): chroma 3 over a max of
// 25 reads as HSV saturation 0.12, even though nothing coloured was drawn.
// Hairline pieces are mostly such faint edge pixels, so the raw mean punished
// exactly the low-alpha accumulation the house look asks for. The --check mode
// therefore treats chroma <= CHROMA_FLOOR as achromatic. The default table
// keeps the raw figure so previously published rows stay comparable.
const CHROMA_FLOOR = 3;
const checkSat = (r, g, b) => {
  const max = Math.max(r, g, b);
  const chroma = max - Math.min(r, g, b);
  return chroma > CHROMA_FLOOR ? chroma / max : 0;
};

function measure(slug) {
  const { width, height, channels, data } = decodePng(join(ROOT, 'thumbs', `${slug}.png`));
  const total = width * height;
  let marked = 0, satSum = 0, checkSatSum = 0, hx = 0, hy = 0, chromaSum = 0;
  for (let i = 0; i < total; i++) {
    const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2];
    const max = Math.max(r, g, b);
    if (max <= MARK_LEVEL) continue;
    marked++;
    const chroma = max - Math.min(r, g, b);
    satSum += chroma / max;
    checkSatSum += checkSat(r, g, b);
    if (chroma === 0) continue;
    let hue;
    if (max === r) hue = ((g - b) / chroma) % 6;
    else if (max === g) hue = (b - r) / chroma + 2;
    else hue = (r - g) / chroma + 4;
    const rad = (hue * 60 * Math.PI) / 180;
    hx += Math.cos(rad) * chroma;
    hy += Math.sin(rad) * chroma;
    chromaSum += chroma;
  }
  if (!marked) throw new Error(`${slug}: thumbnail has no marked pixels — rebuild it`);
  return {
    slug,
    hue: Math.round(((Math.atan2(hy, hx) * 180) / Math.PI + 360) % 360),
    saturation: satSum / marked,
    checkSaturation: checkSatSum / marked,
    ink: marked / total,
  };
}

// --- Conformance thresholds -------------------------------------------------
const SAT_MAX = 0.06; // house-look §1: default mean saturation of marked pixels
const INK_MIN = 0.03; // house-look §2: linework ink coverage floor
const INK_MAX = 0.15; // house-look §2: linework ink coverage ceiling
const HERO_INK_MAX = 0.035; // house-look §2: home-page hero ink ceiling (no floor)
const HEROES = new Set(['rainfall', 'grain-field']); // house-look §2 home-page heroes
const RULES = ['sat', 'ink'];

// Deliberate breaks, one rule per piece, each with the reason its chunk gave
// (house-look: "A piece may break one rule if its chunk says why"). Shape:
//   'slug': { rule: 'sat' | 'ink', reason: 'Chunk 2.x: why' }
// An overridden rule is still measured and printed, just not failed.
const OVERRIDES = {};

function validateOverrides(overrides, slugs) {
  for (const [slug, o] of Object.entries(overrides)) {
    if (!slugs.has(slug)) throw new Error(`override for unknown piece \`${slug}\``);
    if (!RULES.includes(o?.rule)) throw new Error(`override for \`${slug}\`: rule must be one of ${RULES.join(', ')}`);
    if (typeof o.reason !== 'string' || !o.reason.trim()) throw new Error(`override for \`${slug}\`: reason is required`);
  }
}

// Pure rule check for one measured row → failures that count, and failures an
// override excused. Compares raw values; only the messages are rounded.
function evaluate(row, overrides) {
  const broken = [];
  if (row.saturation > SAT_MAX) {
    broken.push({ rule: 'sat', msg: `sat ${row.saturation.toFixed(3)} > ${SAT_MAX} (§1)` });
  }
  if (HEROES.has(row.slug)) {
    if (row.ink > HERO_INK_MAX) broken.push({ rule: 'ink', msg: `hero ink ${row.ink.toFixed(4)} > ${HERO_INK_MAX} (§2)` });
  } else if (row.ink < INK_MIN) {
    broken.push({ rule: 'ink', msg: `ink ${row.ink.toFixed(4)} < ${INK_MIN} (§2)` });
  } else if (row.ink > INK_MAX) {
    broken.push({ rule: 'ink', msg: `ink ${row.ink.toFixed(4)} > ${INK_MAX} (§2)` });
  }
  const o = overrides[row.slug];
  return {
    failures: broken.filter((b) => b.rule !== o?.rule),
    overridden: broken.filter((b) => b.rule === o?.rule),
  };
}

function selfTest() {
  const run = (slug, saturation, ink, overrides = {}) => {
    const { failures, overridden } = evaluate({ slug, saturation, ink }, overrides);
    return { fail: failures.map((f) => f.rule), over: overridden.map((f) => f.rule) };
  };
  // rainfall today: saturated, but low ink is fine for a hero (no 0.03 floor).
  // Ground-tint floor: a faint white edge over #0a0a0d is achromatic; real colour is not.
  assert.equal(checkSat(22, 22, 25), 0);
  assert.ok(checkSat(40, 20, 20) > 0.4);
  assert.deepEqual(run('rainfall', 0.19, 0.007).fail, ['sat']);
  assert.deepEqual(run('grain-field', 0, 0.036).fail, ['ink']);
  assert.deepEqual(run('lacuna', 0, 0.028).fail, ['ink']);
  assert.deepEqual(run('flow-field', 0, 0.16).fail, ['ink']);
  // Boundaries are inclusive passes.
  assert.deepEqual(run('lacuna', 0.06, 0.03).fail, []);
  assert.deepEqual(run('lacuna', 0, 0.15).fail, []);
  assert.deepEqual(run('rainfall', 0, 0.035).fail, []);
  // A sat override excuses sat only; ink still fails.
  const r = run('flow-field', 0.8, 0.27, { 'flow-field': { rule: 'sat', reason: 'test' } });
  assert.deepEqual(r, { fail: ['ink'], over: ['sat'] });
  const slugs = new Set(['flow-field']);
  assert.throws(() => validateOverrides({ 'flow-field': { rule: 'sat' } }, slugs), /reason is required/);
  assert.throws(() => validateOverrides({ 'flow-field': { rule: 'sat', reason: ' ' } }, slugs), /reason is required/);
  assert.throws(() => validateOverrides({ 'flow-field': { rule: 'hue', reason: 'x' } }, slugs), /rule must be/);
  assert.throws(() => validateOverrides({ gone: { rule: 'sat', reason: 'x' } }, slugs), /unknown piece/);
  console.log('collection-metrics self-test: ok');
}

function check(rows, overrides) {
  validateOverrides(overrides, new Set(rows.map((r) => r.slug)));
  const results = rows.map((r) => ({ r, ...evaluate(r, overrides) }));
  const failing = results.filter((x) => x.failures.length);
  console.log(`Conformance vs docs/house-look.md: sat <= ${SAT_MAX} (§1); ink ${INK_MIN}-${INK_MAX} (§2); hero ink <= ${HERO_INK_MAX} (§2, ${[...HEROES].join(', ')})`);
  console.log('');
  if (failing.length) {
    console.log('| Piece | Sat | Ink | Failures |');
    console.log('|---|---:|---:|---|');
    for (const { r, failures } of failing) {
      console.log(`| \`${r.slug}\` | ${r.saturation.toFixed(3)} | ${r.ink.toFixed(4)} | ${failures.map((f) => f.msg).join('; ')} |`);
    }
    console.log('');
  }
  console.log('Overrides:');
  const entries = Object.entries(overrides);
  if (!entries.length) console.log('  (none)');
  for (const [slug, o] of entries) {
    const excused = results.find((x) => x.r.slug === slug).overridden;
    const hit = excused.length ? `excusing: ${excused.map((f) => f.msg).join('; ')}` : 'currently unused';
    console.log(`  \`${slug}\` ${o.rule}: ${o.reason} (${hit})`);
  }
  console.log('');
  console.log(failing.length ? `FAIL: ${failing.length} of ${rows.length} pieces break the house look.` : `PASS: all ${rows.length} pieces conform.`);
  if (failing.length) process.exitCode = 1;
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const pieces = JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
  if (process.argv.includes('--check')) {
    check(pieces.map((p) => { const m = measure(p.slug); return { ...m, saturation: m.checkSaturation }; }), OVERRIDES);
  } else {
    // Sorted by ink: with every default monochrome, hue no longer separates
    // pieces. Both saturation figures print so the gated one (check) is
    // never confused with the raw one again.
    const rows = pieces.map((p) => measure(p.slug)).sort((a, b) => a.ink - b.ink);

    console.log('| Hue | Sat (raw) | Sat (check) | Ink | Piece |');
    console.log('|---:|---:|---:|---:|---|');
    for (const r of rows) {
      console.log(`| ${r.hue} | ${r.saturation.toFixed(2)} | ${r.checkSaturation.toFixed(2)} | ${r.ink.toFixed(3)} | \`${r.slug}\` |`);
    }
  }
}
