// tools/deterministic.mjs
//
// Shared by tools/build.mjs (thumbnail capture) and tools/audit-controls.mjs.
// Freezes Math.random and the animation clock so two identical-settings
// renders are pixel-identical: no queue-emptying/backgrounding noise floor,
// and no per-run PNG churn when nothing actually changed.

// Injected before any page script runs via context.addInitScript.
export const DETERMINISTIC_INIT = `(() => {
  let s = 12345;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  let t = 0; const q = [];
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  performance.now = () => t;
  window.__step = (ms) => { t += ms; const cbs = q.splice(0); for (const cb of cbs) cb(t); };
})();`;

// 250 * 16ms = 4000ms, matches build.mjs's (pre-existing) SETTLE_MS wall-clock wait.
export const STEPS = 250;
export const FRAME_MS = 16;

export async function stepFrames(page, steps = STEPS) {
  await page.evaluate(
    ({ n, ms }) => {
      for (let i = 0; i < n; i++) window.__step(ms);
    },
    { n: steps, ms: FRAME_MS }
  );
}
