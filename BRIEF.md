# BRIEF — linefield

## Goal
Open-source library of self-contained, paste-and-run generative line-art
HTML pieces usable as interactive website backgrounds. Free alternative to
Filament.

## Non-Goals
- Gallery site (later sub-project)
- Framework wrappers, WebGL, community submissions (out of scope for now)
- Build tooling / bundler — pieces must stay standalone

## Constraints
- Zero runtime dependencies
- MIT licensed
- Each piece is a single-file-exportable HTML/JS artifact

## Stack
- Vanilla JS (ES modules), Canvas 2D, HTML5/CSS
- No build step for individual pieces

## Acceptance Criteria
- [x] shared/ modules implemented (noise, color, anim, controls, export)
- [x] pieces/_template runs standalone with all 12 shared controls + exports
- [x] pieces/flow-field runs at target frame rate, both line/particle modes work
- [x] Baked HTML export opens standalone with panel removed (see Known limitations
      in README.md: baked files still reference `shared/*.js` via relative paths
      rather than being fully self-contained — inlining is deferred to a follow-up)

## Status
**shipped** (sub-project 1: foundation, template, flow-field)
