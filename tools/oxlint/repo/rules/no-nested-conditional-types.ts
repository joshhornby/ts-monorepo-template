import { defineRule } from "@oxlint/plugins";

/** Reject a conditional type inside another conditional type. */
export const noNestedConditionalTypesRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow a conditional type inside another conditional type.",
    },
    messages: {
      nested: "Do not nest conditional types. Use a simpler type.",
    },
  },
  createOnce(context) {
    let depth = 0;

    return {
      TSConditionalType(node) {
        if (depth > 0) context.report({ node, messageId: "nested" });
        depth += 1;
      },
      "TSConditionalType:exit"() {
        depth -= 1;
      },
    };
  },
});
