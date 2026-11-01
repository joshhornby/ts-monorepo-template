import { expect, test } from "bun:test";

import { composeProject } from "./infrastructure.ts";

test("two checkouts with the same folder name get different compose projects", () => {
  const first = composeProject("/home/ada/work/My App");
  const second = composeProject("/home/ada/review/My App");

  expect(first).not.toBe(second);
  expect(first).toMatch(/^my-app-[0-9a-f]{8}$/);
});

test("a checkout always gets the same compose project, so its data volume is kept", () => {
  expect(composeProject("/srv/app")).toBe(composeProject("/srv/app"));
});
