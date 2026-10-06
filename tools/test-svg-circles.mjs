// Run: node tools/test-svg-circles.mjs
// Exercise the real download serializer's `circles` option without a browser,
// and prove path, text and polygon output is unchanged when it is absent.
import assert from 'node:assert/strict';
import { exportSvg } from '../shared/export.js';

let downloaded;
const oldDocument = globalThis.document;
const oldCreate = URL.createObjectURL;
const oldRevoke = URL.revokeObjectURL;
globalThis.document = {
  createElement: () => ({ click() {}, remove() {} }),
  body: { appendChild() {} },
};
URL.createObjectURL = (blob) => { downloaded = blob; return 'blob:test'; };
URL.revokeObjectURL = () => {};

try {
  const header = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">';
  const polygon = { points: [[0, -2], [4, 2], [2, 4]], fill: 'rgb(1,2,3)', opacity: 0.5 };
  const text = { x: 4, y: 5, ch: 'a', size: 12 };

  // Existing callers: identical bytes with and without an empty circles list.
  for (const opts of [{}, { texts: [text] }, { polygons: [polygon] }, { texts: [text], polygons: [polygon] }]) {
    exportSvg([[[1, 2], [3, 4]]], opts);
    const before = await downloaded.text();
    exportSvg([[[1, 2], [3, 4]]], { ...opts, circles: [] });
    assert.equal(await downloaded.text(), before);
  }
  exportSvg([[[1, 2], [3, 4]]]);
  assert.equal(await downloaded.text(), `${header}\n<polyline points="1.00,2.00 3.00,4.00" fill="none" stroke="black" stroke-width="1" />\n</svg>`);

  // Filled dots: centre, radius, colour, clamped opacity and escaping.
  exportSvg([], { width: 20, height: 30, circles: [{ cx: 3, cy: -1.5, r: 2.25, fill: 'rgb(219,219,219)', opacity: 0.9 }, { cx: 0, cy: 0, r: 1, fill: '"<&', opacity: 7 }, { cx: 1, cy: 1, r: 0.5 }] });
  const svg = await downloaded.text();
  assert.match(svg, /viewBox="0 0 20 30"/);
  assert.match(svg, /<circle cx="3.00" cy="-1.50" r="2.25" fill="rgb\(219,219,219\)" opacity="0.9000" \/>/);
  assert.match(svg, /<circle cx="0.00" cy="0.00" r="1.00" fill="&quot;&lt;&amp;" opacity="1.0000" \/>/);
  assert.match(svg, /<circle cx="1.00" cy="1.00" r="0.50" fill="black" opacity="1.0000" \/>/);
  assert.doesNotMatch(svg, /polyline|polygon|NaN|Infinity/);
  console.log('SVG circles: dots serialize with centre, radius, colour and opacity; path, text and polygon output unchanged.');
} finally {
  globalThis.document = oldDocument;
  URL.createObjectURL = oldCreate;
  URL.revokeObjectURL = oldRevoke;
}
