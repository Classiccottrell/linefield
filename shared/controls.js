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
`;

function injectCss() {
  if (document.getElementById('lf-panel-css')) return;
  const style = document.createElement('style');
  style.id = 'lf-panel-css';
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

export function createControlPanel({ pieceId, onChange, extraControls = [], defaults: defaultOverrides = {} }) {
  injectCss();

  const storageKey = `linefield:${pieceId}`;
  const allSpecs = [...SHARED_CONTROLS, ...extraControls];
  const defaults = {};
  for (const spec of allSpecs) {
    defaults[spec.name] = spec.name in defaultOverrides ? defaultOverrides[spec.name] : spec.default;
  }

  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    saved = {};
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
      persist();
      onChange(spec.name, v, values);
    });

    inputs[spec.name] = input;
    row.appendChild(input);
    if (beforeEl) body.insertBefore(row, beforeEl);
    else body.appendChild(row);
  }

  for (const spec of allSpecs) buildRow(spec);

  const resetBtn = document.createElement('button');
  resetBtn.className = 'lf-reset';
  resetBtn.textContent = 'Reset to defaults';
  resetBtn.addEventListener('click', () => {
    for (const spec of allSpecs) {
      const def = defaults[spec.name];
      values[spec.name] = def;
      const input = inputs[spec.name];
      if (spec.type === 'checkbox') input.checked = def;
      else input.value = def;
      onChange(spec.name, def, values);
    }
    persist();
  });
  body.appendChild(resetBtn);

  document.body.appendChild(panel);

  function persist() {
    localStorage.setItem(storageKey, JSON.stringify({ collapsed, values }));
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
