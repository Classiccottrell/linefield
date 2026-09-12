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
// two accumulator pieces (`flow-field`, `accretion`) leave behind, which is
// canvas fade, not a mark. This reproduces the twelve values published in
// ROADMAP before this tool existed, to within one unit in the last printed
// digit on 34 of 36 numbers (`wireframe-lattice` ink, `event-horizon` sat).
//
// No pass/fail gate — this is a curation instrument, like tools/mode-sheet.mjs.
// Not run in CI.

import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
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

function measure(slug) {
  const { width, height, channels, data } = decodePng(join(ROOT, 'thumbs', `${slug}.png`));
  const total = width * height;
  let marked = 0, satSum = 0, hx = 0, hy = 0, chromaSum = 0;
  for (let i = 0; i < total; i++) {
    const r = data[i * channels], g = data[i * channels + 1], b = data[i * channels + 2];
    const max = Math.max(r, g, b);
    if (max <= MARK_LEVEL) continue;
    marked++;
    const chroma = max - Math.min(r, g, b);
    satSum += chroma / max;
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
    ink: marked / total,
  };
}

const pieces = JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
const rows = pieces.map((p) => measure(p.slug)).sort((a, b) => a.hue - b.hue);

console.log('| Hue | Sat | Ink | Piece |');
console.log('|---:|---:|---:|---|');
for (const r of rows) {
  console.log(`| ${r.hue} | ${r.saturation.toFixed(2)} | ${r.ink.toFixed(3)} | \`${r.slug}\` |`);
}
