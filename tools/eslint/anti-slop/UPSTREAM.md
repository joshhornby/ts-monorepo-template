# Upstream

Vendored from https://github.com/dmmulroy/anti-slop (MIT, see `LICENSE`).

- Commit: `13909c9e07590f5a85d93c62712259fe14a883f7` (2026-10-13)
- Source: `skills/install-anti-slop/assets/anti-slop/`, without the `effect/` rule group (this repo does not use Effect)

The rules target Oxlint's JS plugin API, but the plugin is wrapped in
`eslintCompatPlugin`, so it loads in ESLint unchanged. Edit rules here freely;
to pull upstream changes, re-copy the source and re-apply local edits.

## Local edits

- `rules/require-safety-comment-for-type-assertion.ts`: compare `range` offsets, not
  `start`/`end`. typescript-eslint nodes have no `start`/`end`, so under ESLint the rule
  rejected every assertion, including one with a `SAFETY:` comment.
- `rules/no-widen-then-assert.ts`, `rules/no-reduce-accumulator-copy.ts` and
  `shared/function-parameters.ts`: compare `range` offsets, not `start`/`end`, for the same
  reason. Before this edit, `no-widen-then-assert` never reported, and
  `no-reduce-accumulator-copy` missed reducers written as named functions.
- `rules/no-module-mocking.ts`: also report Bun's `mock.module()`, where `mock` is imported
  from `bun:test`.
