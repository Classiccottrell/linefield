// tools/serve.mjs
//
// Shared static-file server bootstrap for tools/build.mjs and
// tools/audit-controls.mjs. Both tools serve the repo root to a headless
// browser and previously bound a hardcoded port with no collision handling
// — a real problem when multiple coder agents run the gate suite
// concurrently in a shared worktree (see ROADMAP.md). This centralizes the
// fallback so the two tools can't drift out of sync on it.

import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createServer } from 'node:http';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function makeServer(root) {
  return createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel.endsWith('/')) rel += 'index.html';
    const path = join(root, rel);
    if (!path.startsWith(root) || !existsSync(path)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(readFileSync(path));
  });
}

// Binds to `port`. If `pinned` is true (an explicit env/CLI override), a
// collision is fatal — a pinned port that silently moves isn't a stable
// URL. Otherwise, on EADDRINUSE, falls back once to an OS-assigned
// ephemeral port (`listen(0)`).
//
// Returns { server, port, base } — `port` and `base` always reflect the
// port actually bound (read back via server.address()), never the
// requested one, so a caller can never talk to someone else's server.
export function serveRepo(root, port, { pinned = false } = {}) {
  return new Promise((resolve, reject) => {
    const server = makeServer(root);
    let fellBack = false;
    const onError = (err) => {
      if (err.code === 'EADDRINUSE' && !pinned && !fellBack) {
        fellBack = true;
        server.listen(0);
        return;
      }
      if (err.code === 'EADDRINUSE' && pinned) {
        reject(new Error(`port ${port} is pinned but already in use`));
        return;
      }
      reject(err);
    };
    server.on('error', onError);
    server.listen(port, () => {
      server.off('error', onError);
      const bound = server.address().port;
      resolve({ server, port: bound, base: `http://localhost:${bound}` });
    });
  });
}
