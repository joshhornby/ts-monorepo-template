# Upstream

Vendored from https://github.com/dmmulroy/anti-slop (MIT, see `LICENSE`).

- Commit: `13909c9e07590f5a85d93c62712259fe14a883f7` (2026-10-13)
- Source: `skills/install-anti-slop/assets/anti-slop/`, without the `effect/` rule group (this repo does not use Effect)

The rules target Oxlint's JS plugin API, but the plugin is wrapped in
`eslintCompatPlugin`, so it loads in ESLint unchanged. Edit rules here freely;
to pull upstream changes, re-copy the source and re-apply local edits.
