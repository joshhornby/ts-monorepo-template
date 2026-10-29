import { definePlugin } from "@oxlint/plugins";

import { noNestedConditionalTypesRule } from "./rules/no-nested-conditional-types.ts";
import { noNullAndUndefinedRule } from "./rules/no-null-and-undefined.ts";
import { optionsObjectParametersRule } from "./rules/options-object-parameters.ts";

/** Oxlint rules that enforce docs/typescript.md where no built-in rule does. */
const plugin = definePlugin({
  meta: { name: "repo" },
  rules: {
    "no-nested-conditional-types": noNestedConditionalTypesRule,
    "no-null-and-undefined": noNullAndUndefinedRule,
    "options-object-parameters": optionsObjectParametersRule,
  },
});

export default plugin;
