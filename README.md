# linefield

Open-source, self-hosted generative line-art backgrounds. Paste a single
HTML file into any site to get an interactive, animated line-art
background — no dependencies, no build step.

## Usage

Open `pieces/<name>/index.html` directly, or serve the folder with any
static file server (required for ES module imports to work over `file://`
in some browsers):

```bash
npx serve pieces/flow-field
```

Use the on-screen control panel to tune the piece, then click "Baked HTML"
to export a standalone file with your settings hardcoded and the panel
removed — paste that file's contents into any site.

## Pieces

- `flow-field` — organic flowing lines following a simplex-noise vector field
- `contour-grid` — topographic contour bands undulating like breathing terrain
- `interference` — two concentric ring families crossing to produce moiré
- `orbital-veil` — concentric orbital arcs with differential rotation
- `grain-field` — fine drifting grain, the subtlest piece; good behind text

Every piece shares 13 controls (scale, speed, stroke, opacity, saturation,
hue, hue B, glow, angle, motion, phase, invert, density) plus its own
piece-specific control. `density` multiplies the piece's base element count.

## Adding a new piece

Copy `pieces/_template/` to `pieces/<your-piece-name>/` (kebab-case) and
follow the comments in its `index.html`.

## Known limitations

- "Baked HTML" export currently hardcodes parameter values and removes the
  control panel, but still references `shared/*.js` via relative imports —
  the baked file must stay inside the `pieces/<name>/` folder structure (or
  you copy `shared/` alongside it) to run standalone. Full single-file
  inlining of shared modules is planned for a follow-up.

## License

MIT
