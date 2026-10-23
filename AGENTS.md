# Agent instructions

## Read first

- **TypeScript**: read `docs/typescript.md` before you write or review TypeScript.
- **Tests**: read `docs/testing.md` before you write or review tests.
- **Terms**: use the terms in `CONTEXT.md`. When you name a new domain concept, add it to the glossary.

## Conventions

- Use Bun for every command: `bun install`, `bun run <script>`, `bun test`, `bunx`.
- Tests use `bun:test` and sit next to the code as `*.test.ts`.
- A package imports another package through `@repo/<name>`, declared as `"workspace:*"`.
- When lint or typecheck fails, change the code. The config stays as it is.
- `tools/eslint/anti-slop/` is vendored. Record each edit to it under "Local edits" in its `UPSTREAM.md`.

## Done

A change is done when every step in `.github/workflows/ci.yml` passes locally.
