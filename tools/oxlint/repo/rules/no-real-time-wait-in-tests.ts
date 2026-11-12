import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

import {
  ancestors,
  dottedName,
  isFunction,
  isLiveTestFile,
  isTestFile,
  propertyName,
  unwrap,
} from "./ast.ts";

const timerModules: ReadonlySet<string> = new Set([
  "node:timers/promises",
  "timers/promises",
]);

const timers: ReadonlySet<string> = new Set([
  "setImmediate",
  "setInterval",
  "setTimeout",
]);

const sleeps: ReadonlySet<string> = new Set(["Bun.sleep", "Bun.sleepSync"]);

const isPromiseExecutor = (node: ESTree.Node): boolean => {
  const { parent } = node;

  return (
    parent?.type === "NewExpression" &&
    parent.arguments[0] === node &&
    dottedName(parent.callee) === "Promise"
  );
};

// `new Promise((resolve) => setTimeout(resolve, 20))` is a sleep. A bare `setTimeout(abort, 20_000)` is a watchdog, and stays allowed.
const isInsidePromiseExecutor = (node: ESTree.Node): boolean => {
  const all = ancestors(node);
  const boundary = all.find(isFunction);

  return boundary !== undefined && isPromiseExecutor(boundary);
};

/** Disallow sleeping on the real clock in a test; await the milestone instead. */
export const noRealTimeWaitInTestsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow real-clock waits in tests; await the milestone instead.",
    },
    messages: {
      wait: "Real-clock wait in a test. It passes or fails with runner load. Await the promise, event or message that marks the milestone, or drive a fake clock. A suite that drives a real outside system is a Live Test: name it *.live.test.ts.",
    },
  },
  create(context) {
    if (!isTestFile(context.filename) || isLiveTestFile(context.filename))
      return {};

    const timerPromiseLocals = new Set<string>();
    const timerPromiseNamespaces = new Set<string>();

    const isTimerPromise = (callee: ESTree.Node): boolean => {
      const name = dottedName(callee);

      if (name === undefined) return false;

      if (timerPromiseLocals.has(name)) return true;

      const [namespace, member] = name.split(".");

      return (
        namespace !== undefined &&
        member !== undefined &&
        timerPromiseNamespaces.has(namespace) &&
        timers.has(member)
      );
    };

    return {
      ImportDeclaration(node) {
        if (!timerModules.has(node.source.value)) return;

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportNamespaceSpecifier")
            timerPromiseNamespaces.add(specifier.local.name);

          if (specifier.type !== "ImportSpecifier") continue;

          const imported = propertyName(specifier.imported);

          if (imported !== undefined && timers.has(imported))
            timerPromiseLocals.add(specifier.local.name);
        }
      },
      CallExpression(node) {
        const callee = unwrap(node.callee);
        const name = dottedName(callee);

        const isSleep =
          isTimerPromise(callee) ||
          (name !== undefined && sleeps.has(name)) ||
          (name !== undefined &&
            timers.has(name) &&
            !timerPromiseLocals.has(name) &&
            isInsidePromiseExecutor(node));

        if (isSleep) context.report({ node: node.callee, messageId: "wait" });
      },
    };
  },
});
