import { describe, expect, test } from "bun:test";

import { greet } from "./index.ts";

describe("greet", () => {
  test("greets a valid name with surrounding space removed", () => {
    expect(greet("  Ada ").unwrap()).toBe("Hello, Ada!");
  });

  test("refuses an empty name", () => {
    const result = greet("   ");

    expect(result.isErr() && result.error._tag).toBe("InvalidName");
  });

  test("refuses a name longer than 50 characters", () => {
    const result = greet("a".repeat(51));

    expect(result.isErr() && result.error._tag).toBe("InvalidName");
  });

  test("refuses a reserved name in any case", () => {
    const result = greet("Admin");

    expect(result.isErr() && result.error._tag).toBe("ReservedName");
  });
});
