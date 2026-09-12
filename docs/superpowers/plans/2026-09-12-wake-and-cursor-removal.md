# Wake and Cursor Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove generic cursor behavior from every artwork and ship Wake as one optional, standalone interaction mechanism.

**Architecture:** Pieces return to a visual-only control contract; only the two existing camera pieces keep pointer input for drag-to-orbit. `interactions/wake.js` owns a transparent overlay, pointer sampling, drawing loop, resize lifecycle, and teardown without reading or modifying piece geometry.

**Tech Stack:** Vanilla ES modules, Canvas 2D, browser Pointer Events, ResizeObserver, Playwright, Node.js standard library.

**Spec:** `docs/superpowers/specs/2026-09-12-collection-redesign-and-wake-design.md`

## Global Constraints

- Zero runtime dependencies.
- Every piece remains a single-file-exportable HTML/JS artifact.
- Wake is not a piece control and is not included in piece exports.
- Wake defaults off and respects `prefers-reduced-motion: reduce` unless explicitly overridden.
- Existing drag-to-orbit remains on `event-horizon` and `wireframe-lattice`.
- The twelve established pieces must retain pixel-identical default thumbnails.

---

### Task 1: Remove the embedded cursor contract

**Files:**
- Modify: `shared/controls.js`
- Modify: `pieces/_template/index.html`
- Modify: every `pieces/*/index.html`
- Modify: `tools/audit-controls.mjs`
- Modify: `tools/test-interactions.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/checks.yml`
- Generated: `downloads/*.html`, `index.html`
- Delete: `shared/cursor-modes.js`
- Delete: `tools/test-cursor-modes.mjs`
- Delete: `tools/mode-sheet.mjs`

**Interfaces:**
- Consumes: `createOrbit({ canvas, enabled, sensitivity, onOrbit, onSettle })` from `shared/pointer.js`.
- Produces: a piece control surface with no `cursorInteraction` or `pointer`; no source file under `pieces/` imports `cursor-modes.js`.

- [ ] **Step 1: Add purity assertions before removing code**

At the start of `tools/test-interactions.mjs`, after loading `pieces.json`, read every piece source and assert the forbidden cursor-mode API is absent:

```js
const FORBIDDEN_CURSOR_SOURCE = [
  'cursorInteraction', 'createCursorOverlay', 'modeFactor',
];

for (const { slug } of pieces) {
  const source = readFileSync(join(ROOT, 'pieces', slug, 'index.html'), 'utf8');
  for (const token of FORBIDDEN_CURSOR_SOURCE) {
    assert.equal(source.includes(token), false, `${slug}: still contains ${token}`);
  }
}
```

After `openPiece(page, base, slug)`, inspect the live specs:

```js
const controlNames = await page.evaluate(() => window.__LF_SPECS__.map((spec) => spec.name));
assert.equal(controlNames.includes('cursorInteraction'), false, `${slug}: exposes cursorInteraction`);
assert.equal(controlNames.includes('pointer'), false, `${slug}: exposes pointer`);
```

- [ ] **Step 2: Run the browser test and confirm the new assertions fail**

Run: `npm run test-interactions`

Expected: FAIL on the first piece with `still contains cursorInteraction`.

- [ ] **Step 3: Delete the shared controls and mode module**

Remove these two specs and the `CURSOR_MODES` import from `shared/controls.js`:

```js
{ name: 'cursorInteraction', label: 'Cursor Interaction', type: 'select', options: CURSOR_MODES, default: 'None', category: 'interaction' },
{ name: 'pointer', label: 'Pointer', type: 'range', min: 0, max: 2, step: 0.01, default: 0, category: 'interaction' },
```

Delete `shared/cursor-modes.js`. Keep `shared/pointer.js` unchanged because Wake and camera orbit reuse it.

- [ ] **Step 4: Remove cursor code from the template and all pieces**

For each source under `pieces/`:

- remove `createPointer` unless the same import also supplies `createOrbit`;
- remove `createCursorOverlay` and `modeFactor` imports;
- remove `pointer`, `overlay`, `mode`, `k`, cursor falloff, and mode branches;
- remove `pointer.step()`, `overlay.step(currentValues.cursorInteraction, k, pointer)`, and each `overlay.draw(ctx, colour, k)` call;
- preserve all drawing math outside those branches byte-for-byte.

On `event-horizon` and `wireframe-lattice`, retain only `createOrbit`. Remove `createPointer` from their import lists. Do not add orbit to any replacement.

Verify source cleanup:

```bash
rg -n "cursorInteraction|createCursorOverlay|modeFactor|values\.pointer" pieces shared
```

Expected: no matches.

- [ ] **Step 5: Simplify the control audit and browser QA**

Delete `PREREQS.pointer`, `PREREQS.cursorInteraction`, their special-case comments, and enum-mode probes from `tools/audit-controls.mjs`.

In `tools/test-interactions.mjs`, remove `POINTER_PIECES`, `placeCursor`, cursor arguments from `variant`, the mode battery, Speed-0 cursor exceptions, and pointer screenshots. Keep render animation, color picker, orbit, extreme-value, baked-artifact, and error checks. Remove `pointer` from all orbit extreme maps.

- [ ] **Step 6: Remove obsolete commands and CI steps**

Delete `test-cursor-modes` from `package.json` and its matching workflow step. Leave `test-interactions` in place for render/orbit QA and later Wake coverage.

- [ ] **Step 7: Verify pure pieces**

Run:

```bash
npm run test-interactions
npm run audit-controls
npm run build
git diff --exit-code -- thumbs/flow-field.png thumbs/contour-grid.png thumbs/interference.png thumbs/orbital-veil.png thumbs/grain-field.png thumbs/wireframe-lattice.png thumbs/meridian.png thumbs/synapse.png thumbs/accretion.png thumbs/tether.png thumbs/event-horizon.png thumbs/rainfall.png
```

Expected: tests PASS and the twelve established thumbnails have no diff.

- [ ] **Step 8: Commit the removal**

```bash
git add shared pieces tools package.json .github/workflows/checks.yml downloads index.html
git commit -m "refactor: remove embedded cursor modes"
```

---

### Task 2: Build the Wake lifecycle and drawing core

**Files:**
- Create: `interactions/wake.js`
- Create: `interactions/wake/index.html`
- Modify: `tools/test-interactions.mjs`

**Interfaces:**
- Consumes: `createPointer({ canvas, enabled })` from `shared/pointer.js`.
- Produces: `createWake({ target, color = 'rgba(255,255,255,.72)', strength = 0.65, enabled = false, respectReducedMotion = true })` returning `{ setEnabled, setStrength, destroy }`.

- [ ] **Step 1: Add failing Wake browser assertions**

Append one Wake block to `tools/test-interactions.mjs` before the final error assertion:

```js
await page.goto(`${base}/interactions/wake/`, { waitUntil: 'load' });
assert.equal(await page.locator('[data-lf-wake]').count(), 1, 'Wake overlay missing');

const overlayVariance = () => page.locator('[data-lf-wake]').evaluate((canvas) => {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0, square = 0, n = 0;
  for (let i = 0; i < data.length; i += 4 * 37) {
    const light = (data[i] + data[i + 1] + data[i + 2]) / 3;
    sum += light; square += light * light; n++;
  }
  return square / n - (sum / n) ** 2;
});

assert.equal(await overlayVariance(), 0, 'disabled Wake drew pixels');
await page.locator('#wake-enabled').check();
await page.mouse.move(200, 300);
await page.mouse.move(760, 360, { steps: 12 });
await stepFrames(page, 12);
assert.ok(await overlayVariance() > 0, 'enabled Wake drew nothing');
await page.evaluate(() => window.__LF_WAKE__.setStrength(0));
await stepFrames(page, 1);
assert.equal(await overlayVariance(), 0, 'zero-strength Wake drew pixels');
await page.evaluate(() => window.__LF_WAKE__.setStrength(0.65));
const beforeResize = await page.locator('[data-lf-wake]').evaluate((canvas) => [canvas.width, canvas.height]);
await page.setViewportSize({ width: 960, height: 640 });
await page.waitForTimeout(50);
const afterResize = await page.locator('[data-lf-wake]').evaluate((canvas) => [canvas.width, canvas.height]);
assert.notDeepEqual(afterResize, beforeResize, 'Wake overlay did not resize');
assert.equal(await overlayVariance(), 0, 'resize retained stale Wake history');
await page.evaluate(() => window.__LF_WAKE__.setEnabled(false));
assert.equal(await overlayVariance(), 0, 'disabling Wake did not clear it');
const badTarget = await page.evaluate(async () => {
  const { createWake } = await import('/interactions/wake.js');
  try { createWake({ target: document.body }); return ''; }
  catch (error) { return String(error); }
});
assert.match(badTarget, /Wake target must be a canvas element/);
await page.evaluate(() => window.__LF_WAKE__.destroy());
assert.equal(await page.locator('[data-lf-wake]').count(), 0, 'destroy left overlay attached');
```

- [ ] **Step 2: Run the browser test and confirm the demo is missing**

Run: `npm run test-interactions`

Expected: FAIL because `/interactions/wake/` has no overlay.

- [ ] **Step 3: Implement `createWake` with native browser primitives**

Use `createPointer`, a maximum 32-point history, quadratic midpoint smoothing, and one pulse record. Clamp strength exactly:

```js
const clampStrength = (value) => Math.max(0, Math.min(1.5, Number(value) || 0));
```

Validate the target:

```js
if (!(target instanceof HTMLCanvasElement)) {
  throw new TypeError('Wake target must be a canvas element');
}
```

The overlay must be positioned from `target.getBoundingClientRect()`, scaled by `devicePixelRatio`, carry `data-lf-wake`, and set `pointer-events:none`. A ResizeObserver calls `resize()`, which clears history and resizes the overlay.

On each frame:

1. call `pointer.step()`;
2. append a point only while enabled, active, and at least 3 CSS pixels from the previous point;
3. prune points older than 900 ms and cap the list at 32;
4. draw three midpoint-smoothed paths at normal offsets `[-1, 0, 1] * (2 + speed * 0.012) * strength`;
5. derive alpha from point age, path index, and clamped pointer speed;
6. emit one pulse when movement has been still for 180 ms after at least six samples;
7. clear the overlay every frame before redrawing surviving marks.

`setEnabled(false)` clears history and the overlay. `destroy()` cancels rAF, disconnects ResizeObserver, calls `pointer.destroy()`, removes the overlay, and makes later setters no-ops.

- [ ] **Step 4: Build the standalone demo**

Create a full-viewport neutral canvas `#wake-stage`, a checkbox `#wake-enabled`, and range input `#wake-strength` (`min=0`, `max=1.5`, `step=.01`, `value=.65`). Instantiate:

```js
const wake = createWake({ target: stage, strength: 0.65, enabled: false });
window.__LF_WAKE__ = wake;
enabled.addEventListener('input', () => wake.setEnabled(enabled.checked));
strength.addEventListener('input', () => wake.setStrength(strength.value));
```

The demo background contains only a faint static grid and the words “move slowly / move quickly”; it must not use a linefield piece.

- [ ] **Step 5: Verify Wake**

Run: `npm run test-interactions`

Expected: PASS, including disabled, enabled, and teardown assertions.

- [ ] **Step 6: Commit Wake**

```bash
git add interactions/wake.js interactions/wake/index.html tools/test-interactions.mjs
git commit -m "feat: add standalone Wake interaction"
```

---

### Task 3: Surface Wake separately in the gallery

**Files:**
- Modify: `tools/templates/gallery.html`
- Modify: `tools/test-interactions.mjs`
- Generated: `index.html`

**Interfaces:**
- Consumes: `/interactions/wake/` from Task 2.
- Produces: one gallery link outside `#grid`; no interaction entry is added to `pieces.json`.

- [ ] **Step 1: Add a failing gallery separation check**

In `tools/test-interactions.mjs`, load the gallery and assert:

```js
await page.goto(`${base}/`, { waitUntil: 'load' });
assert.equal(await page.locator('#grid [data-interaction]').count(), 0, 'Wake rendered as a piece');
assert.equal(await page.locator('a[href="interactions/wake/"]').count(), 1, 'Wake gallery link missing');
```

- [ ] **Step 2: Confirm the check fails**

Run: `npm run test-interactions`

Expected: FAIL with `Wake gallery link missing`.

- [ ] **Step 3: Add a static mechanism section**

After `#grid` in `tools/templates/gallery.html`, add a compact `<section class="mechanisms">` containing one link to `interactions/wake/`, the label “Interaction mechanism”, title “Wake”, and copy “A separate cursor current for any canvas.” Do not add manifest plumbing or a second data file for one entry.

- [ ] **Step 4: Rebuild and verify**

Run:

```bash
npm run build
npm run test-interactions
```

Expected: both PASS; `index.html` contains exactly one Wake link outside the piece grid.

- [ ] **Step 5: Commit gallery integration**

```bash
git add tools/templates/gallery.html index.html
git commit -m "feat: present Wake as a separate mechanism"
```

---

### Task 4: Update documentation and remove cursor-era claims

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `BRIEF.md`
- Modify: `ROADMAP.md`
- Modify: `CHANGELOG.md`
- Modify: `skills/building-generative-backgrounds/SKILL.md`

**Interfaces:**
- Consumes: the final control list and Wake API from Tasks 1–3.
- Produces: contributor and consumer documentation containing no active cursor-mode instructions.

- [ ] **Step 1: Replace active cursor documentation**

Document the visual controls only. Replace the contributor “Cursor interaction” section with “Optional interaction mechanisms” and this minimal integration:

```js
import { createWake } from './interactions/wake.js';

const wake = createWake({ target: document.querySelector('canvas') });
wake.setEnabled(true);
```

State that Wake is not baked into pieces. Preserve cursor-mode history only inside dated CHANGELOG entries.

- [ ] **Step 2: Update project status and accepted limitations**

Remove cursor-mode limitations from ROADMAP. Record the editorial replacement work as in progress and Wake as the successor to the removed mode matrix. Keep orbit documentation intact.

- [ ] **Step 3: Update the repository skill**

Remove the cursor-mode implementation contract from `skills/building-generative-backgrounds/SKILL.md`. Add one short lesson: generic cursor vocabularies force unrelated renderers into weak interpretations; prefer a composable overlay or a piece-native interaction.

- [ ] **Step 4: Verify prose and repository state**

Run:

```bash
rg -n "cursorInteraction|Particle Trail|Attract|Vortex|test-cursor-modes|cursor-modes\.js" README.md CONTRIBUTING.md BRIEF.md ROADMAP.md skills package.json .github
npm run verify
git diff --check
```

Expected: no active instructions reference removed APIs; `npm run verify` passes.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md CONTRIBUTING.md BRIEF.md ROADMAP.md CHANGELOG.md skills/building-generative-backgrounds/SKILL.md
git commit -m "docs: separate Wake from artwork controls"
```

---

### Task 5: Complete the Wake gate

**Files:**
- Modify only files needed to fix failures found below.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: a passing, deterministic cursor-removal and Wake change set ready for the collection plan.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm run verify
npm run test-presets
npm run test-baked
npm run test-bake-fresh
npm run test-source
npm run test-interactions
npm run audit-controls
```

Expected: all PASS.

- [ ] **Step 2: Prove generated output is current**

Run `npm run build` twice.

Expected: the second run leaves `git status --short` unchanged.

- [ ] **Step 3: Perform one manual Wake pass**

Serve the repo root and open `/interactions/wake/`. Verify slow movement produces close hairlines, quick movement produces wider brighter separation, pause emits one pulse, exit fades cleanly, controls remain clickable, and reduced-motion defaults to off.

- [ ] **Step 4: Commit any verification fixes**

```bash
git add -A
git commit -m "fix: close Wake verification gaps"
```

Skip this commit when verification required no changes.
