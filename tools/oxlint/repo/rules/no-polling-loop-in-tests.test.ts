import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-polling-loop-in-tests";

describe(rule, () => {
  test.each([
    "for (let index = 0; index < 3; index += 1) await Promise.resolve();",
    "while (true) { await Promise.resolve(); }",
    "while (queue.length > 0) handle(queue.shift());",
    "for (let index = 0; index < 3; index++) { if (done()) break; send(); }",
    "while (busy()) { await next(); }",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code, filename: "poll.test.ts" })).toBe(0);
  });

  test.each([
    "while (!done()) await Bun.sleep(10);",
    "while (state === 'running') { await new Promise((resolve) => setTimeout(resolve, 10)); }",
    "for (let tries = 0; tries < 100; tries += 1) { if (done()) break; await Promise.resolve(); }",
    "for (let tries = 0; tries < 15 && !done(); tries++) await Bun.sleep(10);",
    "do { await Bun.sleep(10); } while (!done());",
    "import { setTimeout as sleep } from 'node:timers/promises';\nwhile (!done()) await sleep(10);",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code, filename: "poll.test.ts" })).toBe(1);
  });

  test("allows polling in a Live Test", () => {
    expect(
      countReports({
        rule,
        code: "while (!done()) await Bun.sleep(1_000);",
        filename: "provider.live.test.ts",
      }),
    ).toBe(0);
  });
});
