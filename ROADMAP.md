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

linefield started as a free, MIT, self-hostable alternative to
[Filament](https://vanta.supply/vault/filament) by Vanta Supply, a paid pack
of 128 interactive line-art pieces in ten collections (see `BRIEF.md`). This
roadmap sets out to meet that product's **craft bar**: its restraint,
composition, line quality, and presentation.

It does **not** set out to reproduce its **catalogue**. Concretely:

- Never reuse a reference piece name, description, alt text, preset name,
  still, or line of code.
- Never design toward a specific reference piece. If a new or reworked piece
  reads as "their X", that is a defect, the same as a control that changes
  nothing.
- Generic concepts are fine. Line art, wireframes, a hue slider, and a
  baked-HTML export are a genre, not a product. Naming and copy are ours.

**Known overlap today.** Six linefield pieces share a name with a reference
piece: `meridian`, `interference`, `accretion`, `event-horizon`, `tether`
and `synapse`. `orbital-veil` contains one ("Veil"), and INSPIRATION's
`filament-ring` stub uses the reference's product name. Several concepts are
close as well (see Phase 1).

Reference piece names seen on its product page on 2026-09-27, as a partial
avoid-list. Sixteen come from its published stills, each with a named file
and alt text: Meridian, Interference, Accretion, Corridor, Undertow, Signal,
Richter, Event Horizon, Comma, Iris, Refract, Basin, Tether, Column,
Synapse, Marble. Cortex is named in its "living orbs" section. Veil appears
as its example piece file (`veil.html`) in its export section. That is 18 of
its 128, so check its full published list before naming anything new.

---

## Gap analysis (observed 2026-09-27)

Method: the reference's product page and published stills, compared against
the live gallery at <https://classiccottrell.github.io/linefield/> and
`npm run collection-metrics` on `main` at `6be3d9c`. This only covers what
was actually observed. Its carousel beyond the first frame and its FAQ
answers did not load, so nothing here is inferred from them.

| | Reference | linefield today |
|---|---|---|
| **Palette** | Monochrome white on near-black. One bright focal point per piece. Colour is available but is never the identity. | Every piece has an authored, saturated hue. 9 of 18 have mean saturation ≥ 0.30 (`flow-field` 0.80, `interference` 0.58, `event-horizon` 0.51). |
| **Composition** | One legible object, centred in a square frame, surrounded by a lot of empty space. | Many edge-to-edge fields: `contour-grid`, `meridian`, `synapse`, `rainfall`, `grain-field`, `interference`. |
| **Line craft** | Hundreds of hairlines. Form emerges where they accumulate brightness. | Several pieces draw a few heavier strokes (`meridian`: seven ribbons; `tether`: a handful of cables). |
| **Materials** | A second family of soft, film-grain lit volumes alongside the linework. | Line, dot, glyph, ellipse and rectangle marks only. No lit-volume technique. `grain-field` is sparse specks. |
| **Scale** | 128 pieces in ten named collections. | 18 pieces and a flat list of 15 tags. |
| **Packaging** | Six exports, including ready-made stills of every piece, plus a `catalogue.md` describing every piece for AI tools. | Five exports (Source, AI prompt, Baked HTML, PNG 2x/4x, SVG). Gallery thumbnails, but no stills pack and no collection-level catalogue. |
| **Presentation** | Art-first cards with one small monospace label. Tick-mark ruler sliders. A display sans paired with a mono label face. Restrained corner frame marks. | Cards carry a title, blurb, tags, three buttons and the same boilerplate paragraph. Standard range sliders. Monospace throughout. |

**The biggest delta is palette.** Next are composition and line craft.
All three show up in a single side-by-side glance, and closing them is what
most of this roadmap is for.

**Where linefield is already ahead, so keep it:** 16 shared controls to the
reference's 12. Free and MIT. Wake. Drag-to-orbit on the 3D pieces. An
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
  It is not merged: its `tether` rework converges on the reference's own
  Tether, and it rewrites closed history.
- [x] The draggable control panel (PR #17, `53dcfe9`) is documented in
  README and CHANGELOG.
- [x] Chunk history is archived to `docs/roadmap-history.md`, and this
  roadmap is written.
- [x] `AGENTS.md` now points here instead of at the finished redesign
  (PR #5). It adds the originality rule, and requires every chunk to use
  its own worktree and leave nothing uncommitted. The owner signed off on
  2026-09-27.
- [ ] Backfill CHANGELOG for everything merged since 1.5.0, then cut a
  release.
- [ ] Settle PR #18. The suggestion is to salvage only the `flow-field`
  "quiet central void" direction, as Phase 2 input.

## Phase 1 — Originality

### Chunk 1.1 — Rename the colliding pieces

For each of `meridian`, `interference`, `accretion`, `event-horizon`,
`tether` and `synapse` (and `orbital-veil`'s "Veil"), choose a new original
name that isn't on the avoid-list. Check it against the reference's full
published list. Then carry the new slug through `pieces.json`, the piece
folder, README, the gallery, downloads, thumbs, both home pages, the docs
pages, the tests, the `collection-metrics` rows, and INSPIRATION's
`filament-ring` stub.

**Names: decided by the owner on 2026-09-27.** Checked on 2026-09-27
against the reference's published stills path
(`/filament/stills/<name>.webp`). All seven new names return 404, and a
known reference name returns 200 as a control. That's strong evidence
rather than proof, since not all 128 reference pieces may have public
stills.

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

### Chunk 1.2 — Re-differentiate the close concepts

Renaming alone doesn't fix a piece that describes itself in the same
sentence as a reference piece. For each flagged piece, write its own
one-sentence description first, without looking at the reference's copy,
then change the dominant gesture wherever it still reads as the same idea.

Close today:

- `tether`: slack cables between anchors.
- `synapse` and `globe`: wire spheres with nodes, and a lat/long sphere.
  The reference's *Meridian* is itself a longitude globe.
- `accretion`: a concentric disc around a dark eye.
- `event-horizon`: a grid pulled into a well. That's nearer the reference's
  *Basin* ("grid draped into a … bowl") than its Event Horizon.
- `interference`: two ripple families.

Compare against the reference's descriptions to spot overlap, never to
borrow wording.

**Finish line:** each reads as its own idea, both at card size and in one
sentence.

## Phase 2 — Visual language: monochrome-first

### Chunk 2.1 — Write the house look

This is a short spec in `docs/`, not code. It covers:

- The default palette: near-white on `#0a0a0d`, with colour opt-in through
  the existing controls. Nothing is removed.
- One bright focal point per piece.
- A hairline stroke floor, and a density target where form comes from line
  count, not stroke weight.
- One legible object in the frame, with a declared text-safe zone.

### Chunk 2.2 — A conformance check

Extend `npm run collection-metrics` so defaults that break the house look
fail loudly. Candidates are a default-saturation ceiling and an ink band.
Keep it to what the metrics already measure; no new instrument unless
needed.

### Chunks 2.3 onward — Convert the collection, ~3 pieces per chunk

Start with the weakest: the renamed `meridian` and `tether`, then `synapse`,
`grain-field`, `contour-grid`, `flow-field` and `interference`. Each gets a
monochrome default, one object in the frame with real negative space, and
hairline density.

`rainfall` and `grain-field` are the home-page heroes. Their low ink is
load-bearing for headline legibility, so keep it.

**Finish line:** the conformance check passes, and a side-by-side contact
sheet reads as one collection.

## Phase 3 — Presentation

- **3.1 Art-first gallery cards.** The preview dominates. Name plus one small
  label. Buttons and the "download ships defaults" note move to the piece
  page or to hover.
- **3.2 Type system.** A display face, a body face and a mono label face,
  sourced from the ClassicCottrell design system rather than the reference's
  trio. This is also the natural first step toward Forma alignment.
- **3.3 A ruler-style slider** in `shared/controls.js`, our own design,
  covered by `audit-controls`.
- **3.4 Collections.** Group the pieces into named collections, in our own
  names, replacing the flat tag chips.
- **3.5** Bring the home page (`home/quiet-drift`) and the docs pages onto
  the new look.

## Phase 4 — Materials and range

- **4.1 Grain / lit-volume technique.** This is a new capability: soft,
  film-grain shaded forms rendered in Canvas 2D with no dependencies.
  Decide its SVG export story up front, because it is raster by nature.
- **4.2 Halftone, 4.3 Masking, 4.4 Radial fibre.** These are the three
  families INSPIRATION already stubs, and each yields more than one piece.
- **Growth is by quality, not a count.** There is no 128 target. Every new
  piece clears the originality line and the collection constraints.

## Phase 5 — Packaging

- **5.1 Stills pack.** Square stills of every piece at its defaults,
  produced by the build and offered as one download.
- **5.2 `catalogue.md`.** One entry per piece: what it looks like, what it's
  for, its text-safe zone and its own controls. It is generated from
  `pieces.json` plus per-piece metadata so it can't drift, and written in
  our own words.
- **5.3 PNG export.** Check the size range and whether transparent-
  background export works. Close any gap.

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
and paste its output here. Rebuild thumbnails (`npm run build`) first, because
it measures the committed PNGs. Refreshed 2026-09-27 on `main` at `6be3d9c`.

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
| 219 | 0.19 | 0.007 | `rainfall` |
| 220 | 0.25 | 0.028 | `lacuna` |
| 237 | 0.23 | 0.067 | `tether` |
| 247 | 0.51 | 0.195 | `event-horizon` |
| 253 | 0.80 | 0.270 | `flow-field` |
| 253 | 0.17 | 0.120 | `driftwork` |
| 254 | 0.58 | 0.318 | `interference` |
| 305 | 0.48 | 0.096 | `orbital-veil` |

**Phase 2 changes what this table is for.** Up to now, a new piece had to
find a free hue on a nearly full wheel. Once defaults are monochrome, hue
stops being a piece's identity, and saturation and ink become the columns
that matter. Differentiate on **form and density**, which was already the
advice, since `rainfall` proved it at saturation 0.12.

**`meridian` and `tether` remain the weakest pair.** This was found twice,
by different methods. They're separated only by hue and by crossing-versus-
parallel structure. Both are also Phase 1 renames and Phase 2 conversions.

---

## Known limitations, accepted

These are real, understood, and judged not worth the fix today.

**Three residual control couplings.** `contour-grid`'s Speed does nothing
when Motion is 0, since all its animation lives in the motion-scaled layer.
`meridian`'s Phase weakens at Sweep 0. `contour-grid`'s Phase is effectively
a horizontal translate. None of these is dead at default settings.

**SVG export ignores `angle`** for pieces that rotate via a canvas transform
(`contour-grid`, `meridian`, `tether`, `rainfall`). Their path points are
recorded before the rotation is applied, so an exported SVG shows unrotated
geometry. PNG export is unaffected.

**`rainfall`'s Color A reads as dead in `audit-controls`, but isn't.** It
measures 0.047% changed pixels against a floor other colour controls clear
at about 0.06%. The hue link is real. It's just too subtle at the
collection's lowest ink coverage, which is deliberate for the home-page hero.

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
reads a value and changes nothing has shipped twice here (`tether`'s Scale
and `synapse`'s Scale), both passing review because the arithmetic looked
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
