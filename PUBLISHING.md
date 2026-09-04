# Publishing

The repository has no remote. Everything is committed on `main`.

## Before pushing

- [ ] `git status` is clean
- [ ] `npm run verify` passes
- [ ] `npm run audit-controls` reports every control live
- [ ] Two consecutive `npm run build` runs leave the tree clean
- [ ] `LICENSE` names the right copyright holder and year
- [ ] No absolute filesystem paths in tracked files:
      `git grep -n "/Users/" -- . ':!*.png' ':!PUBLISHING.md'` returns nothing
- [ ] `CHANGELOG.md` describes what is actually in this release

## Creating the repository and pushing

```bash
cd linefield

# Create the repo and push in one step. Choose public or private.
gh repo create linefield --public --source=. --remote=origin --push

# Or, if the repository already exists:
git remote add origin git@github.com:<owner>/linefield.git
git push -u origin main
```

## Turning on the gallery

The site needs no build step — `index.html`, `thumbs/` and `downloads/` are
committed, and GitHub Pages can serve the repository root as-is:

Settings → Pages → Source: **Deploy from a branch** → Branch: **main**,
folder: **/ (root)**.

The gallery is then at `https://<owner>.github.io/linefield/`.

## Releasing an archive

```bash
git tag -a v1.0.0 -m "linefield v1.0.0"
git push origin v1.0.0
npm run pack   # produces linefield-1.0.0.zip, named from package.json's "version"
gh release create v1.0.0 linefield-1.0.0.zip --notes-file CHANGELOG.md
```

Tag version and `package.json`'s `version` field should match.

`npm run pack` runs `git archive` against `HEAD` — it packages the last
commit, not your working tree. If you have uncommitted changes, they are
silently left out of the archive. Commit (or stash and reconcile) before
running `pack`, and confirm `git status` is clean first.

## What is deliberately not published

`shared/` is not published to npm — see `ROADMAP.md` for the reasoning.
`package.json` is `private: true`, which makes an accidental `npm publish`
fail.
