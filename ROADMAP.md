# Roadmap

Active delivery roadmap, followed by previously recorded limitations and
deferred ideas. Updated 2026-09-19.

**This file is the canonical, version-controlled roadmap.** The Google Doc
("Linefield - product" tab) that previously governed this queue is
deprecated as of 2026-09-19 — its content as of that date was folded in
below, but it is no longer updated and should not be treated as current.
Read this file (and its git history, `git log -p ROADMAP.md`, for how the
queue has changed) before starting a chunk, and update it in the same
commit as the work at handoff. A markdown file in the repo is diffable,
blame-able, and travels with the branch that implements it — a Google Doc
is none of those things to an agent working from the checked-out tree.

---

## Current position

Work is tracked as **PR #5** (`codex/collection-redesign-wake` → `main`,
draft — not ready to merge). The five replacement pages, gallery cards,
thumbnails, and baked downloads exist and are committed on that branch.
Pleat, Driftwork, and Cipher Bloom are implemented and ready for visual
review; Parallax is in progress (Speed is now wired independently of
Motion, see `tools/test-parallax.mjs`; depth/occlusion tuning remains);
Lacuna remains a draft. Their generated assets and targeted checks passed;
the collection-wide release pass remains deferred.
Cursor separation and Wake are already in the branch's committed history.

The agreed direction remains
[Collection Redesign and Wake](docs/superpowers/specs/2026-09-12-collection-redesign-and-wake-design.md).
This roadmap replaces the open-ended execution queue with seven bounded
deliverables. Existing detailed implementation plans are reference material;
their task order must not cause a finished chunk to expand into the next.

Source inspection shows why more work remains:

- Pleat now uses filled rectangular folds. Driftwork now uses alternating
  tangent-aligned ellipses following two crossing currents.
- All fourteen Pleat controls passed targeted checks. Cipher Bloom's formerly
  dead Stroke control is now live; Parallax's renderer still does not use
  Speed.
- Lacuna rotates its arcs around a fixed centre; the design calls for Angle
  to move the calm zone around the frame.
- Wake needs the outstanding stationary-pointer fade concern resolved.
- Documentation and collection measurements still describe removed pieces.

Only focused Pleat implementation checks were run for the first chunk.
The user's request to skip the extra QA round remains in effect; a passing
build or control check is not user visual acceptance.

## Delivery rules

- Work on one named chunk at a time. Each ends with its own preview, a short
  change summary, and an explicit list of anything still unresolved.
- Preserve the current drafts in a local checkpoint before further renderer
  edits. Stage only this redesign's files; do not discard the dirty worktree.
- Reuse the existing controls, color helpers, animation loop, and export
  paths. Keep seventeen artworks and a separate optional Wake mechanism.
- Each artwork chunk owns its source, five presets, manifest/README copy,
  and generated thumbnail/download. Rebuild generated assets for handoff;
  do not edit baked HTML manually.
- Limit implementation checks to the changed behavior. Reserve collection
  QA for the final delivery chunk; do not repeat a full audit after each edit.
- A chunk is finished only when its stated outcome is met. If it is still a
  draft, say so. Do not move to another artwork to compensate for it.
- Freeze accepted chunks unless a concrete defect or user feedback reopens
  them. No additional canvases, cursor modes, dependencies, or gallery
  redesign are part of this queue.

## Chunk 1 — Pleat: implemented — ready for review

Implemented filled coral-and-ivory bands, five presets, and transformed
filled-polygon SVG export. Pleat-only asset generation, all fourteen controls,
SVG serialization/compatibility, manifest verification, and standalone baked
rendering passed. The default thumbnail was inspected. User visual acceptance
and collection release QA remain pending.

Default preview: http://127.0.0.1:4173/downloads/pleat.html . Interactive
controls: http://127.0.0.1:4173/pieces/pleat/ . Pre-edit checkpoint:
`/private/tmp/linefield-pleat-checkpoint.DbF6HC/before-pleat.tar.gz`.

**Outcome:** Two material-like folded bands made from filled marks, separated
by deliberate cuts of empty space. Recognizable without its label and
visibly different from Driftwork and the existing line fields.

**Scope:** `pieces/pleat/index.html`, its entry in `pieces.json`, README piece
copy, and generated `thumbs/pleat.png`, `downloads/pleat.html`, `index.html`.
If filled SVG geometry requires a small additive change in
`shared/export.js`, include it here while preserving existing callers.

- [x] Replace the current sinusoidal polylines with coherent filled marks
  following two folds. Use the approved restrained coral/ivory direction.
- [x] Make Motion control fold depth, Speed advance the field, and Phase
  offset the bands. Keep Angle geometry consistent between canvas and SVG.
- [x] Tune the five presets so they differ in composition or sampling as
  well as brightness. Preserve an identifiable quiet region for text.
- [x] Refresh the preview and generated assets. Check the changed controls
  and filled SVG geometry without starting a collection-wide QA cycle.
- [x] Hand off Pleat alone and stop. Do not start Driftwork in this task.

**Finish line:** One convincing Pleat, working controls for its new form,
matching export geometry, and a reviewable checkpoint.

## Chunk 2 — Driftwork: implemented — ready for review

Implemented two crossing S-shaped currents from tangent-aligned violet-grey
ellipse links. Driftwork-only asset generation, all fourteen controls, five
presets, rotated SVG geometry, standalone baked rendering, manifest
verification, and whitespace checks passed. User visual acceptance and
collection release QA remain pending.

Interactive preview: http://127.0.0.1:4173/pieces/driftwork/?preview=1 .
Pre-edit checkpoint:
`/private/tmp/linefield-driftwork-checkpoint.Dj9gKV/before-driftwork.tar.gz`.
SVG geometry is exact; its styling retains the library's existing black 1px
line-art treatment rather than the canvas color and glow.

**Outcome:** Small alternating ellipses following two crossing S-shaped
currents, with depth carried by size, spacing, and fading.

**Scope:** `pieces/driftwork/index.html` and its manifest, README, thumbnail,
download, and gallery output.

- [x] Replace continuous strands with ellipse marks oriented along each
  current's tangent. Dissolve the marks toward the frame edges.
- [x] Separate link travel (Speed) from evolving currents (Motion), tune the
  five presets, and retain the approved cool violet-grey starting palette.
- [x] Refresh assets and hand off this piece in isolation.

**Finish line:** Its linked texture and crossing silhouette remain distinct
from Pleat even in monochrome. No changes to accepted Pleat geometry.

## Chunk 3 — Cipher Bloom: implemented — ready for review

Implemented a compressed, oblique band of rotated glyph fragments with a
bright core and quiet upper-left. Stroke now adds glyph weight; Scale changes
both type size and band breadth; Speed and Motion use independent travel and
identity clocks. Cipher Bloom-only assets, presets, standalone baking, SVG
geometry, XML-safe quoted font serialization, manifest verification, and
focused export tests passed. Collection-wide QA remains deferred.

Interactive preview: http://127.0.0.1:4173/pieces/cipher-bloom/?preview=1 .
Pre-edit checkpoint:
`/private/tmp/linefield-cipher-checkpoint.uBXH3f/before-cipher-bloom.tar.gz`.

**Outcome:** A drifting band of irregular glyph fragments, with a bright core
and dissolving edges; roughly half the composition remains quiet.

**Scope:** `pieces/cipher-bloom/index.html`, its generated assets and copy;
`shared/export.js` only for a necessary, backward-compatible text export fix.

- [x] Make Stroke visibly affect glyph weight and make Scale control glyph
  size/band breadth consistently. Refine the irregular grid and presets.
- [x] Preserve deterministic glyph changes and separate band travel from
  identity churn.
- [x] Align SVG text anchoring with canvas text and safely serialize the
  font family, including quoted names. Refresh assets and hand off.

**Finish line:** A complete typographic artwork with functioning controls
and usable SVG text output, not just a newly named page.

## Chunk 4 — Parallax: in progress

**Outcome:** A diagonal fan divides around an implied volume, with visible
near/far depth and a quiet centre.

**Scope:** `pieces/parallax/index.html` and its generated assets/copy.

- [x] Make Speed move the field through the lens; keep Motion responsible
  for lens drift/depth. `travel` (Speed) and `lensTime` (Motion) are now
  independent clocks; `tools/test-parallax.mjs` asserts Speed is non-dead
  without a browser. Near/far width and brightness differences still need
  strengthening.
- [ ] Keep occluded path segments separate and transformed SVG geometry
  consistent with the canvas. Tune the presets and refresh assets.

**Finish line:** Depth is legible at card size, Speed works, and occlusion
does not produce connecting lines across the intended empty volume.

## Chunk 5 — Lacuna: close the calm-zone composition

**Outcome:** Broken, locally coherent caustic arcs surround an off-centre calm
zone, gathering on one side and opening on the other.

**Scope:** `pieces/lacuna/index.html` and its generated assets/copy.

- [ ] Bring Angle's calm-zone placement and wave interference into line
  with the agreed direction; keep arc reach, drift, and phase distinct.
- [ ] Tune the quiet region and five presets at the actual gallery capture
  viewport. Refresh assets and hand off.

**Finish line:** The composition reads clearly at card size and its controls
describe the intended form. Keep changes bounded to Lacuna.

## Chunk 6 — Wake: an independent delivery

**Outcome:** A standalone optional cursor mechanism with a finite, clean fade.
This chunk can be completed independently of chunks 1–5.

**Scope:** `interactions/wake.js`, `interactions/wake/index.html`, the existing
`tools/test-interactions.mjs`, and Wake integration documentation.

- [ ] Resolve the stationary-pointer behavior: expired history must not
  continually seed a fresh dot while the pointer remains still.
- [ ] Preserve default-off/reduced-motion behavior, zero strength, overlay
  isolation, resize handling, and full teardown.
- [ ] Extend the existing interaction check only for the specific fade
  regression when implementing the fix. Hand off the standalone demo.

**Finish line:** Move, stop, and leave the pointer: the marks disappear and
stay gone until movement resumes. Artwork exports remain independent.

**Separate PR boundary:** Cursor removal + Wake + its gallery section/docs
can ship without the five replacement renderers. Preserve the uncommitted
artwork work before preparing that branch; never mix draft renderer files
into the Wake-only diff.

## Chunk 7 — Collection handoff and PR

**Depends on:** The five artwork chunks accepted; include Wake only if its
chunk is closed or has already shipped independently.

- [ ] Update README, CHANGELOG, BRIEF, INSPIRATION, and this roadmap where
  they still describe removed artworks as current. Preserve historical
  design decisions as history, not active promises.
- [ ] Rebuild once after final content changes and refresh the collection
  measurements. Retire the obsolete measurements below as current guidance.
- [ ] Perform one bounded release pass: existing control/preset checks for
  replacements, source/baked/export checks, Wake's existing test, and a
  collection comparison at the shipping viewport. Fix failures in the
  owning chunk; do not use this pass to launch another redesign.
- [ ] Package the branch and PR with concrete previews and an accurate
  statement of what passed and what remains deferred. If the user continues
  to defer release QA, label the PR as a draft with verification outstanding.

**Finish line:** A reviewable PR with current generated assets, truthful
documentation, and no unnamed follow-up work. Publishing/merging is a
separate action from preparing that handoff.

---

## Intake — 2026-09-19

New work from a single review session, broken into named chunks the same
way as 1–7. None of these are scoped to start automatically — each begins
only when named, per the delivery rules above. Two items below are cross-
project notes, not buildable chunks yet.

### Chunk 8 — Marketing home page

**Outcome:** A real landing page for linefield as a product, distinct from
the plain piece gallery `index.html` already is. Uses an actual piece as
its own hero background (dogfooding, not a screenshot), shows a sample of
what a visitor finds in the full gallery, and documents — in plain
language, not API reference — how a designer would drop a piece into their
own design-system project.

**Scope:** New file(s) under a `home/` or `site/` directory (does not
replace `index.html`, the gallery). No new dependency; same
no-build-step-for-pieces discipline does not apply here since this is a
site page, not a piece, but keep it framework-free consistent with the
rest of the repo.

- [ ] Build two visual directions. Both must use a real linefield piece
  live as the hero background (pick pieces that read well behind text —
  see CONTRIBUTING's "text-safe zone" guidance from the redesign spec).
- [ ] Both directions include a gallery-sample section (a curated handful
  of pieces, not all seventeen) and a "how to use this in your project"
  section: pasting a piece, the shared-controls contract, baked vs. source
  export, MIT license.
- [ ] Present both for a choice; the chosen direction gets a further polish
  pass — this is the one explicitly called out to be "super sexy," not the
  rejected direction.
- [ ] Add basic, real controls on the page (not decorative) — enough to
  demonstrate the shared-control contract a visitor would actually use.

**Finish line:** One shipped landing page, one archived alternate, both
functional (not mockups) since the whole point is showing the product
working live.

### Chunk 9 — Bring globe back

**Outcome:** `globe` returns to the collection as an eighteenth piece,
alongside `parallax` rather than instead of it — the redesign removed it
as a replacement-for, but it's wanted back as an addition.

**Scope:** Restore `pieces/globe/index.html` (available in git history at
`ecde851` on `main`, pre-redesign) as a piece distinct from `parallax`
despite both being depth/projection pieces — needs a real differentiation
pass since `parallax`'s whole existence was "replace globe with something
that reads less like the existing orb family." Re-run it through the
current (post-redesign) contract: Wake instead of cursor modes, current
shared control set.

- [x] Decide and document how `globe` and `parallax` coexist without
  reading as the same piece twice — this is the actual design work, not
  the restoration. Decision: `globe` is a real 3D sphere (lat/long rings
  and meridians through `shared/project.js`'s perspective camera, silhouette
  a circle that reads as a solid, occludable body) where `parallax` is a
  flat diagonal fan/lens with no depth axis at all — same distinction
  already used to separate it from the orb family (`orbital-veil`,
  `accretion`, `event-horizon`), which are flat screen-space discs.
  Confirmed visually, not just asserted: generated thumbnails
  (`thumbs/globe.png` vs. `thumbs/parallax.png`, `thumbs/orbital-veil.png`,
  `thumbs/event-horizon.png`, `thumbs/accretion.png`) show distinct
  silhouettes at gallery-card size. Palette also moved off the old
  340/355 hue (now occupied by `parallax`'s own 344/24) into the 59–166
  gap — see collection-constraints below.
- [x] Restore/rebuild the piece against current `shared/`, add its
  `pieces.json` entry, README bullet, thumbnail, download.
- [x] Re-run collection-metrics; note globe's hue placement against the
  now-full wheel (see the collection-constraints table below).

**Finish line:** Eighteen pieces, `globe` and `parallax` both read as
distinct compositions at gallery-card size. Met.

### Chunk 10 — Palette: retire purple, adopt ClassicCottrell green

**Outcome:** Purple is removed from the shared UI (control panel, page
chrome — not individual pieces' own hue defaults, which are each piece's
authored identity) and replaced with ClassicCottrell green `#437057`.

**Scope:** `shared/controls.js`'s panel CSS and any other shared-UI
surface using a purple accent. Does not touch per-piece `hue`/`hueB`
defaults in `pieces.json` — that's the art, not the UI chrome.

- [x] Audit every purple hardcoded in shared UI CSS (grep for common purple
  hex ranges, don't rely on memory of what looked purple).
- [x] Swap to `#437057` and its needed tints/shades for hover/active/focus
  states, checked in both the light default and any dark-mode variant.

**Finish line:** No purple left in the control panel or page chrome;
`#437057` reads correctly at every interactive state.

### Chunk 11 — Refresh Tether, Rainfall, Flow Field

**Outcome:** These three pre-redesign pieces get a quality pass so they
don't read as a visibly older generation next to Pleat/Driftwork/Cipher
Bloom/Parallax/Lacuna. This is a visual/compositional refresh, not a
rewrite — keep each piece's identity (per ROADMAP's own "meridian and
tether remain the weakest pair" note below, `tether` already has a known
weakness worth addressing here rather than opening a separate item for
it).

**Scope:** `pieces/tether/index.html`, `pieces/rainfall/index.html`,
`pieces/flow-field/index.html` and their generated assets. `flow-field`
already got a technical hardening pass (resize batcher, dt-clamp) in the
merge that closed PR #5's conflict — this chunk is about its visual
quality, a separate concern from that.

- [ ] One named piece at a time, per the delivery rules — do not let a
  finished piece expand into the next.
- [ ] Judge each against the current collection's bar (silhouette read at
  card size, negative space, a mark vocabulary not already carried more
  strongly by another piece) rather than against its own prior version.
- [ ] Refresh presets, thumbnail, download for each on completion.

`flow-field` done: off-center soft mask replaces edge-to-edge particle
coverage, giving it real negative space; presets refreshed to differ on
at least two visual axes each; resize-batcher/dt-clamp hardening confirmed
intact.

`tether` done: cables that used to run as independent random pairs across
the full canvas — the same edge-to-edge field structure as meridian, hue
aside — now converge to a single anchor point exiting the frame, giving
tether its own dominant gesture (a mooring/fan, not a field) and real
negative space on the side away from the knot. This resolves the
documented "meridian and tether remain the weakest pair" weakness at the
structural level, not just palette. Presets refreshed: `slack` (now the
composition-defining knob) plus a second structural axis (`angle` or
`scale`) vary alongside intensity so all five differ on at least two
visual axes, verified with `node tools/preset-sheet.mjs tether`.
Thumbnail and download regenerated via `npm run build`.

**Finish line:** All three read as belonging to the same collection as the
five newest pieces, judged side by side, not each against its own history.

### Chunk 12 — Wake: promote and expand

**Outcome:** Wake moves from wherever it currently sits to the top of its
section/page, gets a fuller description (what it is, why it's separate
from per-piece cursor decoration), and gains real configuration — knobs
and switches enabling different behaviors, not just on/off.

**Scope:** `interactions/wake.js`, `interactions/wake/index.html`, its
docs. Depends on Chunk 6 (Wake's stationary-pointer fade bug) closing
first — do not layer new configuration surface onto a mechanism with a
known-broken fade.

- [ ] Close Chunk 6's fade bug first if not already closed.
- [ ] Reorder Wake's section to the top wherever it's presented (gallery,
  docs, and the new home page from Chunk 8 if that lands first).
- [ ] Write a fuller description: what Wake is, why it exists outside the
  per-piece control contract, what it does versus what removed cursor
  modes did.
- [ ] Design and add real configuration — specific knobs/switches remain
  open; scope them against what Wake's current single-mechanism design can
  actually support before adding surface area for its own sake.

**Finish line:** Wake is presented first, its description explains itself
without external context, and its configuration is real (state that
changes behavior), not decorative.

### Exploratory — ASCII art brought to life

Not yet a chunk: a named idea, not a scoped deliverable. The glyph-mark
capability already exists (built for `matrix-code`, carried into
`cipher-bloom`); this would be a new piece or technique using arbitrary
ASCII-art source rather than a fixed character set. Needs a design pass —
what makes it distinct from `cipher-bloom` — before it becomes a chunk
with an outcome and a scope. Tied to the Linefield+Forma idea below; may
belong to whichever product turns out to own "bring static art to life"
as a shared pattern.

### Cross-project note — Forma alignment

Not a linefield chunk: linefield and `Projects/Forma` (a separate 3D
shape-playground product, React + three.js, MIT) currently share UI only
partially, and the goal is eventual shared design patterns/design system
between them. Real existing link, not aspirational: linefield's own
`shared/anim.js`/`resize.js`/`quality.js` hardening (merged into this
branch resolving PR #5's conflict) explicitly ports logic from
`cc-webgl`, an engine Forma's own BRIEF.md also references
(`cc-webgl`'s `ResourceRegistry`). That shared substrate is the honest
starting point for alignment — not a rewrite of either product's UI.
Needs its own scoping pass in Forma's own repo/roadmap before it becomes
buildable work here; recorded so it isn't lost, not started.

## Next task prompt

> Finish roadmap chunk 4: Parallax only. Make Speed move the field through the
> lens, retain Motion for lens drift and depth, strengthen near/far contrast,
> keep transformed SVG segments separate across the implied volume, update its
> presets and generated assets, then stop. Keep Pleat, Driftwork, and Cipher
> Bloom unchanged unless user feedback or a concrete defect reopens them. Keep
> Lacuna and Wake unchanged. Collection-wide QA remains deferred.

---

## Known limitations, accepted

These are real, understood, and judged not worth the fix today.

**Three residual control couplings.** `contour-grid`'s Speed does nothing
when Motion is 0, since all animation lives in the motion-scaled layer.
`meridian`'s Phase weakens at Sweep 0. `contour-grid`'s Phase is effectively
a horizontal translate. None is dead at default settings.

**SVG export ignores `angle`** for pieces that rotate via canvas transform
(`contour-grid`, `meridian`, `tether`, `matrix-code`, `chain-haze`) — their path/text
points are recorded before the rotation is applied, so an exported SVG shows
unrotated geometry. PNG export is unaffected. Fixing it properly means every
rotating piece baking its transform into stored points.

**`matrix-code` SVG export uses `<text>`, not `<polyline>`.** It is the
library's first glyph-mark piece — a filled/stroked character has no line
geometry to export as a path. `shared/export.js`'s `exportSvg()` gained an
additive `texts` option (an array of `{x, y, ch, size, fontFamily}`) for
this; every other piece still calls it with only `paths` and renders
byte-identical output to before this option existed.

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

**`pieces/_template/` has no automated coverage at all.** It is excluded
from `pieces.json`, and every gate that derives its piece list from that
manifest — `tools/test-bake-fresh.mjs`, `tools/test-presets.mjs`'s check 8
sweep, and the build's capture paths —
therefore never touches it. A regression in the scaffold that every new
piece is forked from ships uncaught; only `CONTRIBUTING.md`'s manual
"verify visually in a browser" step would catch it, and only if someone
happens to open the template itself rather than a piece copied from it.

---

## Collection constraints for an eighteenth piece

Refreshed by chunk 9 (`globe` restored). Measured across all eighteen
shipped pieces, from their generated thumbnails: mean rendered hue (weighted
by colourfulness), mean saturation, and ink coverage — the fraction of
pixels the piece actually marks.

Every row below is **generated**, not hand-recorded: run
`npm run collection-metrics` and paste its output here. Rebuild thumbnails
(`npm run build`) before trusting a regenerated table — it measures the
committed PNGs, not the live piece.

| Hue | Sat | Ink | Piece |
|---:|---:|---:|---|
| 7 | 0.20 | 0.122 | `parallax` |
| 19 | 0.24 | 0.133 | `pleat` |
| 21 | 0.49 | 0.043 | `accretion` |
| 24 | 0.42 | 0.048 | `contour-grid` |
| 54 | 0.30 | 0.047 | `synapse` |
| 59 | 0.11 | 0.043 | `cipher-bloom` |
| 122 | 0.33 | 0.043 | `globe` |
| 166 | 0.48 | 0.073 | `meridian` |
| 177 | 0.12 | 0.035 | `grain-field` |
| 200 | 0.34 | 0.108 | `wireframe-lattice` |
| 213 | 0.12 | 0.011 | `rainfall` |
| 220 | 0.25 | 0.028 | `lacuna` |
| 235 | 0.24 | 0.066 | `tether` |
| 247 | 0.51 | 0.195 | `event-horizon` |
| 253 | 0.17 | 0.120 | `driftwork` |
| 254 | 0.58 | 0.318 | `interference` |
| 261 | 0.90 | 0.341 | `flow-field` |
| 305 | 0.48 | 0.096 | `orbital-veil` |

**`globe` landed at hue 122** (authored 105/130 gradient), squarely in the
59–166 gap between `cipher-bloom` and `meridian` — the widest untouched arc
on the wheel, confirmed against every piece's full hue→hueB ramp, not just
start hues (a start-hue-only scan wrongly suggested 285→344, which
`orbital-veil`'s 265→330 ramp actually crosses). No adjacent-hue collision.
Ink coverage (0.043) sits with the sparse cluster (`accretion`,
`contour-grid`, `synapse`, `cipher-bloom`) rather than crowding any single
piece — a wireframe sphere's rendered mark density is inherently sparse, no
special tuning needed to land there.

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
- 3D shape layer/compositing — allow a piece to incorporate an authored 3D
  form while preserving the self-contained export model. Explore after the
  replacement collection ships; choose projected geometry, a reusable shape
  input, or optional WebGL only when the visual need is clear.
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
