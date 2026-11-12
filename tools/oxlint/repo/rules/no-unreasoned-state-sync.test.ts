import { describe, expect, test } from "bun:test";

import { countReports } from "./count-reports.ts";

const rule = "no-unreasoned-state-sync";

describe(rule, () => {
  test.each([
    "const value = useMemo(() => 1, []);",
    "// The list stays scrolled to its end.\n// oxlint-disable-next-line repo/no-unreasoned-state-sync\nuseEffect(() => {}, []);",
  ])("accepts %p", (code) => {
    expect(countReports({ rule, code, filename: "view.tsx" })).toBe(0);
  });

  test.each([
    "useEffect(() => {}, []);",
    "useLayoutEffect(() => {}, []);",
    "React.useEffect(() => {}, []);",
  ])("rejects %p", (code) => {
    expect(countReports({ rule, code, filename: "view.tsx" })).toBe(1);
  });
});
