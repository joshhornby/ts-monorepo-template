import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "require-suppression-reason";

describe(rule, () => {
  test.each([
    "// oxlint-disable-next-line eslint/no-console -- the CLI prints its result\nconsole.log(1);",
    "// The CLI prints its result.\n// oxlint-disable-next-line eslint/no-console\nconsole.log(1);",
    "// @ts-expect-error the fixture is wrong on purpose\nconst value: number = 'text';",
    "/* oxlint-enable eslint/no-console */",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code })).toBe(0);
  });

  test.each([
    "// oxlint-disable-next-line eslint/no-console\nconsole.log(1);",
    "/* oxlint-disable eslint/no-console */",
    "// @ts-expect-error\nconst value: number = 'text';",
    "// @ts-ignore:\nconst value: number = 'text';",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code })).toBe(1);
  });
});
