import { createPointer } from '../shared/pointer.js';

const clampStrength = (value) => Math.max(0, Math.min(1.5, Number(value) || 0));

export function createWake({
  target,
  color = 'rgba(255,255,255,.72)',
  strength = 0.65,
  enabled = false,
  respectReducedMotion = true,
} = {}) {
  if (!(target instanceof HTMLCanvasElement)) {
    throw new TypeError('Wake target must be a canvas element');
  }

  const overlay = document.createElement('canvas');
  const context = overlay.getContext('2d');
  const pointer = createPointer({ canvas: target });
  const points = [];
  const reduced = respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = Boolean(enabled) && !reduced;
  let amount = clampStrength(strength);
  let destroyed = false;
  let frame = 0;
  let pulse = null;
  let pulsed = false;
  let lastMove = 0;
  // Tracks the pointer's own last-seeded position, independent of the
  // `points` history array's lifecycle. `points` empties out as marks fully
  // decay; falling back to it for "did the pointer move" (via `points.at(-1)`
  // being undefined) reads a stationary pointer as an infinite jump the
  // instant history clears, re-seeding a fresh mark every ~900ms with zero
  // motion. `lastSeed` persists across that emptying so a still pointer
  // never seeds again until it actually moves.
  let lastSeed = null;

  overlay.dataset.lfWake = '';
  Object.assign(overlay.style, {
    position: 'fixed', pointerEvents: 'none', zIndex: '10',
  });
  document.body.append(overlay);

  function clear() {
    context.clearRect(0, 0, overlay.width, overlay.height);
  }

  function reset() {
    points.length = 0;
    pulse = null;
    pulsed = false;
    lastSeed = null;
    clear();
  }

  function align() {
    const rect = target.getBoundingClientRect();
    Object.assign(overlay.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    });
    return rect;
  }

  function resize() {
    const rect = align();
    const ratio = devicePixelRatio || 1;
    overlay.width = Math.max(1, Math.round(rect.width * ratio));
    overlay.height = Math.max(1, Math.round(rect.height * ratio));
    reset();
  }

  function drawStrand(offset, index, now) {
    if (points.length < 2) return;
    const rect = target.getBoundingClientRect();
    const speed = Math.hypot(
      pointer.vx * rect.width / Math.max(target.width, 1),
      pointer.vy * rect.height / Math.max(target.height, 1),
    );
    const alphaSpeed = Math.min(1, speed / 240);
    const width = (2 + speed * 0.012) * amount;
    const first = points[0];
    context.beginPath();
    context.moveTo(first.x + first.nx * offset * width, first.y + first.ny * offset * width);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const previous = points[i - 1];
      const x = point.x + point.nx * offset * width;
      const y = point.y + point.ny * offset * width;
      context.quadraticCurveTo(
        previous.x + previous.nx * offset * width,
        previous.y + previous.ny * offset * width,
        (previous.x + previous.nx * offset * width + x) / 2,
        (previous.y + previous.ny * offset * width + y) / 2,
      );
    }
    const age = Math.max(0, 1 - (now - first.t) / 900);
    context.globalAlpha = age * (0.44 - Math.abs(index) * 0.1) * (0.4 + alphaSpeed * 0.6);
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, amount * (1.5 - Math.abs(index) * 0.25));
    context.stroke();
  }

  function draw(now) {
    clear();
    if (!active || !amount) return;
    drawStrand(-1, -1, now);
    drawStrand(0, 0, now);
    drawStrand(1, 1, now);
    if (points.length === 1) {
      const point = points[0];
      const age = Math.max(0, 1 - (now - point.t) / 900);
      if (age > 0) {
        context.beginPath();
        context.arc(point.x, point.y, 8 * amount, 0, Math.PI * 2);
        context.globalAlpha = age * 0.35;
        context.fillStyle = color;
        context.fill();
      }
    }
    if (pulse) {
      const age = now - pulse.t;
      if (age < 480) {
        context.beginPath();
        context.arc(pulse.x, pulse.y, (4 + age * 0.045) * amount, 0, Math.PI * 2);
        context.globalAlpha = (1 - age / 480) * 0.3;
        context.strokeStyle = color;
        context.lineWidth = Math.max(1, amount);
        context.stroke();
      } else pulse = null;
    }
    context.globalAlpha = 1;
  }

  function tick() {
    if (destroyed) return;
    pointer.step();
    const now = performance.now();
    if (active && amount && pointer.active) {
      const x = pointer.x * overlay.width / Math.max(target.width, 1);
      const y = pointer.y * overlay.height / Math.max(target.height, 1);
      const previous = points.at(-1);
      const distance = lastSeed ? Math.hypot(x - lastSeed.x, y - lastSeed.y) : Infinity;
      if (distance >= 3 * (devicePixelRatio || 1)) {
        const dx = x - (previous?.x ?? x);
        const dy = y - (previous?.y ?? y);
        const length = Math.hypot(dx, dy) || 1;
        points.push({ x, y, nx: -dy / length, ny: dx / length, t: now });
        if (points.length > 32) points.shift();
        lastSeed = { x, y };
        lastMove = now;
        pulse = null;
        pulsed = false;
      }
    }
    while (points[0] && now - points[0].t > 900) points.shift();
    if (active && amount && !pulse && !pulsed && points.length >= 6 && now - lastMove >= 180) {
      const point = points.at(-1);
      pulse = { x: point.x, y: point.y, t: now };
      pulsed = true;
    }
    draw(now);
    frame = requestAnimationFrame(tick);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(target);
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', align, true);
  resize();
  frame = requestAnimationFrame(tick);

  return {
    setEnabled(value) {
      if (destroyed) return;
      active = Boolean(value) && !reduced;
      if (!active) reset();
    },
    setStrength(value) {
      if (destroyed) return;
      amount = clampStrength(value);
      if (!amount) reset();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', align, true);
      pointer.destroy();
      overlay.remove();
    },
  };
}
