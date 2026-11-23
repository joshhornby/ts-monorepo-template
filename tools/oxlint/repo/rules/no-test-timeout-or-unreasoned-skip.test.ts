import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-test-timeout-or-unreasoned-skip";

describe(rule, () => {
  test.each([
    "test('adds', () => {});",
    "describe.skipIf(!enabled)('engine', () => {});",
    "test('adds', { skip: onWindows }, () => {});",
    "// quarantine: #12 flaky on CI\ntest.skip('adds', () => {});",
    "beforeAll(async () => {});",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code, filename: "math.test.ts" })).toBe(0);
  });

  test.each([
    "test('adds', () => {}, 5_000);",
    "test('adds', () => {}, SLOW);",
    "test('adds', () => {}, { timeout: 5_000 });",
    "test('adds', { retry: 2 }, () => {});",
    "test.each([1])('adds %p', () => {}, 5_000);",
    "beforeAll(async () => {}, 90_000);",
    "setDefaultTimeout(60_000);",
    "test.skip('adds', () => {});",
    "describe.only('math', () => {});",
    "test.todo('adds');",
    "xit('adds', () => {});",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code, filename: "math.test.ts" })).toBe(1);
  });

  test("allows timeouts in a Live Test", () => {
    const code = "test('creates a sandbox', async () => {}, 60_000);";

    expect(
      countReports({ rule, code, filename: "provider.live.test.ts" }),
    ).toBe(0);
  });

  test("ignores files that are not tests", () => {
    const code = "test('adds', () => {}, 5_000);";

    expect(countReports({ rule, code, filename: "math.ts" })).toBe(0);
  });
});
