# ts-monorepo-template

Turborepo monorepo using TypeScript and Bun.

## Start a new project

1. Create the repo from this template:

   ```sh
   gh repo create <name> --template joshhornby/ts-monorepo-template --private --clone
   ```

2. Set `name` in the root `package.json` to the project name.
3. Change the title of this README. Then delete this section.
4. Add the project's terms to the glossary in `CONTEXT.md`.
5. Replace the `greet` example in `packages/core` and `apps/api` with real code.
6. Run `bun install`, then the commands below. All of them must pass.
7. A template does not copy repo settings. On GitHub, add a ruleset for `main` that requires a pull request and the `check` status from CI. Turn on Dependabot alerts and secret scanning where your plan allows them.

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
