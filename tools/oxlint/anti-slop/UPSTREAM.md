# Upstream

Vendored from https://github.com/dmmulroy/anti-slop (MIT, see `LICENSE`).

- Commit: `13909c9e07590f5a85d93c62712259fe14a883f7` (2026-10-13)
- Source: `skills/install-anti-slop/assets/anti-slop/`, without the `effect/` rule group (this repo does not use Effect)
- Installed at: `tools/oxlint/anti-slop/`, loaded through `jsPlugins` in `.oxlintrc.json`

To pull upstream changes, re-copy the source and re-apply the local edits below.

## Local edits

- `rules/no-module-mocking.ts`: also report Bun's `mock.module()`, where `mock` is imported
  from `bun:test`.
