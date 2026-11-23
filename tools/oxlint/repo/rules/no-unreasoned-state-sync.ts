import { defineRule } from "@oxlint/plugins";

import { dottedName, isTestFile } from "./ast.ts";

const effectHooks: ReadonlySet<string> = new Set([
  "React.useEffect",
  "React.useInsertionEffect",
  "React.useLayoutEffect",
  "useEffect",
  "useInsertionEffect",
  "useLayoutEffect",
]);

/** Report every React effect hook; one that stays says, in its suppression, what it keeps in step. */
export const noUnreasonedStateSyncRule = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Report every React effect hook, the usual way state gets synchronized; one that stays says why.",
    },
    messages: {
      // Agents read this message and act on it, so it walks the alternatives before it shows the way out.
      effect:
        "Stop and reconsider before keeping this effect. " +
        "Is it computable from props or state? Compute it during render. " +
        "Does it respond to a user action? Do it in that handler. " +
        "Does it reset state when a prop changes? Key the component on that prop. " +
        "Does it tell a parent or store that a value changed? Do it where the change happens. " +
        "Does it read a value from outside React? Use useSyncExternalStore. " +
        "An effect that sets state another effect reads is one handler or one derivation. " +
        "An effect is right only when it keeps something outside React in step with this component while mounted: " +
        "a DOM node, listener, timer, connection or a resource held until unmount. " +
        "Moving the same logic into a ref or store to dodge this rule is not a fix. " +
        "If the effect does that, name what it keeps in step on the line above: " +
        "`// oxlint-disable-next-line repo/no-unreasoned-state-sync -- <what it syncs with and why>`.",
    },
  },
  create(context) {
    if (isTestFile(context.filename)) return {};

    return {
      CallExpression(node) {
        const name = dottedName(node.callee);

        if (name !== undefined && effectHooks.has(name))
          context.report({ node, messageId: "effect" });
      },
    };
  },
});
