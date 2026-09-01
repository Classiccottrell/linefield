// shared/anim.js

export function createLoop({ onFrame, speed = 1 }) {
  let running = false;
  let lastTime = 0;
  let elapsed = 0;
  let rafId = null;
  let currentSpeed = speed;

  function tick(now) {
    if (!running) return;
    const dt = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;
    const scaledDt = dt * currentSpeed;
    elapsed += scaledDt;
    onFrame(scaledDt, elapsed);
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
    setSpeed(n) {
      currentSpeed = n;
    },
    get isRunning() {
      return running;
    },
  };
}
