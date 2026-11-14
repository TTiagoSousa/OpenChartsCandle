# Contributing to OpenChartsCandle

Thanks for your interest in the project. Bug reports, ideas and pull requests are all welcome.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security problems are reported privately, as described in [SECURITY.md](SECURITY.md).

## Running it locally

You need Node.js 20 or later.

```bash
npm install
npm run dev        # demo site with every example at http://localhost:5190
npm test           # tests (Vitest)
npm run typecheck  # type check
npm run build      # dist/: one entry per chart family, type declarations and CSS
npm run check      # typecheck + tests + build, like the CI
```

The demo imports `openchartscandle/*` exactly like an app would. A Vite alias points those imports to `src/`, so changes show up at once. The examples live in `demo/<family>/examples/` and `demo/<family>/gallery/`; the docs shown on the site are the files in `docs/`.

## Project layout

```
src/<family>/      one folder per chart family (candlestick, pie, line, bar, …), each with its index.ts
src/shared/        helpers used by several families
docs/<family>/     documentation (Portuguese), also shown on the demo site
demo/              demo site and examples
tests/             Vitest tests
dist/              build output, committed so tagged versions can be installed from git
releases/vX.Y.Z/   release notes (en.md, pt-PT.md)
scripts/           build and release scripts
```

[docs/estrutura.md](docs/estrutura.md) explains how to add a new family.

## Branches

| Branch | Purpose |
|---|---|
| `develop` | Daily work. Pull requests target this branch. |
| `staging` | What will be released next. |
| `main` | Released code. The default branch. |

Code always moves forward with fast-forward merges (`git merge --ff-only`), so the history stays linear and has no merge commits. `main` and `staging` are protected: they can't be deleted or force-pushed, and the CI must pass on the commit before it gets there.

## Pull requests

1. Fork the repository and create a branch from `develop`.
2. Make your change, with tests when it changes behaviour.
3. Update the docs in `docs/` and the `[Unreleased]` section of [CHANGELOG.md](CHANGELOG.md) when a feature changes.
4. If you touched `src/`, run `npm run build` and commit the updated `dist/` (the CI checks that it is up to date).
5. Run `npm run check` and open the pull request against `develop`, filling in the template.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), in English, with a scope when it helps:

```
feat(candlestick): add the anchored VWAP drawing
fix(rsi): keep the average after a live update
docs(heatmap): explain the piecewise visual map
perf(scatter): draw large series in one path
refactor(shared): move the number formatter
test(svp): cover sessions across midnight
build(deps): bump vite to 8.4
ci: cache npm in the CI
chore(release): v1.1.0
```

- `feat` adds something, `fix` corrects a bug; `perf`, `refactor`, `docs`, `test`, `build`, `ci` and `chore` cover the rest.
- A breaking change gets a `!` after the type (`feat(candlestick)!: rename createChart options`) or a `BREAKING CHANGE:` line in the body.
- Never commit secrets (API keys, tokens, passwords). Before committing, `git grep -nIE "api[_-]?key|secret|password|token|sk-[a-z]+-"` is a quick check.

## Versions and releases

The project uses [semantic versioning](https://semver.org/) with one version for the whole library. The version is computed from the commits since the last tag: a breaking change makes a major, a `feat` a minor and anything else a patch.

Releases are made by the maintainer with `scripts/release.mjs`:

1. On `develop`, run `npm run release -- --prepare`. It computes the version, updates `package.json`, `package-lock.json` and the install tags in the READMEs, moves `[Unreleased]` in the changelog to the new version, rebuilds `dist/` and writes `releases/vX.Y.Z/en.md`.
2. Write `releases/vX.Y.Z/pt-PT.md` (the Portuguese notes), review everything and commit it as `chore(release): vX.Y.Z`. Push `develop` and wait for the CI.
3. Fast-forward `staging` and then `main` to that commit and push them (the CI runs again on each).
4. On `main`, run `npm run release -- --push`. It creates the annotated tag `vX.Y.Z` with the English notes as its message and pushes the tag.
5. The tag starts the release workflow: it checks the version, builds and tests again and creates the GitHub Release with the notes and the package (`.tgz`). The demo site on GitHub Pages is rebuilt on every push to `main`.

`--dry-run` shows what would happen without changing anything, `--version X.Y.Z` forces a version, `--title "…"` adds a title to the release and `--allow-branch <name>` runs a step from another branch.
