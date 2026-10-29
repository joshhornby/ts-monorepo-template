import { defineRule } from "@oxlint/plugins";
import type { ESTree } from "@oxlint/plugins";

const hasMember = ({
  union,
  member,
}: {
  readonly union: ESTree.TSUnionType;
  readonly member: "TSNullKeyword" | "TSUndefinedKeyword";
}): boolean => union.types.some((type) => type.type === member);

/** An optional property already allows undefined, so `null` in its type allows both. */
const isOptionalPropertyType = (union: ESTree.TSUnionType): boolean => {
  const annotation = union.parent;

  if (annotation.type !== "TSTypeAnnotation") return false;
  const property = annotation.parent;

  return property.type === "TSPropertySignature" && property.optional;
};

/** Report a type that allows both null and undefined for one value. */
export const noNullAndUndefinedRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow a type that allows both null and undefined.",
    },
    messages: {
      both: "Use null or undefined for a value, not both. undefined means not given. null means known to have no value.",
    },
  },
  createOnce(context) {
    return {
      TSUnionType(node) {
        if (!hasMember({ union: node, member: "TSNullKeyword" })) return;

        if (
          hasMember({ union: node, member: "TSUndefinedKeyword" }) ||
          isOptionalPropertyType(node)
        ) {
          context.report({ node, messageId: "both" });
        }
      },
    };
  },
});
