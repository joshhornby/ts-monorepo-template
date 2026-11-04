import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-nested-conditional-types";

describe(rule, () => {
  test.each([
    "type IsText<T> = T extends string ? true : false;",
    "type A<T> = T extends string ? 1 : 2;\ntype B<T> = T extends number ? 1 : 2;",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code })).toBe(0);
  });

  test.each([
    "type Kind<T> = T extends string ? (T extends 'a' ? 1 : 2) : 3;",
    "type Kind<T, U> = T extends (U extends string ? U : never) ? 1 : 2;",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code })).toBe(1);
  });
});
