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

## Using a piece in your own site

Three routes, in the order most people want them.

### 1. Bake it (recommended)

Open a piece, tune it with the control panel, then click **Baked HTML**. You
get a single self-contained `.html` file with your settings hardcoded, the
control panel removed, and every shared module inlined. No dependencies, no
build step, nothing else to copy. Paste its contents into a page, or serve
the file as-is.

This is the primary path and the one the project is designed around.

### 2. Embed an iframe

If the piece is hosted somewhere, point at it:

```html
<iframe src="https://example.com/pieces/flow-field/"
        style="border:0;width:100%;height:100%"></iframe>
```

The gallery's **Copy embed** button produces exactly this. The piece stays
updatable and fully isolated from your page's CSS — but it is a frame, with
a frame's layout and accessibility implications.

### 3. Copy the folder

Take `pieces/<name>/` and `shared/`, keeping their relative positions, and
host both. Most control, most files. Useful if you intend to modify the
piece rather than just use it.

## Configuring a piece without the control panel

A piece checks for `window.__LF_BAKED_VALUES__` before it builds its control
panel. If that global is set, the piece renders with those values and no
control panel.

This is exactly what the Baked HTML export does, and you can do it by hand.
Open a piece's `index.html` (or a baked file) and add one script **above**
the existing `<script type="module">`:

```html
<script>
  window.__LF_BAKED_VALUES__ = {
    scale: 1, speed: 0.6, stroke: 1, opacity: 1,
    saturation: 0.5, hue: 210, hueB: 260,
    glow: 0, angle: 0, motion: 1, phase: 0,
    invert: false, density: 0.8,
  };
</script>
```

It has to come first: the piece reads the global while its module script is
evaluating, so a script placed after it runs too late.

The global suppresses the control panel only. A piece's export-button row
(`Baked HTML`, `PNG`, `SVG`, `Copy AI Prompt`) is static markup in
`index.html`, so hand-setting the global leaves it on screen — the Baked
HTML export removes it separately, along with anything else marked
`data-lf-panel`. Delete or hide that `<div class="lf-export-row">` if you
are configuring a piece by hand and don't want it visible.

Every one of the 14 shared controls may be set this way, plus any
piece-specific control — check that piece's `extraControls` for its names.
But unlike the real Baked HTML export, which always writes every control's
current value, a hand-written object is used as-is: it is not merged with
the piece's defaults. Any control you omit reads as `undefined`, which
breaks rendering (an untuned canvas, no visible strokes) rather than
falling back to a default. Set every control the piece defines — copy the
full list above and edit values, don't trim it. Unknown keys are ignored.

## Presets

Every piece ships five curated starting points, shown as a chip row at the top
of its control panel: whisper, ink, neon, drift, dense. The names mean the same
intent on every piece; the values are tuned per piece, because a saturation
that flatters `grain-field` is wrong for `flow-field`.

A preset is a partial set of controls composed over that piece's own defaults,
not a full snapshot. Anything a preset does not name falls back to the piece's
default, so switching between two presets never leaves a control stranded at
the previous one's value. This is deliberately the opposite of
`window.__LF_BAKED_VALUES__`, which is used exactly as given.

Open a piece at a preset directly with `?preset=<name>`, for example
`pieces/meridian/?preset=ink`. An unknown name is ignored and the piece opens
normally, so a stale link still works. Moving any slider clears the active
chip, since the configuration is no longer that preset. Picking a preset
persists like any manual tuning, and "Reset to defaults" still returns to the
piece's own defaults.

The gallery shows all five as a strip of labelled swatches under each card.

## Gallery

`index.html` at the repo root shows all twelve pieces with live previews,
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
- `rainfall` — sparse vertical streaks falling at varying speeds, each with a brighter head

Every piece shares 14 controls (scale, speed, stroke, opacity, saturation,
hue, hue B, glow, angle, motion, phase, invert, density, pointer) plus its
own piece-specific control. `density` multiplies the piece's base element
count. `pointer` scales the piece's cursor response (0 by default, opt-in);
as of this writing `flow-field`, `contour-grid`, `interference`,
`orbital-veil`, `grain-field`, `wireframe-lattice`, and `meridian` read it —
the rest read the value and ignore it until wired.

## Adding a new piece

See [CONTRIBUTING.md](CONTRIBUTING.md).

## The skill

The craft this library was built on ships with it, as a Claude Code skill:
the constants that render wrong with their real numbers, what counts as
verifying a piece rather than reasoning about it, and the gate for judging a
collection instead of one piece at a time.

Install it:

```bash
mkdir -p ~/.claude/skills/building-generative-backgrounds && \
  curl -fsSL https://raw.githubusercontent.com/Classiccottrell/linefield/main/skills/building-generative-backgrounds/SKILL.md \
  -o ~/.claude/skills/building-generative-backgrounds/SKILL.md
```

Read it at [skills/building-generative-backgrounds/SKILL.md](skills/building-generative-backgrounds/SKILL.md),
and see [TESTING.md](skills/building-generative-backgrounds/TESTING.md) for the
runs it was written against. It applies to generative canvas work anywhere,
not only to this repo.

## Gallery build tooling

`pieces.json` is the manifest driving the gallery microsite (title, blurb,
tags, and the palette defaults each piece must match). `tools/build.mjs`
verifies it against `pieces/` and this README, then generates gallery
assets:

```bash
npm install
npx playwright install chromium   # one-time, for headless capture
npm run verify          # check pieces.json / pieces/ / README agree; no generation
npm run build            # verify, then regenerate thumbs/ and downloads/
npm run audit-controls   # empirically check every shared+piece control moves pixels
node tools/test-presets.mjs <slug>   # preset mechanism + value range gate
npm run test-baked       # every downloads/*.html renders standalone, no shared/ present
node tools/preset-sheet.mjs <slug>   # render a piece's presets for review
```

`npm run build` produces `thumbs/<slug>.png` (a screenshot of each piece's
canvas, captured at 640×400), `thumbs/<slug>.<preset>.png` (sixty preset
swatches at 240×150) and `downloads/<slug>.html` (each piece's own
"Baked HTML" output, captured by clicking that piece's real export button,
never reimplemented) for all twelve pieces, then renders `index.html` at
the repo root from `tools/templates/gallery.html` and the manifest — the
gallery page itself, with live hover/keyboard previews, tag filtering, and
per-piece "Copy embed" / "Download" actions. All three (`thumbs/`,
`downloads/`, `index.html`) are committed.

`tools/audit-controls.mjs` drives every control on every piece between
points across its full range with a seeded RNG and a manually-stepped
clock (so two identical-settings renders are pixel-identical — no noise
floor to reason about), then diffs sampled canvas pixels. It flags a
control DEAD if no pair of test points produces a visible change. Two
pieces have shipped a control that read a value but changed nothing
(`tether` and `synapse`'s Scale) — both passed per-piece review by
inspection alone, which is why this exists as a script instead of a
one-off check.

The gallery's live hover/keyboard preview loads pieces with `?preview=1`.
`shared/controls.js` checks for that flag and, when present, skips both
reading and writing `localStorage:<pieceId>` — so the preview always
renders a piece's defaults, never a visitor's own tuned settings from a
direct visit to that piece. A piece opened directly, with no query string,
persists exactly as before.

## Roadmap

[ROADMAP.md](ROADMAP.md) records what is deliberately not built yet and why,
the limitations accepted along the way, and the constraints any new piece
inherits.

## Performance

All pieces hold 60fps at their default settings on ordinary hardware. The
two heaviest were measured at their worst case — `synapse` at density 2.0
with reach 200, and `accretion` at density 2.0 — and both held 60fps.

What costs the most, in order:

- **Density** multiplies element count directly and is the control most
  likely to cost you frames.
- **Glow** draws each stroke twice. It used to use canvas `shadowBlur`,
  which costs a blur pass per draw call and took `grain-field` from 60fps to
  2.7fps; it is now a wider, dimmer underlay stroke instead, which is
  cheap enough to leave on.
- **Connection-based pieces** — `synapse` links each node to its neighbours.
  It uses a uniform spatial grid rather than checking every pair, without
  which it would degrade quadratically as density rises.

One thing that is not a performance problem but looks like one: browsers
throttle animation in background tabs, so pieces that build their image from
accumulated trails — `flow-field`, `accretion` — look wrong if you switch
away and back. They recover within a second.

## Browser support

Tested by loading every piece and the gallery in each engine and checking
that the canvas draws, keeps changing, and logs no errors. Run via
`node tools/browser-matrix.mjs`; see that script for exactly what it checks.

| Engine | Version tested | Pieces | Gallery |
|---|---|---|---|
| Chromium | 151.0.7922.34 | 12/12 | 12 cards, 10 chips, hover-query=true, clipboard=true, 0 errors |
| Firefox | 153.0 | 12/12 | 12 cards, 10 chips, hover-query=true, clipboard=true, 0 errors |
| WebKit | 26.5 | 12/12 | 12 cards, 10 chips, hover-query=true, clipboard=true, 0 errors |

All three engines were installed locally and actually launched — nothing in
this table is inferred. Measured with Playwright's bundled engine builds,
headless, on macOS arm64, served over `http://localhost`. Playwright's
WebKit is a WebKit checkout, not Safari, and its Chromium is not a Chrome
release build — read the rows as engine-level evidence, not as a claim
about a specific shipped browser.

Not tested, but inferred from what the code uses — Canvas 2D, ES modules,
`URLSearchParams`, `matchMedia('(hover: hover)')` — any browser released
since roughly 2020 should work. Older browsers without ES module support
will not.

Two things to know:

- **Copy embed needs a secure context.** `navigator.clipboard` is
  unavailable over plain `http://` on a non-localhost host, so the gallery's
  copy button will not work on an insecurely served deployment. (Tested here
  over `http://localhost`, which counts as a secure context — that's why
  `clipboard=true` above; a non-localhost `http://` deployment was not
  tested and would show `clipboard=false`.)
- **A piece opened directly from the filesystem will not run.** ES module
  imports are blocked over `file://` in every browser. Serve the folder — a
  baked export has no such problem, since it inlines everything.

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
