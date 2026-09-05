# Inspiration

Stubs for future pieces, grouped by the technique each would need rather
than by how they look. Nothing here is specified enough to build — these are
starting points, and each would get a proper "intended look" before anyone
writes code.

Seeded by a set of visual references. The motifs are generic (halftone,
perspective grids, spherical wireframes); the point is the *technique* each
implies, not reproducing any particular image.

---

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

- **`meridian-globe`** — longitude lines wrapping a sphere, converging to a
  bright point at the pole. Straightforward with the existing camera.
- **`node-sphere`** — `synapse`'s network mapped onto a sphere's surface, so
  connections follow curvature. Combines `network` + `orb` + `3d`.

**Caution, and it is a real one.** The library already has three `orb`-tagged
pieces (`orbital-veil`, `accretion`, `event-horizon`). Adding two more
spheres is the fastest route back to the failure this project already had
once, where five pieces were individually fine and collectively looked like
one thing. If only one sphere gets built, `node-sphere` is the better
choice — it is a network first and a sphere second.

### Perspective / geometric family

- **`corridor`** — one-point perspective tunnel of nested frames receding to
  a vanishing point, with grid walls. Rigid and architectural, closest
  relative is `wireframe-lattice`, but a tunnel reads very differently from
  a plane.
- **`drape`** — a grid sheet with a fold or curl running through it, like
  cloth. Honestly this is `wireframe-lattice` with a different displacement
  function; worth building only if the fold is dramatic enough to read as
  its own piece.

### Sparse / motion family

`rainfall` shipped from this family in 1.1.0.

- **`vortex-polygon`** — a polygon rotated and scaled incrementally so its
  edges trace a spiral. Pure straight lines producing an apparently curved
  form, which no current piece does.

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
