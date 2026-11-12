import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-real-time-wait-in-tests";

describe(rule, () => {
  test.each([
    "const timer = setTimeout(() => abort(), 20_000);",
    "await new Promise((resolve) => emitter.once('done', resolve));",
    "await Bun.sleep;",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code, filename: "wait.test.ts" })).toBe(0);
  });

  test.each([
    "await Bun.sleep(20);",
    "Bun.sleepSync(20);",
    "await new Promise((resolve) => setTimeout(resolve, 20));",
    "await new Promise((resolve) => { setTimeout(resolve, 20); });",
    "import { setTimeout as sleep } from 'node:timers/promises';\nawait sleep(20);",
    "import * as timers from 'node:timers/promises';\nawait timers.setTimeout(20);",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code, filename: "wait.test.ts" })).toBe(1);
  });

  test("allows waits in a Live Test", () => {
    expect(
      countReports({
        rule,
        code: "await Bun.sleep(1_000);",
        filename: "provider.live.test.ts",
      }),
    ).toBe(0);
  });
});
