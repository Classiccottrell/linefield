// tools/build.mjs
// Builds the linefield gallery from pieces.json.
//
// The pieces themselves have no dependencies and no build step — that is the
// product, and this script never rewrites them. This tooling exists for the
// microsite only: it reads the pieces and emits site artifacts.
//
// Usage:
//   node tools/build.mjs               verify, then generate everything
//   node tools/build.mjs --verify-only verify and stop

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadManifest() {
  return JSON.parse(readFileSync(join(ROOT, 'pieces.json'), 'utf8'));
}

// Pull the `defaults: { hue: N, hueB: N, saturation: N }` block out of a
// piece's source. Whitespace-tolerant; returns null if the piece has none.
export function readPieceDefaults(slug) {
  const src = readFileSync(join(ROOT, 'pieces', slug, 'index.html'), 'utf8');
  const m = src.match(
    /defaults:\s*\{\s*hue:\s*(-?[\d.]+)\s*,\s*hueB:\s*(-?[\d.]+)\s*,\s*saturation:\s*([\d.]+)\s*\}/
  );
  if (!m) return null;
  return { hue: Number(m[1]), hueB: Number(m[2]), saturation: Number(m[3]) };
}

// Slugs the README's Pieces list claims, from lines like:
//   - `synapse` — drifting nodes ...
export function readReadmeSlugs() {
  const src = readFileSync(join(ROOT, 'README.md'), 'utf8');
  return [...src.matchAll(/^- `([a-z0-9-]+)`/gm)].map((m) => m[1]);
}

export function verifyManifest() {
  const manifest = loadManifest();
  const errors = [];

  // `_template` is a scaffold for forking, not a piece — it is excluded here
  // deliberately, even though it carries its own defaults block.
  const dirs = readdirSync(join(ROOT, 'pieces'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .sort();

  const slugs = manifest.map((p) => p.slug).sort();

  for (const slug of dirs) {
    if (!slugs.includes(slug)) {
      errors.push(`pieces/${slug}/ exists but is missing from pieces.json`);
    }
  }
  for (const slug of slugs) {
    if (!dirs.includes(slug)) {
      errors.push(`pieces.json lists "${slug}" but pieces/${slug}/ does not exist`);
    }
  }

  for (const p of manifest) {
    if (!dirs.includes(p.slug)) continue;
    const actual = readPieceDefaults(p.slug);
    if (!actual) {
      errors.push(`pieces/${p.slug}/index.html has no defaults block`);
      continue;
    }
    for (const key of ['hue', 'hueB', 'saturation']) {
      if (actual[key] !== p[key]) {
        errors.push(
          `${p.slug}: manifest ${key}=${p[key]} but the piece ships ${key}=${actual[key]}`
        );
      }
    }
    if (!Array.isArray(p.tags) || p.tags.length === 0) {
      errors.push(`${p.slug}: manifest has no tags`);
    }
    if (!p.title || !p.blurb) {
      errors.push(`${p.slug}: manifest is missing a title or blurb`);
    }
  }

  const readme = readReadmeSlugs().sort();
  for (const slug of slugs) {
    if (!readme.includes(slug)) {
      errors.push(`README.md's Pieces list is missing "${slug}"`);
    }
  }
  for (const slug of readme) {
    if (!slugs.includes(slug)) {
      errors.push(`README.md lists "${slug}", which is not in pieces.json`);
    }
  }

  if (errors.length) {
    console.error(`\nManifest verification failed (${errors.length}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error('\nFix pieces.json, the piece, or the README so they agree.\n');
    process.exit(1);
  }

  console.log(`Verified ${manifest.length} pieces against pieces/ and README.md.`);
  return manifest;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const manifest = verifyManifest();
  if (process.argv.includes('--verify-only')) process.exit(0);
  // Generation steps are added in later tasks.
  console.log('Nothing to generate yet.');
  void manifest;
}
