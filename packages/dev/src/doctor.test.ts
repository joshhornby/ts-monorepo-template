import { expect, test } from "bun:test";

import { parseEnvExample } from "./doctor.ts";

test("lists each variable with the feature that needs it", () => {
  const example = [
    "# Needed for: sending email",
    "SMTP_URL=",
    "",
    "LOG_LEVEL=info",
  ].join("\n");

  expect(parseEnvExample(example)).toEqual([
    { key: "SMTP_URL", neededFor: "sending email" },
    { key: "LOG_LEVEL", neededFor: null },
  ]);
});

test("does not carry a feature past a blank line", () => {
  const example = ["# Needed for: payments", "", "API_KEY="].join("\n");

  expect(parseEnvExample(example)).toEqual([
    { key: "API_KEY", neededFor: null },
  ]);
});

test("skips commented-out variables", () => {
  expect(parseEnvExample("# Needed for: search\n# SEARCH_URL=")).toEqual([]);
});
