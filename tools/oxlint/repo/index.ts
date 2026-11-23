import { definePlugin } from "@oxlint/plugins";

import { noAppImportsRule } from "./rules/no-app-imports.ts";
import { noNestedConditionalTypesRule } from "./rules/no-nested-conditional-types.ts";
import { noNullAndUndefinedRule } from "./rules/no-null-and-undefined.ts";
import { requireOptionsObjectRule } from "./rules/require-options-object.ts";

/** Oxlint rules that codify docs/typescript.md. */
const repoPlugin = definePlugin({
  meta: { name: "repo" },
  rules: {
    "no-app-imports": noAppImportsRule,
    "no-nested-conditional-types": noNestedConditionalTypesRule,
    "no-null-and-undefined": noNullAndUndefinedRule,
    "require-options-object": requireOptionsObjectRule,
  },
});

export default repoPlugin;
