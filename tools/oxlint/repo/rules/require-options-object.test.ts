import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "require-options-object";

describe(rule, () => {
  test.each([
    "function greet(options: { name: string; greeting: string }) {}",
    "const greet = (name: string) => name;",
    "const total = [1, 2].reduce((sum, item) => sum + item, 0);",
    "class Greeter { greet(options: { name: string }) {} }",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code })).toBe(0);
  });

  test.each([
    "function greet(name: string, greeting: string) {}",
    "const greet = (name: string, greeting: string) => name;",
    "const greet = function (name: string, greeting: string) {};",
    "class Greeter { greet(name: string, greeting: string) {} }",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code })).toBe(1);
  });
});
