# Contributing to linefield

## Adding a new piece

1. Copy the whole `pieces/_template/` folder to `pieces/<your-piece-name>/`,
   using kebab-case for the folder name (e.g. `flow-field`, `contour-grid`).
2. Update the `<title>` and `PIECE_ID` in the new `index.html`.
3. Replace the `drawFrame()` body with your own rendering logic, following
   the comments left in the template.
4. Pick a distinct default palette for your piece (see "Defaults" below) so
   the library doesn't look uniform — check the other pieces' `defaults`
   blocks before choosing hues.
5. Verify visually in a browser (see "No build step, no tests" below).

No build step, no dependencies, no bundler. Everything is plain ES modules
loaded directly by the browser, so a piece is just an `index.html` that
imports from `../../shared/*.js`.

## Serving the project

Serve the **repo root** with any static file server — pieces import shared
code with paths like `../../shared/controls.js`, so opening a piece's own
folder as the server root, or opening the file directly via `file://`,
will not work (ES modules are blocked over `file://` and the relative
import paths assume repo-root serving).

```bash
npx serve .
```

Then open `http://localhost:<port>/pieces/<piece-name>/`.

## The 13 shared controls

Every piece gets these controls for free via `createControlPanel()`
(`shared/controls.js`): `scale`, `speed`, `stroke`, `opacity`, `saturation`,
`hue`, `hueB`, `glow`, `angle`, `motion`, `phase`, `invert`, `density`.

A new piece should make **each** of these visibly affect its render — don't
leave a control wired up but inert. If a control doesn't map naturally onto
your piece's visuals, find a reasonable interpretation (e.g. `angle` can
rotate a field, `motion` can scale a secondary animation speed distinct
from `speed`, `hueB` can drive a second color family) rather than skipping
it.

## Piece-specific controls (`extraControls`)

Pass an `extraControls` array to `createControlPanel({ ... extraControls })`
for controls unique to your piece (same spec shape as the shared controls —
`name`, `label`, `type`, `min`/`max`/`step` or default, etc). These render
below the 13 shared controls automatically. You can also add one after the
panel exists with `panel.addControl({ ... })`.

## Defaults (`defaults`)

Pass a `defaults` object to `createControlPanel({ ... defaults })` to set
your piece's own default values, most importantly `hue` and `hueB`, so each
piece in the library reads as visually distinct out of the box. Check the
existing pieces' `defaults` blocks before picking colors to avoid
duplicating another piece's palette.

Note a saved `localStorage` value always outranks a piece's `defaults` for
a returning visitor — that's expected; "Reset to defaults" in the panel
clears it.

## Density convention

If your piece renders a countable number of elements (particles, lines,
grid cells), derive the count from `density` rather than hardcoding it:

```js
const BASE_COUNT = 200; // pick a sane baseline for your piece
const count = Math.round(BASE_COUNT * values.density);
```

If your piece holds a **persistent** array (e.g. particles that carry
state frame to frame, not values recomputed from scratch each frame), you
must re-seed that array inside the panel's `onChange` callback when
`density` changes — recomputing `count` alone won't resize an existing
array. See `pieces/flow-field/index.html` for a worked example.

## Baked HTML export

`shared/export.js`'s `bakeHtml()` produces a fully standalone file: it
strips the control panel, inlines all of `shared/*.js` into one
`<script type="module">`, and hardcodes the current control values as
`window.__LF_BAKED_VALUES__`. The output has zero external references and
runs from anywhere, including outside this repo. If you add a new shared
module, add its path to `SHARED_MODULE_PATHS` in `bakeHtml()` and make sure
its top-level names don't collide with any other shared module's top-level
names (`bakeHtml` concatenates all of them into one scope).

## No build step, no automated tests

There's no bundler, transpiler, or test runner in this repo. Canvas
rendering is verified visually: serve the repo root, open the piece in a
browser, and confirm it renders and animates as expected, with zero
console errors. Also click through each export button (PNG 2x, PNG 4x,
SVG, Baked HTML, Copy AI Prompt) to confirm they work.
