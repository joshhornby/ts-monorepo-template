---
name: add-service
description: Add a long-running service, such as an HTTP server or worker, that `bun run up` starts and `bun run down` stops. Use when asked to add an app or service to this monorepo.
---

# Add a service

A service is a long-running process under `apps/<name>`. `bun run up` starts each service listed in `packages/dev/src/workspace.ts`, gives it a port, and waits for its health check. Copy the shape of `apps/api`.

## Steps

1. Pick a short kebab-case name. It is the service name in `up`, `status` and `logs`. Check that `apps/<name>` does not exist yet.

2. Create `apps/<name>/package.json`, with the same scripts as `apps/api`:

   ```json
   {
     "name": "@repo/<name>",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "bun --watch src/index.ts",
       "build": "bun build src/index.ts --target bun --outdir dist",
       "start": "bun dist/index.js",
       "typecheck": "tsc",
       "lint": "eslint ."
     },
     "devDependencies": {
       "@repo/typescript-config": "workspace:*"
     }
   }
   ```

   Declare each `@repo/<package>` it imports as `"workspace:*"` under `dependencies`. Add a `"test": "bun test"` script with the first `*.test.ts`.

3. Create `apps/<name>/tsconfig.json`:

   ```json
   {
     "extends": "@repo/typescript-config/base.json",
     "include": ["src"]
   }
   ```

4. Create `apps/<name>/src/index.ts`. The service must:
   - read its port from the `PORT` environment variable. `up` sets it. Do not hard-code a port.
   - answer `200` on `GET /health` once it is ready. `up` waits for this, and `status` reports it.
   - log to stdout and stderr. `up` writes both to the log that `bun run logs <name>` reads.

   ```ts
   const server = Bun.serve({
     port: Number(process.env["PORT"] ?? 3000),
     fetch(req) {
       const url = new URL(req.url);

       // `bun run up` waits for this to answer before it reports the URL.
       if (url.pathname === "/health") return new Response("ok");

       return new Response("Not found", { status: 404 });
     },
   });

   console.log(`<name> listening on ${server.url.href}`);
   ```

   Parse other environment variables with a Zod schema. Add each one to `.env.example`, so `bun run doctor` can report it when it is missing.

5. Add the service to `services` in `defaultWorkspace` in `packages/dev/src/workspace.ts`:

   ```ts
   {
     name: "<name>",
     directory: "apps/<name>",
     command: ["bun", "--watch", "src/index.ts"],
     portOffset: 1,
   },
   ```

   `portOffset` is added to the slot's base port. Each service needs its own offset. Keep it below `portsPerSlot` (10) in the same file, or two slots share a port.

6. Run `bun install` so the workspace link and `bun.lock` update. Commit `bun.lock`.

7. Add a line for the service to the "Layout" list in `README.md`.

## Check

```sh
bun run up <name> --json   # exits non-zero and prints the last log lines if /health never answers 200
bun run status --json
bun run down
```

Then run every step in `.github/workflows/ci.yml`.
