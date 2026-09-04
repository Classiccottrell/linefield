# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
