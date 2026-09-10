// shared/color.js

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));

  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hueShift(h, degrees) {
  return ((h + degrees) % 360 + 360) % 360;
}

export function invertRgb(r, g, b) {
  return [255 - r, 255 - g, 255 - b];
}

// Extracts ONLY hue from a hex colour — the picker's own saturation/lightness
// are discarded, because rendering always sources chroma from the piece's
// shared `saturation` slider, never from the swatch a user happened to pick.
// This is a one-way, lossy read (8-bit RGB quantizes hue), used exactly once
// per user pick — never in a render loop, and never applied to a piece's own
// seeded defaults, which keep their exact authored degree value untouched.
// A grey/white/black pick (max === min) has no hue at all; callers must keep
// the previous hue rather than let this return a meaningless 0 (red).
export function hexToHue(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return null; // achromatic — caller must preserve prior hue
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

// The shared 0-1 ramp position -> {h, s} for a piece's two-stop palette.
// Solid mode ignores `f` and always returns stop A; gradient mode lerps hue
// between the two stops exactly as every piece's own per-element interpolation
// did before this control existed (`hue + (hueB - hue) * f`). `s` is always
// the piece's single shared saturation control — colour stops never carry
// their own saturation. `hue`/`hueB` are the exact, hidden numeric palette
// values (see shared/controls.js); `colorA`/`colorB` are their hex *view*
// only and are never read here.
export function paletteHsl(values, f) {
  const s = values.saturation;
  if (values.colorMode === 'solid') return { h: values.hue, s };
  return { h: values.hue + (values.hueB - values.hue) * f, s };
}
