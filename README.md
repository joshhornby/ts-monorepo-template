# ts-monorepo-template

Turborepo monorepo using TypeScript and Bun.

## Layout

- `apps/api` – Bun HTTP server
- `packages/core` – shared TypeScript library
- `packages/typescript-config` – shared `tsconfig` base
- `tools/eslint/anti-slop` – vendored [anti-slop](https://github.com/dmmulroy/anti-slop) lint rules (see `UPSTREAM.md`)

## Commands

```sh
bun install
bun run dev        # run all apps in watch mode
bun run build      # build everything
bun run test       # run tests
bun run typecheck  # typecheck all packages
bun run lint       # lint with typescript-eslint (strict, type-checked) + anti-slop
bun run format     # format with bun fmt (Prettier defaults)
bun run format:check
bun run knip       # find unused files, exports and dependencies
```
