import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-app-imports";

const manifest = ({
  directory,
  name,
}: {
  readonly directory: string;
  readonly name: string;
}) => ({
  path: `${directory}/package.json`,
  content: JSON.stringify({ name }),
});

const files = [
  manifest({ directory: ".", name: "workspace" }),
  manifest({ directory: "apps/api", name: "@repo/api" }),
  manifest({ directory: "apps/web", name: "@repo/web" }),
  manifest({ directory: "packages/core", name: "@repo/core" }),
];

describe(rule, () => {
  test.each([
    { path: "apps/web/src/main.ts", code: 'import "@repo/core";' },
    { path: "apps/web/src/main.ts", code: 'import "./app.ts";' },
    { path: "apps/web/src/pages/home.ts", code: 'import "../app.ts";' },
    { path: "apps/web/src/main.ts", code: 'import "@repo/web/app";' },
    { path: "apps/web/src/main.ts", code: 'import "@repo/api-client";' },
    { path: "packages/core/src/index.ts", code: 'import "./greeting.ts";' },
  ])("accepts $code in $path", ({ path, code }) => {
    expect(countReports({ rule, code, path, files })).toBe(0);
  });

  test.each([
    { path: "apps/web/src/main.ts", code: 'import "@repo/api";' },
    { path: "apps/web/src/main.ts", code: 'import "@repo/api/src/index.ts";' },
    {
      path: "apps/web/src/main.ts",
      code: 'import "../../api/src/index.ts";',
    },
    {
      path: "apps/web/src/main.ts",
      code: 'import type { Api } from "@repo/api";',
    },
    {
      path: "apps/web/src/main.ts",
      code: 'type Api = import("@repo/api").Api;',
    },
    {
      path: "apps/web/src/main.ts",
      code: 'export const api = import("@repo/api");',
    },
    { path: "apps/web/src/main.ts", code: 'export * from "@repo/api";' },
    { path: "apps/web/src/main.ts", code: 'export { api } from "@repo/api";' },
    { path: "packages/core/src/index.ts", code: 'import "@repo/web";' },
    {
      path: "packages/core/src/index.ts",
      code: 'import "../../../apps/web/src/app.ts";',
    },
  ])("rejects $code in $path", ({ path, code }) => {
    expect(countReports({ rule, code, path, files })).toBe(1);
  });
});
