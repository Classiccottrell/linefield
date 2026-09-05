---
name: building-generative-backgrounds
description: Use when building animated generative canvas artwork such as flow fields, particle systems, noise fields, wireframe or line-art backgrounds, or when adding a piece to an existing generative art library.
---

# Building Generative Backgrounds

## Overview

A generative piece can be mathematically correct and still render wrong.
Every failure below passed code review, because the arithmetic was fine on
paper. Only looking at the output proves it works.

Evidence throughout comes from linefield, a twelve-piece canvas library
where each of these was shipped, found, and fixed.

## Constants that render wrong

The maths is right and the picture is not. Check these by construction
before you check anything else.

| Symptom | Cause | Fix |
|---|---|---|
| Trails draw as dots, not lines | Per-frame displacement is under the stroke width. 40px/s at 60fps is 0.67px against a 2.5px stroke | Displacement per frame must exceed stroke width. That piece needed 260px/s |
| Particles collapse into filaments | A scalar noise value used directly as a heading is not divergence-free, so paths converge onto contours | Anchor each particle to a home point with a spring, or reseed on arrival |
| Frame rate collapses under glow | Canvas `shadowBlur` costs a blur pass per draw call. 60fps to 2.7fps at 3200 elements | Draw a wider, dimmer underlay stroke instead. Visually close, cheap enough to leave on |
| Frame rate degrades as count rises | All-pairs neighbour search is quadratic | Uniform spatial grid, bucket by cell, check the 9 neighbouring cells |
| A control does nothing at its low end | Base counts under ~10 round to 0 or 1 when multiplied by a minimum density | Floor the result, or raise the base count |
| The form reads as a mass | Element count set for coverage rather than for the intended read | Cut it until the form appears. 12 ribbons read as a tangle; 7 read as ribbons |

## What "verify it works" has to produce

Reading the code is not verification. Each line below produces evidence
that exists outside your reasoning about it.

1. **Look at it**, in a foregrounded window, at the size it will actually be
   used. Background tabs throttle `requestAnimationFrame`, which corrupts
   both visual judgement and any frame-rate number you take.
2. **Clear persisted UI state first.** Saved settings outrank defaults, so a
   piece you tuned an hour ago shows you your own values, not the ones you
   are about to ship.
3. **Drive every control across its range and diff rendered pixels.** Seed
   the RNG and step the clock manually so two identical-settings renders are
   pixel-identical, then a diff of zero means dead, not noise. Two controls
   shipped in linefield that read a value and changed nothing; both passed
   review by inspection.
4. **Run every control to 0 and to maximum.** This is where NaN, division by
   zero, and degenerate gradients surface.
5. **Measure worst-case frame rate**, at maximum density, discarding the
   first window while the JIT warms.
6. **Exercise the export path the way a user will.** If the piece exports a
   standalone file, open that file from disk with no server running.

## The collection gate

A piece judged only against its own intent can be individually correct and
collectively redundant. linefield once shipped five pieces that were each
right and together looked like one thing five times, because every review
compared a piece to its brief and never to its siblings.

Render every piece to a thumbnail, put them on one contact sheet, and look
at them together. Past roughly six pieces, measure as well: mean hue, mean
saturation, and ink coverage (the fraction of pixels a piece marks). Ink
coverage separates pieces that hue alone says are distinct, and hue is a
slider a viewer can move anyway.

Differentiate on form or density before reaching for colour.

## Inlining and bundling

Any hand-maintained list of modules to inline is a silent-failure surface.
Add a module, forget the list, and the bundler emits a file that is valid,
loads without error, and renders blank. Two separate reviews reported that
gate passing in linefield when it failed deterministically.

If the build has such a list, derive it from the imports instead. If you
cannot, load the built artifact and assert something drew.

## Screenshots

Screenshotting a canvas element still composites fixed-position overlays
above it. A control panel that sits over the canvas lands in the capture.
Hide the overlays, or capture with them removed, before judging output.
