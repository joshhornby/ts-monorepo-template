import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-null-and-undefined";

describe(rule, () => {
  test.each([
    "type ShippedAt = Date | null;",
    "type Name = string | undefined;",
    "type Order = { shippedAt: Date | null };",
    "type Order = { note?: string };",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code })).toBe(0);
  });

  test.each([
    "type ShippedAt = Date | null | undefined;",
    "type Order = { shippedAt?: Date | null };",
    "interface Order { shippedAt?: Date | null }",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code })).toBe(1);
  });
});
