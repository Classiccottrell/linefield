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
- [ ] shared/ modules implemented (noise, color, anim, controls, export)
- [ ] pieces/_template runs standalone with all 12 shared controls + exports
- [ ] pieces/flow-field runs at target frame rate, both line/particle modes work
- [ ] Baked HTML export opens standalone with panel removed

## Status
**active**
