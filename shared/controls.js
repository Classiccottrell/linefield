// shared/controls.js

const SHARED_CONTROLS = [
  { name: 'scale', label: 'Scale', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'speed', label: 'Speed', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'stroke', label: 'Stroke', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.01, default: 1 },
  { name: 'saturation', label: 'Saturation', type: 'range', min: 0, max: 1, step: 0.01, default: 0.6 },
  { name: 'hue', label: 'Hue', type: 'range', min: 0, max: 360, step: 1, default: 200 },
  { name: 'hueB', label: 'Hue B', type: 'range', min: 0, max: 360, step: 1, default: 280 },
  { name: 'glow', label: 'Glow', type: 'range', min: 0, max: 2, step: 0.01, default: 0 },
  { name: 'angle', label: 'Angle', type: 'range', min: 0, max: 360, step: 1, default: 0 },
  { name: 'motion', label: 'Motion', type: 'range', min: 0, max: 2, step: 0.01, default: 1 },
  { name: 'phase', label: 'Phase', type: 'range', min: 0, max: 2, step: 0.01, default: 0 },
  { name: 'invert', label: 'Invert', type: 'checkbox', default: false },
  { name: 'density', label: 'Density', type: 'range', min: 0.1, max: 2, step: 0.01, default: 1 },
  { name: 'pointer', label: 'Pointer', type: 'range', min: 0, max: 2, step: 0.01, default: 0 },
];

// The shared preset vocabulary. Every piece declares all five; the names mean
// the same intent everywhere, the values differ per piece. Exported so a
// future verifier (e.g. tools/build.mjs) can check a piece's presets against
// this set instead of hardcoding it a second time.
export const PRESET_NAMES = ['whisper', 'ink', 'neon', 'drift', 'dense'];

const PANEL_CSS = `
.lf-panel { position: fixed; bottom: 12px; right: 12px; width: 240px;
  background: rgba(20,20,24,0.92); color: #e8e8e8; font: 12px/1.4 -apple-system,sans-serif;
  border-radius: 8px; padding: 10px 12px; z-index: 9999; max-height: 80vh; overflow-y: auto; }
.lf-panel.collapsed .lf-body { display: none; }
.lf-panel h3 { margin: 0 0 8px; font-size: 12px; display: flex; justify-content: space-between; cursor: pointer; }
.lf-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
.lf-row label { flex: 1; }
.lf-row input[type=range] { flex: 1.4; }
.lf-reset { width: 100%; margin-top: 6px; background: #333; color: #eee; border: none; border-radius: 4px; padding: 4px; cursor: pointer; }
.lf-presets { display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 8px; }
.lf-chip { flex: 1 1 auto; background: #2a2a32; color: #c9c9d4; border: 1px solid #3a3a46;
  border-radius: 3px; padding: 4px 6px; font: 500 10px/1 ui-monospace,Menlo,monospace;
  letter-spacing: .05em; text-transform: uppercase; cursor: pointer; }
.lf-chip:hover { color: #fff; border-color: #55556a; }
.lf-chip[aria-pressed="true"] { background: #e8e8ec; color: #16161a; border-color: #e8e8ec; }
.lf-chip:focus-visible { outline: 2px solid #6fb4c9; outline-offset: 1px; }
`;

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
  // kind is the discriminant every gate must branch on, never `type`: Stage C
  // adds 'select'/'radio' types, and a gate that switches on type-name string
  // would silently fall a new type into whichever branch it doesn't match.
  for (const spec of allSpecs) {
    spec.kind = spec.type === 'checkbox' ? 'boolean' : 'number';
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

  const panel = document.createElement('div');
  panel.className = 'lf-panel' + (collapsed ? ' collapsed' : '');
  panel.setAttribute('data-lf-panel', '');

  const heading = document.createElement('h3');
  heading.textContent = 'controls ▾';
  heading.addEventListener('click', () => {
    collapsed = !collapsed;
    panel.classList.toggle('collapsed', collapsed);
    persist();
  });
  panel.appendChild(heading);

  const body = document.createElement('div');
  body.className = 'lf-body';
  panel.appendChild(body);

  // Per-control render hook. The default registration below covers a plain
  // <input>; a widget that isn't a bare input (Stage C's dropdown/radio/
  // colour picker) registers its own render(v) instead, so setValue below
  // stays agnostic to what is actually on screen.
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
    controllers[name]?.render(v);
    setActiveChip(null);
    onChange(name, v, values);
    if (shouldPersist) persist();
  }

  function buildRow(spec, beforeEl) {
    const row = document.createElement('div');
    row.className = 'lf-row';
    const label = document.createElement('label');
    label.textContent = spec.label;
    row.appendChild(label);

    let input;
    if (spec.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!values[spec.name];
    } else if (spec.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.value = values[spec.name];
    } else {
      input = document.createElement('input');
      input.type = 'range';
      input.min = spec.min;
      input.max = spec.max;
      input.step = spec.step;
      input.value = values[spec.name];
    }

    // Thin adapter: read the raw DOM value and hand it to setValue. It must
    // not touch values/onChange/persistence itself — setValue is the only
    // write path (see above).
    input.addEventListener('input', () => {
      const v = spec.type === 'checkbox' ? input.checked : parseFloat(input.value);
      setValue(spec.name, v);
    });

    controllers[spec.name] = {
      render(v) {
        if (spec.type === 'checkbox') input.checked = v;
        else input.value = v;
      },
    };
    row.appendChild(input);
    if (beforeEl) body.insertBefore(row, beforeEl);
    else body.appendChild(row);
  }

  // Presets are the same operation the reset button already performed: write
  // every control, update its input, fire onChange, persist. The only
  // difference is which map is written. Composing over `defaults` is what
  // makes a partial preset safe — a control the preset omits lands on the
  // piece's own default rather than keeping the previous preset's value.
  function applyValues(map) {
    const next = { ...defaults, ...map };
    for (const spec of allSpecs) setValue(spec.name, next[spec.name], { persist: false });
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
    body.appendChild(chipRow);
  }

  for (const spec of allSpecs) buildRow(spec);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'lf-reset';
  resetBtn.textContent = 'Reset to defaults';
  resetBtn.addEventListener('click', () => {
    applyValues(defaults);
    setActiveChip(null);
  });
  body.appendChild(resetBtn);

  document.body.appendChild(panel);

  function persist() {
    if (isPreview) return;
    localStorage.setItem(storageKey, JSON.stringify({ collapsed, values }));
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
      spec.kind = spec.type === 'checkbox' ? 'boolean' : 'number';
      specByName[spec.name] = spec;
      allSpecs.push(spec);
      if (!(spec.name in values)) values[spec.name] = spec.default;
      buildRow(spec, resetBtn);
      persist();
    },
  };
}
