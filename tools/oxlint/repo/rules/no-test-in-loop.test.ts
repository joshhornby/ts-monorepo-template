import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-test-in-loop";

describe(rule, () => {
  test.each([
    "test.each([1, 2])('adds %p', () => {});",
    "test('adds', () => { for (const value of [1, 2]) expect(value).toBeGreaterThan(0); });",
    "for (const value of [1, 2]) check(() => test);",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code, filename: "math.test.ts" })).toBe(0);
  });

  test.each([
    "for (const value of [1, 2]) test(`adds ${value}`, () => {});",
    "for (const [name] of Object.entries(providers)) { describe(name, () => {}); }",
    "describe('math', () => { for (let index = 0; index < 2; index++) it('adds', () => {}); });",
    "for (const [name] of Object.entries(providers)) describe.skipIf(!ready)(name, () => {});",
    "for (const value of [1, 2]) test.each([value])('adds %p', () => {});",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code, filename: "math.test.ts" })).toBe(1);
  });
});
