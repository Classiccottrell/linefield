# linefield

Open-source, self-hosted generative line-art backgrounds. Paste a single
HTML file into any site to get an interactive, animated line-art
background — no dependencies, no build step.

## Usage

Serve the repo root with any static file server (required — ES module
scripts fail over `file://` in every browser) and open a piece from there,
not from inside its own folder, since pieces import shared code via
`../../shared/*.js`:

```bash
npx serve .
```

Then open `http://localhost:<port>/pieces/flow-field/` (swap in any piece
name).

Use the on-screen control panel to tune the piece, then click "Baked HTML"
to export a standalone file with your settings hardcoded, the panel
removed, and all shared code inlined — paste that file's contents into any
site with no other files required.

PNG export offers 2x and 4x resolution buttons.

## Gallery

`index.html` at the repo root shows all eleven pieces with live previews,
filtering, and per-piece downloads. Serve the repo and open `/`:

```bash
npx serve .
```

It is generated from `pieces.json` by `npm run build` — see "Gallery build
tooling" below and CONTRIBUTING.md.

## Pieces

- `flow-field` — organic flowing lines following a simplex-noise vector field
- `contour-grid` — topographic contour bands undulating like breathing terrain
- `interference` — two concentric ring families crossing to produce moiré
- `orbital-veil` — concentric orbital arcs with differential rotation
- `grain-field` — fine drifting grain, the subtlest piece; good behind text
- `wireframe-lattice` — rigid 3D wireframe grid rippling in perspective
- `meridian` — seven long ribbons sweeping the full width
- `synapse` — drifting nodes wired to their neighbours, pulsing
- `accretion` — matter spiralling inward to a bright core
- `tether` — a few heavy cables strung taut and swaying
- `event-horizon` — a polar grid bent inward by a gravity well

Every piece shares 13 controls (scale, speed, stroke, opacity, saturation,
hue, hue B, glow, angle, motion, phase, invert, density) plus its own
piece-specific control. `density` multiplies the piece's base element count.

## Adding a new piece

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Gallery build tooling

`pieces.json` is the manifest driving the gallery microsite (title, blurb,
tags, and the palette defaults each piece must match). `tools/build.mjs`
verifies it against `pieces/` and this README, then generates gallery
assets:

```bash
npm install
npx playwright install chromium   # one-time, for headless capture
npm run verify   # check pieces.json / pieces/ / README agree; no generation
npm run build    # verify, then regenerate thumbs/ and downloads/
```

`npm run build` produces `thumbs/<slug>.png` (a screenshot of each piece's
canvas, captured at 640×400) and `downloads/<slug>.html` (each piece's own
"Baked HTML" output, captured by clicking that piece's real export button,
never reimplemented) for all eleven pieces, then renders `index.html` at
the repo root from `tools/templates/gallery.html` and the manifest — the
gallery page itself, with live hover/keyboard previews, tag filtering, and
per-piece "Copy embed" / "Download" actions. All three (`thumbs/`,
`downloads/`, `index.html`) are committed.

## Known limitations

- Piece defaults (including the default palette) can change between
  versions, but a saved localStorage value always outranks the piece's
  default. If a piece looks different from its documented palette, click
  "Reset to defaults" in its control panel to pick up the current default.
- SVG export doesn't reflect the Angle control for pieces that rotate the
  whole scene via a canvas transform (`contour-grid`, `meridian`, `tether`):
  their path points are recorded before that rotation is applied, so the
  exported SVG shows the unrotated geometry. Use PNG export if you need the
  rotated view.

## License

MIT
