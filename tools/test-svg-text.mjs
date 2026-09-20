// Run: node tools/test-svg-text.mjs
// Quoted font names must not break XML; glyph placement and weight survive export.
import assert from 'node:assert/strict';
import { exportSvg } from '../shared/export.js';

let blob;
const originalDocument = globalThis.document;
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
globalThis.document = { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } };
URL.createObjectURL = value => { blob = value; return 'blob:test'; };
URL.revokeObjectURL = () => {};
try {
  exportSvg([], { texts: [{ x: 20, y: 30, ch: '<&', size: 16,
    fontFamily: '"SF Mono", "A&B<font>"', anchor: 'middle', baseline: 'central', rotation: 37, strokeWidth: 0.75 }] });
  const svg = await blob.text();
  assert.match(svg, /font-family="&quot;SF Mono&quot;, &quot;A&amp;B&lt;font&gt;&quot;"/);
  assert.match(svg, /text-anchor="middle"/);
  assert.match(svg, /dominant-baseline="central"/);
  assert.match(svg, /transform="rotate\(37 20 30\)"/);
  assert.match(svg, /stroke="black" stroke-width="0.75"/);
  assert.match(svg, />&lt;&amp;<\/text>/);
  console.log('SVG text: XML-safe quoted font, centered baseline, rotation and glyph weight passed.');
} finally {
  globalThis.document = originalDocument;
  URL.createObjectURL = originalCreate;
  URL.revokeObjectURL = originalRevoke;
}
