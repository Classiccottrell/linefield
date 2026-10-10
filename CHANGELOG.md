# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Four new pieces, bringing the collection to twenty-four, each from its
  own brief and each in the house look. `contrail` is one trail of
  hairlines, tight and bright at its head, loosening as it ages back to the
  frame's edge (Currents, extra control Dispersion). `bristle` is one
  S-shaped brush swipe of hairline bristles running dry in streaks
  (Currents, Dryness). `louvre` is a window of slats crossed by one slowly
  sweeping beam of light (Volumes, Beam width). `fracture` is a pane of
  diagonal hairlines broken into drifting shards whose cracks carry the
  light (Surfaces, Shards); its shatter differs on every page load. All
  four pass `collection-check` and `audit-controls` with every control
  live.

- **Stills pack and `catalogue.md`** (ROADMAP Phase 5). `node tools/build.mjs`
  now also captures an 800×800 square PNG of every piece at its defaults
  into `stills/`, zips them into `stills.zip`, and links that zip from the
  gallery's intro copy. It generates `catalogue.md` from `pieces.json` plus
  the live control list each piece already exposes on `window.__LF_SPECS__`
  — one entry per piece: blurb, tags, text-safe zone, anchor, and controls
  — so it can't drift from the pieces themselves, and it's written in our
  own words. Checked PNG export's size range (1x/2x/4x,
  unchanged, no gap) and whether transparent-background export works — it
  doesn't, for any piece, and can't be added without a render-architecture
  change across all 20; recorded as a known limitation rather than chased.

- `collections.json` groups the twenty pieces into five named collections
  — Currents, Volumes, Orbits, Surfaces, Codes — replacing the flat tag
  chips. `pieces.json` is untouched; `node tools/build.mjs --verify-only`
  now fails loudly if a piece has no collection, or a collection names a
  slug that doesn't exist.
- `node tools/collection-metrics.mjs --check` (`npm run collection-check`)
  — a conformance gate against `docs/house-look.md`: default saturation
  ≤ 0.06 and ink coverage within 0.03–0.15 (0.035 ceiling, no floor, for
  the two home-page hero pieces). Its saturation check treats pixels with
  chroma ≤ 3 as achromatic, so a faint hairline's anti-aliased edge over
  the ground colour doesn't register as "coloured" when it isn't — the
  first thing it was run against would have failed on that alone.
- Two pieces that introduce new materials (ROADMAP Phase 4.1 and 4.2).
  `dune` is a single wind-cut ridge built from film grain: a heightfield
  shaded by one low raking light, rendered to a half-resolution buffer
  through ImageData, grained per pixel from a deterministic hash, and
  upscaled. `swell` is one ocean swell drawn as a halftone screen whose dot
  area carries the light. Both default to the monochrome house look and
  carry `safeZone` and `anchor` in `pieces.json`.
- `exportSvg()` in `shared/export.js` takes an additive `circles` option
  for filled dots (`swell`). Callers that don't pass it get byte-identical
  output; `tools/test-svg-circles.mjs` checks both.

- The control panel can be dragged by its header on screens wider than
  640px. It is clamped to the viewport, re-clamped on resize, and its
  position is persisted per piece in localStorage next to the tuned values.
  The header's click-to-collapse still works, since a move under 4px counts
  as a click. The mobile bottom sheet is unchanged. This shipped in PR #17
  (`53dcfe9`) without an entry, so it is recorded here.

### Changed

- **Pieces use more of the canvas by default, and Scale is the framing
  control.** At full canvas most pieces were an island about a third of
  the width. `docs/house-look.md` §2 now treats framing as a range set by
  Scale, from contained to full canvas, with defaults judged at full
  canvas; the 45–75%-of-the-shorter-side rule and the one-third text-safe
  minimum are retired. Default Scale rises on 14 pieces (flow-field becomes
  a full-canvas field), preset Scale values move with them, and Scale now
  widens flow-field, grain-field and cipher-bloom. contrail is recomposed
  so its tail stays in the square crop, and its oldest strands now fray
  out at different lengths instead of ending together. Saved settings in
  a visitor's browser still win over the new defaults; "Reset to defaults"
  picks them up.
- `CONTRIBUTING.md` and the docs contributing page no longer tell
  contributors to give each piece a distinct default palette, which
  predates the monochrome house look.
- **Every piece converted to a monochrome house look** (ROADMAP Phase 2):
  near-white ink on `#0a0a0d` by default (saturation 0; colour stays
  opt-in through the existing controls, concentrated in each piece's
  `neon` preset), one legible object per frame with a declared text-safe
  zone, and hairline strokes (0.4–0.9px at `Stroke: 1`) whose brightness
  comes from additive (`globalCompositeOperation = 'lighter'`) overlap
  rather than lower stroke lightness. `node tools/collection-metrics.mjs
  --check` passes all twenty pieces with zero overrides. Two pieces
  changed more than their palette, as a deliberate re-differentiation
  from the reference rather than a restyle: `globe` dropped its longitude
  lines entirely (latitude slices only, no bright pole); `parallax`'s
  lines, which previously shared an implicit off-frame vanishing point,
  are now genuinely parallel. Defaults, presets and `pieces.json` blurbs
  changed on every converted piece; rendering logic was reworked where the
  house look required it (not line-for-line on every piece).
- **Art-first gallery.** Cards are dominated by a square preview; actions
  (Open, Copy embed, Download) moved into a hover/keyboard-focus overlay,
  always visible on touch. The repeated "download ships defaults" note is
  now said once near the top of the grid.
- **Type system** sourced from the ClassicCottrell design system — Red Hat
  Display (display and body), Rosarivo italic (editorial accents), a
  system mono stack (labels) — loaded only on site pages (gallery, home,
  docs). `pieces/` and `shared/` remain dependency-free; a baked export
  still runs offline.
- **The control panel's sliders are restyled as a ruler**: a tick-mark
  track, a hairline thumb, mono label and value in one row. Same native
  `<input type=range>`, same names/ids/events/persistence — a chrome-only
  change.
- `ROADMAP.md` is restructured around a gap analysis against an external
  reference collection. The chunk-by-chunk delivery history
  moved intact to `docs/roadmap-history.md`.
- Renamed seven pieces (ROADMAP Chunk 1.1). Rendering, defaults and presets are
  unchanged. `meridian` → `longwave`, `interference` → `moire` (titled
  Moiré), `accretion` → `infall`, `event-horizon` → `funnel`, `tether` →
  `mooring`, `synapse` → `relay`, `orbital-veil` → `orbitals`.
  **The old URLs break.** `pieces/<old>/` and `downloads/<old>.html` now
  return 404 for all seven, with no redirects or aliases, so update any
  copied link or embed to the new slug. Saved panel settings are stored in
  localStorage keyed by piece id, so any tuning saved for a renamed piece
  resets to that piece's defaults.

Entries for the work merged between 1.5.0 and this point are incomplete.
That includes the home page, the specimen-grid gallery, the docs pages,
Wake's configuration, and the piece refinement passes. Backfilling them is
a Phase 0 item in `ROADMAP.md`.

### Fixed

- The gallery no longer paints empty grid cells as solid grey blocks.
  Collections whose count doesn't fill their last row (Currents and
  Volumes have five, Codes has two) showed the grid's line-coloured
  background through every missing card. Each card and heading now draws
  its own 1px outline, so the hairlines look the same and empty cells stay
  page-coloured.
- `test-baked` and `test-bake-fresh` no longer flake on sparse pieces.
  Both measured one live frame after a 2.5s wall-clock wait, so
  `rainfall` passed or failed depending on how many drops happened to be on
  screen (3.91 against the blank floor of 4, once in CI). They now use the
  deterministic clock and RNG the build, the control audit and the
  interaction tests already use, stepped to the frame the build captures;
  `rainfall` reads 6.4 on every run.

## [1.5.0] — 2026-09-12

### Changed

- Removed the cursor-mode matrix from pieces. Wake is its separate optional
  successor at `interactions/wake.js`.

## [1.4.0] — 2026-09-10

### Added

- **Seven cursor-interaction modes on all twelve pieces**: None, Grow,
  Shrink, Particle Trail, Ripples, Attract, Vortex. `cursorInteraction`
  selects the mode and `pointer` (0-2, default 0) scales it; `modeFactor`
  in `shared/cursor-modes.js` is the single gate both read, so
  `cursorInteraction: 'None'` and `pointer: 0` are two independent ways to
  be off. Grow/Shrink/Attract/Vortex are literal per-mark scaling on the
  five pieces that stroke each element separately (`flow-field`,
  `grain-field`, `synapse`, `accretion`, `rainfall`) and amplification of
  the piece's existing local deformation on the seven that draw whole
  rings, ribbons and cables as single paths — canvas cannot vary stroke
  width within one path. Particle Trail and Ripples are one shared overlay
  in `shared/cursor-modes.js`, identical on every piece.
- `tools/test-cursor-modes.mjs` — drives every mode live on every piece and
  asserts no two render identically; run it before calling a piece's
  cursor wiring done (not yet wired into CI).
- `tools/mode-sheet.mjs` — paired None-vs-mode 1:1 crops, cropped to the
  cursor, for the visual review a diff percentage can't substitute for.
- `tools/test-bake-fresh.mjs` — bakes every piece live rather than reading
  committed `downloads/*.html`, so a bake regression is caught even when
  the artifacts themselves haven't been regenerated yet.

### Changed

- **The control panel is sectioned, restyled and usable on a phone.** Cursor
  interaction is now its own group, separated from background configuration.
  Sections collapse, with Interactions open by default so the panel fits on
  screen at rest, and "Reset to defaults" is a sticky footer rather than a
  button below an internal scroll.
- **Colour is authored with a picker** — a Solid/Gradient mode and one or two
  hex stops — instead of two raw hue sliders. Hue is still stored exactly
  behind the picker, because a hue survives a round trip through 8-bit hex
  only when `(hue mod 60)` is a multiple of 4, which fails for eleven of the
  twelve pieces. Rendering is unchanged: all 72 thumbnails are byte-identical.
- **Control gates address controls by name, not DOM position.** `setValue` is
  the panel's single write path and the audit drives it directly, so a
  dropdown, radio or colour picker is testable where an indexed
  `<input type=range>` query would have silently stopped working.
- Preset swatches no longer appear on the gallery homepage. Presets remain in
  each piece's panel and `?preset=<name>` links still work.

### Fixed

- **`npm run audit-controls` can fail.** It had no `process.exit` and always
  exited 0, so the CI step running it could report dead controls and still
  pass — for the whole life of the project.
- **Every piece declares a viewport meta tag.** None of the thirteen did, so
  a phone used a ~980px layout viewport and the panel's mobile rules could
  never match; the controls rendered as an unreadable corner card.
- **Drag-to-orbit moves the Pitch and Yaw sliders.** It previously held
  private state, so the panel displayed values that were not what the camera
  was rendering.
- **Baked exports inline the full shared-module import graph.** The inliner
  only walked each piece's own top-level imports, so the first
  shared-module-importing-a-shared-module (`shared/cursor-modes.js` pulled
  in by every piece) produced twelve blank exports. Fixed by walking the
  full import graph with a topological sort, so a shared module that
  itself imports a shared module inlines in dependency order.
- **`npm run audit-controls` ran mid-sequence in CI.** A failing
  `audit-controls` step aborted the job before five later gates ran, so a
  dead control could hide a real regression behind it. Moved to run last,
  so every other gate always reports regardless of whether the controls
  audit passes.

## [1.3.0] — 2026-09-07

### Added

- Pointer response on all twelve pieces, opt-in through the shared Pointer
  control and independent of animation Speed.
- Pitch and Yaw controls plus bounded drag-to-orbit on `wireframe-lattice`
  and `event-horizon`; shared Angle now provides camera roll on both.
- Source export on every piece, downloading the exact unbaked `index.html`.
- `npm run test-source`, covering every Source button and byte-comparing its
  download with the corresponding piece file.
- `npm run test-interactions`, covering animation, pointer response, orbit
  controls, and baked-artifact browser behavior.

### Changed

- Gallery preview pages disable drag-to-orbit so card interaction remains
  unambiguous.

## [1.2.0] — 2026-09-06

### Added

- **Five curated presets on every piece** — `whisper`, `ink`, `neon`, `drift`,
  `dense` — as a chip row at the top of each control panel. A preset map is
  partial and composes over the piece's own defaults, so switching between two
  presets never strands a control at the previous one's value.
- **`?preset=<name>`** opens a piece at a named preset. An unknown name is
  ignored and the piece opens normally.
- **A preset swatch strip on every gallery card**, five labelled links to that
  piece at that preset, captured at 240x150.
- **`tools/preset-sheet.mjs`**, a contact-sheet tool that renders one piece's
  presets side by side for curation review. It fails loudly on a panel that
  did not hide, a preset that throws, and a canvas that rendered blank.
- **A blank-canvas check on the swatch capture path.** `captureThumbnails`
  had one and so did the curation tool, but `captureSwatches` — which writes
  the sixty images the gallery displays — did not, so three black-tile
  swatches were produced with every gate reporting green.
- **Range validation** in `tools/test-presets.mjs`. A preset value outside its
  control's declared `min`/`max` was previously written straight into render
  state while the slider clamped only its own display, so the piece rendered
  past what the control claimed was possible and every gate passed it.

### Changed

- Preset curation now measures at 1280x800, the viewport the build ships.
  `tools/preset-sheet.mjs` had rendered at 640x400, where a sparse piece is
  roughly four times denser, so every preset was accepted against images that
  did not represent the shipped swatch. Nine pieces were retuned against
  measurements at the correct viewport.
- The build reads each piece's presets and default palette off the running
  page rather than parsing HTML. `readPieceDefaults`'s key-order-locked regex
  remains only as the fallback for `--verify-only`, which exits before a
  browser is launched.

## [1.1.0] — 2026-09-04

### Added

- **`rainfall`**, a twelfth piece: sparse vertical streaks descending at
  per-drop speeds and lengths, each fading from a bright head to a
  transparent tail, with an optional soft head glint. It is the first piece
  whose motion has a single clear direction rather than drifting or
  orbiting, and its near-achromatic palette fills the library's one
  remaining gap on the hue wheel.

## [1.0.0] — 2026-09-04

First public release.

### Added

- **Eleven generative line-art pieces**, each a single self-contained HTML
  file with no dependencies: `flow-field`, `contour-grid`, `interference`,
  `orbital-veil`, `grain-field`, `wireframe-lattice`, `meridian`, `synapse`,
  `accretion`, `tether`, `event-horizon`.
- **Thirteen shared controls** on every piece — scale, speed, stroke,
  opacity, saturation, hue, hue B, glow, angle, motion, phase, invert,
  density — plus a piece-specific control on each, with values persisted
  per piece and a reset.
- **Four export paths** per piece: a fully standalone baked HTML file with
  settings hardcoded and every shared module inlined; PNG at 2x and 4x; SVG;
  and a copyable description of the current settings.
- **Six shared modules** — simplex noise, colour conversion, an animation
  loop, the control panel, the export pipeline, and a 3D camera.
- **A gallery** at the repository root showing all eleven pieces, with
  previews that go live on hover or keyboard focus, category filtering, a
  copyable embed snippet, and a pre-baked download per piece.
- **Build tooling** generating the gallery, thumbnails and downloads from a
  `pieces.json` manifest, with verification that fails when the manifest,
  the pieces and the README disagree.
- **A control audit** (`npm run audit-controls`) that drives every piece and
  control combination and diffs rendered frames, catching controls that read
  a value without changing anything.
