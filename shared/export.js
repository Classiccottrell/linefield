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

export function bakeHtml({ sourceHtml, values }) {
  const withoutPanel = sourceHtml.replace(
    /<[^>]+data-lf-panel[^>]*>[\s\S]*?<\/[^>]+>\s*/g,
    ''
  );
  const inject = `<script>window.__LF_BAKED_VALUES__ = ${JSON.stringify(values)};</script>\n`;
  const baked = withoutPanel.replace('</head>', `${inject}</head>`);
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
