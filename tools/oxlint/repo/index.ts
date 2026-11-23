import { definePlugin } from "@oxlint/plugins";

import { noAppImportsRule } from "./rules/no-app-imports.ts";
import { noNestedConditionalTypesRule } from "./rules/no-nested-conditional-types.ts";
import { noNullAndUndefinedRule } from "./rules/no-null-and-undefined.ts";
import { noPollingLoopInTestsRule } from "./rules/no-polling-loop-in-tests.ts";
import { noRealTimeWaitInTestsRule } from "./rules/no-real-time-wait-in-tests.ts";
import { noTestInLoopRule } from "./rules/no-test-in-loop.ts";
import { noTestTimeoutOrUnreasonedSkipRule } from "./rules/no-test-timeout-or-unreasoned-skip.ts";
import { noUnreasonedStateSyncRule } from "./rules/no-unreasoned-state-sync.ts";
import { noWallClockInTestsRule } from "./rules/no-wall-clock-in-tests.ts";
import { requireOptionsObjectRule } from "./rules/require-options-object.ts";
import { requireSuppressionReasonRule } from "./rules/require-suppression-reason.ts";

/**
 * Oxlint rules that codify docs/typescript.md, docs/testing.md and docs/ui.md.
 * The test, suppression and effect rules are adapted from the t3code Oxlint plugin
 * (github.com/krl-gr/upcomputer, oxlint-plugin-t3code, commit 89354bf). See LICENSE-t3code.
 */
const repoPlugin = definePlugin({
  meta: { name: "repo" },
  rules: {
    "no-app-imports": noAppImportsRule,
    "no-nested-conditional-types": noNestedConditionalTypesRule,
    "no-null-and-undefined": noNullAndUndefinedRule,
    "no-polling-loop-in-tests": noPollingLoopInTestsRule,
    "no-real-time-wait-in-tests": noRealTimeWaitInTestsRule,
    "no-test-in-loop": noTestInLoopRule,
    "no-test-timeout-or-unreasoned-skip": noTestTimeoutOrUnreasonedSkipRule,
    "no-unreasoned-state-sync": noUnreasonedStateSyncRule,
    "no-wall-clock-in-tests": noWallClockInTestsRule,
    "require-options-object": requireOptionsObjectRule,
    "require-suppression-reason": requireSuppressionReasonRule,
  },
});

export default repoPlugin;
