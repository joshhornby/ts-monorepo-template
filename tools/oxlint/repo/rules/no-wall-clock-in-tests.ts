import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

import {
  ancestors,
  dottedName,
  isLiveTestFile,
  isTestFile,
  propertyName,
  unwrap,
} from "./ast.ts";

const wallClockCalls: ReadonlySet<string> = new Set([
  "Bun.nanoseconds",
  "Date.now",
  "performance.now",
  "process.hrtime",
  "process.hrtime.bigint",
]);

const mockingCalls: ReadonlySet<string> = new Set([
  "jest.setSystemTime",
  "setSystemTime",
  "spyOn",
  "vi.setSystemTime",
  "vi.spyOn",
]);

const mockMethods: ReadonlySet<string> = new Set([
  "mockImplementation",
  "mockImplementationOnce",
  "mockResolvedValue",
  "mockResolvedValueOnce",
  "mockReturnValue",
  "mockReturnValueOnce",
]);

const isMockingCall = (callee: ESTree.Node): boolean => {
  const name = dottedName(callee);

  if (name !== undefined && mockingCalls.has(name)) return true;

  const expression = unwrap(callee);

  if (expression.type !== "MemberExpression") return false;

  const method = propertyName(expression.property);

  return method !== undefined && mockMethods.has(method);
};

// A reading passed to a mock seeds fake time rather than measuring the runner, so it stays allowed.
const feedsMock = (node: ESTree.Node): boolean => {
  const chain = [node, ...ancestors(node)];

  return chain.some(
    (current, index) =>
      current.type === "CallExpression" &&
      current.callee !== chain[index - 1] &&
      isMockingCall(current.callee),
  );
};

/** Disallow reading the wall clock in a test. */
export const noWallClockInTestsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow wall-clock readings (Date.now, new Date(), performance.now, process.hrtime) in tests.",
    },
    messages: {
      wallClock:
        "Wall-clock reading in a test. An elapsed-time assertion passes or fails with runner load. Use a fixed time, `setSystemTime`, or a clock passed in. A suite that drives a real outside system is a Live Test: name it *.live.test.ts.",
    },
  },
  create(context) {
    if (!isTestFile(context.filename) || isLiveTestFile(context.filename))
      return {};

    return {
      CallExpression(node) {
        const name = dottedName(node.callee);

        if (name === undefined || !wallClockCalls.has(name)) return;

        if (!feedsMock(node)) context.report({ node, messageId: "wallClock" });
      },
      NewExpression(node) {
        if (node.arguments.length > 0 || dottedName(node.callee) !== "Date")
          return;

        if (!feedsMock(node)) context.report({ node, messageId: "wallClock" });
      },
    };
  },
});
