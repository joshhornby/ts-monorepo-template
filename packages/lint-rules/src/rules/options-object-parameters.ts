import { defineRule } from "@oxlint/plugins";
import type { ESTree } from "@oxlint/plugins";

type NamedFunction = ESTree.Function | ESTree.ArrowFunctionExpression;

/** Report a named function with two or more parameters. Inline callbacks stay exempt. */
export const optionsObjectParametersRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require one options object for a function with two or more parameters.",
    },
    messages: {
      optionsObject:
        "A function with two or more parameters takes one options object.",
    },
  },
  createOnce(context) {
    const check = (node: NamedFunction): void => {
      if (node.params.length > 1) {
        context.report({ node, messageId: "optionsObject" });
      }
    };

    return {
      FunctionDeclaration: check,
      FunctionExpression(node) {
        if (
          node.parent.type === "VariableDeclarator" ||
          node.parent.type === "MethodDefinition"
        ) {
          check(node);
        }
      },
      ArrowFunctionExpression(node) {
        if (node.parent.type === "VariableDeclarator") check(node);
      },
    };
  },
});
