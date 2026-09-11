// tools/test-bake-fresh.mjs — the bake PROCESS must produce a working file,
// not just the committed downloads/*.html.
//
// tools/test-baked.mjs validates the committed BYTES on disk: real and
// worth keeping, because it catches a hand-edit, a truncated file, or
// output left over from a since-fixed broken bake. It does NOT catch a
// piece that was visually tuned and never rebuilt — that piece's stale
// download still renders fine (nonzero variance, no errors); there is no
// automated check for that (see CONTRIBUTING.md, "CI will not catch a
// forgotten rebuild"). What test-baked.mjs is actually blind to is a
// regression in shared/export.js's bake PROCESS itself, until someone
// happens to run `npm run build` again. That gap is exactly how the
// CURSOR_MODES temporal-dead-zone bug shipped past every gate: the BFS ->
// dependency-order fix landed in the same commits as controls.js importing
// cursor-modes.js, downloads/ was never regenerated, and test-baked.mjs kept
// validating pre-cursor-modes files that didn't contain the broken code path
// at all.
//
// This drives the REAL, live bake path per piece — click the actual
// "Baked HTML" button, which calls the actual bakeHtml() in shared/export.js
// against the piece's actual current source — captures the download, and
// loads THAT file over file://, exactly like test-baked.mjs does for the
// committed copy. Proves the PROCESS works against today's source; says
// nothing about what's actually committed in downloads/ (a hand-edit there
// would pass this check and only test-baked.mjs would catch it). Run both
// in CI: this one is blind to what's committed; test-baked.mjs is blind to
// a live process regression. NEITHER catches a forgotten rebuild after a
// visual tuning change — that remains manual, on the author.
//
// Run: node tools/test-bake-fresh.mjs [slug]
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const PORT = 7843;
const VARIANCE_MIN = 4;

function serveRepo(port) {
  const server = createServer((req, res) => {
    let p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
    if (!existsSync(p)) { res.writeHead(404); return res.end('nope'); }
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(readFileSync(p));
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

const slugs = process.argv[2]
  ? [process.argv[2]]
  : readdirSync(join(ROOT, 'pieces'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_template').map((d) => d.name).sort();

const server = await serveRepo(PORT);
const browser = await chromium.launch();
const tmpDir = mkdtempSync(join(tmpdir(), 'lf-bake-fresh-'));
const failures = [];

try {
  for (const slug of slugs) {
    // Bake it live: load the real piece, click its real "Baked HTML"
    // button, capture the file the real bakeHtml() download path produces.
    const bakeCtx = await browser.newContext({ acceptDownloads: true });
    const bakePage = await bakeCtx.newPage();
    const bakeErrors = [];
    bakePage.on('pageerror', (e) => bakeErrors.push(String(e)));
    // #btn-baked's own handler does bakeHtml(...).catch(err =>
    // console.error(...)) — a rejection there never reaches 'pageerror', it
    // only ever reaches 'console'. Without this listener a real bake
    // failure produced no named cause at all: no download ever arrives,
    // waitForEvent('download') hangs for its full default timeout, and the
    // resulting TimeoutError (a) names nothing about what actually broke
    // and (b) was uncaught here, aborting every remaining piece in the run
    // instead of failing just this one.
    bakePage.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) bakeErrors.push(m.text()); });
    await bakePage.goto(`http://localhost:${PORT}/pieces/${slug}/`, { waitUntil: 'load' });
    await bakePage.waitForSelector('#btn-baked');
    let download;
    try {
      // Explicit, shorter than Playwright's 30s default: a real bake
      // failure is a synchronous throw inside bakeHtml (caught and logged
      // above), not slow work, so nothing legitimate needs 30s to not
      // download. 5s bounds the loop's own worst case without changing
      // what a healthy bake looks like.
      [download] = await Promise.all([
        bakePage.waitForEvent('download', { timeout: 5000 }),
        bakePage.click('#btn-baked'),
      ]);
    } catch (timeoutErr) {
      await bakeCtx.close();
      failures.push(
        bakeErrors.length
          ? `${slug}: error while baking: ${bakeErrors.join('; ')}`
          : `${slug}: bake produced no download and logged no error (${timeoutErr.message})`
      );
      continue;
    }
    const bakedPath = join(tmpDir, `${slug}.html`);
    await download.saveAs(bakedPath);
    await bakeCtx.close();
    if (bakeErrors.length) {
      failures.push(`${slug}: error while baking: ${bakeErrors.join('; ')}`);
      continue;
    }

    // Load the freshly-baked file exactly like test-baked.mjs loads the
    // committed one: over file://, no server, from a directory with no
    // shared/ sibling — the promise a baked export makes.
    const runCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const runPage = await runCtx.newPage();
    const runErrors = [];
    runPage.on('pageerror', (e) => runErrors.push(String(e)));
    runPage.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) runErrors.push(m.text()); });
    await runPage.goto(`file://${bakedPath}`, { waitUntil: 'load' });
    await runPage.waitForTimeout(2500);
    const variance = await runPage.evaluate(() => {
      const c = document.querySelector('#canvas');
      if (!c) return -1;
      const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
      let s = 0, sq = 0, n = 0;
      for (let i = 0; i < data.length; i += 4 * 37) {
        const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
        s += l; sq += l * l; n++;
      }
      const m = s / n;
      return sq / n - m * m;
    });
    await runCtx.close();

    if (variance < 0) failures.push(`${slug}: fresh bake has no #canvas element`);
    else if (variance < VARIANCE_MIN) failures.push(`${slug}: fresh bake rendered blank (variance ${variance.toFixed(2)} < ${VARIANCE_MIN})`);
    else if (runErrors.length) failures.push(`${slug}: fresh bake errored: ${runErrors.join('; ')}`);
    else console.log(`  ok   ${slug} (fresh bake, variance ${variance.toFixed(1)})`);
  }
} finally {
  await browser.close();
  server.close();
  rmSync(tmpDir, { recursive: true, force: true });
}

if (failures.length) {
  console.error('\nfresh bake failures:\n  ' + failures.join('\n  '));
  process.exit(1);
}
console.log(`\nall ${slugs.length} pieces bake fresh and render standalone`);
