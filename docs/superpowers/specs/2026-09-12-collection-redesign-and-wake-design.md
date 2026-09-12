# Collection Redesign and Wake

## Purpose

Restore the collection's editorial standard after five recent pieces and seven cursor modes made it feel literal, repetitive, and mechanically over-specified.

The five recent pieces are replaced freely rather than polished in place. Their useful mark-making techniques survive, but their names, compositions, and motion do not. Cursor decoration becomes an optional mechanism outside every artwork.

## Scope

Replace these pieces one-for-one:

| Remove | Add | Technique retained |
|---|---|---|
| `puddle` | `undertow` | bounded wave interference |
| `globe` | `parallax` | spatial projection and depth |
| `matrix-code` | `cipher-bloom` | glyph marks |
| `chain-haze` | `driftwork` | linked elliptical marks |
| `stock-market` | `signal-fold` | filled rectangular marks |

Remove the shared cursor-mode selector, pointer-strength control, cursor overlays, and per-piece Grow/Shrink/Attract/Vortex branches from all seventeen pieces and the piece template.

Add one standalone interaction addon, Wake. Keep drag-to-orbit on true 3D pieces because it manipulates their camera directly and is not cursor decoration.

Framework wrappers, new runtime dependencies, WebGL, new shared visual controls, and compatibility aliases for removed piece URLs are out of scope.

## Collection principles

Each replacement must have:

- one dominant compositional gesture visible at gallery-card size;
- meaningful negative space rather than uniform edge-to-edge coverage;
- motion that reveals the form instead of merely translating or spinning it;
- a mark vocabulary not already carried more strongly by another piece;
- restrained defaults suitable behind page content;
- five presets that differ on at least two visual axes, not only intensity.

The default palette is subordinate to form. Exact hues are tuned against the full collection rather than treated as part of a piece's identity.

## Replacement pieces

### Undertow

An off-centre calm zone is surrounded by broken caustic arcs. Several phase-shifted wave sources deform elliptical fronts; only locally coherent portions are drawn, leaving reflective fragments rather than a closed puddle outline. Arc density gathers on one side and opens on the other, producing a clear sweeping silhouette.

`Speed` advances the wave phase. `Motion` changes the source drift. `Phase` changes interference. `Angle` moves the calm zone around the frame rather than rotating the canvas. `Density` changes the number of fronts. `Scale` changes their reach.

The default is low-saturation blue-silver with modest ink coverage. Motion is slow enough that the composition reads as stable before it reads as animated.

### Parallax

A fan of long diagonal lines enters the frame, divides around an invisible oval volume, compresses at its rim, and reunites beyond it. The volume is never outlined. Near paths are brighter and wider; far paths thin and fade. A slow lateral drift changes which lines pass in front of the implied body, allowing depth to appear and disappear.

This is not a wire globe and does not expose latitude or longitude. It differs from `contour-grid` through convergence, occlusion, diagonal flow, and the central absence.

`Speed` moves the field through the lens. `Motion` changes the lens drift and depth. `Phase` shifts line spacing. `Angle` changes the field direction. `Density` changes the fan count. `Scale` changes the lens and convergence strength.

The default is a muted rose-to-amber field with a dark centre and medium-low coverage.

### Cipher Bloom

Glyph fragments occupy an oblique atmospheric band with a dense core and dissolving edges. Characters sit on an irregular grid and mutate in deterministic time buckets; they do not fall in columns. Sparse bright marks punctuate the core while dim fragments imply a larger field. The band drifts slowly enough to behave as texture, not a terminal animation.

`Speed` moves the band. `Motion` controls identity-change frequency. `Phase` bends its centreline. `Angle` sets its diagonal. `Density` controls grid occupancy. `Scale` controls glyph size and band breadth.

The default avoids Matrix green: warm chalk and dim amber on black, with roughly half the frame left quiet.

### Driftwork

Small alternating ellipses follow two broad currents that cross into an S-shaped composition. Each ellipse is oriented to the local tangent; alternating aspect ratios imply linkage without drawing literal chains. Size, spacing, and opacity carry depth. Marks dissolve before reaching the frame edge, so the macro form reads as atmosphere rather than lanes receding to a vanishing point.

`Speed` advects links. `Motion` evolves the currents. `Phase` offsets the two streams. `Angle` steers the composition. `Density` controls mark count. `Scale` changes link size and current separation.

The default uses cool violet-grey with low saturation and medium coverage concentrated around the crossing.

### Signal Fold

Filled rectangles sample a low-resolution traveling field. Height, orientation, and visibility combine into two folded bands separated by sharp cuts of negative space. Adjacent marks move coherently, so the result reads as a material surface or signal mass rather than independent chart bars.

`Speed` advances the traveling field. `Motion` changes fold depth. `Phase` offsets the two bands. `Angle` turns the field mathematically so SVG output remains correct. `Density` changes sampling resolution. `Scale` changes mark size and band breadth.

The default uses restrained coral and warm ivory, with medium-high coverage localized to the folds rather than spread uniformly.

## Controls and presets

The replacements use the existing shared visual controls: scale, speed, stroke, opacity, saturation, solid/gradient color, glow, angle, motion, phase, invert, and density. Hidden hue values remain implementation details of the color pickers.

No piece-specific control is added unless visual testing proves that the shared controls cannot express a required dimension. The default implementation therefore adds none.

Every control must visibly affect each replacement at its minimum and maximum without creating invalid geometry, NaN coordinates, or a blank default. Presets retain the shared names `whisper`, `ink`, `neon`, `drift`, and `dense`.

## Wake interaction addon

Wake is a separate mechanism, not a shared piece control.

`interactions/wake.js` exports `createWake({ target, color, strength, enabled, respectReducedMotion })`. `target` must be a canvas element; an invalid target throws a clear `TypeError`. The function returns `setEnabled(boolean)`, `setStrength(number)`, and `destroy()`.

Wake creates a transparent, pointer-inert canvas aligned above `target`. It reuses `createPointer()` from `shared/pointer.js`, samples a short position history, and draws two or three smoothed offset strands. Pointer speed affects strand separation and brightness. History decays within about one second. When movement settles after a meaningful gesture, one faint pressure pulse expands from the final point. Pointer exit adds no new marks; existing marks fade naturally.

The addon owns its animation frame, resize observation, pointer tracker, and overlay element. `destroy()` cancels the frame, disconnects resize observation, removes listeners through the pointer tracker, and removes the overlay.

Wake defaults off. When `prefers-reduced-motion: reduce` is active and `respectReducedMotion` is not disabled explicitly, it remains off. Strength is clamped to 0–1.5. Color defaults to translucent white and can be supplied by the host.

`interactions/wake/index.html` demonstrates the mechanism on a neutral background with only an On/Off control and Strength slider. The main gallery gains a small, visually separate “Interaction mechanisms” section linking to this demo. Artwork control panels and piece exports do not include Wake. README integration instructions show the import and one call needed to add it to any canvas.

## File and data changes

- Rename the five source directories and replace their renderers.
- Replace the five entries in `pieces.json`; the gallery continues to derive from this manifest.
- Remove old thumbnails and baked downloads; `npm run build` generates replacements under the new slugs.
- Remove `shared/cursor-modes.js`.
- Keep `shared/pointer.js` for Wake and 3D orbit.
- Remove cursor controls from `shared/controls.js`.
- Remove cursor imports, overlay calls, and mode branches from every piece and `_template`.
- Add `interactions/wake.js` and `interactions/wake/index.html`.
- Update README, BRIEF, ROADMAP, CHANGELOG, CONTRIBUTING, package scripts, and CI so they describe the smaller visual-control contract and standalone Wake addon.
- Delete the obsolete cursor-mode contact-sheet and test scripts.
- Repurpose `tools/test-interactions.mjs` to exercise Wake lifecycle, enable/disable behavior, strength, pointer response, resize, and teardown.

## Rendering and export behavior

Each piece remains a zero-dependency ES-module page and bakes to one standalone HTML file. Existing color, animation, projection, control, deterministic-clock, SVG, PNG, source, and baked-export paths are reused.

SVG paths must describe the transformed geometry actually shown on canvas. New pieces apply `Angle` mathematically rather than relying on an unrecorded canvas transform. `cipher-bloom` continues to use the existing SVG text export capability.

Removing cursor code must not change untouched pieces at their default settings. Their current deterministic thumbnails are the baseline for comparison.

Wake is distributed as source and documented separately. It is not inlined into baked artwork and cannot affect artwork exports.

## Failure and lifecycle behavior

Piece rendering clamps counts and dimensions before drawing. Projection or transform results that are non-finite are skipped rather than added to canvas or SVG paths. Resize rebuilds only dimensions or deterministic geometry that depends on the viewport; it does not introduce random state.

Wake resets its position history when its target changes size, fades normally on pointer exit, and performs complete teardown. The overlay uses `pointer-events: none`, so it cannot block links, controls, scrolling, or 3D drag interaction.

## Verification

Before editing, preserve the current deterministic default captures for the original twelve pieces. After cursor removal, compare new captures against them; they must be pixel-identical except for generated gallery metadata that does not touch the canvas.

For each replacement:

1. Run the control audit across every shared control at minimum and maximum.
2. Run preset validation and inspect all five presets at 1280×800.
3. Measure worst-case frame rate at maximum density after warm-up.
4. Exercise PNG, SVG, source, and baked HTML exports.
5. Open the baked file standalone and confirm it renders with no server.

For the collection, rebuild all gallery artifacts and inspect a seventeen-piece contact sheet at the shipping viewport. Each replacement must be identifiable by silhouette without its label and must not collapse into an existing piece when viewed at card size.

For Wake, the repurposed browser test verifies that disabled and zero-strength states draw nothing, enabled pointer movement draws on only the overlay, resize clears stale history, and `destroy()` removes the overlay and stops further drawing. A manual pass confirms that the strands read as one coherent wake rather than a particle trail plus ripple mode.

Run the complete package checks and require a clean second `npm run build` to prove generated output is current and deterministic.

## Completion criteria

The work is complete when the gallery contains the twelve established pieces, the five renamed replacements, and a separate Wake mechanism; no cursor-mode control or per-piece cursor-mode branch remains; all automated checks pass; generated artifacts are current; and the visual contact-sheet review confirms that the five replacements belong to the collection without resembling the sketches they replace.
