import { expect, test } from "bun:test";

import { parseEnv } from "./env.ts";

test("uses port 3000 when PORT is not set", () => {
  expect(parseEnv({})).toEqual({ ok: true, value: { PORT: 3000 } });
});

test("reads PORT as a number", () => {
  expect(parseEnv({ PORT: "3010" })).toEqual({
    ok: true,
    value: { PORT: 3010 },
  });
});

test("names the variable when a value is invalid", () => {
  const env = parseEnv({ PORT: "eighty" });

  expect(env.ok).toBe(false);
  expect(env.ok ? "" : env.failure).toContain("PORT");
});
