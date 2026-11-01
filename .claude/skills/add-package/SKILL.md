---
name: add-package
description: Scaffold a new `@repo/<name>` workspace package under `packages/`. Use when asked to add a shared library or package to this monorepo.
---

# Add a package

A package is a shared TypeScript library under `packages/<name>`. Other workspaces import it as `@repo/<name>`. Copy the shape of `packages/core`.

## Steps

1. Pick a short kebab-case name. Check that `packages/<name>` does not exist yet.

2. Create `packages/<name>/package.json`:

   ```json
   {
     "name": "@repo/<name>",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "exports": {
       ".": "./src/index.ts"
     },
     "scripts": {
       "typecheck": "tsc",
       "test": "bun test",
       "lint": "eslint ."
     },
     "devDependencies": {
       "@repo/typescript-config": "workspace:*"
     }
   }
   ```

   Add `dependencies` only for what the code imports. Knip reports a dependency that nothing uses.

3. Create `packages/<name>/tsconfig.json`:

   ```json
   {
     "extends": "@repo/typescript-config/base.json",
     "include": ["src"]
   }
   ```

   Do not turn off a compiler flag. See `docs/typescript.md`.

4. Create `packages/<name>/src/index.ts`. It is the public surface. Export only what other packages need.

5. Create the first test next to the code, as `packages/<name>/src/index.test.ts`. Use `bun:test` and test through the exports. See `docs/testing.md`.

   ```ts
   import { expect, test } from "bun:test";
   import { example } from "./index.ts";

   test("describes the behaviour the package guarantees", () => {
     expect(example()).toBe("expected value");
   });
   ```

6. In each workspace that uses the package, add it to `dependencies` as `"@repo/<name>": "workspace:*"`. Import it as `@repo/<name>`, never by a relative path into `packages/`.

7. Run `bun install` at the repo root so the workspace link and `bun.lock` update. Commit `bun.lock`.

   To enforce a coverage threshold, copy `packages/core/bunfig.toml` into the package and change its `test` script to `bun test --coverage`.

8. Add a line for the package to the "Layout" list in `README.md`.

9. If the package names a new domain concept, add it to the glossary in `CONTEXT.md`.

## Check

Run every step in `.github/workflows/ci.yml`. The quick ones:

```sh
bun run format
bun run lint
bun run typecheck
bun run test
bun run knip
```
