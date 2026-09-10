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

function stripExports(src) {
  // `export function foo` / `export const foo` -> drop the `export ` keyword.
  return src.replace(/^export\s+/gm, '');
}

async function inlineSharedModules(pieceScriptSrc) {
  const paths = [...pieceScriptSrc.matchAll(SHARED_IMPORT_RE)].map((m) => m[1]);
  const unique = [...new Set(paths)];
  if (!unique.length) {
    throw new Error('bakeHtml: the piece imports no shared modules — refusing to bake a file that would render blank');
  }
  const strippedPieceSrc = pieceScriptSrc.replace(SHARED_IMPORT_RE, '');

  const bodies = await Promise.all(
    unique.map(async (path) => {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`bakeHtml: could not fetch ${path} (${res.status})`);
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
