# House look — linefield v2

The target every piece is converted to in Phase 2 (see `ROADMAP.md`). It is
written so a piece can be checked against it, not admired by it. Where a
number appears it is a default to tune from, measured at the shipping
viewport (1280×800), not a law. A piece may break one rule if its chunk
says why.

The originality line in `ROADMAP.md` outranks everything here. This look is
our own. The reference is monochrome and fine-lined too, but never
open it to copy a composition. Write the piece's
one-sentence description first, from the brief below, and build toward
that sentence.

---

## 1. Palette: monochrome first

- **Ground:** `#0a0a0d`, unchanged.
- **Ink:** neutral near-white. The default is `saturation: 0`. Stroke
  lightness sits in the **0.82–0.90** range, replacing the old per-piece
  `0.55` constants. Brightness variation comes from alpha and accumulation
  (see §3), not from lowering lightness.
- **Colour is opt-in, never removed.** Every colour control keeps working,
  and the `neon` preset is where colour lives by default (see §6).
  `invert` still flips to dark ink on light ground.
- **Conformance:** the collection-metrics check fails any piece whose
  default render measures mean saturation **> 0.06** (Chunk 2.2).

## 2. Composition: one object, real empty space

- **One legible object.** A piece is a *thing* in the frame (a band, a
  knot, a funnel, a cloud), not a texture that runs off every edge. The
  object's extent should be about **45–75 % of the frame's shorter side**.
- **It must read in a square crop.** Gallery cards and stills are square,
  but the canvas is wide. Compose so the object sits inside the frame's
  central square, or clearly and deliberately crosses it.
- **Empty space is designed.** Every piece declares a **text-safe zone**,
  a region at least a third of the frame where no bright mark lands. Put it
  in the piece's header comment and in `pieces.json` (see §7).
- **Ink coverage** (the fraction of pixels marked, from `collection-metrics`):
  linework pieces between **0.03 and 0.15**. Home-page heroes (`rainfall`,
  `grain-field`) stay **≤ 0.035**.

## 3. Line craft: hairlines that build brightness

- **Hairline floor.** At `stroke: 1` a line is **0.4–0.9 px** wide. Weight
  comes from how many lines there are, not how thick each one is.
- **Enough lines to build form.** Linework pieces draw on the order of
  **80+ marks**. Seven ribbons or a handful of cables is the old look.
- **Additive accumulation.** Draw overlapping hairlines with
  `ctx.globalCompositeOperation = 'lighter'` at a low per-line alpha
  (about **0.06–0.35**), so wherever lines converge the image brightens on
  its own. Reset to `'source-over'` before clearing the frame, and before
  anything that must not add (text glyphs usually shouldn't). SVG export
  can't express `lighter`, and that's accepted: the export carries the
  geometry, and the brightness is a canvas property.

## 4. One luminous anchor

Each piece has a single brightest region: a convergence, a core, a tip or a
knot. Keep it small (well under about 5 % of the frame) and outside the
text-safe zone. It should *emerge* from line density where possible. An
explicit soft radial glow is a fallback, not the default. `glow` defaults
to 0 unless the anchor needs it.

## 5. Motion that reveals the form

Motion should make the object easier to understand, not just move it
around. The primary gesture is slow: a period of **8 s or more** at
`speed: 1`. No whole-frame drift. Speed, Motion and Phase stay independent,
as the principles in `ROADMAP.md` require.

## 6. Presets

Keep the five preset names, with these intents:

| Preset | Intent |
|---|---|
| `whisper` | Fewest, faintest lines. Suitable behind body text. |
| `ink` | Maximum contrast, no glow, still monochrome. |
| `neon` | **The colour preset.** A saturated two-stop gradient plus glow. The one place a default shows colour. |
| `drift` | Slower, more Motion, looser form. |
| `dense` | More lines and more accumulation, a brighter anchor. |

Every pair must still differ on at least two axes, and every preset must
still clear luminance variance 12.

## 7. Per-piece metadata

Add to each piece's `pieces.json` entry:

- `"safeZone"`: a short phrase such as `"left third"` or `"top band"`,
  naming where text can sit.
- `"anchor"`: a short phrase such as `"core, lower right"`, naming where
  the brightest region is.

The Phase 5 catalogue is generated from these, so they have to be accurate.

---

## Piece briefs

Each brief is the one-sentence description to build toward. It's written
fresh, without reference copy. The pieces marked **re-differentiate** had a
name or concept too close to a reference piece; for those, the brief *is*
the redesign, not a restyle.

| Piece | Brief | Notes |
|---|---|---|
| `longwave` *(re-differentiate)* | One band of 80–140 hairline traces riding a shared carrier wave across the frame on a shallow diagonal. The traces pinch together at nodes and fan apart between them, and the brightest node is the anchor. | Replaces seven thick ribbons. Text-safe zone: the corners the band doesn't cross. |
| `moire` *(re-differentiate)* | Two gratings of fine *parallel straight lines* inside one circular aperture, one rotating slowly against the other, so broad moiré bands sweep across the disc. | **No rings and no ripples.** The bands are the subject. The anchor is where the bands pinch. Text-safe zone: outside the aperture. |
| `infall` *(re-differentiate)* | Logarithmic-spiral streamlines of fine lines winding into a small, off-centre bright core. They brighten by accumulation as they converge. | **No concentric rings, and no dark eye.** The core is bright. |
| `funnel` *(re-differentiate)* | A funnel seen from the side: 60 or more stacked ellipses narrowing down to a point, slowly twisting, with the tip as the anchor. | **Not a bowl seen from above, not a grid well, not a void ringed by lines.** Keep Pitch/Yaw and drag-to-orbit through `shared/project.js`. |
| `mooring` *(re-differentiate)* | A single rope of 24–48 hairline strands twisted into a helix. It enters from one edge, throws one loose loop, and leaves by another; the loop's densest crossing is the anchor. | **No slack catenaries between anchors, and no rays from a point.** |
| `relay` *(re-differentiate)* | A branching network grown from one root into a single canopy-shaped silhouette. A pulse travels from root to tips, lighting each branch point as it passes. | **Not a sphere, and not a scattered field.** One silhouette, with a travelling pulse. |
| `globe` *(re-differentiate)* | A sphere described only by 40–70 latitude slices, tilted, brightening toward its limb, with no longitude lines and no bright pole. | Keep Pitch/Yaw. The anchor is the brightest limb arc. |
| `orbitals` | Many hairline arcs at differential rotation around one centre. Their overlaps accumulate into a slowly travelling bright crescent. | A rename only; the concept stays. |
| `flow-field` | Particles confined to one soft organic region around a quiet central void, trailing hairlines. | The "quiet central void" direction from PR #18 is fair game. It's our own work. |
| `contour-grid` | The contour lines of a single landform (one island, one summit), cropped as one object. The summit is the anchor. | Replaces edge-to-edge bands. |
| `grain-field` | Fine grain gathered into one soft drifting cloud with a long falloff, leaving a clear text-safe side. | A home hero, so ink ≤ 0.035. |
| `wireframe-lattice` | One finite lattice sheet with visible edges, floating and flexing, instead of a plane running to the horizon. | Keep Pitch/Yaw. |
| `rainfall` | Sparse vertical streaks with brighter heads, gathered in a veil that leaves the left third quiet. | A home hero, so ink ≤ 0.035. Mostly a palette conversion. |
| `lacuna` | Broken caustic arcs around an off-centre calm zone. | A palette and hairline conversion. The composition is already right. |
| `parallax` | Parallel diagonal lines parting around an invisible volume, with near lines heavier than far. | **Never let the lines radiate from a single point**, because that becomes a different, reference-adjacent idea. |
| `cipher-bloom` | A compressed oblique band of changing glyph fragments with a bright core. | Glyphs draw with `source-over`, not `lighter`. Palette conversion. |
| `driftwork` | Tangent-aligned ellipse links following two crossing currents. | Palette and hairline conversion. |
| `pleat` | Two folded bands of filled marks with a clean cut between them, in ivory only. | Filled marks, so accumulation is optional. Drop the coral. |

## What done looks like

A contact sheet of all 18 at the shipping viewport, square-cropped, reads as
one collection: monochrome, fine, one object each, with room to breathe.
Every piece passes the conformance check and the existing gate suite. And
none of them, described in one sentence, is also the description of a
reference piece.
