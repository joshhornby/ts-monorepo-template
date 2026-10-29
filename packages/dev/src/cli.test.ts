import { expect, test } from "bun:test";

import { parseArguments } from "./cli.ts";

test("reads the command, service names, --json and -n", () => {
  expect(parseArguments(["logs", "api", "-n", "20", "--json"])).toEqual({
    kind: "valid",
    arguments: { command: "logs", positional: ["api"], json: true, lines: 20 },
  });
});

test("shows help when no command is given", () => {
  expect(parseArguments([])).toMatchObject({
    kind: "valid",
    arguments: { command: "help" },
  });
});

test("refuses -n without a positive whole number", () => {
  expect(parseArguments(["logs", "api", "-n", "lots"]).kind).toBe("invalid");
  expect(parseArguments(["logs", "api", "-n"]).kind).toBe("invalid");
});

test("refuses an unknown option rather than ignoring it", () => {
  expect(parseArguments(["down", "--force"])).toEqual({
    kind: "invalid",
    message: "Unknown option --force.",
  });
});
