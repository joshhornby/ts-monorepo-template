import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

import { ancestorsInFunction, chainRoot, isTestFile } from "./ast.ts";

const testFunctions: ReadonlySet<string> = new Set([
  "describe",
  "it",
  "suite",
  "test",
]);

const loopTypes: ReadonlySet<string> = new Set([
  "DoWhileStatement",
  "ForInStatement",
  "ForOfStatement",
  "ForStatement",
  "WhileStatement",
]);

const isInsideLoop = (node: ESTree.Node): boolean =>
  ancestorsInFunction(node).some((ancestor) => loopTypes.has(ancestor.type));

/** Disallow registering a test or suite inside a loop; use `.each` so each case is named and listed. */
export const noTestInLoopRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow declaring tests inside a loop; use test.each or describe.each instead.",
    },
    messages: {
      loop: "Do not declare {{name}}(…) inside a loop. Use {{name}}.each(cases)(name, …) instead.",
    },
  },
  create(context) {
    if (!isTestFile(context.filename)) return {};

    return {
      CallExpression(node) {
        const { parent } = node;

        // `describe.skipIf(x)(name, fn)` is one registration; report the outer call only.
        if (parent.type === "CallExpression" && parent.callee === node) return;

        const name = chainRoot(node.callee);

        if (name === undefined || !testFunctions.has(name)) return;

        if (isInsideLoop(node))
          context.report({
            node: node.callee,
            messageId: "loop",
            data: { name },
          });
      },
    };
  },
});
