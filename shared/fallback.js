// shared/fallback.js
//
// Ported from cc-webgl/src/errors/ErrorBoundary.ts's capability-probe +
// DOM-fallback-mount pattern, adapted from WebGL context creation to
// canvas-2D context creation.

/** Probe whether a fresh canvas can get a 2d context in this environment. */
export function probeCanvas2DCapability() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return !!ctx;
  } catch {
    return false;
  }
}

/** Mount an accessible placeholder into `container` when canvas-2D context
 * creation fails. Returns the mounted element. */
export function mountFallback(container, label = 'Interactive scene unavailable') {
  const el = document.createElement('div');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', label);
  el.style.width = '100%';
  el.style.height = '100%';
  container.appendChild(el);
  return el;
}
