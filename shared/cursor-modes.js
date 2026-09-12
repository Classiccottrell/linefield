// shared/cursor-modes.js
// A leaf module: no imports, matching every other shared module, so the bake
// inliner picks it up from a piece's own import line.

export const CURSOR_MODES = [
  'None', 'Grow', 'Shrink', 'Particle Trail', 'Ripples', 'Attract', 'Vortex',
];

// Trail and Ripples are cursor effects, not piece effects, so they live here
// once rather than twelve times. They keep their OWN aged memory and redraw
// every surviving mark from scratch each frame: ten pieces clear the canvas
// fully each frame (marks would vanish) and two repaint translucent to
// accumulate trails (marks would smear at the piece's fade rate, untunable).
//
// CONTRACT, binding on every piece that wires this in (see CONTRIBUTING.md,
// "Cursor interaction"): call `.draw()` AFTER the piece has cleared the
// canvas and drawn its own frame for this tick — as the very last thing in
// the frame, not before it. `.step()` has no such constraint; call it
// whenever convenient in onFrame, typically right after `pointer.step()`.
// A piece that draws BEFORE its own clear renders nothing: a full-clear
// piece's fillRect/clearRect wipes the overlay's marks along with
// everything else drawn that frame. Ten of the twelve pieces in this
// library do a full clear every frame, so this is the common case, not an
// edge case.
export function createCursorOverlay() {
  let marks = [];
  let lastX = null, lastY = null;

  return {
    // Called once per frame from the piece's onFrame, before drawing.
    step(mode, k, pointer) {
      if (!k || (mode !== 'Particle Trail' && mode !== 'Ripples')) {
        if (marks.length) marks = [];
        return;
      }
      const now = performance.now();
      if (mode === 'Particle Trail' && pointer.active) {
        const moved = lastX === null || Math.hypot(pointer.x - lastX, pointer.y - lastY) > 6;
        // A movement-only trigger leaves nothing to sample once the cursor
        // stops (or, under the deterministic harness's single pointermove,
        // once the last particle's life has elapsed against a run that
        // steps thousands of ms) — that read as inert on every full-clear
        // piece, which repaints from nothing each frame and so has no
        // accumulated trace once the emission expires. Throttled re-emission
        // while the pointer is present, mirroring Ripples below, keeps the
        // trail alive regardless of whether the cursor is moving.
        const lastDot = marks.length ? marks[marks.length - 1] : null;
        const stale = !lastDot || now - lastDot.born > 45;
        if (moved || stale) {
          // Dust, not beads: a scattered cluster of small, faint, varied-
          // size particles around the cursor (not centred on a single
          // point), each drifting apart as it ages. Density (particle
          // count) carries the effect's visibility, not size or opacity —
          // those stay small/low so the overlay doesn't outweigh a piece's
          // own marks (grain-field's fine specks are the tuning floor).
          const n = 22;
          for (let i = 0; i < n; i++) {
            const ang = Math.random() * Math.PI * 2;
            const rad = Math.random() * 11;
            marks.push({
              kind: 'dot',
              x: pointer.x + Math.cos(ang) * rad,
              y: pointer.y + Math.sin(ang) * rad,
              born: now, life: 650 + Math.random() * 450,
              r: 0.5 + Math.random() * 1.6,
              alphaMul: 0.3 + Math.random() * 0.35,
              dx: (Math.random() - 0.5) * 50,
              dy: (Math.random() - 0.5) * 50,
            });
          }
          lastX = pointer.x; lastY = pointer.y;
        }
      }
      if (mode === 'Ripples' && pointer.active) {
        const last = marks[marks.length - 1];
        if (!last || now - last.born > 260) {
          marks.push({ kind: 'ring', x: pointer.x, y: pointer.y, born: now, life: 1400 });
        }
      }
      marks = marks.filter((m) => now - m.born < m.life);
      if (marks.length > 400) marks = marks.slice(-400);
    },

    // Called after the piece has drawn its own frame.
    draw(ctx, colour, k) {
      if (!marks.length || !k) return;
      const now = performance.now();
      ctx.save();
      for (const m of marks) {
        const age = (now - m.born) / m.life;
        if (age >= 1) continue;
        const alpha = (1 - age) * k;
        if (m.kind === 'dot') {
          ctx.globalAlpha = Math.min(alpha * (m.alphaMul ?? 1), 1);
          ctx.fillStyle = colour;
          ctx.beginPath();
          ctx.arc(m.x + m.dx * age, m.y + m.dy * age, m.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = Math.min(alpha * 0.7, 1);
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(m.x, m.y, 12 + age * 190, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
    },

    reset() { marks = []; lastX = null; lastY = null; },
  };
}

// The strength every per-piece mode multiplies by. `pointer` is the intensity
// control, `influence` eases the cursor entering and leaving. Nothing else —
// in particular never `values.speed`, which a user can set to zero.
export function modeFactor(values, pointer) {
  if (values.cursorInteraction === 'None') return 0;
  return values.pointer * pointer.influence;
}
