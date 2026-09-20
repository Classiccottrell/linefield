// shared/anim.js

// Max per-frame dt (seconds) after a tab-switch/GC stall, so a single huge
// frame doesn't fling particles across the canvas. Ported from
// cc-webgl/src/core/FrameScheduler.ts's DT_CLAMP_SECONDS.
const ANIM_DT_CLAMP_SECONDS = 0.1;

export function createLoop({ onFrame, speed = 1 }) {
  let running = false;
  let paused = false;
  let lastTime = 0;
  let elapsed = 0;
  let rafId = null;
  let currentSpeed = speed;

  function tick(now) {
    if (!running || paused) return;
    const rawDt = lastTime ? (now - lastTime) / 1000 : 0;
    const clampedDt = Math.min(Math.max(rawDt, 0), ANIM_DT_CLAMP_SECONDS);
    lastTime = now;
    const scaledDt = clampedDt * currentSpeed;
    elapsed += scaledDt;
    onFrame(scaledDt, elapsed);
    rafId = requestAnimationFrame(tick);
  }

  function handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      paused = true;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    } else if (running && paused) {
      paused = false;
      // Reset the sentinel instead of computing a real dt, so resume doesn't
      // produce a giant catch-up frame — same reasoning as start()'s reset.
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      paused = false;
      lastTime = 0;
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      paused = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    },
    setSpeed(n) {
      currentSpeed = n;
    },
    get isRunning() {
      return running;
    },
  };
}
