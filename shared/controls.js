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

  const inputs = {};

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

    input.addEventListener('input', () => {
      const v = spec.type === 'checkbox' ? input.checked : parseFloat(input.value);
      values[spec.name] = v;
      setActiveChip(null);
      persist();
      onChange(spec.name, v, values);
    });

    inputs[spec.name] = input;
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
    for (const spec of allSpecs) {
      const v = next[spec.name];
      values[spec.name] = v;
      const input = inputs[spec.name];
      if (input) {
        if (spec.type === 'checkbox') input.checked = v;
        else input.value = v;
      }
      onChange(spec.name, v, values);
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
  // The live value object, for gate scripts. Same reference the panel mutates.
  window.__LF_VALUES__ = values;

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
    addControl(spec) {
      allSpecs.push(spec);
      if (!(spec.name in values)) values[spec.name] = spec.default;
      buildRow(spec, resetBtn);
      persist();
    },
  };
}
