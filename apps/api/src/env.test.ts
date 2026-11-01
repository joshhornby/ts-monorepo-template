import { expect, test } from "bun:test";

import { parseEnv } from "./env.ts";

const DATABASE_URL = "postgres://postgres:postgres@localhost:3009/app";

test("uses port 3000 when PORT is not set", () => {
  expect(parseEnv({ DATABASE_URL })).toEqual({
    ok: true,
    value: { PORT: 3000, DATABASE_URL },
  });
});

test("reads PORT as a number", () => {
  expect(parseEnv({ PORT: "3010", DATABASE_URL })).toEqual({
    ok: true,
    value: { PORT: 3010, DATABASE_URL },
  });
});

test("names the variable when a value is invalid", () => {
  const env = parseEnv({ PORT: "eighty", DATABASE_URL });

  expect(env.ok ? "" : env.failure).toContain("PORT");
});

test("says how to set DATABASE_URL when it is missing", () => {
  const env = parseEnv({});

  expect(env.ok ? "" : env.failure).toContain("`bun run up` sets it");
});
