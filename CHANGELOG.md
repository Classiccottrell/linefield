# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
