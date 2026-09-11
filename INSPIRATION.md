# Inspiration

Stubs for future pieces, grouped by the technique each would need rather
than by how they look. Nothing here is specified enough to build — these are
starting points, and each would get a proper "intended look" before anyone
writes code.

Seeded by a set of visual references. The motifs are generic (halftone,
perspective grids, spherical wireframes); the point is the *technique* each
implies, not reproducing any particular image.

Additional candidates below are interpretations of a handwritten sketch;
ambiguous labels are kept uncertain rather than treated as specifications.

---

## Commissioned, not yet built

Five pieces requested directly. Unlike everything below, these were not
candidates to weigh — they were outstanding work, and all five have now
shipped: `puddle`, `globe`, `matrix code`, `chain haze` and `stock market`
(see below). ROADMAP's Next up has no scheduled work as a result.

**`globe`** — shipped. A real 3D lat/long wire sphere via
`shared/project.js`'s camera: latitude small-circles at radius `R·cos(lat)`
plus longitude great-circles converging at both poles, tagged `3d`/`geometric`
rather than `orb`. Distinct from `orbital-veil`, `accretion` and
`event-horizon` on structure, not just hue — all three are flat screen-space
discs squashed by a tilt factor; globe is genuine sphere geometry with a
scale-driven depth fade (`shared/project.js`'s projected `scale` sets
per-segment alpha, so the far hemisphere recedes) so it reads as a surface,
not a mandala. Grow/Shrink displace the mesh along its own radius (a bulge/
dent no orb piece has); Attract/Vortex stay screen-space, matching
`wireframe-lattice`. Phase bunches latitude spacing toward the equator
(vanishes at Phase 0, monotonic); Motion drives an axial wobble independent
of Speed's constant spin.

**`matrix code`** — shipped. A quantized column/row grid of `ctx.fillText`
glyphs (`ui-monospace, "SF Mono", Menlo, Consolas, monospace` — no
`@font-face`, no network font, so the baked single-file export renders
standalone anywhere), the library's first non-stroke mark. Not rainfall
wearing letters: rainfall is continuous-y streaks at random x with sway and
one fixed identity per drop; matrix code is a rigid, no-sway cell grid where
head position advances in whole glyph cells (discrete, not continuous) and
each cell's character churns on its own deterministic clock (a hash of
column/row/time-bucket, gated by `motion`) fully independent of the head
passing over it — the two motions never touch. `stroke` gets a glyph-native
reading (a `strokeText` outline pass scaled by the control, since there is
no `lineWidth` to hook on a filled character); `scale` drives font size and
therefore cell/column count; `density` narrows column width per
CONTRIBUTING's density convention rather than resizing a persistent array —
there is no persistent array, every cell is recomputed from `col`/`row`
indices each frame. SVG export required a small, additive change to
`shared/export.js`'s `exportSvg()`: an optional `texts` array of
`{x, y, ch, size, fontFamily}` rendered as native SVG `<text>` elements,
since a glyph has no line-segment geometry to export as a path — every other
piece still calls it with only `paths` and is unaffected. **Glyph marks are
now a capability the library has**, not just this one piece's technique; a
future text-based piece can reuse the same `fillText`/`strokeText`/`texts`
pattern instead of re-deriving it.

**`puddle`** — shipped. A bounded, organic interference field: nested closed
curves radius-displaced by the summed wave contributions of six emitters
(golden-angle spaced, deterministic), rather than rings centred on any one
source, so the pattern is genuine interference — crests crossing and
cancelling — not the shared Ripples cursor mode (one expanding ring from the
pointer) made permanent. The rim itself is an irregular, harmonic-perturbed
boundary that damps the wave toward its edge instead of reflecting or
tiling infinitely, which is the structural difference from `interference`.

**`chain haze`** — shipped. Lines of chains receding into the distance, built
from **repeated linked marks along a path** rather than a continuous stroke —
the library's first repeated-linked-mark piece. Each chain is a sequence of
discrete stroked ovals walking a straight line toward its own vanishing
point (`FOV / (FOV + z)`, a scalar perspective divisor — not the shared 3D
camera, which is more machinery than a straight receding line needs); links
alternate a face-on ellipse (full width) and an edge-on ellipse (squashed to
~35% width) at ~30% spacing overlap, which is what reads as interlocking
links rather than a dashed/dotted line. Distinct from `tether` (one
continuous stroked cable per line, no discrete marks): Grow/Shrink scale
individual link size, matching `matrix-code`'s per-mark precedent, not
`tether`'s amplify-an-existing-deformation. Depth fade borrows `globe`'s
clamped-alpha shape but floors link scale at 0.38 so recession is carried by
alpha and perspective bunching, never by shrinking a link below legibility.

**`stock market`** — shipped. **Filled rectangle marks**, which no piece
drew before this one — the library's first. It was the only candidate here
whose subject is representational, which ROADMAP flagged as worth settling
before it was built. Resolved the same way `globe` resolves "sphere without
being literal continents": several independent tracks of bars, each marching
and growing up or down from its own mid-line, with no axis, no gridline, no
price label and no single fixed baseline. The structural cue that reads as
"trading chart" (discrete bars, up/down state by colour and direction,
continuous marching motion) survives; everything that would anchor it to a
specific instrument or screenshot does not. Grow/Shrink scale a bar's own
height/width, matching `matrix-code`'s per-mark precedent, not `chain-haze`'s
per-link one only because there is no chain here — each bar is its own mark,
independently addressable, same category as a glyph cell. Height and up/down
state are a deterministic hash of (track, column, time-bucket) — no
`Math.random`, no persistent array — read against the previous bucket's hash
of the same function, so the "previous price" needs no stored state, only
the same discipline `matrix-code`'s glyph churn and `chain-haze`'s march
already established.

## Techniques the library doesn't have yet

Three of these families need a capability no current piece has. Those are
the interesting ones — a new technique yields several pieces, while a new
arrangement of existing technique usually yields one.

### Halftone — mark *size* encodes a field

Every current piece varies position, colour and stroke weight. None varies
the **size of a repeated mark** to encode a value. That single addition
opens a whole family, and it reads completely differently from line art at a
glance.

- **`halftone-sphere`** — dots on a sphere, size driven by lighting or
  depth, so a 3D form emerges from a flat grid of dots. Would use
  `shared/project.js`.
- **`halftone-torus`** — the same idea on a ring, where the dot grid and the
  ring's curvature beat against each other and produce moiré for free. This
  is `interference`'s optical territory reached by a different route.

Shared need: a dot-grid renderer where radius is a function of a field.
Worth building once and using twice.

### Masking — the shape is the subject

**`grain-mask`** — a dense noise field clipped to a shape (an arch, a pill,
a column) with a luminance gradient across it. `grain-field` already makes
the texture; what is new is that the *silhouette* carries the composition
rather than the marks being spread edge to edge.

Needs clipping paths and a gradient-driven density or brightness ramp.
Probably the cheapest new technique here, and it makes every existing
particle piece re-usable inside a shape.

### Radial fibre — many short strokes on a common centre

**`filament-ring`** — a void ringed by thousands of fine, slightly
misaligned strokes, like iron filings round a magnet or brushed fur. Dense
and directional where `event-horizon` is sparse and geometric, so the two
would not collide despite both having a hole in the middle.

Needs cheap per-stroke jitter at high count — closer to `grain-field`'s
budget than `synapse`'s.

---

## Extensions of technique already present

These reuse what exists and would be faster to build, but each adds less.

### Spherical / orb family

- ~~**`meridian-globe`** — longitude lines wrapping a sphere, converging to a
  bright point at the pole.~~ Built as `globe` (see "Commissioned, not yet
  built" above) — latitude rings included as well, not longitude alone.
- **`node-sphere`** — `synapse`'s network mapped onto a sphere's surface, so
  connections follow curvature. Combines `network` + `orb` + `3d`.

**Caution, and it is a real one.** The library already has three `orb`-tagged
pieces (`orbital-veil`, `accretion`, `event-horizon`) plus `globe`
(`3d`/`geometric`, deliberately not tagged `orb`). A `node-sphere` would be
the fourth sphere-shaped piece regardless of its tag — weigh that against
the failure this project already had once, where five pieces were
individually fine and collectively looked like one thing, before adding it.

### Perspective / geometric family

- **`corridor`** — one-point perspective tunnel of nested frames receding to
  a vanishing point, with grid walls. Rigid and architectural, closest
  relative is `wireframe-lattice`, but a tunnel reads very differently from
  a plane.
- **`drape`** — a grid sheet with a fold or curl running through it, like
  cloth. Honestly this is `wireframe-lattice` with a different displacement
  function; worth building only if the fold is dramatic enough to read as
  its own piece.
- **Hanging perspective strokes (name uncertain)** — chain-like or hanging
  vertical marks diminishing toward a horizon. The handwriting is ambiguous;
  intended silhouette and whether strokes connect need clarification.

### Sparse / motion family

`rainfall` shipped from this family in 1.1.0.

- **`vortex-polygon`** — a polygon rotated and scaled incrementally so its
  edges trace a spiral. Pure straight lines producing an apparently curved
  form, which no current piece does.
- **Ripple rings** — concentric rings pulsing asynchronously rather than as a
  single synchronized wave. Needs an intended-look spec to distinguish it
  from `interference` and `orbital-veil`.
~~**Candlestick field** — stock-market-style vertical bodies and wicks
across the canvas.~~ Built as `stock market` (see "Commissioned, not yet
built" above) — filled bars rather than open/high/low/close bodies-and-wicks,
the abstraction the representational-subject tension there resolved to.

### Interaction vocabulary from the sketch

The top network drawing suggests four reusable pointer behaviours: repulsor,
attractor, ripple, and vortex. These are interaction vocabulary, not four
committed pieces.

Other sketch marks appear to overlap existing candidates: sphere studies map
to `halftone-sphere` or `node-sphere`, the tunnel maps to `corridor`, and the
stone-like field may map to `grain-mask`. The last match is uncertain.

---

## Constraints anything new inherits

From `ROADMAP.md`, repeated here because they bite hardest when adding
pieces:

**The hue wheel is still nearly full.** Roughly 95–135 remains the only open
band, and it abuts `meridian` at 166. `rainfall` did not take it — it went
near-achromatic (sat 0.12) and differentiated on density instead, which is
exactly what this constraint asks a new piece to do. Differentiate on **form
or density**, not on a free colour.

**Every shared control must visibly affect every new piece.** Two pieces have
shipped with a control that read a value and changed nothing, both passing
review because the arithmetic looked right. Run `npm run audit-controls`.

**Judge it against the other twelve, not just against its own intent.** That
is the check that catches a piece which is individually good and
collectively redundant.

---

## Rough ranking

If the goal is maximum variety per unit of work:

1. **`grain-mask`** — cheapest new technique, unlocks masking for every
   existing particle piece
2. **`halftone-sphere`** — new mark vocabulary, and the dot-grid renderer
   pays for itself twice
3. **`corridor`** — strong distinct silhouette, reuses the camera
4. **`filament-ring`** — striking, but density tuning will be fussy
5. **`vortex-polygon`** — curves from straight lines is a good trick
6. **`node-sphere`** — only if the orb crowding is accepted deliberately
7. **`drape`** — likely too close to `wireframe-lattice` to earn a slot
