# Roadmap

What is deliberately not built yet, and why. Everything here was considered
and deferred — none of it is an oversight.

Ordered roughly by how much it would add.

---

## Next up

### Pointer interaction and 3D orientation

**Designed, specced, not built.** The cursor becomes a modulation layer over
the slider state: sliders set the base, the pointer modulates around it. A
fourteenth shared control (`pointer`, default 0 — off, because these are
backgrounds) scales the response, and each piece maps the cursor to
something in its own vocabulary rather than a uniform warp.

The same work replaces the two 3D pieces' overloaded `angle` control with
proper axis rotation — `angle` becomes roll, `rotX`/`rotY` become pitch and
yaw — plus drag-to-orbit, disabled inside gallery previews so a drag never
fights a card's click-to-open.

Deferred so the library could ship first. Adding to something unshipped is
worth less than shipping it.

### "Source" export button

The original design called for five export buttons; four shipped. "Source"
would hand over the piece's unbaked source rather than a baked artifact —
useful for someone who wants to modify rather than embed.

### Presets

Curated starting points per piece: five or six good-looking configurations a
viewer can flip through, rather than everyone starting from the same
defaults and hunting.

Worth being precise about a naming collision: `pieces/_template/` is a
*code scaffold* for forking a new piece. It is not a preset, and nothing in
the project currently stores a named set of control values.

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

**`wireframe-lattice` at exactly Tilt 0** loses a little real geometry. The
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
confusing "has no defaults block" error rather than a wrong result.
`readReadmeSlugs` scans the whole README rather than just the Pieces
section, so a future limitations bullet leading with a backticked slug would
be misread as a piece claim. Both fail loudly, neither fails silently.

---

## Collection constraints for a twelfth piece

**The hue wheel is nearly full.** Measured mean hues across the eleven:
24, 26, 55, 136 (achromatic), 165, 199, 236, 247, 257, 273, 306. Only
roughly 95–135 is open, and it abuts `meridian`. A twelfth piece should
differentiate on **form or density**, not expect a free colour.

**`meridian` and `tether` are the weakest pair.** Found twice, by
different methods — once by comparing rendered frames pixel-by-pixel, once
by looking at all eleven side by side. Their motion energy (0.174 vs
0.176) and ink coverage (0.058 vs 0.060) measure nearly identical, and the
6-vs-7 element difference is invisible because tether's heavier stroke
cancels its lower count. They are separated by hue and by crossing-versus-
parallel line structure — and hue is a slider a viewer can move. Anything
new in the sparse, heavy-stroked territory has to work harder.

---

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

**Judge the collection, not just the piece.** The library once shipped five
pieces that were each individually correct and collectively looked like one
thing five times, because every review judged a piece against its own intent
and never against the others.
