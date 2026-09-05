# How this skill was tested

Written against observed failures, not from memory. Three runs, all on
fresh agents with no shared context.

## Run 1: baseline inside linefield

Task: add a twelfth piece following the project's conventions, verify it
works. No skill loaded.

It mostly passed. It read CONTRIBUTING, ran `npm run verify`, ran
`audit-controls` on its piece, and that tool flagged its own new control
DEAD at 0.033% changed pixels, below the 0.05% threshold. It enlarged the
effect and re-ran until every control was LIVE. It then tested exports and
loaded the baked file over `file://` with no server.

The conclusion that mattered: the repo's own docs and tooling already carry
most of this knowledge, so a skill repeating them adds little for anyone
working inside linefield. It missed one thing, and missed it by not knowing
it was a gate rather than by arguing against one: it never compared the
piece against the other eleven. It checked palette non-collision
numerically and still landed at hue 213, in the most crowded band in the
library.

That piece shipped as `rainfall` after the collection review it skipped.

## Runs 2 and 3: outside any library, control against skill

Because run 1 passed on the strength of the repo's scaffolding, the real
test had to run where that scaffolding does not exist. Two fresh agents,
identical task (build an animated generative line-art background as one
self-contained HTML file with live controls), differing only in whether
they loaded this skill.

One limit worth naming: the skill arm's prompt told it to invoke the skill
by name. That isolates the value of the content, which is what these runs
were for, but it means discovery was not tested. Whether the description
field alone would pull this skill in unprompted is still an open question.

**Control arm.** Proved its controls worked by setting each slider and
reading the stored parameter back:

> all six matched the set value exactly, so every required control is
> live-bound

That is the dead-control failure exactly. It verifies the value round-trips
through state, not that anything changed on screen. Both controls linefield
shipped dead would have passed it. Driven independently afterwards, its
seven controls did all turn out to be live and it held 60fps, so the method
was weaker than the output. It used `shadowBlur` and never measured frame
rate, so it had no way to know whether that cost it anything.

**Skill arm.** Three decisions made up front rather than fixed later: base
speed set to 320px/s so per-frame displacement clears the 4px maximum
stroke; glow built as a wider dimmer underlay stroke, with `shadowBlur`
appearing in the file only inside a comment explaining why it is not used;
particle count floored so low density cannot round to zero.

Its verification found two bugs that reading the code could not:

- Seeding the RNG and stepping the clock exposed a `Math.random()` call in
  the off-screen respawn path, so two identical-settings renders differed.
- A screenshot taken with the panel hidden showed the value column clipping
  "1.00" to "1.0" and "200" to "2".

It also caught one of its own assertions being vacuous, `dataURL.length >
1000`, which any solid-colour PNG passes, and replaced it with an ink
coverage measurement.

It correctly skipped the collection gate and the inlining section as not
applicable to a standalone file, and named the one gap it could not close:
headless runs cannot tell you whether 60fps has headroom under a real
compositor.
