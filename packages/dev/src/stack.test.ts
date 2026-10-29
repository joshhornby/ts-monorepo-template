import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { down, logs, status, up } from "./stack.ts";
import type { Service, Workspace } from "./workspace.ts";

const healthyServer = `
Bun.serve({
  port: Number(process.env.PORT),
  fetch: (req) => new Response(new URL(req.url).pathname === "/health" ? "ok" : "hello"),
});
console.log("ready");
`;

const crashingServer = `
console.error("database url is missing");
process.exit(1);
`;

/** A checkout with one service, on its own ports and slots directory. */
function createWorkspace(program: string): Workspace {
  const root = mkdtempSync(join(tmpdir(), "dev-stack-test-"));

  const service: Service = {
    name: "web",
    directory: ".",
    command: ["bun", "server.ts"],
    portOffset: 0,
  };

  writeFileSync(join(root, "server.ts"), program);

  return {
    root,
    slotsDirectory: join(root, "slots"),
    basePort: 40_000 + Math.floor(Math.random() * 10_000),
    services: [service],
  };
}

test("up returns once the service is healthy, and down stops it", async () => {
  const workspace = createWorkspace(healthyServer);

  const result = await up({ workspace, names: [] });

  try {
    expect(result).toMatchObject({ kind: "healthy", slot: 0 });
    expect(await status(workspace)).toMatchObject({
      slot: 0,
      services: [{ name: "web", health: "healthy" }],
    });
  } finally {
    expect(await down(workspace)).toEqual({ stopped: ["web"] });
  }

  expect(await status(workspace)).toEqual({ slot: null, services: [] });
  expect(logs({ workspace, name: "web", lines: 5 })).toEqual({
    kind: "lines",
    lines: ["ready"],
  });
});

test("up keeps a running service rather than starting a second copy", async () => {
  const workspace = createWorkspace(healthyServer);

  try {
    const first = await up({ workspace, names: ["web"] });
    const second = await up({ workspace, names: ["web"] });

    expect(second).toEqual(first);
  } finally {
    await down(workspace);
  }
});

test("up fails with the service's last log lines when it crashes", async () => {
  const workspace = createWorkspace(crashingServer);

  expect(await up({ workspace, names: [] })).toEqual({
    kind: "unhealthy",
    service: "web",
    logTail: ["database url is missing"],
  });
  expect(await status(workspace)).toEqual({ slot: null, services: [] });
});

test("up refuses a service it does not know", async () => {
  const workspace = createWorkspace(healthyServer);

  expect(await up({ workspace, names: ["web", "worker"] })).toEqual({
    kind: "unknown-service",
    names: ["worker"],
  });
});
