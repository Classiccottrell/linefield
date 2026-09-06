// shared/pointer.js
// Tracks the cursor relative to one canvas. A leaf module: no imports, no
// state beyond its own listeners.

export function createPointer({ canvas, enabled = true }) {
  const p = {
    x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0,
    active: false, influence: 0,
  };

  let lastX = 0, lastY = 0, lastT = 0;

  function onMove(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top) * (canvas.height / r.height);
    const t = performance.now();
    const dt = lastT ? Math.max((t - lastT) / 1000, 1 / 240) : 0;
    if (dt) { p.vx = (x - lastX) / dt; p.vy = (y - lastY) / dt; }
    p.x = x; p.y = y;
    p.nx = (x / canvas.width) * 2 - 1;
    p.ny = (y / canvas.height) * 2 - 1;
    p.active = true;
    lastX = x; lastY = y; lastT = t;
  }
  function onEnter() { p.active = true; }
  function onLeave() { p.active = false; }

  if (enabled) {
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);
  }

  // Called once per frame by the piece. `influence` rises while the pointer
  // is over the canvas and eases back to 0 when it leaves, so a piece never
  // snaps as the cursor exits.
  //
  // It takes NO dt argument and keeps its own clock, deliberately. The dt a
  // piece receives from createLoop is `scaledDt` — already multiplied by the
  // Speed control — so using it would tie cursor response to Speed, and at
  // Speed 0 dt is 0 and influence would freeze forever.
  //
  // performance.now() is safe under the deterministic harness: it is not
  // frozen, it is a controlled clock that stepFrames advances 16ms per frame,
  // so influence rises normally during an audit and two runs stay identical.
  let stepT = 0;
  p.step = () => {
    const now = performance.now();
    const dt = stepT ? Math.min((now - stepT) / 1000, 0.1) : 0;
    stepT = now;
    if (!dt) return;
    const target = p.active ? 1 : 0;
    const rate = p.active ? 6 : 2.5;
    p.influence += (target - p.influence) * Math.min(rate * dt, 1);
    const decay = Math.exp(-4 * dt);
    p.vx *= decay; p.vy *= decay;
  };

  // 0..1 proximity of a canvas point to the pointer, for pieces that
  // modulate locally rather than globally.
  p.falloff = (x, y, radius) => {
    if (!radius) return 0;
    const d = Math.hypot(x - p.x, y - p.y);
    return Math.max(0, 1 - d / radius);
  };

  p.destroy = () => {
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerenter', onEnter);
    canvas.removeEventListener('pointerleave', onLeave);
  };

  return p;
}
