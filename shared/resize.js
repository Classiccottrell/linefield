// shared/resize.js
//
// Ported from cc-webgl/src/input/ResizeManager.ts's batch-then-evaluate
// pattern: a ResizeObserver only sets a pending flag; the actual work runs
// from `evaluate()`, which callers invoke once per frame tick (no own rAF).
// Keeps the `clientWidth === 0 || clientHeight === 0` bail.

/** onResize({ width, height, dpr, aspect }) is called from evaluate(), never
 * from the ResizeObserver callback directly. */
export function createResizeBatcher(container, onResize, maxDPR = 2) {
  let pending = true; // evaluate once on construction
  let currentMaxDPR = maxDPR;

  const observer = new ResizeObserver(() => {
    pending = true;
  });
  observer.observe(container);

  return {
    setMaxDPR(next) {
      currentMaxDPR = next;
    },
    // Call once per frame tick; only does work if a resize is pending.
    evaluate() {
      if (!pending) return;
      pending = false;
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      const dpr = Math.min(window.devicePixelRatio, currentMaxDPR);
      onResize({ width: clientWidth, height: clientHeight, dpr, aspect: clientWidth / clientHeight });
    },
    destroy() {
      observer.disconnect();
    },
  };
}
