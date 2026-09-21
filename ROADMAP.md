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

- [x] Resolve the stationary-pointer behavior: expired history must not
  continually seed a fresh dot while the pointer remains still. Root cause:
  once history fully decayed, `points.at(-1)` returned `undefined`, so the
  moved-distance check fell back to `Infinity` — always "moved," reseeding
  every ~900ms. Fixed by tracking the last-seeded position independently of
  the decaying history array (commit `8684544`). Also fixed a secondary bug
  found while diagnosing: the single-remaining-dot render branch didn't fade
  by age like the multi-point strand did.
- [x] Preserve default-off/reduced-motion behavior, zero strength, overlay
  isolation, resize handling, and full teardown. Untouched code paths,
  confirmed still passing.
- [x] Extend the existing interaction check only for the specific fade
  regression when implementing the fix. Hand off the standalone demo.
  Verified by reverting the fix and confirming the extended test fails
  exactly as expected, then confirming a real Playwright session against
  `interactions/wake/index.html` over wall-clock time.

**Finish line:** Move, stop, and leave the pointer: the marks disappear and
stay gone until movement resumes. Artwork exports remain independent. **Done.**

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

- [x] One named piece at a time, per the delivery rules — do not let a
  finished piece expand into the next. Run as three parallel agents on
  disjoint files (each scoped to its own piece only), not as one agent
  expanding scope across all three.
- [x] Judge each against the current collection's bar (silhouette read at
  card size, negative space, a mark vocabulary not already carried more
  strongly by another piece) rather than against its own prior version.
- [x] Refresh presets, thumbnail, download for each on completion.
  - [x] `rainfall` done: was uniform random scatter edge to edge (no
    gesture, just dots). Reshaped into a single spatially-fixed veil — a
    raised-cosine brightness window over x, denser center-right, quiet at
    both edges, with a left-side floor deliberately below the rest so it
    stays quietest under the `home/quiet-drift` hero copy it backs. Drops
    still fall/sway exactly as before; only per-drop brightness changed, so
    motion reveals the veil's shape as streaks cross it rather than just
    translating. Ink coverage 0.011 → 0.010 (measured, did not increase).
    Presets untouched structurally, still differ on ≥2 axes each.

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
**Done.**

**Tooling gap found running this chunk, fixed since:** `tools/build.mjs`
and `tools/audit-controls.mjs` hardcoded ports 5799/5798 with no per-run
scoping. Three coder agents running the gate suite concurrently in the same
worktree collided on both repeatedly — `audit-controls` in particular sat
in `EADDRINUSE` retry loops across all three agents' sessions for most of
this chunk, and one agent's orphaned retry loop kept re-triggering after
its own work was done and reported. Both tools now share `tools/serve.mjs`:
each still tries its default port first (5799/5798, preserved for muscle
memory and stable local URLs), and on `EADDRINUSE` falls back once to an
OS-assigned ephemeral port, logging whichever port it actually bound. Set
`LF_BUILD_PORT`/`LF_AUDIT_PORT` to pin an explicit port instead (CI, or a
human who wants a stable URL) — a pinned port fails loudly on collision
rather than silently moving.

**Worktree fragility found running this chunk, not fixed here:** the
`flow-field` agent's entire uncommitted edit was silently wiped mid-task —
`git status` went clean with no trace while two sibling commits landed
around the same time. Root cause unconfirmed (no reflog evidence of a hard
reset), but the likely mechanism is three coder agents sharing one physical
worktree directory: any one agent's `git checkout .`/`reset --hard`/bad
`stash` can silently destroy another's uncommitted work with no error.
Recovered by re-applying from conversation history and committing
immediately. If running concurrent coder agents on this repo again, prefer
one worktree per agent over sharing one.

### Chunk 12 — Wake: promote and expand

**Outcome:** Wake moves from wherever it currently sits to the top of its
section/page, gets a fuller description (what it is, why it's separate
from per-piece cursor decoration), and gains real configuration — knobs
and switches enabling different behaviors, not just on/off.

**Scope:** `interactions/wake.js`, `interactions/wake/index.html`, its
docs. Depends on Chunk 6 (Wake's stationary-pointer fade bug) closing
first — do not layer new configuration surface onto a mechanism with a
known-broken fade.

- [x] Close Chunk 6's fade bug first if not already closed. (Already closed;
  `lastSeed` fix confirmed present in `interactions/wake.js` before this
  chunk started.)
- [x] Reorder Wake's section to the top wherever it's presented (gallery,
  docs, and the new home page from Chunk 8 if that lands first). Gallery's
  `.mechanisms` section now renders above the piece grid (`tools/templates/gallery.html`,
  regenerated into `index.html`); both `home/quiet-drift/` and
  `home/specimen-grid/` gained a Wake callout directly under the hero,
  ahead of the gallery sample and "how to use" sections.
- [x] Write a fuller description: what Wake is, why it exists outside the
  per-piece control contract, what it does versus what removed cursor
  modes did. Expanded on `interactions/wake/index.html`, the gallery
  mechanisms card, and both home directions (register-matched copy per
  page, not identical text).
- [x] Design and add real configuration — specific knobs/switches remain
  open; scope them against what Wake's current single-mechanism design can
  actually support before adding surface area for its own sake. Added
  `setLife`, `setStrands`, `setPulse`, `setColor` to `createWake()`'s
  public API, wired live on the demo page; strength/enable unchanged.

**Finish line:** Wake is presented first, its description explains itself
without external context, and its configuration is real (state that
changes behavior), not decorative.

### Chunk 13 — Wake as its own product area (deferred to last, not yet scoped)

**Explicitly deferred.** User direction: finish the rest of the core
linefield roadmap first; this chunk does not start until every other
chunk here is done, Chunk 12's PR included. Recorded now only so the
decision isn't lost before then.

**Direction, decided:** a combination of two of the three options
originally offered — (b) genuinely different interaction categories, not
just trail-effect variations (Wake's current knobs — life/strands/pulse/
color — already cover that axis well, per the user), and (c) a composable
toolkit of interaction primitives, not a fixed menu, with an eye toward
reuse by `Projects/Forma` down the line per the earlier cross-project
note. Not (a): more variations on the trail idea specifically was ruled
out.

**Not yet scoped, needs a real design pass before it's a buildable
chunk:** what the actual primitives are (Wake's trail is only one — click/
tap, scroll-driven, and hover-target were named as one example direction,
not a decision), whether they live under `interactions/` as siblings to
`wake.js` or need their own directory/naming convention, whether "still
does not need to interact with the backgrounds, though that could be
something" (user's own words) means an opt-in bridge API between a
primitive and a specific piece, and what a Forma-facing composable API
surface would need to look like before Forma's own repo could consume it
(see the "Cross-project note — Forma alignment" entry above — same
scoping dependency applies here).

---

## Intake — 2026-09-20 (post home-page review)

User picked `home/quiet-drift/` as the actual home page and asked for it
to grow a real feature; picked `home/specimen-grid/`'s layout specifically
to become the *main gallery's* visual system, not just live on as an
alternate home; and added two new microsite pages plus a second pass on
Chunk 11's three pieces. Four new chunks, numbered onward from 14 (Chunk
13, "Wake as its own product area," merged separately via PR #8 and lands
just above this section).

### Chunk 14 — quiet-drift becomes the home page, gains a hero-effect switcher

**Outcome:** `home/quiet-drift/` is the linefield home page. It gains a
dropdown that swaps which live piece runs as the hero background, without
reloading the page — starting with two options, not all eighteen.

**Scope:** `home/quiet-drift/index.html` only. Does not touch
`home/specimen-grid/` (that direction's fate is Chunk 15, below) or
`pieces.json`.

- [ ] Add a hero-piece dropdown. Two options to start: `rainfall` (current
  hero, already confirmed text-safe) and one more pick — choose a second
  piece with similarly low ink coverage per `ROADMAP.md`'s collection
  table (do not pick a dense piece that would break the headline's
  legibility; that's the whole reason rainfall was chosen originally).
- [ ] Swapping the dropdown swaps the live iframe's piece in place — reuse
  the existing live-preview mechanism (`goLive()`-style same-origin
  iframe, `?preview=1`) the page already uses for its hero, don't invent a
  second embedding method.
- [ ] The existing speed/density/opacity live knobs continue to act on
  whichever piece is currently selected.
- [ ] Note for whoever picks this up: the user's own words were "I want to
  make sure that when we... let me rethink this one, because I think
  that's on the roadmap that these get updated as well" — an unfinished
  thought about the hero-piece list staying in sync as pieces get
  refreshed or renamed (this exact class of staleness bit the "SVG ignores
  angle" limitation's piece list earlier this session). Whatever the
  dropdown's option list looks like, don't hardcode it somewhere a future
  piece rename/removal can silently orphan it without a build-time check
  catching it — ask the user to confirm intent here if it's not obvious
  once you're implementing, don't guess further than this note already
  does.

**Finish line:** The home page is quiet-drift, its hero is switchable
between at least two real pieces live, with working knobs on whichever is
selected.

### Chunk 15 — Rebuild the main gallery using specimen-grid's layout

**Outcome:** The main piece gallery (`index.html` at the repo root,
generated from `tools/templates/gallery.html`) adopts `specimen-grid`'s
visual system — boxed/framed viewport treatment, monospace/technical
register, crosshair-guide framing — as the collection's actual browsing
experience, not just a marketing-page alternate.

**Scope:** `tools/templates/gallery.html` (the source template — `index.html`
is generated from it via `npm run build`, never hand-edit the generated
file directly, per the Chunk 12 agent's own note on this exact mistake to
avoid). `home/specimen-grid/index.html` may be deprecated/removed once its
layout lives in the real gallery, or kept as the home-page-direction
record — decide once the port is done and it's clear whether duplicating
the layout in two places is worth it or just drift risk.

- [x] Port specimen-grid's layout system (framed viewport, crosshair
  guides, sticky topbar, `$ command` label style) into the gallery
  template, applied across all eighteen piece cards, not just a hero.
  specimen-grid's own page actually ships two different treatments: the
  one-hero `.specimen` (boxed, crosshair-guided) and the `.grid`/`.cell`
  many-sample mosaic it uses for its own four-piece sample (hairline
  gutters via `gap:1px` + `background:var(--line)`, bottom-of-thumbnail
  hue-degree tag, no crosshair). Ported the latter for the eighteen cards —
  it's specimen-grid's own answer to the one-to-many scaling question, and
  a literal crosshair repeated eighteen times is exactly the noise the
  brief flagged as a risk. Sticky topbar, monospace type, sharp
  (zero-radius) corners, and `$`-prefixed action labels (CSS
  `::before`, so the copy-to-clipboard "Copied" swap never eats the glyph)
  carried over directly.
- [x] Confirm the existing gallery behaviors survive the port: live
  previews, thumbnail fallback, links into each piece's own page, Wake's
  Chunk 12 promoted section staying at the top. First three verified live
  (Playwright screenshot + hover test). Wake's promotion (PR #8,
  `wake-promote-and-expand`) is not in this branch's history — confirmed
  via `git merge-base --is-ancestor`, not an assumption — so Wake still
  renders as the pre-Chunk-12 bottom "Interaction mechanism" section here;
  restyled in place, left unpromoted and out of scope for this chunk.
- [x] Rebuild (`npm run build`) and confirm `node tools/build.mjs
  --verify-only` still reports all eighteen pieces. `index.html` is the
  only generated artifact that changed; `thumbs/` and `downloads/` came
  back byte-identical, confirming no piece drift from this template-only
  change.

`home/specimen-grid/` kept as-is: `home/COMPARISON.md` documents it
side-by-side with `home/quiet-drift/` as Chunk 8's two directions, and
deleting the page would leave that record pointing at nothing. The two
pages share no code (each inlines its own CSS), so the layout now living
in two places is not a maintenance hazard the way a shared component
would be.

**Finish line:** The gallery reads as specimen-grid's layout applied to
the full collection, not the old gallery template with a coat of paint.

### Chunk 16 — Stub docs and CONTRIBUTING pages as microsite pages

**Outcome:** `docs/` and contribution guidance exist as real pages on the
microsite (styled consistently with whatever the gallery/home now look
like post-Chunk 15), not only as root-level `.md` files a visitor has to
find on GitHub.

**Scope:** New page(s), likely `docs/index.html` or similar and a
contribution-guide page — exact routing/naming is this chunk's own
decision, not pre-specified here. Source content from the existing
`CONTRIBUTING.md` and whatever's already under `docs/` rather than
rewriting it from scratch; this is a stub/scaffold pass, not a full docs
rewrite.

**Depends on:** Chunk 15 landing first, so these pages inherit the same
design system rather than a third, different visual language on the same
microsite.

- [ ] Stub a docs landing page reflecting the repo's actual `docs/`
  content (check what's there now — the redesign spec lives under
  `docs/superpowers/specs/`, that's implementation history, not visitor-
  facing documentation; figure out what's actually visitor-relevant before
  stubbing a page around it).
- [ ] Stub a contribution-guide page from `CONTRIBUTING.md`'s existing
  content — a real page, not a dead link to a `.md` file.
- [ ] Link both from the gallery/home pages' nav so they're actually
  reachable, not orphaned pages.

**Finish line:** Both pages exist, are linked from the site, and use the
Chunk 15 design system — "stub" means scaffolded and navigable, not
necessarily final copy.

### Chunk 17 — Second refinement pass on Tether, Rainfall, Flow Field

**Outcome:** A deeper iteration on the three pieces Chunk 11 already
refreshed — the user asked to focus refinement effort here again, treating
the first pass as a start, not a finish.

**Scope:** `pieces/tether/index.html`, `pieces/rainfall/index.html`,
`pieces/flow-field/index.html` and their generated assets — same three
files Chunk 11 touched.

- [x] Before changing anything, look at all three next to the five
  commissioned pieces and Pleat/Driftwork/Cipher Bloom/Parallax/Lacuna
  again, now that Chunk 11's changes are live — identify specifically
  what still falls short, rather than re-doing the same diagnosis Chunk 11
  already made (structural gesture, negative space — that part is done;
  find the next gap).
  - Note: `rainfall`'s ink coverage is deliberately kept low (0.010) to
    stay text-safe behind `home/quiet-drift`'s headline, and by Chunk 14
    above it may become one of two selectable hero pieces there — don't
    undo that constraint without checking Chunk 14's status first.
- [x] One named piece at a time, per the delivery rules.
- [x] Refresh presets/thumbnail/download for each on completion, same as
  Chunk 11.

Diagnosis, past Chunk 11's structural/negative-space fix:

- [x] `tether` done: the fan and its negative space were real (Chunk 11),
  but every cable rendered at one uniform stroke weight — no hierarchy —
  and the knot the whole fan converges toward was just where lines
  stopped, so the void Chunk 11 opened stayed literally empty instead of
  pointing at anything. Added a three-tier depth per cable (same
  discrete-tier idiom as `parallax`'s `row % 4 / 3`) driving both width
  and alpha, so the bundle reads as load-bearing lines up front and slack
  ones behind. Added a soft radial knot-glow, drawn underneath the cables
  inside the piece's own rotate transform so it tracks `angle` (verified
  against the `neon` preset, which rotates 352°) — centred just inside the
  frame (0.90W) rather than at the literal off-canvas anchor (1.04W),
  since a glow centred past the edge only shows a sliver of its own
  falloff. Ink 0.066 → 0.079 (up, from the added marked pixels; still the
  second-sparsest piece). Verified with `node tools/preset-sheet.mjs
  tether`: all five presets show visible hierarchy and a knot highlight.
- [x] `rainfall` done: the veil Chunk 11 shaped was a fixed shape forever —
  a static composition next to `lacuna`'s turning rings or `parallax`'s
  depth drift — and each drop's sway was an independent random phase, so
  neighbouring streaks jittered against each other instead of reading as
  one gesture (the "scattered dashes" problem survived inside the veil's
  new shape). Sway is now sampled by drop x-position instead of an
  independent random phase, so neighbouring drops lean together — a gust
  crossing the veil. The veil's centre now drifts slowly right (0.62 →
  0.72), gated by Motion. **Ink-coverage constraint held explicitly:** the
  drift is one-sided (never left of its resting centre) and `envelopeAt()`
  additionally clamps with `Math.min` against the untouched static curve
  for `x < 0.35` (the hero-copy zone), so `env(x, t) <= env_today(x)` holds
  at every `t` — verified by direct computation across `t` in `[0, 5000)`,
  not just the one captured thumbnail frame. Measured ink moved 0.010 →
  0.008 (down, not up); opacity/density/stroke untouched. Chunk 14's
  hero-piece-switcher status was not checked further since the change only
  ever reduces density, never raises it.
- [x] `flow-field` done: Chunk 11's off-center mask gave the piece real
  negative space, but the mass inside that focal region was still 500
  particles' worth of 40-point trails crossing each other — a tangled
  purple blob next to `driftwork`'s woven mesh, not a flow. `BASE_COUNT`
  500 → 320 with longer trails (40 → 56 points) is the actual lever: fewer,
  longer-lived ribbons read as individual currents. Stroke width now rides
  the same mask value as alpha but on a gentler curve (`0.4 + 0.6*m`, not
  `m`), so threads thin as they dissolve into the negative space instead of
  just fading to transparent. Color mix is now driven by the field's own
  local angle at each particle instead of an arbitrary position/time sine —
  the palette is a compass for the flow, not decorative banding. Ink 0.341
  → 0.222 (down). Verified with `node tools/preset-sheet.mjs flow-field`:
  all five presets read as legible currents.

**Finish line:** All three read as fully resolved against the current
collection's bar — the user's own judgment is the finish line here more
than any mechanical checklist, since Chunk 11 already cleared the
mechanical bar once. **Done**, pending the user's own look.

**Checks run:** `node tools/build.mjs --verify-only`, `npm run
test-bake-fresh` (18/18), `npm run test-baked` (18/18), `npm run
test-source` (18/18), `npm run test-interactions` (all 18 renders +
picker + orbit checks passed), `node tools/test-presets.mjs tether` (all
preset-mechanism and cross-collection preset-value checks passed). `npm
run audit-controls` ran clean this time (no `EADDRINUSE`) and reached all
three touched pieces before the rest of the collection: `flow-field`,
`tether` and `rainfall` each show every one of their controls — including
the ones this chunk's changes ride (`stroke`/`glow`/`opacity`/`angle` on
`tether`; `motion`/`speed`/`phase` on `rainfall`; the existing mask plus
`stroke`/`opacity`/`density` on `flow-field`) — as `LIVE` with no piece
introducing a new control that needed auditing.

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
(`contour-grid`, `meridian`, `tether`, `rainfall`) — their path/text
points are recorded before the rotation is applied, so an exported SVG shows
unrotated geometry. PNG export is unaffected. Fixing it properly means every
rotating piece baking its transform into stored points. (`rainfall` joined
this list in its Chunk 11 refresh; `matrix-code` and `chain-haze`, previously
listed here, no longer exist — removed by the collection redesign.)

**`rainfall`'s Color A control reads as dead in `audit-controls`, but isn't.**
Measured at 0.047% changed-pixel diff against a detection floor other color
controls clear at ~0.06% (`node tools/audit-controls.mjs rainfall`). Color A
is hue-linked (`shared/controls.js`'s `linkedHue`) and does shift the render
— the diff is real, just too subtle for the audit's threshold given
`rainfall`'s ink coverage, the sparsest in the collection at 0.010 after its
Chunk 11 refresh (deliberately kept low: it's the hero on
`home/quiet-drift`, where lowering coverage further would help this
false-positive but reads worse on the page it exists for). Same class of
limitation as grain-field/synapse's sub-pixel Shrink, below.

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
| 216 | 0.13 | 0.008 | `rainfall` |
| 220 | 0.25 | 0.028 | `lacuna` |
| 237 | 0.23 | 0.079 | `tether` |
| 239 | 0.86 | 0.222 | `flow-field` |
| 247 | 0.51 | 0.195 | `event-horizon` |
| 253 | 0.17 | 0.120 | `driftwork` |
| 254 | 0.58 | 0.318 | `interference` |
| 305 | 0.48 | 0.096 | `orbital-veil` |

Chunk 17 moved three rows: `rainfall` ink 0.010 → 0.008 (down — the veil-drift
and correlated-sway rework dims some previously-bright pixels below the
measurement threshold at the captured frame; opacity/density/stroke
untouched, and the left-third text-safety guard is unconditional, not
frame-dependent — see the chunk's own notes below). `tether` ink 0.066 →
0.079 (up — per-cable width/alpha hierarchy and the knot glow both add
marked pixels; still the second-sparsest piece in the library). `flow-field`
ink 0.341 → 0.222 (down — BASE_COUNT 500 → 320 plus a gentler mask-edge
width falloff mark fewer pixels even with longer trails). `flow-field`'s hue
also shifted 261 → 239, landing close to `tether` (237); both are gradient
pieces whose thumbnail-frame mean hue is a colourfulness-weighted snapshot,
not a fixed authored value, so this is expected drift from the rendering
change, not a new authored-palette collision — `tether`'s defaults
(220/250) and `flow-field`'s (200/280) are unchanged.

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
