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
5. Replace the orders example in `packages/core`, `packages/contracts`, `apps/api` and `apps/web` with real code. Keep its patterns: see [The example](#the-example).
6. Run `bun run setup`, then the commands below. All of them must pass.
7. A template does not copy repo settings. On GitHub, add a ruleset for `main` that requires a pull request and the `check` status from CI. Turn on Dependabot alerts and secret scanning where your plan allows them.

## Layout

- `apps/api` – Bun HTTP server for orders
- `apps/web` – [TanStack Start](https://tanstack.com/start) app for orders. Its server functions call `apps/api`
- `packages/contracts` – the HTTP request and response schemas that `apps/api` and `apps/web` share
- `packages/core` – the order domain: pure functions, no I/O
- `packages/dev` – the `setup`, `doctor`, `up`, `down`, `status` and `logs` commands
- `packages/typescript-config` – shared `tsconfig` bases: `base.json` for Bun code, `react.json` for the web app
- `tools/eslint/anti-slop` – vendored [anti-slop](https://github.com/dmmulroy/anti-slop) lint rules (see `UPSTREAM.md`)

## The example

A small orders domain shows the patterns in `docs/typescript.md` and `docs/testing.md`. Copy them when you replace it.

| Pattern                                                  | Where                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| Branded identifier, parsed by its schema                 | `OrderId` in `packages/core/src/order.ts`                               |
| Lifecycle as a discriminated union                       | `Order` in `packages/core/src/order.ts`                                 |
| Exhaustive `switch` with no `default`                    | `shipOrder`, `cancelOrder`, `toOrderJson`                               |
| Expected failures as values                              | `Result` in `packages/core/src/result.ts`                               |
| Environment parsed once, at startup                      | `apps/api/src/env.ts`                                                   |
| Request bodies parsed at the boundary                    | `parseBody` in `apps/api/src/server.ts`                                 |
| Wire shapes as schemas, with `null`                      | `packages/contracts/src/orders.ts`, shared by `apps/api` and `apps/web` |
| Dependencies passed in, not module-mocked                | `Dependencies` in `apps/api/src/server.ts`                              |
| Domain tests                                             | `packages/core/src/order.test.ts`                                       |
| Integration tests over real HTTP                         | `apps/api/src/server.test.ts`                                           |
| Server functions that call the API and parse its answers | `apps/web/src/orders/`                                                  |
| Browser tests of the main journeys                       | `apps/web/e2e/orders.e2e.ts`                                            |

The API:

| Request                   | Body                     | Answers                                         |
| ------------------------- | ------------------------ | ----------------------------------------------- |
| `GET /orders`             |                          | every order, oldest first                       |
| `POST /orders`            | `{ "item", "quantity" }` | 201 and the order                               |
| `GET /orders/:id`         |                          | the order, or 404                               |
| `POST /orders/:id/ship`   |                          | the shipped order, or 409                       |
| `POST /orders/:id/cancel` | `{ "reason" }`           | the cancelled order, or 409 once it has shipped |

Errors are `{ "error": { "kind", "message" } }`. Orders are kept in memory until the project has a database.

## Commands

```sh
bun run setup      # install dependencies, create .env, run doctor; safe to re-run
bun run doctor     # report what is missing and what breaks without it
bun run dev        # run all apps in watch mode, in the foreground
bun run build      # build everything
bun run test       # run tests
bun run e2e        # run browser tests against the stack that `bun run up` started
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

`up` gives each service its own `PORT`. A service that calls another gets its URL too: `web` gets `API_URL`. See `environment` in `packages/dev/src/workspace.ts`.

Each checkout takes a slot, so up to three copies of the stack run on one machine without sharing ports. Slot 0 uses ports from 3000, slot 1 from 3010, slot 2 from 3020. When every slot is taken, `up` names the checkouts that hold them. A slot whose checkout was deleted is reclaimed.

Services are listed in `packages/dev/src/workspace.ts`.
