import { expect, test } from "bun:test";
import { greet } from "./index.ts";

test("greet", () => {
  expect(greet("World")).toBe("Hello, World!");
});
