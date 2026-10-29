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
- `tools/oxlint/anti-slop/` is vendored. Record each edit to it under "Local edits" in its `UPSTREAM.md`.

## Running the app

- Start services with `bun run up --json`. It returns once they are healthy. Read each URL from its output. Do not assume a port.
- Do not poll or sleep around `up`. If it fails, it exits non-zero and prints the service's last log lines.
- Use `bun run status --json` and `bun run logs <service> -n 50` to see what is running.
- Run `bun run down` when you are done.
- Run `bun run doctor --json` before you say something cannot run. It names what is missing and how to fix it.
- Only `bun run setup` installs. No other command installs anything or prompts. A command you add that deletes data takes `--yes`.

## Done

A change is done when every step in `.github/workflows/ci.yml` passes locally.
