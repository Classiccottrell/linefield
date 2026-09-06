# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Range validation** in `tools/test-presets.mjs`. A preset value outside its
  control's declared `min`/`max` was previously written straight into render
  state while the slider clamped only its own display, so the piece rendered
  past what the control claimed was possible and every gate passed it.

### Changed

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
