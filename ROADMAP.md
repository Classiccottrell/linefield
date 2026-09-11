# Roadmap

What is deliberately not built yet, and why. Everything here was considered
and deferred — none of it is an oversight.

Ordered roughly by how much it would add.

---

## Next up

### Five new pieces

Specified and not yet built. These came from a direct request and are the
outstanding work on the library:

- **globe** — a wire mesh of horizontal and vertical lines bending inward to
  read as a spinning globe.
- **matrix code** — dripping columns of symbols that continually change.
- **puddle** — a rippling puddle.
- **chain haze** — lines of chains receding into the distance.
- **stock market** — rising and falling movement with buy and sell
  rectangles, reading as a trading chart.

Each inherits the constraints in [INSPIRATION.md](INSPIRATION.md) and must
honour all thirteen shared controls, all seven cursor modes, and the
collection review before shipping. `matrix code` and `stock market` need a
capability the library does not have yet — glyph and rectangle marks rather
than strokes — so each of those is closer to a new technique than a new
arrangement.

Pointer interaction, full 3D orientation, drag-to-orbit and exact Source
export shipped in 1.3.0. Seven cursor-interaction modes across all twelve
pieces shipped in 1.4.0. The sectioned control panel, colour picker and
mobile sheet shipped alongside.

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

**Shrink cannot read on marks that are already near sub-pixel width.**
`grain-field` and `synapse` draw their finest strokes close to the width
floor a browser can render distinctly, and Shrink narrows from there.
Widening the falloff radius was tried on both and did not help — it
enlarges the affected area without deepening the effect, so the marks
inside it dim rather than visibly narrow. Left as a limitation rather than
a bug: the mode is wired correctly and reads on the other ten pieces.

**`rainfall`'s Vortex reads as lateral wind, not rotation.** A drop's
vertical position is time-driven rather than angle-driven, so only the
horizontal component of the tangential motion a true vortex would apply is
expressible in the draw model — the construction underneath is a genuine
rotation, but nothing vertical can carry it. Fixing this means giving
`rainfall` a second, angle-driven vertical term specifically for Vortex,
which no other mode on this piece needs.

**`flow-field`'s Grow/Shrink are invisible at Speed 0.** Both modes act
only on `lineWidth`; flow-field draws each particle as a segment from `p.x`
to `p.x + cos(angle) * 260 * values.speed * dt`, so at Speed 0 that segment
has zero length, and a zero-length butt-capped stroke draws no pixels at
any width. `tools/test-interactions.mjs`'s widened Speed-0 loop (added
2026-09-11) measured this at 0.000% and excludes it explicitly via
`SPEED0_KNOWN_DEAD`, with the same measurement recorded in that file's own
comment — every OTHER piece clears the 0.05% floor under identical
conditions (Grow 0.249-24.274%, Shrink 0.206-3.602%), so this is
flow-field's draw model specifically, not a gate set too high. In the
letter of CONTRIBUTING's contract this IS cursor response
gated on `speed` — not through `modeFactor`, which is unaffected, but
through the absence of any geometry for a wider line to apply to. Fixing it
means giving flow-field a minimum segment length (or a dot fallback) when
`values.speed` is 0, which changes rendered output and needs its own
`npm run build` and visual review — deferred, not fixed in this pass.

**`pieces/_template/` has no automated coverage at all.** It is excluded
from `pieces.json`, and every gate that derives its piece list from that
manifest — `tools/test-cursor-modes.mjs`, `tools/test-bake-fresh.mjs`,
`tools/test-presets.mjs`'s check 8 sweep, and the build's capture paths —
therefore never touches it. A regression in the scaffold that every new
piece is forked from ships uncaught; only `CONTRIBUTING.md`'s manual
"verify visually in a browser" step would catch it, and only if someone
happens to open the template itself rather than a piece copied from it.

**`accretion`'s Particle Trail reads boldest of the five per-element
pieces.** Its partial-clear fade compounds the overlay across frames — each
frame's marks blend with what the previous frame already drew, rather than
starting from a clean slate the way a full-clear piece does. Cosmetic,
unresolved.

**The Pointer-as-number assertion (`tools/test-interactions.mjs`) runs at a
thin margin on most pieces** — measured 2026-09-11 at 0.087-0.126% against a
0.05% floor on ten of twelve (the exceptions are the two accumulator
pieces: `flow-field` 15.309%, `accretion` 6.338%) — because it is pinned to
the deliberately faint Particle Trail overlay, chosen specifically so a
regression in a per-piece mode cannot masquerade as a Pointer failure (see
that assertion's own comment). A future retune of the overlay's tuning
(particle count, size, alpha) could flip many pieces' margins at once and
read as a Pointer regression across the board rather than what it actually
is. The widened Speed-0 loop added alongside this measurement inherits the
same fragility for its own Particle-Trail-at-Speed-0 case: 0.079-0.123% on
the same ten pieces, same floor, same overlay, same risk.

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

**A diff percentage is not visibility.** `event-horizon`'s Shrink changed
10.67% of sampled pixels and was invisible to a human, because the change
sat entirely within the disc's own silhouette. Conversely `rainfall`'s
Shrink measured twice the gate threshold and was invisible because only
about three of thirty drops fell inside the falloff radius. Every
threshold-based gate in this repo inherits this limit: it proves something
changed, never that anyone can see it.

**A review instrument must answer the question you are asking.** The first
collection sheets showed twelve pieces under one mode, full-frame. That
compares pieces to each other but never to their own baseline, and a
1280-wide frame squeezed into a grid column loses any local effect.
Rebuilt as paired 1:1 crops — None beside the mode, same seed and frame
count, cropped to the cursor. The earlier instrument produced a confident
"inconclusive" that the better one overturned in both directions. This
sharpens two entries above: "Judge at the viewport that ships" and "Judge
the collection, not just the piece" both assume the instrument shows what
it claims to; this is what happens when it doesn't.

**A named mode means one thing; the mechanism may differ.** Grow is
literal on five pieces and amplification on seven, because canvas cannot
vary stroke width within a single path. What keeps that honest is looking
at all twelve under each mode and asking whether they read as the same
intent — which no automated gate can answer.
