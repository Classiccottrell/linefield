// tools/test-current.mjs — the page current contract (shared/current.js).
// Plain node, no browser: the contract is logic, not rendering.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'shared', 'current.js');

// The same bytes ship in Forma (src/bridge/current.js), pinned to this hash
// there too. If this fails you changed the contract: land the identical file
// in both repos, then update both pins.
const PINNED = '3832ff3993e64f75153bfc347bc601b27a7e18ccf76a13756ab6556b1dc9e84c';
const sha = createHash('sha256').update(readFileSync(FILE)).digest('hex');
assert.equal(sha, PINNED, `shared/current.js changed (sha256 ${sha}). Mirror it to Forma, then update both pins.`);

// A stand-in for the browser's window-level listeners, to observe them.
const listeners = new Map();
globalThis.addEventListener = (type, fn) => listeners.set(type, fn);
globalThis.removeEventListener = (type) => listeners.delete(type);
const docListeners = new Map();
globalThis.document = { documentElement: { addEventListener: (t, fn) => docListeners.set(t, fn), removeEventListener: (t) => docListeners.delete(t) } };

// Two separately loaded copies, as linefield and Forma each bring their own.
const a = await import('../shared/current.js?copy=a');
const b = await import('../shared/current.js?copy=b');
assert.notEqual(a, b);
const current = a.pageCurrent();
assert.equal(b.pageCurrent(), current, 'two copies of the file share one current');
assert.equal(current.version, 1);

// Alone: no listeners, not accompanied.
const lines = current.join('linefield');
assert.equal(lines.accompanied, false);
assert.equal(listeners.size, 0, 'a lone member adds no listeners');
const lines2 = current.join('linefield');
assert.equal(lines.accompanied, false, 'a second member of the same kind is not company');
assert.equal(listeners.size, 0);
lines2.leave();

// Company arrives.
const form = b.pageCurrent().join('forma');
assert.equal(lines.accompanied, true);
assert.equal(form.accompanied, true);
assert.ok(current.has('forma') && current.has('linefield'));
assert.deepEqual(current.members.sort(), ['forma', 'linefield']);
assert.ok(listeners.has('pointermove'), 'the page pointer is tracked once there is company');
listeners.get('pointermove')({ clientX: 300, clientY: 200 });
assert.deepEqual({ ...current.pointer }, { x: 300, y: 200, active: true });

// Channels: last publisher owns; unknown channels are ignored.
lines.publish('field', { sample(x, y, t, out) { out[0] = 1; out[1] = 0; return out; } });
lines.publish('palette', { a: [220, 220, 220], b: [200, 210, 255], dark: true, name: 'whisper' });
form.publish('body', { x: 400, y: 300, r: 120, disperse: 0.5, form: 'gas' });
form.publish('nonsense', 1);
assert.equal(current.nonsense, undefined);
assert.equal(current.body.form, 'gas');
lines.publish('body', null);
assert.ok(current.body, 'only the owner can clear a channel');

// flowAt: the field alone, then the cursor's three moving modes.
const out = [9, 9];
current.pointer.active = false;
assert.deepEqual(current.flowAt(0, 0, 0, out), [1, 0]);
lines.publish('field', null);
assert.deepEqual(current.flowAt(0, 0, 0, out), [0, 0], 'no field, no cursor: still water');
current.pointer.x = 300; current.pointer.y = 200; current.pointer.active = true;
form.publish('cursor', { mode: 'push', strength: 1, reach: 100 });
current.flowAt(350, 200, 0, out); // 50 px to the right of the cursor
assert.ok(out[0] > 0.5 && Math.abs(out[1]) < 1e-9, 'push moves away from the cursor');
form.publish('cursor', { mode: 'attract', strength: 1, reach: 100 });
current.flowAt(350, 200, 0, out);
assert.ok(out[0] < -0.5 && Math.abs(out[1]) < 1e-9, 'attract moves toward the cursor');
current.flowAt(300, 200, 0, out);
assert.ok(Math.hypot(out[0], out[1]) < 1e-6, 'attract comes to rest at the cursor');
form.publish('cursor', { mode: 'vortex', strength: 1, reach: 100 });
current.flowAt(350, 200, 0, out);
assert.ok(Math.abs(out[1]) > Math.abs(out[0]) && out[0] < 0, 'vortex circles the cursor, drawn slightly in');
current.flowAt(900, 900, 0, out);
assert.deepEqual(out, [0, 0], 'the cursor has no effect far away');
for (const mode of ['scatter', 'wake', 'off']) {
  form.publish('cursor', { mode, strength: 1, reach: 100 });
  assert.deepEqual(current.flowAt(350, 200, 0, out), [0, 0], `${mode} does not move the flow`);
}
for (const mode of ['push', 'attract', 'vortex']) assert.ok(a.CURRENT_CURSOR_MODES.includes(mode));
assert.deepEqual(a.CURRENT_PRESETS, ['whisper', 'ink', 'neon', 'drift', 'dense']);

// Every top-level name is prefixed: the bake inlines all shared modules into
// one script, where a common name (PRESET_NAMES, say) would be redeclared.
for (const m of readFileSync(FILE, 'utf8').matchAll(/^(?:export )?(?:const|let|function|class) (\w+)/gm)) {
  assert.match(m[1], /^(CURRENT_|createCurrent$|pageCurrent$)/, `top-level name "${m[1]}" could collide in a bake`);
}

// Leaving clears what the member published and, once alone, the listeners.
form.leave();
assert.equal(current.body, null);
assert.equal(current.cursor, null);
assert.ok(current.palette, 'another member\'s channels survive');
assert.equal(lines.accompanied, false);
assert.equal(listeners.size, 0, 'listeners are removed when company leaves');
assert.equal(current.pointer.active, false);
form.publish('body', { x: 1 });
assert.equal(current.body, null, 'a member that left cannot publish');
lines.leave();

// A different version on the page is a different contract.
globalThis.__pageCurrent__.version = 99;
const c = await import('../shared/current.js?copy=c');
assert.notEqual(c.pageCurrent(), current, 'mismatched versions do not share a current');

console.log('page current: ok');
