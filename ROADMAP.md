# Roadmap

What is deliberately not built yet, and why. Everything here was considered
and deferred — none of it is an oversight.

Ordered roughly by how much it would add.

---

## Next up

No scheduled work. Pointer interaction, full 3D orientation, drag-to-orbit,
and exact Source export shipped in 1.3.0.

---

## Known limitations, accepted

These are real, understood, and judged not worth the fix today.

**Three residual control couplings.** `contour-grid`'s Speed does nothing
when Motion is 0, since all animation lives in the motion-scaled layer.
`meridian`'s Phase weakens at Sweep 0. `contour-grid`'s Phase is effectively
a horizontal translate. None is dead at default settings.

**SVG export ignores `angle`** for pieces that rotate via canvas transform
(`contour-grid`, `meridian`, `tether`) — their path points are recorded
before the rotation is applied, so an exported SVG shows unrotated geometry.
PNG export is unaffected. Fixing it properly means every rotating piece
baking its transform into stored points.

**`wireframe-lattice` at exactly Pitch 0** loses a little real geometry. The
camera's near plane sits at 20% of `fov` to keep SVG coordinates bounded,
and at a perfectly edge-on view that clips geometry which would otherwise
draw. Recoverable by making the near plane a per-camera option, which
`shared/project.js`'s options-bag design already allows.

**Baked downloads ship defaults.** The gallery's Download button hands over
each piece at its default settings, because the gallery cannot know what a
visitor tuned. Baking from inside a piece captures your own settings — the
card says so.

**Two parser fragilities in the build.** `readPieceDefaults` is a regex
locked to the key order `hue, hueB, saturation`; reordering yields a
confusing "has no defaults block" error rather than a wrong result. It is
now only the fallback for `--verify-only`, which exits before a browser
exists; a full build reads defaults and presets off the running page via
`collectPresets`, which is exact.
`readReadmeSlugs` scans the whole README rather than just the Pieces
section, so a future limitations bullet leading with a backticked slug would
be misread as a piece claim. Both fail loudly, neither fails silently.

---

## Collection constraints for a thirteenth piece

Measured across the twelve shipped pieces, from their generated thumbnails:
mean rendered hue (weighted by colourfulness), mean saturation, and ink
coverage — the fraction of pixels the piece actually marks.

| Hue | Sat | Ink | Piece |
|---:|---:|---:|---|
| 21 | 0.49 | 0.043 | `accretion` |
| 24 | 0.42 | 0.048 | `contour-grid` |
| 54 | 0.30 | 0.047 | `synapse` |
| 166 | 0.48 | 0.073 | `meridian` |
| 177 | 0.12 | 0.035 | `grain-field` |
| 200 | 0.34 | 0.107 | `wireframe-lattice` |
| 213 | 0.12 | 0.011 | `rainfall` |
| 235 | 0.24 | 0.066 | `tether` |
| 247 | 0.51 | 0.195 | `event-horizon` |
| 254 | 0.58 | 0.318 | `interference` |
| 261 | 0.90 | 0.341 | `flow-field` |
| 305 | 0.48 | 0.096 | `orbital-veil` |

**The hue wheel is nearly full.** Roughly 95–135 is the only open band, and it
abuts `meridian`. A new piece should differentiate on **form or density**, not
expect a free colour. `rainfall` is the worked example: it landed at hue 213,
in the most crowded band in the table, and still reads as distinct because at
saturation 0.12 the hue barely registers and its ink coverage is a third of
the next-sparsest piece.

**Ink coverage is the axis with the most room left.** Eight of the twelve sit
between 0.04 and 0.11. `rainfall` at 0.011 and `flow-field` at 0.341 are the
poles, and almost nothing occupies the middle-high range between 0.11 and
0.19.

**`meridian` and `tether` remain the weakest pair.** Found twice, by different
methods — once by comparing rendered frames pixel-by-pixel, once by looking at
every piece side by side. They are separated by hue and by crossing-versus-
parallel line structure, and hue is a slider a viewer can move. Anything new
in the sparse, heavy-stroked territory has to work harder.

## More pieces

[INSPIRATION.md](INSPIRATION.md) stubs out candidate pieces grouped by the
technique each needs — halftone (mark size encodes a field), masking (the
silhouette carries the composition), and radial fibre are the three the
library cannot currently do, and each would yield more than one piece.

## Later, if ever

- Publishing `shared/` to npm. Considered and declined for v1.0.0: six small
  dependency-free modules that pieces already inline, weighed against
  permanent version discipline and a second install path, for an audience
  that mostly wants to paste one HTML file. The modules are plain ES modules
  with no build step, so anyone who wants them can copy the folder.
- Framework wrappers (React / Vue / Svelte components)
- Framer and Webflow embed instructions
- Live parameter sharing via URL hash — a tuned piece becomes a link
- WebGL versions of the heavier pieces
- A community piece submission flow

---

## Principles worth keeping

**Every shared control must visibly affect every piece.** A control that
reads a value and changes nothing has shipped twice here — `tether`'s Scale
and `synapse`'s Scale — and both passed review, because the arithmetic
looked fine on paper. `npm run audit-controls` now drives all
piece × control combinations and diffs rendered pixels; run it after
touching any piece.

**A piece stays one file with no dependencies and no build step.** The
microsite has tooling; the pieces do not, and nothing in `pieces/` or
`shared/` may import anything generated. That boundary is what makes a baked
export paste-and-run.

**The skill file exists in two places and nothing keeps them in sync.**
`skills/building-generative-backgrounds/SKILL.md` ships with this repo, and a
byte-identical copy lives in the maintainer's personal skills directory so it
loads automatically outside this project. Edit one, copy to the other, and
`diff` them. If they ever drift, the repo copy is the source of truth.

**Judge at the viewport that ships.** `tools/preset-sheet.mjs` originally
rendered at 640x400 while `tools/build.mjs` renders at 1280x800. Pieces size
their canvas from `window.innerWidth` with a fixed base element count, so a
sparse piece is roughly four times denser in ink coverage at the smaller
viewport. Every one of the sixty presets was visually accepted against images
that did not represent the shipped swatch: `synapse`'s `whisper` measured 37.9
in the curation tool and 1.7 in the build, and three swatches shipped as black
tiles with every gate green. An instrument whose conditions differ from
production reports confidently and is wrong. Both now use 1280x800.

**Gate the path that ships, not just the path you look at.**
`captureThumbnails` had a blank-canvas variance check and so did the curation
tool, but `captureSwatches` — the path writing the sixty images the gallery
actually displays — did not. The check now lives in one helper called by both.

**A preset is judged by looking.** Sixty configurations were authored from
each piece's defaults and most were revised after seeing them rendered. Every
visual failure had the same shape: two presets differing only in degree.
`neon` and `dense` on `flow-field`, `drift` and `dense` on `interference`, and
`whisper`/`drift`/`dense` all three on `grain-field`. The fix is never a bigger
gap on one axis, it is a second axis. A preset that reads like its neighbour
is the same defect as a control that reads a value and changes nothing.

Measured luminance variance at the shipping viewport is the floor the curation
targets: every preset clears 12, three times the blank-canvas threshold of 4.
Tuning to just clear the gate is how the defect shipped the first time.

**A preset needing a control pinned at its limit is wrong, not tight.**
`grain-field`'s `whisper` sat at maximum density purely to clear the
blank-canvas check, which hid the problem instead of fixing it.

**Judge the collection, not just the piece.** The library once shipped five
pieces that were each individually correct and collectively looked like one
thing five times, because every review judged a piece against its own intent
and never against the others.
