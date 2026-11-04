import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

/** Require one options object for a named function with two or more parameters. */
export const requireOptionsObjectRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require one options object for a named function with two or more parameters.",
    },
    messages: {
      optionsObject:
        "A function with two or more parameters takes one options object.",
    },
  },
  createOnce(context) {
    const check = (node: FunctionNode): void => {
      if (node.params.length > 1)
        context.report({ node, messageId: "optionsObject" });
    };

    // Inline callbacks such as reduce((total, item) => ...) stay exempt, so only named forms are checked.
    return {
      FunctionDeclaration: check,
      VariableDeclarator(node) {
        const { init } = node;

        if (
          init?.type === "ArrowFunctionExpression" ||
          init?.type === "FunctionExpression"
        )
          check(init);
      },
      MethodDefinition(node) {
        check(node.value);
      },
    };
  },
});
