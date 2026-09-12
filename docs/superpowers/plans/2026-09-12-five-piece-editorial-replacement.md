# Five-Piece Editorial Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Puddle, Globe, Matrix Code, Chain Haze, and Stock Market with Lacuna, Parallax, Cipher Bloom, Driftwork, and Pleat as five distinct, composition-led generative backgrounds.

**Architecture:** Each replacement remains one dependency-free canvas page using the existing controls, color, animation, export, and projection utilities. The manifest changes one entry at a time; `npm run build` remains the only writer of thumbnails, baked downloads, and the gallery.

**Tech Stack:** Vanilla ES modules, Canvas 2D, existing linefield shared modules, Playwright build and visual gates.

**Spec:** `docs/superpowers/specs/2026-09-12-collection-redesign-and-wake-design.md`

## Global Constraints

- No runtime dependencies, WebGL, framework wrappers, or new shared controls.
- Add no piece-specific control unless shared controls cannot express the approved form; the planned implementation adds none.
- Every shared visual control must visibly affect every replacement.
- Apply Angle mathematically so recorded SVG geometry matches canvas output.
- Defaults are slow, low-saturation, and preserve a text-safe region.
- Each piece declares all five presets: `whisper`, `ink`, `neon`, `drift`, and `dense`.
- Judge every default and preset at 1280×800 and against the full collection.

---

### Task 1: Replace Puddle with Lacuna

**Files:**
- Create: `pieces/lacuna/index.html`
- Modify: `pieces.json`
- Delete: `pieces/puddle/index.html`
- Delete after build: `downloads/puddle.html`, `thumbs/puddle.png`
- Generated: `downloads/lacuna.html`, `thumbs/lacuna.png`, `index.html`

**Interfaces:**
- Consumes: `createControlPanel`, `createLoop`, `paletteHsl`, `hslToRgb`, and existing export functions.
- Produces: piece id `lacuna`, SVG `paths`, and five presets.

- [ ] **Step 1: Change only the manifest entry and confirm verification fails**

Replace the Puddle object with:

```json
{
  "slug": "lacuna",
  "title": "Lacuna",
  "blurb": "Broken caustic arcs gather around an off-centre calm zone.",
  "tags": ["optical", "organic", "sparse"],
  "hue": 198,
  "hueB": 224,
  "saturation": 0.24
}
```

Run: `npm run verify`

Expected: FAIL because `pieces/lacuna/` is missing and `pieces/puddle/` is extra.

- [ ] **Step 2: Build the Lacuna renderer**

Start from the common HTML/export shell in Puddle, remove its closed-ring renderer, and set `PIECE_ID = 'lacuna'`.

For `front = 0..round(18*density)`, sample `u = 0..1` across a rotated ellipse around `(0.62W, 0.48H)`. Use:

```js
const theta = values.angle * Math.PI / 180;
const a = (-0.9 + u * 1.8) * Math.PI;
const drift = elapsed * values.motion * 0.08;
const wave = Math.sin(a * 3 + front * 0.71 - elapsed * values.speed * 0.9 + values.phase * Math.PI * 2);
const radius = (70 + front * 15) * values.scale + wave * (5 + front * 0.12);
const keep = Math.sin(a * 2.3 + front * 0.8 + drift) > -0.18;
```

Rotate each retained point mathematically around the calm zone. Break the current SVG/canvas path whenever `keep` is false. Weight alpha toward the lower-right arc and away from the left-side text-safe zone. Add one wider, dim under-stroke to the brightest 15% of segments when Glow is nonzero; do not use `shadowBlur`.

Delete `pieces/puddle/index.html` once `pieces/lacuna/index.html` is complete so manifest verification sees exactly seventeen source directories.

- [ ] **Step 3: Add five two-axis presets**

Use these starting values, then tune visually without pinning a control at its limit:

```js
const PRESETS = {
  whisper: { opacity: 0.18, stroke: 0.45, density: 0.55, saturation: 0.05, glow: 0 },
  ink:     { opacity: 0.88, stroke: 1.25, density: 0.72, saturation: 0, angle: 18 },
  neon:    { opacity: 0.72, stroke: 0.72, density: 1.12, saturation: 0.68, glow: 1.05 },
  drift:   { opacity: 0.34, stroke: 0.55, density: 0.68, speed: 0.28, motion: 1.55, phase: 0.7 },
  dense:   { opacity: 0.58, stroke: 0.48, density: 1.65, speed: 0.62, angle: 338 },
};
```

- [ ] **Step 4: Verify and build Lacuna**

Run:

```bash
npm run verify
node tools/test-presets.mjs lacuna
node tools/audit-controls.mjs lacuna
npm run build
```

Inspect `thumbs/lacuna.png` at native gallery-card size. It must read as a broken sweep with quiet space on the left, not as nested closed contours.

- [ ] **Step 5: Remove old generated artifacts and commit**

```bash
git add -A pieces/puddle pieces/lacuna pieces.json downloads/lacuna.html thumbs/lacuna.png index.html
git rm downloads/puddle.html thumbs/puddle.png
git commit -m "feat: replace Puddle with Lacuna"
```

---

### Task 2: Replace Globe with Parallax

**Files:**
- Create: `pieces/parallax/index.html`
- Modify: `pieces.json`
- Delete: `pieces/globe/index.html`, `downloads/globe.html`, `thumbs/globe.png`
- Generated: `downloads/parallax.html`, `thumbs/parallax.png`, `index.html`

**Interfaces:**
- Consumes: the standard piece shell and export helpers; no camera or orbit API.
- Produces: piece id `parallax`, mathematically rotated path arrays, five presets.

- [ ] **Step 1: Replace the manifest entry and confirm the missing-piece failure**

Use:

```json
{
  "slug": "parallax",
  "title": "Parallax",
  "blurb": "A diagonal line field divides around a volume that is never drawn.",
  "tags": ["depth", "optical", "sparse"],
  "hue": 344,
  "hueB": 24,
  "saturation": 0.3
}
```

Run `npm run verify`; expect missing `parallax` and extra `globe`.

- [ ] **Step 2: Render the invisible lens**

Create `round(24*density)` source lines spanning beyond the diagonal of the viewport. For each line coordinate `(x,y)`, rotate into field space, calculate elliptical distance from a drifting lens centre, and displace along the lens normal:

```js
const qx = (x - lensX) / (190 * values.scale);
const qy = (y - lensY) / (125 * values.scale);
const d2 = qx * qx + qy * qy;
const bend = Math.exp(-d2 * 1.4) * (1.15 + 0.25 * Math.sin(elapsed * values.motion + values.phase * Math.PI));
x += qx * bend * 95;
y += qy * bend * 62;
```

Skip samples inside `d2 < 0.62` so the body remains unoutlined. Compress sample spacing and raise alpha near `0.7 < d2 < 1.5` to make one luminous rim without drawing an ellipse. Keep the left third calmer than the right.

Delete `pieces/globe/index.html` once `pieces/parallax/index.html` is complete.

- [ ] **Step 3: Add and tune five presets**

Use low-density, high-stroke Ink; low-saturation Whisper; high-glow but medium-density Neon; slow oblique Drift; and high-density fine-line Dense. Each pair must differ in angle, density, or motion as well as opacity.

- [ ] **Step 4: Verify, build, and commit**

Run:

```bash
npm run verify
node tools/test-presets.mjs parallax
node tools/audit-controls.mjs parallax
npm run build
```

Inspect at card size: the unseen volume must be obvious from line behavior, while no complete sphere or latitude/longitude grid appears.

```bash
git add -A pieces/globe pieces/parallax pieces.json downloads/parallax.html thumbs/parallax.png index.html
git rm downloads/globe.html thumbs/globe.png
git commit -m "feat: replace Globe with Parallax"
```

---

### Task 3: Replace Matrix Code with Cipher Bloom

**Files:**
- Create: `pieces/cipher-bloom/index.html`
- Modify: `pieces.json`
- Delete: `pieces/matrix-code/index.html`, `downloads/matrix-code.html`, `thumbs/matrix-code.png`
- Generated: `downloads/cipher-bloom.html`, `thumbs/cipher-bloom.png`, `index.html`

**Interfaces:**
- Consumes: deterministic hash helpers from Matrix Code and `exportSvg({ texts })`.
- Produces: piece id `cipher-bloom`, `texts` entries `{ x, y, ch, size, fontFamily }`, five presets.

- [ ] **Step 1: Replace the manifest entry and confirm verification fails**

Use title `Cipher Bloom`, slug `cipher-bloom`, blurb `Glyph fragments gather into a drifting oblique atmosphere.`, tags `glyph`, `organic`, `sparse`, hue `42`, hueB `76`, saturation `0.22`. Run `npm run verify` and expect the missing/extra pair.

- [ ] **Step 2: Reuse hashing but replace vertical rain with a band field**

Build an irregular grid from `cell = 22 / values.scale` and deterministic jitter. Rotate each point into local band space using Angle. Define the centreline and envelope:

```js
const centre = H * 0.56 + Math.sin(localX * 0.007 + elapsed * values.speed * 0.16 + values.phase * Math.PI) * H * 0.12;
const distance = Math.abs(localY - centre);
const envelope = Math.max(0, 1 - distance / (H * (0.09 + 0.05 * values.motion)));
const occupied = rand01(col, row, 7) < envelope * Math.min(0.82, 0.32 * values.density);
const bucket = Math.floor(elapsed * (0.35 + values.motion * 0.8));
const ch = GLYPHS[hash(col, row, bucket) % GLYPHS.length];
```

Brighten fewer than 8% of occupied marks to form one moving highlight. Fade toward both frame edges and keep the upper-left text-safe. Do not create continuous columns.

Delete `pieces/matrix-code/index.html` once `pieces/cipher-bloom/index.html` is complete.

- [ ] **Step 3: Preserve text export and add presets**

Populate `texts` from exactly the visible glyphs. Use warm chalk/amber defaults and ensure `ink` is monochrome, `neon` adds saturation plus glow, `drift` changes motion and angle, and `dense` widens the band as well as raising occupancy.

- [ ] **Step 4: Verify, build, and commit**

Run `npm run verify`, `node tools/test-presets.mjs cipher-bloom`, `node tools/audit-controls.mjs cipher-bloom`, and `npm run build`. Inspect that the band is readable at 240×150 and at least half the frame remains quiet.

```bash
git add -A pieces/matrix-code pieces/cipher-bloom pieces.json downloads/cipher-bloom.html thumbs/cipher-bloom.png index.html
git rm downloads/matrix-code.html thumbs/matrix-code.png
git commit -m "feat: replace Matrix Code with Cipher Bloom"
```

---

### Task 4: Replace Chain Haze with Driftwork

**Files:**
- Create: `pieces/driftwork/index.html`
- Modify: `pieces.json`
- Delete: `pieces/chain-haze/index.html`, `downloads/chain-haze.html`, `thumbs/chain-haze.png`
- Generated: `downloads/driftwork.html`, `thumbs/driftwork.png`, `index.html`

**Interfaces:**
- Consumes: Chain Haze's `sampleEllipse` helper and standard SVG path export.
- Produces: piece id `driftwork`, ellipse path arrays, five presets.

- [ ] **Step 1: Replace the manifest entry and confirm verification fails**

Use title `Driftwork`, slug `driftwork`, blurb `Linked elliptical marks cross through two slow atmospheric currents.`, tags `flow`, `depth`, `organic`, hue `270`, hueB `314`, saturation `0.2`. Run `npm run verify` and expect the missing/extra pair.

- [ ] **Step 2: Replace perspective lanes with two evolving currents**

For each stream `s in [0,1]`, sample `round(46*density)` marks along `u` with a wrapped time offset. Build two crossing centre curves:

```js
const x = (-0.12 + u * 1.24) * W;
const base = s ? 0.66 : 0.36;
const y = H * (base + Math.sin(u * Math.PI * 2 + s * 2.2 + elapsed * values.motion * 0.12 + values.phase * Math.PI) * 0.16);
const tangent = Math.atan2(nextY - y, nextX - x) + values.angle * Math.PI / 180;
const depth = 0.35 + 0.65 * Math.sin((u + s * 0.31) * Math.PI);
```

Alternate full and compressed minor axes to imply linkage. Multiply size and alpha by `depth`; fade the first and last 12% of each stream. Offset the second stream phase so the crossing remains near the right third, leaving the upper-left quiet.

Delete `pieces/chain-haze/index.html` once `pieces/driftwork/index.html` is complete.

- [ ] **Step 3: Add presets and verify**

Make Whisper sparse and dim, Ink bold with fewer links, Neon medium-density with a brighter crossing, Drift slow with wider stream separation, and Dense fine-lined with many links. Run targeted preset and control audits plus `npm run build`.

- [ ] **Step 4: Inspect and commit**

At card size, the S-shaped crossing must dominate; no straight receding lanes or vanishing point may remain.

```bash
git add -A pieces/chain-haze pieces/driftwork pieces.json downloads/driftwork.html thumbs/driftwork.png index.html
git rm downloads/chain-haze.html thumbs/chain-haze.png
git commit -m "feat: replace Chain Haze with Driftwork"
```

---

### Task 5: Replace Stock Market with Pleat

**Files:**
- Create: `pieces/pleat/index.html`
- Modify: `pieces.json`
- Delete: `pieces/stock-market/index.html`, `downloads/stock-market.html`, `thumbs/stock-market.png`
- Generated: `downloads/pleat.html`, `thumbs/pleat.png`, `index.html`

**Interfaces:**
- Consumes: Stock Market's deterministic hash and `rectPath` helper.
- Produces: piece id `pleat`, closed rectangle paths after mathematical rotation, five presets.

- [ ] **Step 1: Replace the manifest entry and confirm verification fails**

Use title `Pleat`, slug `pleat`, blurb `Rectangular marks gather into two slowly folding signal bands.`, tags `geometric`, `grid`, `dense`, hue `12`, hueB `48`, saturation `0.28`. Run `npm run verify` and expect the missing/extra pair.

- [ ] **Step 2: Replace chart tracks with a coherent field**

Create a grid of `round(26*density)` columns and half as many rows. For each cell, rotate its centre mathematically around the viewport centre. Define two diagonal band distances and a traveling field:

```js
const fold = Math.sin(gx * 0.42 + elapsed * values.speed * 0.7 + values.phase * Math.PI)
  + 0.55 * Math.sin(gy * 0.73 - elapsed * values.motion * 0.38);
const bandA = Math.abs(gy - gx * 0.42 - rows * 0.18);
const bandB = Math.abs(gy + gx * 0.31 - rows * 0.92);
const envelope = Math.max(0, 1 - Math.min(bandA, bandB) / (2.2 * values.scale));
```

Skip cells with `envelope < 0.08`. Set rectangle height from `abs(fold)`, orientation from its sign, and alpha from the envelope. Introduce two deterministic threshold cuts so black gaps cross the bands. Record the rotated four corners in `paths` rather than relying on `ctx.rotate`.

Delete `pieces/stock-market/index.html` once `pieces/pleat/index.html` is complete.

- [ ] **Step 3: Add presets and verify**

Make Whisper show only the two band spines, Ink use fewer larger black-and-white blocks, Neon brighten the fold crests, Drift slow and offset the cuts, and Dense use many small marks without filling the quiet upper-left.

Run `npm run verify`, `node tools/test-presets.mjs pleat`, `node tools/audit-controls.mjs pleat`, and `npm run build`.

- [ ] **Step 4: Inspect and commit**

At card size, adjacent marks must read as two folded masses; no horizontal chart tracks, baseline, or independent up/down bars may remain.

```bash
git add -A pieces/stock-market pieces/pleat pieces.json downloads/pleat.html thumbs/pleat.png index.html
git rm downloads/stock-market.html thumbs/stock-market.png
git commit -m "feat: replace Stock Market with Pleat"
```

---

### Task 6: Curate the full collection and close documentation

**Files:**
- Modify: `README.md`
- Modify: `BRIEF.md`
- Modify: `ROADMAP.md`
- Modify: `INSPIRATION.md`
- Modify: `CHANGELOG.md`
- Modify: `skills/building-generative-backgrounds/SKILL.md`
- Generated: `index.html`, all changed thumbnails and downloads

**Interfaces:**
- Consumes: all five replacement pieces and the completed Wake plan.
- Produces: a coherent seventeen-piece gallery and current documentation.

- [ ] **Step 1: Build a collection contact sheet**

Run `npm run build`, then compose all seventeen default thumbnails in manifest order at their native 640×400 ratio. Inspect at both full size and 240×150 card size.

Reject and retune any replacement that lacks a label-independent silhouette, competes with its text-safe region, resembles an established piece, or distributes brightness uniformly.

- [ ] **Step 2: Inspect all replacement presets**

For each new slug, capture `whisper`, `ink`, `neon`, `drift`, and `dense` at 1280×800. Reject adjacent presets that differ on only opacity, density, or saturation. Keep every luminance-variance measurement above 12 without pinning a control at its range limit.

- [ ] **Step 3: Measure the collection and tune palettes last**

Run: `npm run collection-metrics`

Adjust default hues only after form and density pass. Prefer low saturation over forcing artificial hue separation in the already-full wheel.

- [ ] **Step 4: Update names, counts, and editorial notes**

Replace all active references to the five removed names. Document each new piece's text-safe zone and composition in README/INSPIRATION. Move the redesign from ROADMAP work-in-progress to shipped, and add a dated CHANGELOG entry describing the five replacements and cursor separation.

- [ ] **Step 5: Run the complete verification battery**

Run:

```bash
npm run verify
npm run test-presets
npm run test-baked
npm run test-bake-fresh
npm run test-source
npm run test-interactions
npm run audit-controls
npm run build
```

Run `npm run build` a second time. Expected: no file changes on the second run.

- [ ] **Step 6: Perform final browser QA**

Open the gallery and each new piece at 1280×800. Confirm hover preview, tag filters, controls, mobile panel, all export buttons, and the separate Wake link. Open each new baked HTML file from disk with the server stopped.

- [ ] **Step 7: Commit curation and docs**

```bash
git add README.md BRIEF.md ROADMAP.md INSPIRATION.md CHANGELOG.md skills/building-generative-backgrounds/SKILL.md pieces.json pieces downloads thumbs index.html
git commit -m "release: curate five replacement pieces"
```
