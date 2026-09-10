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
        // once the one dot's 900ms life has elapsed against a run that
        // steps thousands of ms) — that read as inert on every full-clear
        // piece, which repaints from nothing each frame and so has no
        // accumulated trace once the last dot expires. Throttled re-emission
        // while the pointer is present, mirroring Ripples below, keeps a
        // live mark on screen regardless of whether the cursor is moving.
        const lastDot = marks.length ? marks[marks.length - 1] : null;
        const stale = !lastDot || now - lastDot.born > 70;
        if (moved || stale) {
          marks.push({ kind: 'dot', x: pointer.x, y: pointer.y, born: now,
            life: 900, r: 8 + Math.random() * 10,
            dx: (Math.random() - 0.5) * 18, dy: (Math.random() - 0.5) * 18 });
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
          ctx.globalAlpha = Math.min(alpha, 1);
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
