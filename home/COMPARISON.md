# Chunk 8 — two marketing home page directions

Both are real, functioning pages under `home/`, not mockups. Each runs an
actual linefield piece live as its hero (same-origin iframe + the panel
suppressed on the loaded document, the exact technique the gallery's own
hover-preview at root `index.html` already uses), and each wires a handful
of real sliders to that live piece via `iframe.contentWindow.__LF_PANEL__.setValue()`,
the same write path the piece's own exported control panel calls.

## `home/quiet-drift/`

Full-bleed hero, `rainfall` running behind a left-anchored headline with a
soft gradient scrim. Editorial/quiet register: italic serif display type,
generous negative space, warm off-white ink. Copy voice is short and calm.
Three visible knobs (speed, density, opacity) sit under the CTA row.

`rainfall` chosen for lowest measured ink coverage in the library (0.011,
`ROADMAP.md`'s collection-constraints table) and confirmed against its own
thumbnail: a scatter of thin falling streaks with most of the frame empty,
which is exactly what a left-anchored text block needs — the piece never
competes with the headline no matter where the text sits.

Gallery sample: `meridian`, `tether`, `cipher-bloom`, `flow-field` — a
deliberate range from sparse to the densest piece in the collection, shown
as a plain filmstrip.

## `home/specimen-grid/`

Bounded two-column "lab rig" layout: copy and a live control rig on the
left, the piece boxed in a framed specimen viewport (with crosshair
guides) on the right, not full-bleed. Technical register: monospace
throughout, sticky topbar, a dense sample grid with hue-degree tags,
command-style step labels (`$ tune` / `$ export` / `$ ship`). Three knobs
(speed, angle, stroke) sit inside the rig panel itself.

`lacuna` chosen over the (stale, per-ROADMAP's own disclaimer) ink table:
new pieces post-redesign have no measured row, so its thumbnail was read
directly. It's a quiet swirl concentrated in the frame's center-right with
the rest of the canvas empty — text-safe specifically because the
specimen viewport here is boxed and offset from the copy column, so the
densest part of the piece never sits under a text line. It also demos a
newer, less-seen piece from the redesign rather than repeating a
pre-redesign one.

Gallery sample: `grain-field`, `wireframe-lattice`, `parallax`, `pleat` —
four post-redesign-era or low-ink pieces, tagged with hue degrees to match
the datasheet framing.

## What's actually different

Not palette (both are collection-dark, `#437057`-accented, no purple).
Different structurally: full-bleed atmospheric vs. bounded/framed
technical; serif/italic vs. monospace/uppercase; a scattering of sparse
motion vs. a boxed, contained specimen. Different pieces as hero (`rainfall`
vs. `lacuna`), different gallery samples, different copy voice throughout.

## Recommendation (not a decision)

`specimen-grid` reads as more distinctive and more "linefield" — the boxed
specimen-with-crosshairs framing turns the live piece into an obvious
demo-not-decoration, which serves the "prove it's real, not a screenshot"
requirement better than a full-bleed hero does (a full-bleed hero can still
read as "nice background" rather than "this is the product"). Its
monospace/rig vocabulary also sits closer to the collection's existing
control-panel aesthetic (`shared/controls.js`'s own panel is dense and
technical), so it would need less translation work in a follow-up polish
pass. `quiet-drift` is the safer, more conventional marketing-page choice
and would appeal to a design-forward audience that never opens a control
panel.

This is a recommendation only — the choice of which direction gets the
further "make it super sexy" polish pass belongs to the user, per
`ROADMAP.md`'s Chunk 8 scope.
