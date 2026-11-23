import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-wall-clock-in-tests";

describe(rule, () => {
  test.each([
    "const at = new Date('2026-01-01T00:00:00Z');",
    "setSystemTime(new Date());",
    "spyOn(Date, 'now').mockReturnValue(Date.now());",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code, filename: "clock.test.ts" })).toBe(0);
  });

  test.each([
    "const started = Date.now();",
    "const now = new Date();",
    "const started = performance.now();",
    "const started = process.hrtime.bigint();",
    "const started = Bun.nanoseconds();",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code, filename: "clock.test.ts" })).toBe(1);
  });

  test("allows the wall clock in a Live Test and outside tests", () => {
    const code = "const started = Date.now();";

    expect(
      countReports({ rule, code, filename: "server.live.test.ts" }) +
        countReports({ rule, code, filename: "clock.ts" }),
    ).toBe(0);
  });
});
