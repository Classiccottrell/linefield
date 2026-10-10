# Roadmap

The live plan for linefield. The delivery log for everything before
2026-09-27 (Chunks 1–18: the collection redesign, Wake, the home page, the
specimen-grid gallery, the docs pages, and the refinement passes) is archived
intact in [`docs/roadmap-history.md`](docs/roadmap-history.md). That file is
a record and is never edited to reflect later decisions.

Read this file before starting work, and update it in the same commit as the
work it describes. Work goes one named chunk at a time (see
[Delivery rules](#delivery-rules)).

---

## The reference, and the line we don't cross

This roadmap measures linefield against an external reference collection,
deliberately left unnamed in this repo. It sets out to meet that
collection's **craft bar**: its restraint, composition, line quality, and
presentation.

It does **not** set out to reproduce its **catalogue**. Concretely:

- Never reuse a reference piece name, description, alt text, preset name,
  still, or line of code.
- Never design toward a specific reference piece. If a new or reworked piece
  reads as "their X", that is a defect, the same as a control that changes
  nothing.
- Generic concepts are fine. Line art, wireframes, a hue slider, and a
  baked-HTML export are a genre, not a product. Naming and copy are ours.

**Known overlap.** Seven linefield piece names and one INSPIRATION stub
name collided with the reference. Chunk 1.1 renamed all eight (see its
table). An audit of INSPIRATION then retired several stubs that described
reference pieces outright (see INSPIRATION's originality audit). Several
live concepts were close as well (see Phase 1).

The avoid-list of reference piece names, and how to check a candidate name
against it, are kept out of this repo on purpose: in the maintainer's
untracked `.local/reference-avoid-list.md`. Check every new name there
before using it.

---

## Gap analysis (observed 2026-09-27)

Method: the reference's public material, compared against the live
gallery at <https://classiccottrell.github.io/linefield/> and
`npm run collection-metrics` on `main` at `6be3d9c`. This only covers what
was actually observed; nothing here is inferred.

| | Reference | linefield today |
|---|---|---|
| **Palette** | Monochrome white on near-black. One bright focal point per piece. Colour is available but is never the identity. | Every piece has an authored, saturated hue. 9 of 18 have mean saturation ≥ 0.30 (`flow-field` 0.80, `moire` 0.58, `funnel` 0.51). |
| **Composition** | One legible object, centred in a square frame, surrounded by a lot of empty space. | Many edge-to-edge fields: `contour-grid`, `longwave`, `relay`, `rainfall`, `grain-field`, `moire`. |
| **Line craft** | Hundreds of hairlines. Form emerges where they accumulate brightness. | Several pieces draw a few heavier strokes (`longwave`: seven ribbons; `mooring`: a handful of cables). |
| **Materials** | A second family of soft, film-grain lit volumes alongside the linework. | Line, dot, glyph, ellipse and rectangle marks only. No lit-volume technique. `grain-field` is sparse specks. |
| **Scale** | A much larger catalogue, grouped into named collections. | 18 pieces and a flat list of 15 tags. |
| **Packaging** | Ready-made stills of every piece, and a per-piece catalogue. | Five exports (Source, AI prompt, Baked HTML, PNG 2x/4x, SVG). Gallery thumbnails, but no stills pack and no collection-level catalogue. |
| **Presentation** | Art-first cards with one small label. Ruler-style sliders. A display face paired with a label face. | Cards carry a title, blurb, tags, three buttons and the same boilerplate paragraph. Standard range sliders. Monospace throughout. |

**The biggest delta is palette.** Next are composition and line craft.
All three show up in a single side-by-side glance, and closing them is what
most of this roadmap is for.

**Where linefield is already ahead, so keep it:** more shared controls (16).
Free and MIT. Wake. Drag-to-orbit on the 3D pieces. An
automated gate suite (control audit, fresh/committed bake, source export,
interactions, collection metrics) that the reference gives no sign of
having.

---

## Delivery rules

- **One named chunk at a time.** Each chunk ends with a preview, a short
  change summary, and an explicit list of anything unresolved. A finished
  chunk does not expand into the next one.
- **Run the gates before calling a piece done:**
  `node tools/build.mjs --verify-only`, `npm run test-bake-fresh`,
  `npm run test-baked`, `npm run test-source`, `npm run test-interactions`,
  `npm run audit-controls`. Regenerate `thumbs/` and `downloads/` with
  `npm run build`; never hand-edit generated output.
- **Judge the collection, not the piece.** Judge it at the shipping viewport,
  side by side with the rest of the collection. Check the originality line
  above too.
- **One branch and one PR per chunk, off current `main`.** The owner reviews
  and merges.
- **Concurrent agents get separate worktrees.** Sharing one directory has
  already cost uncommitted work once (see history, Chunk 11).

---

## Phase 0 — Baseline

- [x] `main` is clean at `6be3d9c`, and all 18 pieces are verified.
- [x] Codex's uncommitted Sep-24 continuation is preserved on
  `codex-uncommitted-work-sep24` and opened as draft **PR #18** for review.
  It is not merged: its `tether` (now `mooring`) rework converges on a
  reference piece, and it rewrites closed history.
- [x] The draggable control panel (PR #17, `53dcfe9`) is documented in
  README and CHANGELOG.
- [x] Chunk history is archived to `docs/roadmap-history.md`, and this
  roadmap is written.
- [x] `AGENTS.md` now points here instead of at the finished redesign
  (PR #5). It adds the originality rule, and requires every chunk to use
  its own worktree and leave nothing uncommitted. The owner signed off on
  2026-09-27.
- [ ] Backfill CHANGELOG for everything merged since 1.5.0, then cut a
  release. **Partially done:** all of `v2`'s own work (Phase 1 renames,
  Phase 2 conversion, Phase 3 presentation, Phase 4 materials, Phase 5
  packaging) now has entries under `[Unreleased]`. Still missing: the original home page and
  specimen-grid gallery (Chunk 8), Wake's promotion and configuration
  (Chunk 12), and the pre-`v2` piece refinement passes (Chunks 11/17) —
  all shipped before this restructure and never changelogged. Cutting the
  release is the owner's call, not bundled into this backfill.
- [x] Settle PR #18, by being overtaken rather than merged. Its `flow-field`
  "quiet central void" direction was independently rebuilt from scratch in
  Phase 2 (confirmed: the Phase 2 batch read the PR but didn't adopt its
  parametric-ribbon approach), and its `tether` rework is moot now that no
  piece is named `tether`. PR #18 can be closed unmerged; nothing in it is
  still needed.

## Phase 1 — Originality

### Chunk 1.1 — Rename the colliding pieces

For each of `meridian`, `interference`, `accretion`, `event-horizon`,
`tether` and `synapse` (and `orbital-veil`), choose a new original
name that isn't on the avoid-list (see "The reference, and the line we
don't cross"). Then carry the new slug through `pieces.json`, the piece
folder, README, the gallery, downloads, thumbs, both home pages, the docs
pages, the tests, the `collection-metrics` rows, and the INSPIRATION stub
that is now `void-ring`.

**Names: decided by the owner on 2026-09-27.** Checked on 2026-09-27
against the reference's published stills (method in the avoid-list). None
of the seven new names is there, and a known reference name is, as a
control. That's strong evidence rather than proof, since not every
reference piece has a public still.

| Today | Candidate | Why |
|---|---|---|
| `meridian` | `longwave` | Seven long ribbons sweeping the width |
| `interference` | `moire` | Names the effect itself: two ring families beating |
| `accretion` | `infall` | Matter falling inward to a bright core |
| `event-horizon` | `funnel` | A polar grid pulled down into a well |
| `tether` | `mooring` | Cables converging on one fixed point |
| `synapse` | `relay` | Nodes passing a pulse to their neighbours |
| `orbital-veil` | `orbitals` | Arcs turning at different rates around one centre |

**Old URLs: decided by the owner on 2026-09-27. They break.** No redirect
stubs and no aliases, which matches the redesign's precedent when it
removed five pieces. `…/pieces/<old-slug>/` and `…/downloads/<old-slug>.html`
will 404 after this chunk ships. Say so in the CHANGELOG entry, so anyone
with a copied embed has one place to find out why. The other options
considered were redirect stubs, and keeping the old slugs with new display
names.

**Finish line:** no linefield piece or stub shares a name with a reference
piece. Every internal link, test and doc uses the new slugs. The CHANGELOG
records the broken URLs.

**Status (2026-09-27): done.** The seven renames are merged into `v2`. The
stub whose name collided became `void-ring`, but an audit of INSPIRATION showed
that renaming stubs misses the point. `corridor`, `void-ring`,
`vortex-polygon`, `halftone-torus` and `node-sphere` each describe a
reference piece's *concept*, not just its name, and `halftone-sphere` and
`drape` sit too close. All seven are retired as struck-through record
entries. No live piece or live stub now shares a name with a reference
piece.

### Chunk 1.2 — Re-differentiate the close concepts

Renaming alone doesn't fix a piece that describes itself in the same
sentence as a reference piece. For each flagged piece, write its own
one-sentence description first, without looking at the reference's copy,
then change the dominant gesture wherever it still reads as the same idea.

Close today:

- `mooring`: slack cables between anchors.
- `relay` and `globe`: wire spheres with nodes, and a lat/long sphere.
  A reference piece is itself a longitude globe.
- `infall`: a concentric disc around a dark eye.
- `funnel`: a grid pulled into a well. That's close to a reference
  piece built from a grid draped into a bowl.
- `moire`: two ripple families.

Compare against the reference's descriptions to spot overlap, never to
borrow wording.

**Finish line:** each reads as its own idea, both at card size and in one
sentence.

**Status (2026-09-30): done, folded into the Phase 2 conversion.** Each
piece changed its dominant gesture, not just its copy (`5683367`,
`bc96383`, `e15832f`): `mooring` is one twisted rope rising into a loop,
with no cables between anchors; `relay` is a branching canopy grown from
one root, not a sphere; `globe` has latitude slices only, no meridians;
`infall` is streamlines spiralling into a bright core, not a dark eye;
`funnel` is seen side-on as narrowing ellipses, not a grid pulled into a
bowl; `moire` uses straight-line gratings, no ripples. The "Close today"
list above is the pre-conversion record.

## Phase 2 — Visual language: monochrome-first

### Chunk 2.1 — Write the house look

This is a short spec in `docs/`, not code. It covers:

- The default palette: near-white on `#0a0a0d`, with colour opt-in through
  the existing controls. Nothing is removed.
- One bright focal point per piece.
- A hairline stroke floor, and a density target where form comes from line
  count, not stroke weight.
- One legible object in the frame, with a declared text-safe zone.

**Status (2026-09-27): done.** `docs/house-look.md` (`73d8037`), including
a one-sentence brief per piece.

### Chunk 2.2 — A conformance check

Extend `npm run collection-metrics` so defaults that break the house look
fail loudly. Candidates are a default-saturation ceiling and an ink band.
Keep it to what the metrics already measure; no new instrument unless
needed.

**Status (2026-09-27): done.** `npm run collection-check` (`490b777`),
later made fair to monochrome pieces with a chroma floor (`30f9b50`).

### Chunks 2.3 onward — Convert the collection, ~3 pieces per chunk

- [x] Done, in six batches run in parallel worktrees, each independently
  gated and merged: `funnel`/`mooring`/`relay`; `longwave`/`moire`/`infall`;
  `globe`/`orbitals`/`wireframe-lattice`; `flow-field`/`contour-grid`/
  `grain-field`; `rainfall`/`lacuna`/`parallax`;
  `cipher-bloom`/`driftwork`/`pleat`. Every piece has a monochrome default,
  one object in the frame with real negative space, and hairline density
  built by additive (`'lighter'`) accumulation rather than lower lightness.

`rainfall` and `grain-field` are the home-page heroes. Their low ink stayed
load-bearing for headline legibility through the conversion (`rainfall`
ink 0.006, `grain-field` 0.029).

**Finish line: met.** `node tools/collection-metrics.mjs --check` passes
all 20 pieces, zero overrides. The contact sheet below reads as one
collection, confirmed both by individual-batch square-crop renders and a
direct side-by-side look.

**Two real bugs caught by the conversion gates, not shipped:**
`flow-field`'s Stroke control was dead on the default (no-glow) path —
`ctx.lineWidth` was only ever set inside the `glow > 0` branch. And
`parallax`'s lane offset grew with `t`, so every line implicitly passed
through one off-frame point — lines radiating from a single point, the
exact reference-adjacent shape this collection's originality line forbids.
Both were caught by the gates (`audit-controls`, and a by-eye preset-sheet
review) before merge, not after.

## Phase 3 — Presentation

- [x] **3.1 Art-first gallery cards.** The preview dominates. Name plus one
  small label. Buttons move into a hover/focus overlay on the card; the
  "download ships defaults" note is said once near the top of the grid
  instead of on every card.
- [x] **3.2 Type system.** Red Hat Display (display+body), Rosarivo italic
  (editorial accents) and the system mono stack (labels), sourced from the
  ClassicCottrell design system rather than the reference's typefaces. Loaded
  only on site pages (gallery, home, docs) — `pieces/` and `shared/` stay
  dependency-free. This is also the natural first step toward Forma
  alignment.
- [x] **3.3 A ruler-style slider** in `shared/controls.js`, our own design
  (tick-mark track, hairline thumb), covered by `audit-controls` for the
  write path and `test-presets.mjs`'s DOM-driven check for the real input.
- [x] **3.4 Collections.** `collections.json` groups the twenty pieces into
  five named collections (Currents, Volumes, Orbits, Surfaces, Codes),
  replacing the flat tag chips. `pieces.json` stays untouched; the build's
  `--verify-only` fails loudly on an unclaimed slug or an unknown one.
- [x] **3.5** Bring the home page (`home/quiet-drift`) and the docs pages
  onto the new look.

## Phase 4 — Materials and range

- **4.1 Grain / lit-volume technique.** This is a new capability: soft,
  film-grain shaded forms rendered in Canvas 2D with no dependencies.
  - [x] First piece: `dune`, a wind-shaped ridge of film grain under a low
    raking light. A heightfield is marched column by column in an oblique
    orthographic view into a half-resolution luminance buffer, shaded by one
    low directional light (Angle turns it). Each buffer pixel becomes a
    grain with a probability set by its light, hashed from (x, y, grain
    frame), never `Math.random`. The buffer is written through a
    `Uint32Array` view of ImageData and upscaled with `drawImage`, smoothing
    off. Grain is composed as `max(ground, ink)`, not blended, so faint
    grain carries no blue cast from the ground. About 7 ms a frame at
    1280×800, 60fps.
  - [x] SVG story, decided: export the line geometry only (the brink and the
    ripple lines as polylines). No embedded bitmap. See Known limitations.
- **4.2 Halftone.**
  - [x] First piece: `swell`, one ocean swell drawn in dots whose area
    carries the light. Deliberately not a sphere or a ring. Tone is carried
    by size at full alpha, and a hard tone floor keeps dark water empty.
    The light field is long along the lip and asymmetric across it, so dot
    sizes never form rings. Density sets the pitch and Angle the screen
    angle. Scale sizes the swell, because screen frequency and pitch would
    be one control twice. SVG exports each dot as a `<circle>` via
    `exportSvg()`'s additive `circles` option.
- **4.3 Masking** (`grain-mask`, with a shape of our own) comes next.
- **"Radial fibre" is dropped.** Every stub it held matched a reference
  piece (see INSPIRATION's audit).
- **Growth is by quality, not a count.** There is no target count. Every new
  piece clears the originality line and the collection constraints.
- [x] **Sketchbook round (2026-10-07).** Eleven throwaway composition
  studies, judged side by side; the strongest four became pieces, each
  built in its own worktree from its own brief: `contrail` and `bristle`
  (Currents), `louvre` (Volumes), `fracture` (Surfaces). A fifth study
  was dropped at the originality check rather than reworked. The other six
  stay unbuilt; none was strong enough as drawn.
- [x] **Framing pass (2026-10-10).** At full canvas (1280×800), 18 of 24
  pieces sat in about a third of the width with an empty border all round;
  the owner found the one-object framing too extreme. Rather than add a
  control, the existing Scale control is now the framing control
  (house-look §2 rewritten): it runs from contained to full canvas, and
  defaults are chosen at full canvas. Default Scale went up on 15 pieces:
  flow-field 1.75 (now a full-canvas field around a quiet centre);
  wireframe-lattice 1.8; driftwork, bristle, orbitals, contour-grid, relay
  1.6; globe, funnel, cipher-bloom 1.5; infall 1.4; moire, pleat 1.3.
  louvre and fracture were then reworked to drop their frames on the
  owner's review: louvre's slats run edge to edge under one beam, and
  fracture became one long crack across a full-bleed field; both default
  to Scale 1.8. Scale was made to widen flow-field, grain-field and cipher-bloom,
  where it previously did little or nothing, and contrail was recomposed so
  its tail sits in the square crop and Scale extends it. Left contained on
  purpose: moire and pleat (the 0.15 ink ceiling), grain-field (the 0.035
  home-page hero cap) and contrail (its text-safe zone). Eight safe-zone
  descriptions were rewritten after measuring the new renders.

## Phase 5 — Packaging

- [x] **5.1 Stills pack.** Square stills of every piece at its defaults,
  produced by the build and offered as one download. Done (`fa8c513`):
  `stills/<slug>.png` at 800×800, zipped to `stills.zip`, linked from the
  gallery intro.
- [x] **5.2 `catalogue.md`.** One entry per piece: what it looks like, what it's
  for, its text-safe zone and its own controls. It is generated from
  `pieces.json` plus per-piece metadata so it can't drift, and written in
  our own words. Done (`fa8c513`): controls come from each running piece's
  `window.__LF_SPECS__`, not a hand list.
- [x] **5.3 PNG export.** Check the size range and whether transparent-
  background export works. Close any gap. Checked (`fa8c513`): 1x/2x/4x is
  fine. Transparency doesn't work for any piece and isn't cheaply fixable,
  so it's recorded under Known limitations rather than closed.

## Later

- **Wake as its own product.** Previously Chunk 13, deferred until the core
  phases are done. The direction is decided: distinct interaction
  categories plus a composable toolkit, not more trail variations (see
  history).
- **Forma alignment.** A shared design system with `Projects/Forma`. Phase
  3.2's type system is the first real step.
- **ASCII art brought to life.** This builds on the glyph-mark capability
  in `cipher-bloom`.
- **Publishing `shared/` to npm.** Declined for v1.0.0. It's six small
  dependency-free modules that pieces already inline. Weighed against
  permanent version discipline and a second install path, for an audience
  that mostly wants to paste one HTML file, it wasn't worth it. Anyone who
  wants them can copy the folder.
- Framework wrappers (React / Vue / Svelte). Framer and Webflow embed
  instructions. Live parameter sharing via URL hash. A 3D shape layer. WebGL
  versions of the heavier pieces. A community submission flow.

---

## Collection constraints

Every row is **generated**, not hand-recorded. Run `npm run collection-metrics`
and paste its output here verbatim; it prints this exact table, already
sorted by ink. Rebuild thumbnails (`npm run build`) first, because it
measures the committed PNGs. Refreshed 2026-10-10, after the framing pass.

**Hue is no longer a useful column, and that's success, not a gap.** Every
piece now reports hue 240 — that's not a real colour, it's the ground's own
faint blue tint, because no piece has any real chroma left at its default.
Ink, not hue, is now the axis that tells pieces apart.

| Hue | Sat (raw) | Sat (check) | Ink | Piece |
|---:|---:|---:|---:|---|
| 240 | 0.13 | 0.00 | 0.006 | `rainfall` |
| 240 | 0.13 | 0.00 | 0.029 | `grain-field` |
| 240 | 0.12 | 0.00 | 0.037 | `lacuna` |
| 240 | 0.11 | 0.00 | 0.047 | `contrail` |
| 240 | 0.05 | 0.00 | 0.056 | `mooring` |
| 240 | 0.03 | 0.00 | 0.059 | `dune` |
| 240 | 0.05 | 0.00 | 0.064 | `relay` |
| 240 | 0.10 | 0.00 | 0.065 | `contour-grid` |
| 240 | 0.06 | 0.00 | 0.069 | `funnel` |
| 240 | 0.04 | 0.00 | 0.071 | `swell` |
| 240 | 0.06 | 0.00 | 0.083 | `bristle` |
| 240 | 0.09 | 0.00 | 0.087 | `orbitals` |
| 240 | 0.13 | 0.00 | 0.093 | `wireframe-lattice` |
| 240 | 0.12 | 0.00 | 0.098 | `louvre` |
| 240 | 0.09 | 0.00 | 0.100 | `fracture` |
| 240 | 0.09 | 0.00 | 0.108 | `flow-field` |
| 240 | 0.12 | 0.00 | 0.116 | `driftwork` |
| 240 | 0.05 | 0.00 | 0.118 | `pleat` |
| 240 | 0.08 | 0.00 | 0.118 | `cipher-bloom` |
| 240 | 0.08 | 0.00 | 0.135 | `infall` |
| 240 | 0.06 | 0.00 | 0.136 | `longwave` |
| 240 | 0.14 | 0.00 | 0.137 | `globe` |
| 240 | 0.12 | 0.00 | 0.138 | `parallax` |
| 240 | 0.08 | 0.00 | 0.141 | `moire` |

**Sat (check)** is what `collection-check` gates on (chroma-floored; see
Chunk 2.2), against the §1 ceiling of 0.06. It reads 0.00 for every piece:
once the floor discounts anti-aliased edges over the ground, no default
has any colour. **Sat (raw)** is the unfloored figure, kept for comparison
with older tables. An earlier copy of this table printed the raw figures
under the "check" label, hand-sorted out of ink order. The tool now prints
both columns, so the table can be pasted instead of assembled.

**`longwave` and `mooring`, the pair flagged as weakest before conversion,
now read distinctly.** `longwave` is a wide, flat, fanned band with pinch
nodes; `mooring` is a narrow twisted rope with one loop. Confirmed by a
direct side-by-side look at both, not just the metrics.

---

## Known limitations, accepted

These are real, understood, and judged not worth the fix today.

**Three residual control couplings — resolved by the Phase 2 rewrites,
not chased deliberately.** `contour-grid`'s draw loop was reworked for the
house look (rings around one summit instead of edge-to-edge bands, rotated
by an explicit per-point transform rather than `ctx.rotate`); its Speed now
reads `values.speed` directly, with no Motion dependency — verified by
reading the current source, not just trusting the batch report. `longwave`
replaced the old piece entirely; its Phase now offsets node position
directly (`sNode = sAnchor + values.phase * nodeGap * 0.5`), independent of
Sweep's carrier amplitude — the coupling's mechanism is gone, not just
quieter. Treat this bullet as closed; if a new coupling surfaces, open a
fresh one rather than reopening this text.

**SVG export ignores `angle`** for the one piece left that still rotates
via a canvas transform: `rainfall` (confirmed: `pieces/rainfall/index.html`
still calls `ctx.rotate`). `contour-grid`, `longwave` and `mooring` were
rewritten in Phase 2 to compute rotated points directly, so their exports
already match the canvas — confirmed by grepping all four for `ctx.rotate`
and finding it only in `rainfall`. Its path points are recorded before the
rotation is applied, so an exported SVG shows unrotated geometry. PNG
export is unaffected.

**`rainfall`'s Color A is fixed — no longer dead.** The Phase 2 conversion
bumped the glint dot's radius/threshold (for an unrelated reason: clearing
a luminance-variance floor at the new, fainter hairline alphas), which as
a side effect pushed Color A's diff over `audit-controls`' detection floor.
Confirmed with a fresh single-piece run: `LIVE, changed=0.181%` — well
clear of the ~0.06% floor other colour controls pass at, not the old
0.047%.

**`dune`'s SVG has no grain.** Film grain has no line geometry, so the
SVG carries the brink and the ripple lines as polylines and nothing else.
Embedding the grain as a bitmap would make the SVG a PNG in disguise. PNG
export carries the grain.

**`cipher-bloom` exports SVG `<text>`, not `<polyline>`.** A glyph has no
line geometry to export. `shared/export.js`'s `exportSvg()` takes an
additive `texts` option for this. Every other piece passes only `paths` and
is unaffected.

**`wireframe-lattice` at exactly Pitch 0** loses a little real geometry. The
camera's near plane sits at 20% of `fov` to keep SVG coordinates bounded.
This is recoverable via a per-camera near-plane option, which
`shared/project.js`'s options bag already allows.

**Baked downloads ship defaults.** The gallery can't know what a visitor
tuned. Baking from inside a piece captures your own settings.

**Two parser fragilities in the build.** `readPieceDefaults` is a regex
locked to key order. It's only the `--verify-only` fallback now; a full
build reads defaults off the running page. `readReadmeSlugs` scans the whole
README, not just the Pieces section. Both fail loudly, and neither fails
silently.

**PNG export has no transparent background, for every piece.** Checked for
Phase 5.3: the size range is fine as shipped (1x / 2x / 4x, via
`exportPng`'s `multiplier`), but transparency doesn't work and can't be
added cheaply. Every piece repaints the full canvas opaque each frame —
`flow-field` with `ctx.fillRect(0, 0, W, H)`, `dune` with `ctx.drawImage()`
of an opaque grain texture — because the accumulation trail (and the grain
technique) needs a full repaint to work at all; `clearRect` would erase the
trail instead of fading it. `canvas.toBlob('image/png')` faithfully exports
what's actually on the canvas, so there's no transparent region to export.
Giving every piece a real alpha channel means tracking ink separately from
background through each one's own compositing — a render-architecture
change across every piece, not a Phase 5 packaging fix. Not chased here.

**`flow-field`'s still isn't byte-stable across rebuilds.** Two back-to-back
builds on 2026-10-05 produced identical thumbnails, downloads, gallery and
catalogue, and identical stills for 19 pieces. `stills/flow-field.png`
differed, so `stills.zip` did too. Its half-scale thumbnail is stable, so
the cause is something in the full-resolution capture, not yet
diagnosed. The cost is a spurious diff on those two files after a rebuild;
revert them if `flow-field` wasn't touched. The zip itself is
deterministic (pinned timestamps, sorted entries).

**`pieces/_template/` has no automated coverage.** It's excluded from
`pieces.json`, so every manifest-driven gate skips it. Only CONTRIBUTING's
manual "verify in a browser" step would catch a regression in the scaffold
every new piece is forked from.

---

## Principles worth keeping

**Match the reference's bar, not its catalogue.** Its quality is the target.
Its pieces, names and words are not. If a piece reads as "their X", it isn't
finished.

**Every shared control must visibly affect every piece.** A control that
reads a value and changes nothing has shipped twice here (`mooring`'s Scale
and `relay`'s Scale), both passing review because the arithmetic looked
fine. `npm run audit-controls` drives every piece × control combination and
diffs pixels. Run it after touching any piece.

**A piece stays one file with no dependencies and no build step.** The
microsite has tooling; the pieces don't. Nothing in `pieces/` or `shared/`
may import anything generated. That boundary is what makes a baked export
paste-and-run.

**The skill file exists in two places and nothing keeps them in sync.**
`skills/building-generative-backgrounds/SKILL.md` ships with the repo, and a
byte-identical copy lives in the maintainer's personal skills directory.
Edit one, copy to the other, and `diff` them. The repo copy is the source of
truth.

**Judge at the viewport that ships.** The curation tool once rendered at
640x400 while the build rendered at 1280x800, and sparse pieces came out
about four times denser at the smaller size. Every preset was accepted
against images that didn't represent the shipped swatch. An instrument
whose conditions differ from production reports confidently and is wrong.

**Gate the path that ships, not just the path you look at.** The swatch
capture path had no blank-canvas check while the paths nobody shipped did.
The check now lives in one helper called by both.

**A preset is judged by looking.** Every preset failure had the same shape:
two presets differing only in degree. The fix is never a bigger gap on one
axis; it's a second axis. Every preset clears luminance variance 12, three
times the blank-canvas threshold. Tuning just to clear the gate is how the
defect shipped the first time.

**A preset needing a control pinned at its limit is wrong, not tight.**

**Judge the collection, not just the piece.** The library once shipped five
pieces that were each individually correct and collectively looked like one
thing five times.
