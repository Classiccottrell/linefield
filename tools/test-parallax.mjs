// Run: node tools/test-parallax.mjs
// Execute the real renderer with a recording canvas to catch a dead Speed
// control independently of lens animation, without launching a browser.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { hslToRgb, paletteHsl } from '../shared/color.js';

let currentPath = [], strokes = [];
const ctx = {
  fillRect() {}, beginPath() { currentPath = []; },
  moveTo(x, y) { currentPath.push([x, y]); },
  lineTo(x, y) { currentPath.push([x, y]); },
  stroke() { strokes.push(currentPath.slice()); },
};
const canvas = { getContext: () => ctx };
const sandbox = { hslToRgb, paletteHsl,
  window: { innerWidth: 1280, innerHeight: 800, addEventListener() {} },
  document: { getElementById: id => id === 'canvas' ? canvas : null },
  createControlPanel: ({ defaults }) => ({ values: { scale: 1, speed: 1, stroke: 1, opacity: 1, density: 1,
    glow: 0, invert: false, angle: 0, motion: 0, phase: 0, ...defaults, speed: 1, motion: 0 } }),
  createLoop: () => ({ start() {} }),
};
const html = readFileSync(new URL('../pieces/parallax/index.html', import.meta.url), 'utf8');
const source = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;\s*$/gm, '');
vm.createContext(sandbox);
vm.runInContext(`${source}\nglobalThis.render = drawFrame; globalThis.values = currentValues;`, sandbox);
function frame(dt, elapsed) {
  strokes = [];
  sandbox.render(dt, elapsed, sandbox.values);
  return JSON.stringify(strokes);
}
const start = frame(0, 0);
assert(frame(2, 2) !== start, 'Speed must move Parallax geometry while Motion is zero');
sandbox.values.speed = 0;
const stopped = frame(0, 2);
assert.equal(frame(2, 4), stopped, 'zero Speed and Motion must freeze the field');
console.log('Parallax: Speed advects geometry independently of Motion; zero Speed freezes it.');
