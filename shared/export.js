// shared/export.js

function download(filename, blobOrUrl, mime) {
  const url = blobOrUrl instanceof Blob ? URL.createObjectURL(blobOrUrl) : blobOrUrl;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (blobOrUrl instanceof Blob) URL.revokeObjectURL(url);
}

export function exportPng(canvas, { multiplier = 1 } = {}) {
  if (multiplier === 1) {
    canvas.toBlob((blob) => download('linefield.png', blob), 'image/png');
    return;
  }
  const scaled = document.createElement('canvas');
  scaled.width = canvas.width * multiplier;
  scaled.height = canvas.height * multiplier;
  const ctx = scaled.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  scaled.toBlob((blob) => download('linefield.png', blob), 'image/png');
}

export function exportSvg(paths, { width = 800, height = 600 } = {}) {
  const polylines = paths
    .map((pts) => {
      const pointsAttr = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      return `<polyline points="${pointsAttr}" fill="none" stroke="black" stroke-width="1" />`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${polylines}\n</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  download('linefield.svg', blob);
}

export async function exportSource({ filename = 'linefield-source.html' } = {}) {
  const url = location.href.split(/[?#]/)[0];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`exportSource: could not fetch source (${res.status})`);
  const blob = await res.blob();
  download(filename, blob);
  return blob;
}

// The piece's own import statements are the registration. A hand-maintained
// list is a silent-failure surface: omit an entry and the baked file is
// valid, loads without error, and renders nothing. That shipped once.
const SHARED_IMPORT_RE =
  /^\s*import\s*\{[^}]*\}\s*from\s*['"](\.\.\/\.\.\/shared\/[^'"]+\.js)['"];?\s*$/gm;

// A shared module importing ANOTHER shared module (e.g. controls.js reading
// hexToHue from color.js) addresses it as './color.js' — same directory,
// different relative base than the piece's '../../shared/color.js'. Matched
// separately and normalised back to the piece-style path below so the same
// `seen` dedupe applies to both forms of the same file.
const INNER_SHARED_IMPORT_RE =
  /^\s*import\s*\{[^}]*\}\s*from\s*['"]\.\/([^'"]+\.js)['"];?\s*$/gm;

function stripExports(src) {
  // `export function foo` / `export const foo` -> drop the `export ` keyword.
  return src.replace(/^export\s+/gm, '');
}

function stripInnerImports(src) {
  return src.replace(INNER_SHARED_IMPORT_RE, '');
}

// BFS over the shared-module import graph, not just the piece's own
// top-level imports. Scanning only the piece script is exactly the
// hand-maintained-list failure this function's own comment already warns
// about, one level removed: a shared module's OWN imports were invisible to
// it, so a new cross-shared-module import survived verbatim into a classic
// (non-module) inline script — a SyntaxError this file's <script> tag has no
// listener for, producing a validly-loading, blank-canvas download. See
// skills/building-generative-backgrounds/SKILL.md, "Inlining and bundling".
async function inlineSharedModules(pieceScriptSrc) {
  const strippedPieceSrc = pieceScriptSrc.replace(SHARED_IMPORT_RE, '');
  const initial = [...pieceScriptSrc.matchAll(SHARED_IMPORT_RE)].map((m) => m[1]);
  if (!initial.length) {
    throw new Error('bakeHtml: the piece imports no shared modules — refusing to bake a file that would render blank');
  }

  const seen = new Set();
  const order = [];
  const srcByPath = new Map();
  const queue = [...initial];
  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);
    order.push(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`bakeHtml: could not fetch ${path} (${res.status})`);
    const src = await res.text();
    srcByPath.set(path, src);
    // Normalise './foo.js' found INSIDE a shared module to the same
    // '../../shared/foo.js' form the piece-level regex produces, so a module
    // reached both ways (e.g. color.js: directly by the piece, and via
    // controls.js) is only ever inlined once.
    const inner = [...src.matchAll(INNER_SHARED_IMPORT_RE)].map((m) => `../../shared/${m[1]}`);
    for (const p of inner) if (!seen.has(p)) queue.push(p);
  }

  const bodies = order.map((path) => {
    const src = srcByPath.get(path);
    return `// --- inlined: ${path} ---\n${stripInnerImports(stripExports(src))}`;
  });

  return `${bodies.join('\n\n')}\n\n// --- piece script ---\n${strippedPieceSrc}`;
}

export async function bakeHtml({ sourceHtml, values }) {
  const doc = new DOMParser().parseFromString(sourceHtml, 'text/html');
  doc.querySelectorAll('[data-lf-panel]').forEach((el) => el.remove());

  const pieceScript = doc.querySelector('script[type="module"]');
  const pieceScriptSrc = pieceScript ? pieceScript.textContent : '';
  if (pieceScript) pieceScript.remove();

  const inlinedSrc = await inlineSharedModules(pieceScriptSrc);

  const safeJson = JSON.stringify(values).replace(/</g, '\\u003c');
  const inject = doc.createElement('script');
  inject.textContent = `window.__LF_BAKED_VALUES__ = ${safeJson};\n${inlinedSrc}`;
  doc.body.appendChild(inject);

  const baked = `<!doctype html>\n${doc.documentElement.outerHTML}`;
  const blob = new Blob([baked], { type: 'text/html' });
  download('linefield-baked.html', blob);
  return baked;
}

export function describeForAI({ pieceName, values }) {
  const parts = Object.entries(values)
    .map(([k, v]) => `${k}=${typeof v === 'number' ? v.toFixed(2) : v}`)
    .join(', ');
  const text = `A generative line-art background piece called "${pieceName}", rendered on an HTML canvas with parameters: ${parts}.`;
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  return text;
}
