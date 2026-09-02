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

// Shared modules a piece's inline <script type="module"> may import from.
// Order matters: modules with no internal deps first is not required since
// they're pure functions, but we keep a stable, readable order.
const SHARED_MODULE_PATHS = [
  '../../shared/noise.js',
  '../../shared/color.js',
  '../../shared/anim.js',
  '../../shared/controls.js',
  '../../shared/export.js',
];

function stripExports(src) {
  // `export function foo` / `export const foo` -> drop the `export ` keyword.
  return src.replace(/^export\s+/gm, '');
}

async function inlineSharedModules(pieceScriptSrc) {
  // Strip the piece's own import lines pulling from shared/*.js.
  const strippedPieceSrc = pieceScriptSrc.replace(
    /^\s*import\s*\{[^}]*\}\s*from\s*['"]\.\.\/\.\.\/shared\/[^'"]+\.js['"];?\s*$/gm,
    ''
  );

  const bodies = await Promise.all(
    SHARED_MODULE_PATHS.map(async (path) => {
      const res = await fetch(path);
      const src = await res.text();
      return `// --- inlined: ${path} ---\n${stripExports(src)}`;
    })
  );

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
