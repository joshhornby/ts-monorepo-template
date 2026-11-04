import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

const hasMember = ({
  union,
  type,
}: {
  readonly union: ESTree.TSUnionType;
  readonly type: ESTree.TSType["type"];
}): boolean => union.types.some((member) => member.type === type);

/** Reject a type that allows both null and undefined for one value. */
export const noNullAndUndefinedRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a type that allows both null and undefined for one value.",
    },
    messages: {
      nullAndUndefined:
        "Use null or undefined for a value, not both. undefined means not given. null means known to have no value.",
    },
  },
  createOnce(context) {
    return {
      TSUnionType(node) {
        if (
          hasMember({ union: node, type: "TSNullKeyword" }) &&
          hasMember({ union: node, type: "TSUndefinedKeyword" })
        ) {
          context.report({ node, messageId: "nullAndUndefined" });
        }
      },
      TSPropertySignature(node) {
        const type = node.typeAnnotation?.typeAnnotation;

        if (
          node.optional &&
          type?.type === "TSUnionType" &&
          hasMember({ union: type, type: "TSNullKeyword" })
        ) {
          context.report({ node: type, messageId: "nullAndUndefined" });
        }
      },
    };
  },
});
