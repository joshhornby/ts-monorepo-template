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
6. Run `bun run setup`, then the commands below. All of them must pass.
7. A template does not copy repo settings. On GitHub, add a ruleset for `main` that requires a pull request and the `check` status from CI. Turn on Dependabot alerts and secret scanning where your plan allows them.

## Layout

- `apps/api` – Bun HTTP server
- `packages/core` – shared TypeScript library
- `packages/dev` – the `setup`, `doctor`, `up`, `down`, `status` and `logs` commands
- `packages/typescript-config` – shared `tsconfig` base
- `tools/eslint/anti-slop` – vendored [anti-slop](https://github.com/dmmulroy/anti-slop) lint rules (see `UPSTREAM.md`)

## Commands

```sh
bun run setup      # install dependencies, create .env, run doctor; safe to re-run
bun run doctor     # report what is missing and what breaks without it
bun run dev        # run all apps in watch mode, in the foreground
bun run build      # build everything
bun run test       # run tests
bun run typecheck  # typecheck all packages
bun run lint       # lint with typescript-eslint (strict, type-checked) + anti-slop
bun run format     # format with bun fmt (Prettier defaults)
bun run format:check
bun run knip       # find unused files, exports and dependencies
```

## Running the app in the background

These commands suit agents and scripts. Each takes `--json`.

```sh
bun run up [service...]  # start services and wait until healthy; prints their URLs
bun run status           # what is running, where, and whether it is healthy
bun run logs api -n 50   # recent log lines
bun run down             # stop everything and free the slot
```

`up` exits non-zero and prints the last 50 log lines when a service does not become healthy. It waits for `GET /health` to answer 200.

Each checkout takes a slot, so up to three copies of the stack run on one machine without sharing ports. Slot 0 uses ports from 3000, slot 1 from 3010, slot 2 from 3020. When every slot is taken, `up` names the checkouts that hold them. A slot whose checkout was deleted is reclaimed.

Services are listed in `packages/dev/src/workspace.ts`.
