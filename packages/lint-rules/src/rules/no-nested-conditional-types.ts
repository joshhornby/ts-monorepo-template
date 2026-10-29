import { defineRule } from "@oxlint/plugins";
import type { ESTree } from "@oxlint/plugins";

const isInsideConditionalType = (node: ESTree.TSConditionalType): boolean => {
  for (
    let ancestor: ESTree.Node | null = node.parent;
    ancestor !== null;
    ancestor = ancestor.parent
  ) {
    if (ancestor.type === "TSConditionalType") return true;
  }

  return false;
};

/** Report a conditional type written anywhere inside another conditional type. */
export const noNestedConditionalTypesRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a conditional type inside another.",
    },
    messages: {
      nested: "Do not nest conditional types. Use a simpler type.",
    },
  },
  createOnce(context) {
    return {
      TSConditionalType(node) {
        if (isInsideConditionalType(node)) {
          context.report({ node, messageId: "nested" });
        }
      },
    };
  },
});
