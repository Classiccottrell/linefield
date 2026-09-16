// Run: node tools/test-svg-polygons.mjs
// Exercise the real download serializer without starting a browser.
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
  exportSvg([[[1, 2], [3, 4]]]);
  assert.equal(await downloaded.text(), `${header}\n<polyline points="1.00,2.00 3.00,4.00" fill="none" stroke="black" stroke-width="1" />\n</svg>`);
  exportSvg([], { texts: [{ x: 4, y: 5, ch: '<&', size: 12 }] });
  assert.equal(await downloaded.text(), `${header}\n<text x="4.00" y="5.00" font-family="monospace" font-size="12.00" fill="black">&lt;&amp;</text>\n</svg>`);

  // Already rotated rectangle, including negative coordinates. Its four
  // filled corners must survive rather than becoming an open stroke path.
  const corners = [[0, -2], [4, 2], [2, 4], [-2, 0]];
  exportSvg([], { width: 20, height: 30, polygons: [{ points: corners, fill: 'rgb(200,140,120)', opacity: 0.625 }] });
  const svg = await downloaded.text();
  assert.match(svg, /viewBox="0 0 20 30"/);
  assert.match(svg, /<polygon points="0.00,-2.00 4.00,2.00 2.00,4.00 -2.00,0.00" fill="rgb\(200,140,120\)" opacity="0.6250" \/>/);
  assert.doesNotMatch(svg, /polyline|fill="none"|NaN|Infinity/);
  exportSvg([], { polygons: [{ points: corners, fill: '"<&', opacity: 8 }] });
  assert.match(await downloaded.text(), /fill="&quot;&lt;&amp;" opacity="1.0000"/);
  console.log('SVG polygons: filled transformed corners, color, opacity, escaping and existing path/text output passed.');
} finally {
  globalThis.document = oldDocument;
  URL.createObjectURL = oldCreate;
  URL.revokeObjectURL = oldRevoke;
}
