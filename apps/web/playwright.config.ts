import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";
import { z } from "zod";

const Status = z.object({
  services: z.array(
    z.object({ name: z.string(), url: z.url(), health: z.string() }),
  ),
});

/** The web URL for this checkout's slot, from `bun run status`. Run `bun run up` first. */
function webUrl(): string {
  const root = fileURLToPath(new URL("../..", import.meta.url));

  const status = Status.parse(
    JSON.parse(
      execFileSync("bun", ["run", "status", "--json"], {
        cwd: root,
        encoding: "utf8",
      }),
    ),
  );

  const web = status.services.find((service) => service.name === "web");

  if (web?.health !== "healthy") {
    throw new Error("The web service is not running. Run `bun run up` first.");
  }

  return web.url;
}

export default defineConfig({
  testDir: "e2e",
  // `bun test` would also run *.spec.ts files, so browser tests use their own suffix.
  testMatch: "**/*.e2e.ts",
  forbidOnly: process.env["CI"] !== undefined,
  // One worker, so tests that share the stack do not race each other.
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env["WEB_URL"] ?? webUrl(),
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
});
