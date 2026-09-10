// shared/controls.js

import { hexToHue } from './color.js';
import { CURSOR_MODES } from './cursor-modes.js';

// `category` routes a control to one of the panel's tiers — 'interaction',
// 'color', or the default 'visual' — and is presentation-only: it changes
// which DOM section a row renders in, never __LF_SPECS__'s declaration
// order, which every gate that isn't the panel itself still reads flat.
const SHARED_CONTROLS = [
  // The seven cursor-interaction modes (Grow, Shrink, Particle Trail,
  // Ripples, Attract, Vortex, None). The behaviours are wired per-piece
  // (see shared/cursor-modes.js); this declares the shared vocabulary so
  // it is never duplicated per piece.
  { name: 'cursorInteraction', label: 'Cursor Interaction', type: 'select', options: CURSOR_MODES, default: 'None', category: 'interaction' },
  { name: 'pointer', label: 'Pointer', type: 'range', min: 0, max: 2, step: 0.01, default: 0, category: 'interaction' },
  { name: 'scale', label: 'Scale', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'speed', label: 'Speed', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'stroke', label: 'Stroke', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.01, default: 1, category: 'color' },
  { name: 'saturation', label: 'Saturation', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6, category: 'color' },
  // Solid/gradient palette. `colorA`/`colorB` are the authored controls a
  // user actually sees and drags; `hue`/`hueB` are hidden (no panel row) —
  // the exact numeric degrees every piece's render math still reads. Picking
  // a colour writes the hidden field via `linkedHue` (see setValue below);
  // the reverse never happens, so a piece's own seeded default hue is never
  // round-tripped through 8-bit hex and stays exactly what the piece declares.
  { name: 'colorMode', label: 'Color Mode', type: 'select', options: ['solid', 'gradient'], default: 'gradient', category: 'color' },
  { name: 'colorA', label: 'Color A', type: 'color', default: '#00aaff', linkedHue: 'hue', category: 'color' },
  { name: 'colorB', label: 'Color B', type: 'color', default: '#aa00ff', linkedHue: 'hueB', category: 'color' },
  { name: 'hue', label: 'Hue', type: 'hidden', default: 200 },
  { name: 'hueB', label: 'Hue B', type: 'hidden', default: 280 },
  { name: 'invert', label: 'Invert', type: 'checkbox', default: false, category: 'color' },
  { name: 'glow', label: 'Glow', type: 'range', min: 0, max: 2, step: 0.01, default: 0 },
  { name: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 1, default: 0 },
  { name: 'motion', label: 'Motion', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'phase', label: 'Phase', type: 'range', min: 0, max: 2, step: 0.01, default: 0 },
  { name: 'density', label: 'Density', type: 'range', min: 0.1, max: 2, step: 0.01, default: 1 },
];

// The shared preset vocabulary. Every piece declares all five; the names mean
// the same intent everywhere, the values differ per piece. Exported so a
// future verifier (e.g. tools/build.mjs) can check a piece's presets against
// this set instead of hardcoding it a second time.
export const PRESET_NAMES = ['whisper', 'ink', 'neon', 'drift', 'dense'];

// Stage C: sectioned, styled panel. Structure is from mock 1 (Interactions /
// divider / Color+Visual / divider / Reset); appearance is from mock 2 (dark
// rounded card, mono accent headers, gradient-fill sliders). The
// PREVIEW_PLANE + VISUAL telemetry boxes in mock 2 are deferred — no data
// feed for them yet — everything else about its styling is applied.
const PANEL_CSS = `
/* Fix round 1: the panel is a flex column so the scrollable middle
   (.lf-body) can't push the footer (.lf-reset) off screen, and section
   headers are now toggle buttons so the panel fits at rest. */
.lf-panel { position: fixed; bottom: 12px; right: 12px; width: 300px;
  background: #0b0b0f; color: #e8e8e8; font: 12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;
  border: 1px solid rgba(255,255,255,0.06); border-radius: 16px;
  z-index: 9999; max-height: 80vh; overflow: hidden; box-sizing: border-box;
  display: flex; flex-direction: column; }
.lf-panel.collapsed .lf-body, .lf-panel.collapsed .lf-reset { display: none; }
.lf-panel h3 { margin: 0; padding: 14px 18px 12px; font: 700 11px/1 ui-monospace,Menlo,monospace;
  text-transform: uppercase; letter-spacing: .12em; color: #6b7cff; flex: none;
  display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.lf-panel h3 .lf-status { display: flex; align-items: center; gap: 5px; font: 500 10px/1 ui-monospace,Menlo,monospace;
  letter-spacing: .05em; color: #8a8a9a; text-transform: none; }
.lf-panel h3 .lf-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
  box-shadow: 0 0 6px rgba(34,197,94,0.8); flex: none; }
/* .lf-body is the ONLY scrolling region — header, footer and the mobile
   handle sit outside it so they never scroll out of view. min-height: 0 is
   load-bearing: without it a flex child won't shrink below its content size
   and this scroller simply never activates. */
.lf-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 0 18px 14px; }
.lf-section-head { all: revert; appearance: none; background: none; border: none; padding: 0;
  margin: 0 0 10px; width: 100%; box-sizing: border-box; text-align: left; cursor: pointer;
  font: 700 10px/1 ui-monospace,Menlo,monospace; text-transform: uppercase; letter-spacing: .12em;
  color: #6b7cff; display: flex; align-items: center; justify-content: space-between; }
.lf-section-head:focus-visible { outline: 2px solid #6fb4c9; outline-offset: 2px; }
.lf-chevron { display: inline-block; font: 10px/1 ui-monospace,Menlo,monospace;
  transition: transform .15s ease; }
.lf-chevron::before { content: '\\25be'; }
.lf-section.lf-section-collapsed .lf-chevron { transform: rotate(-90deg); }
.lf-section.lf-section-collapsed .lf-section-body { display: none; }
.lf-section + .lf-section { margin-top: 14px; }
.lf-divider { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 16px 0; }
.lf-row { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.lf-row:last-child { margin-bottom: 0; }
.lf-row-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.lf-row label { font-size: 11px; color: #8a8a9a; }
.lf-readout { font: 600 11px/1 ui-monospace,Menlo,monospace; color: #ec4899; }
.lf-row-checkbox { flex-direction: row; align-items: center; justify-content: space-between; }
.lf-row-checkbox label { order: -1; }

.lf-row select { width: 100%; box-sizing: border-box; appearance: none; -webkit-appearance: none;
  background: #141419 url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6"><path d="M0 0l5 6 5-6z" fill="%238a8a9a"/></svg>') no-repeat right 10px center;
  color: #e8e8e8; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  padding: 7px 28px 7px 10px; font: 12px -apple-system,sans-serif; }

.lf-row input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px;
  border-radius: 999px; background-color: #26262e;
  background-image: linear-gradient(90deg,#4f6bff,#a855f7 50%,#ec4899);
  background-repeat: no-repeat; background-size: var(--lf-pct, 0%) 100%; cursor: pointer; }
.lf-row input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px;
  border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,0.18), 0 0 8px rgba(255,255,255,0.6);
  cursor: pointer; margin-top: 0; }
.lf-row input[type=range]::-moz-range-thumb { width: 14px; height: 14px; border: none; border-radius: 50%;
  background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,0.18), 0 0 8px rgba(255,255,255,0.6); cursor: pointer; }
.lf-row input[type=range]::-moz-range-track { height: 6px; border-radius: 999px; background: transparent; }
.lf-ticks { display: flex; justify-content: space-between; padding: 0 1px; margin-top: -1px; }
.lf-ticks span { width: 2px; height: 2px; border-radius: 50%; background: #3a3a46; }

.lf-color-row { display: flex; align-items: center; gap: 8px; }
.lf-color-row input[type=color] { width: 30px; height: 26px; padding: 0; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px; background: none; cursor: pointer; flex: none; }
.lf-hex { font: 12px ui-monospace,Menlo,monospace; color: #c9c9d4; text-transform: uppercase; }

.lf-segmented { display: flex; gap: 6px; margin-bottom: 8px; }
.lf-seg-btn { flex: 1; background: #141419; color: #8a8a9a; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 7px 8px; font: 11px -apple-system,sans-serif; cursor: pointer;
  display: flex; align-items: center; gap: 6px; justify-content: center; }
.lf-seg-btn::before { content: ''; width: 9px; height: 9px; border-radius: 50%; border: 1px solid #55556a; flex: none; }
.lf-seg-btn.lf-seg-btn-active { color: #e8e8e8; border-color: #6b7cff; }
.lf-seg-btn.lf-seg-btn-active::before { border-color: #6b7cff; background: #6b7cff; }
.lf-visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

/* Sticky footer (fix round 1, finding 1): a flex sibling of .lf-body, not a
   child of it, so it never scrolls with the sections above it. Its own
   background covers content scrolling underneath; its top border is the
   hairline that reads it as a footer rather than a floating button. */
.lf-reset { flex: none; width: 100%; box-sizing: border-box; margin: 0; background: #0b0b0f;
  color: #e8e8e8; border: none; border-top: 1px solid rgba(255,255,255,0.08);
  border-radius: 0 0 16px 16px; padding: 12px 18px; cursor: pointer;
  font: 11px -apple-system,sans-serif; }
.lf-reset:hover { background: #141419; }
.lf-presets { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 14px; }
.lf-chip { flex: 1 1 auto; background: #141419; color: #c9c9d4; border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px; padding: 5px 6px; font: 500 10px/1 ui-monospace,Menlo,monospace;
  letter-spacing: .05em; text-transform: uppercase; cursor: pointer; }
.lf-chip:hover { color: #fff; border-color: #55556a; }
.lf-chip[aria-pressed="true"] { background: #6b7cff; color: #0b0b0f; border-color: #6b7cff; }
.lf-chip:focus-visible { outline: 2px solid #6fb4c9; outline-offset: 1px; }

/* Below ~640px: full-width sheet docked to the bottom edge, collapsed to a
   handle by default so the artwork stays unobstructed. This is scoped
   entirely to the media query and a separate in-memory flag — never the
   persisted desktop 'collapsed' state — so it can't leak into desktop. */
.lf-handle { display: none; }
@media (max-width: 640px) {
  .lf-panel { left: 0; right: 0; bottom: 0; width: 100%; max-height: 70vh;
    border-radius: 16px 16px 0 0; border-bottom: none; }
  .lf-handle { display: flex; flex: none; justify-content: center; padding: 8px 0; cursor: pointer; }
  .lf-handle::before { content: ''; width: 36px; height: 4px; border-radius: 999px; background: #3a3a46; }
  .lf-reset { border-radius: 0; }
  .lf-panel.mobile-collapsed .lf-body,
  .lf-panel.mobile-collapsed .lf-reset { display: none; }
}
`;

function kindOf(spec) {
  if (spec.type === 'checkbox') return 'boolean';
  if (spec.type === 'color') return 'color';
  if (spec.type === 'select') return 'enum';
  if (spec.type === 'hidden') return 'hidden';
  return 'number';
}

function injectCss() {
  if (document.getElementById('lf-panel-css')) return;
  const style = document.createElement('style');
  style.id = 'lf-panel-css';
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

export function createControlPanel({ pieceId, onChange, extraControls = [], defaults: defaultOverrides = {}, presets = {} }) {
  injectCss();

  // Gallery preview iframes load pieces with ?preview=1: same-origin means
  // they'd otherwise read (and, on interaction, overwrite) the viewer's own
  // localStorage:<pieceId> — showing a hovered card's saved tuning instead
  // of its defaults. Under this flag we neither read nor write it. A piece
  // opened directly, with no query string, is completely unaffected.
  const isPreview = new URLSearchParams(location.search).get('preview') === '1';

  const storageKey = `linefield:${pieceId}`;
  const allSpecs = [...SHARED_CONTROLS, ...extraControls];
  const specByName = {};
  // kind is the discriminant every gate must branch on, never `type`: a gate
  // that switches on the type-name string would silently fall a new type
  // into whichever branch it doesn't match. 'hidden' (hue/hueB) has no panel
  // row at all and is excluded from control gates entirely — it is not a
  // user-facing control, just the exact numeric value colorA/colorB drive.
  for (const spec of allSpecs) {
    spec.kind = kindOf(spec);
    specByName[spec.name] = spec;
  }
  const defaults = {};
  for (const spec of allSpecs) {
    defaults[spec.name] = spec.name in defaultOverrides ? defaultOverrides[spec.name] : spec.default;
  }

  let saved = {};
  if (!isPreview) {
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      saved = {};
    }
  }

  const values = { ...defaults, ...saved.values };
  let collapsed = saved.collapsed || false;
  // Mobile-sheet collapse is a separate, unpersisted flag: it starts
  // collapsed every load (handle-only, per the brief) and is scoped to the
  // <=640px media query in CSS, so toggling it can never affect (or be
  // affected by) the desktop `collapsed` state above.
  let mobileCollapsed = true;
  // Fix round 1, finding 2: sections collapse independently, persisted
  // alongside `collapsed`/`values`. Interactions starts open (the thing the
  // separation was for); Color and Visual start closed, so the panel fits
  // on screen at rest. `saved.sections ?? {}` is deliberately defensive — a
  // blob written before this change has no `sections` key at all, and
  // reading it without the fallback would throw on spread below.
  const DEFAULT_SECTION_OPEN = { interaction: true, color: false, visual: false };
  const sectionOpen = { ...DEFAULT_SECTION_OPEN, ...(saved.sections ?? {}) };

  const panel = document.createElement('div');
  panel.className = 'lf-panel mobile-collapsed' + (collapsed ? ' collapsed' : '');
  panel.setAttribute('data-lf-panel', '');

  // Mobile-only drag handle (CSS hides it above the breakpoint). Tapping it
  // expands/collapses the bottom sheet without touching desktop's own
  // click-to-collapse heading below.
  const handle = document.createElement('div');
  handle.className = 'lf-handle';
  handle.addEventListener('click', () => {
    mobileCollapsed = !mobileCollapsed;
    panel.classList.toggle('mobile-collapsed', mobileCollapsed);
  });
  panel.appendChild(handle);

  const heading = document.createElement('h3');
  const headingLabel = document.createElement('span');
  headingLabel.textContent = 'Controls';
  const status = document.createElement('span');
  status.className = 'lf-status';
  status.innerHTML = '<span class="lf-dot"></span>live';
  heading.append(headingLabel, status);
  heading.addEventListener('click', () => {
    collapsed = !collapsed;
    panel.classList.toggle('collapsed', collapsed);
    persist();
  });
  panel.appendChild(heading);

  const body = document.createElement('div');
  body.className = 'lf-body';
  panel.appendChild(body);

  // Two tiers, per the brief: Interactions (cursor response, kept separate
  // from background configuration on purpose) divided from Color+Visual.
  // Each section is a toggle-button header plus a body a category routes
  // rows into — `sectionOf` below is the single place that mapping lives.
  // Collapsing hides `.lf-section-body` via CSS only: rows stay in the DOM
  // (never removed), so a gate that drives a control by name or by
  // `row.querySelector` still finds it whether its section is open or not.
  function makeSection(key, title) {
    const section = document.createElement('div');
    section.className = 'lf-section';

    const headBtn = document.createElement('button');
    headBtn.type = 'button';
    headBtn.className = 'lf-section-head';
    const headLabel = document.createElement('span');
    headLabel.textContent = title;
    const chevron = document.createElement('span');
    chevron.className = 'lf-chevron';
    headBtn.append(headLabel, chevron);

    const sectionBody = document.createElement('div');
    sectionBody.className = 'lf-section-body';
    section.append(headBtn, sectionBody);

    function applyOpenState() {
      const open = sectionOpen[key];
      headBtn.setAttribute('aria-expanded', String(open));
      section.classList.toggle('lf-section-collapsed', !open);
    }
    applyOpenState();
    headBtn.addEventListener('click', () => {
      sectionOpen[key] = !sectionOpen[key];
      applyOpenState();
      persist();
    });

    return { el: section, body: sectionBody };
  }
  const secInteraction = makeSection('interaction', 'Interactions');
  const secColor = makeSection('color', 'Color');
  const secVisual = makeSection('visual', 'Visual');
  body.appendChild(secInteraction.el);
  body.appendChild(document.createElement('hr')).className = 'lf-divider';
  body.appendChild(secColor.el);
  body.appendChild(secVisual.el);

  // category is optional and defaults to 'visual'. Only 'interaction' and
  // 'color' route a control out of Visual — 'motion'/'form'/'ink' (the
  // piece-extra sub-tags called out in the brief) are metadata for a future
  // stage and land in Visual today, same as an uncategorised control.
  function sectionOf(spec) {
    if (spec.category === 'interaction') return secInteraction.body;
    if (spec.category === 'color') return secColor.body;
    return secVisual.body;
  }

  // Per-control render hook. Covers <input type=range|checkbox|color> and
  // <select> uniformly; a future widget that isn't a bare input/select would
  // register its own render(v) instead, so setValue below stays agnostic to
  // what is actually on screen.
  const controllers = {};

  // Clamp to the spec's declared range where numeric, then snap to its step
  // the same way <input type=range> snaps on a programmatic .value set. That
  // browser-side snap is exactly what the old DOM round-trip captured (set
  // .value, then read it back post-sanitization); setValue writes values[]
  // directly and never reads the DOM back, so without this step a control's
  // displayed slider position and its rendered value can disagree — the
  // Pitch/Yaw divergence this stage exists to remove, reintroduced. Not
  // applied to booleans (kind === 'boolean') or to a name with no known spec.
  function clampValue(spec, v) {
    // Enum membership is not optional: a value outside spec.options must be
    // rejected rather than written, or __LF_VALUES__ and the rendered <select>
    // diverge (the <select> silently ignores an out-of-range .value while
    // the state object keeps whatever was passed in). Falls back to the
    // control's current value, the same "previous value stands" rule a
    // number's clamp already applies at its min/max.
    if (spec?.kind === 'enum') {
      return spec.options.includes(v) ? v : values[spec.name];
    }
    if (!spec || spec.kind !== 'number' || typeof spec.min !== 'number' || typeof spec.max !== 'number') {
      return v;
    }
    const clamped = Math.min(spec.max, Math.max(spec.min, v));
    const step = Number(spec.step);
    if (!(step > 0)) return clamped;
    const snapped = spec.min + Math.round((clamped - spec.min) / step) * step;
    const decimals = (String(step).split('.')[1] || '').length;
    return decimals ? Number(snapped.toFixed(decimals)) : snapped;
  }

  // THE write path. Every value change — a drag, a preset, Reset, or a gate
  // script driving the panel with no DOM at all — goes through this and only
  // this, so a value set by an audit renders identically to the same value
  // set by a human: clamp -> write -> render -> clear active chip -> fire
  // onChange exactly once -> persist if asked.
  function setValue(name, value, { persist: shouldPersist = true } = {}) {
    const spec = specByName[name];
    const v = clampValue(spec, value);
    values[name] = v;
    // A colour control's spec names the hidden numeric field it drives
    // (colorA -> hue, colorB -> hueB). This is the ONLY place that hex gets
    // decoded — once per pick, never in a render loop — and it never runs
    // for a programmatic write to the hidden field itself (see applyValues,
    // which reasserts hue/hueB after this fires so a preset/reset always
    // lands on the exact declared number, not a lossy decode of colorA/
    // colorB). An achromatic pick (grey/white/black) has no hue to extract;
    // hexToHue returns null and the previous hue is left untouched.
    if (spec?.linkedHue) {
      const decoded = hexToHue(v);
      if (decoded !== null) values[spec.linkedHue] = decoded;
    }
    controllers[name]?.render(v);
    if (name === 'colorMode') controllers.colorB?.setRowVisible?.(v === 'gradient');
    setActiveChip(null);
    onChange(name, v, values);
    if (shouldPersist) persist();
  }

  // Same decimals rule clampValue's step-snap uses, so a slider's readout
  // never shows more precision than the control itself actually holds.
  function formatNumber(spec, v) {
    const decimals = (String(spec.step).split('.')[1] || '').length;
    return decimals ? Number(v).toFixed(decimals) : String(v);
  }

  // Mock 2's slider fill is a gradient over the FILLED portion only, unfilled
  // remainder flat grey — not achievable in pure CSS for a native <input
  // type=range> (no fill-percentage selector exists), so render() also
  // writes this custom property every time a value changes, human-dragged or
  // gate-driven, and the two-stop `background-size` trick in PANEL_CSS reads it.
  function setRangeFill(input, spec, v) {
    const pct = spec.max > spec.min ? ((v - spec.min) / (spec.max - spec.min)) * 100 : 0;
    input.style.setProperty('--lf-pct', `${pct}%`);
  }

  // Mock 2's "(•) Solid ( ) Gradient" radio pair, without a second real
  // <input> in colorMode's row: the row's one real control stays the
  // <select> buildRow already built (kept in the DOM, driven exactly the way
  // test-interactions.mjs dispatches a real DOM `input` event), visually
  // hidden, with a composite pair of buttons layered in front of it that
  // call setValue the same way any other control does. This is the
  // registration hook, not a second write path: the buttons never touch
  // `values` themselves.
  function enhanceColorModeToggle(row, select, spec) {
    select.classList.add('lf-visually-hidden');
    const seg = document.createElement('div');
    seg.className = 'lf-segmented';
    const buttons = {};
    for (const opt of spec.options) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lf-seg-btn';
      btn.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
      btn.addEventListener('click', () => setValue(spec.name, opt));
      buttons[opt] = btn;
      seg.appendChild(btn);
    }
    row.insertBefore(seg, select);
    const baseRender = controllers[spec.name].render;
    controllers[spec.name].render = (v) => {
      baseRender(v);
      for (const [opt, btn] of Object.entries(buttons)) btn.classList.toggle('lf-seg-btn-active', opt === v);
    };
    controllers[spec.name].render(values[spec.name]);
  }

  function buildRow(spec) {
    // 'hidden' (hue/hueB) is not a control — no row, no input, no DOM at all.
    // It stays in allSpecs/defaults/values so the rest of the machinery
    // (defaults composition, presets, persistence) treats it like any other
    // value; it is simply never rendered or driven directly.
    if (spec.type === 'hidden') return;

    const row = document.createElement('div');
    row.className = 'lf-row';
    let input;
    let readoutEl = null;
    let hexEl = null;

    if (spec.type === 'checkbox') {
      // Compact single line — label and box side by side, matching mock 2's
      // "Invert [ ]" — rather than the label-above-control layout every
      // other control below uses.
      row.classList.add('lf-row-checkbox');
      const label = document.createElement('label');
      label.textContent = spec.label;
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!values[spec.name];
      row.append(label, input);
    } else {
      const head = document.createElement('div');
      head.className = 'lf-row-head';
      const label = document.createElement('label');
      label.textContent = spec.label;
      head.appendChild(label);

      if (spec.type === 'color') {
        input = document.createElement('input');
        input.type = 'color';
        input.value = values[spec.name];
        row.appendChild(head);
        const colorRow = document.createElement('div');
        colorRow.className = 'lf-color-row';
        hexEl = document.createElement('span');
        hexEl.className = 'lf-hex';
        hexEl.textContent = values[spec.name];
        colorRow.append(input, hexEl);
        row.appendChild(colorRow);
      } else if (spec.type === 'select') {
        input = document.createElement('select');
        for (const opt of spec.options) {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        }
        input.value = values[spec.name];
        row.append(head, input);
      } else {
        readoutEl = document.createElement('span');
        readoutEl.className = 'lf-readout';
        readoutEl.textContent = formatNumber(spec, values[spec.name]);
        head.appendChild(readoutEl);
        input = document.createElement('input');
        input.type = 'range';
        input.min = spec.min;
        input.max = spec.max;
        input.step = spec.step;
        input.value = values[spec.name];
        row.append(head, input);
        setRangeFill(input, spec, values[spec.name]);
        const ticks = document.createElement('div');
        ticks.className = 'lf-ticks';
        for (let i = 0; i < 9; i++) ticks.appendChild(document.createElement('span'));
        row.appendChild(ticks);
      }
    }

    // Thin adapter: read the raw DOM value and hand it to setValue. It must
    // not touch values/onChange/persistence itself — setValue is the only
    // write path (see above).
    input.addEventListener('input', () => {
      const v = spec.type === 'checkbox' ? input.checked
        : (spec.type === 'color' || spec.type === 'select') ? input.value
        : parseFloat(input.value);
      setValue(spec.name, v);
    });

    controllers[spec.name] = {
      render(v) {
        if (spec.type === 'checkbox') { input.checked = v; return; }
        input.value = v;
        if (readoutEl) readoutEl.textContent = formatNumber(spec, v);
        if (hexEl) hexEl.textContent = v;
        if (spec.type !== 'color' && spec.type !== 'select') setRangeFill(input, spec, v);
      },
      setRowVisible(visible) {
        row.style.display = visible ? '' : 'none';
      },
    };

    if (spec.name === 'colorMode') enhanceColorModeToggle(row, input, spec);

    sectionOf(spec).appendChild(row);
  }

  // Presets are the same operation the reset button already performed: write
  // every control, update its input, fire onChange, persist. The only
  // difference is which map is written. Composing over `defaults` is what
  // makes a partial preset safe — a control the preset omits lands on the
  // piece's own default rather than keeping the previous preset's value.
  function applyValues(map) {
    const next = { ...defaults, ...map };
    for (const spec of allSpecs) setValue(spec.name, next[spec.name], { persist: false });
    // setValue(colorA/colorB, ...) above may have just overwritten hue/hueB
    // with a lossy hex decode — order-dependent otherwise, since 'hidden'
    // specs are plain entries in the same allSpecs array. The exact value
    // `next` already carries always wins on a programmatic write (preset,
    // Reset, ?preset= on load): reassert it directly, no side effects, so
    // these paths render at exactly the declared number, never an
    // approximation of it.
    for (const spec of allSpecs) {
      if (spec.kind === 'hidden') values[spec.name] = next[spec.name];
    }
    persist();
  }

  const presetNames = Object.keys(presets);
  let chipRow = null;
  const chips = {};

  function setActiveChip(name) {
    for (const [n, el] of Object.entries(chips)) {
      el.setAttribute('aria-pressed', String(n === name));
    }
  }

  if (presetNames.length) {
    chipRow = document.createElement('div');
    chipRow.className = 'lf-presets';
    for (const name of presetNames) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'lf-chip';
      chip.dataset.preset = name;
      chip.textContent = name;
      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', () => {
        applyValues(presets[name]);
        setActiveChip(name);
      });
      chips[name] = chip;
      chipRow.appendChild(chip);
    }
    // Presets sit above every section, ahead of the two tiers built earlier
    // in this function — insertBefore rather than appendChild, since the
    // section containers are already in `body` by this point.
    body.insertBefore(chipRow, secInteraction.el);
  }

  for (const spec of allSpecs) buildRow(spec);
  // colorB's row only makes sense in gradient mode; setValue toggles it on
  // every subsequent change, this sets the correct initial state.
  controllers.colorB?.setRowVisible?.(values.colorMode === 'gradient');

  // Reset is a sticky footer (fix round 1, finding 1): a sibling of `body`,
  // not a child of it, so the flex layout in PANEL_CSS keeps it pinned to
  // the panel's bottom edge regardless of how far `body` is scrolled. Still
  // inside `panel`, which carries `data-lf-panel` — the hard constraint is
  // about that attribute, not about which direct child holds a row.
  const resetBtn = document.createElement('button');
  resetBtn.className = 'lf-reset';
  resetBtn.textContent = 'Reset to defaults';
  resetBtn.addEventListener('click', () => {
    applyValues(defaults);
    setActiveChip(null);
  });
  panel.appendChild(resetBtn);

  document.body.appendChild(panel);

  function persist() {
    if (isPreview) return;
    localStorage.setItem(storageKey, JSON.stringify({ collapsed, values, sections: sectionOpen }));
  }

  // Declared, uncomposed. tools/build.mjs reads this off the loaded page
  // instead of regex-parsing the HTML, so there is no second copy of the
  // preset data to drift out of sync.
  window.__LF_PRESETS__ = presets;
  // The resolved control specs (name/type/min/max/step), for gate scripts that
  // need to validate preset values against declared ranges without parsing HTML.
  window.__LF_SPECS__ = allSpecs;
  // The live value object, for gate scripts. Same reference the panel mutates.
  window.__LF_VALUES__ = values;
  // The write path itself, for gate scripts that need to drive controls with
  // no DOM query at all — e.g. tools/audit-controls.mjs, which otherwise
  // depends on positional row indices no future widget need honour.
  window.__LF_PANEL__ = { setValue };

  // Highest precedence on load: an explicit ?preset= beats saved localStorage,
  // which beats the piece's defaults. Applied after every row exists so the
  // inputs are there to update. An unknown name is ignored deliberately — a
  // stale shared link should open the piece, not break it.
  const requested = new URLSearchParams(location.search).get('preset');
  if (requested && requested in presets) {
    applyValues(presets[requested]);
    setActiveChip(requested);
  }

  return {
    values,
    el: panel,
    setValue,
    addControl(spec) {
      spec.kind = kindOf(spec);
      specByName[spec.name] = spec;
      allSpecs.push(spec);
      defaults[spec.name] = spec.default;
      if (!(spec.name in values)) values[spec.name] = spec.default;
      buildRow(spec);
      persist();
    },
  };
}
