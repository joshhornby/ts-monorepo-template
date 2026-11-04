import { definePlugin } from "@oxlint/plugins";

import { noNestedConditionalTypesRule } from "./rules/no-nested-conditional-types.ts";
import { noNullAndUndefinedRule } from "./rules/no-null-and-undefined.ts";
import { requireOptionsObjectRule } from "./rules/require-options-object.ts";

/** Oxlint rules that codify docs/typescript.md. */
const repoPlugin = definePlugin({
  meta: { name: "repo" },
  rules: {
    "no-nested-conditional-types": noNestedConditionalTypesRule,
    "no-null-and-undefined": noNullAndUndefinedRule,
    "require-options-object": requireOptionsObjectRule,
  },
});

export default repoPlugin;
