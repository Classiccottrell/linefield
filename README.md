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

## Known limitations

- Piece defaults (including the default palette) can change between
  versions, but a saved localStorage value always outranks the piece's
  default. If a piece looks different from its documented palette, click
  "Reset to defaults" in its control panel to pick up the current default.

## License

MIT
