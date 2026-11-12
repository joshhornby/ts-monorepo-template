import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

import {
  dottedName,
  isFunction,
  isLiveTestFile,
  isTestCallee,
  isTestFile,
  propertyName,
  unwrap,
} from "./ast.ts";

const hooks: ReadonlySet<string> = new Set([
  "afterAll",
  "afterEach",
  "beforeAll",
  "beforeEach",
]);

const focusOrSkip: ReadonlySet<string> = new Set(["only", "skip", "todo"]);

const focusOrSkipFunctions: ReadonlySet<string> = new Set([
  "fdescribe",
  "fit",
  "xdescribe",
  "xit",
  "xtest",
]);

const overrides: ReadonlySet<string> = new Set(["retry", "timeout"]);

const configOverrides: ReadonlySet<string> = new Set([
  "hookTimeout",
  "retry",
  "testTimeout",
]);

const quarantine =
  /quarantine:\s*#\d+|https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/issues\/\d+/u;

const hasKey = (input: {
  readonly node: ESTree.Node | undefined;
  readonly keys: ReadonlySet<string>;
}): boolean => {
  if (input.node === undefined) return false;

  const expression = unwrap(input.node);

  if (expression.type !== "ObjectExpression") return false;

  return expression.properties.some((property) => {
    if (property.type !== "Property") return false;

    const name = propertyName(property.key);

    return name !== undefined && input.keys.has(name);
  });
};

const hasTrueKey = (input: {
  readonly node: ESTree.Node | undefined;
  readonly keys: ReadonlySet<string>;
}): boolean => {
  if (input.node === undefined) return false;

  const expression = unwrap(input.node);

  if (expression.type !== "ObjectExpression") return false;

  return expression.properties.some((property) => {
    if (property.type !== "Property") return false;

    const name = propertyName(property.key);
    const value = unwrap(property.value);

    return (
      name !== undefined &&
      input.keys.has(name) &&
      value.type === "Literal" &&
      value.value === true
    );
  });
};

// Bun takes `test(name, fn, 5_000)` or `test(name, fn, { timeout })`; Vitest also takes `test(name, { timeout }, fn)`.
const overridesTimeout = (
  args: ESTree.CallExpression["arguments"],
): boolean => {
  const [, second, third] = args;

  if (hasKey({ node: second, keys: overrides })) return true;

  if (third === undefined) return false;

  const value = unwrap(third);

  if (isFunction(value)) return false;

  if (value.type === "ObjectExpression")
    return hasKey({ node: value, keys: overrides });

  return true;
};

const enclosingStatement = (node: ESTree.Node): ESTree.Node => {
  let current = node;

  while (
    current.type !== "Program" &&
    !/(?:Statement|Declaration)$/u.test(current.type)
  )
    current = current.parent;

  return current;
};

/** Disallow per-test timeouts and retries, and require a tracking issue for a skipped or focused test. */
export const noTestTimeoutOrUnreasonedSkipRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow per-test timeouts and retries, and require a tracking issue for skipped or focused tests.",
    },
    messages: {
      timeout:
        "A per-test timeout or retry hides a wait that should be event-driven. Remove the override and await the milestone. A suite that drives a real outside system is a Live Test: name it *.live.test.ts.",
      skip: "A skipped or focused test needs a tracking issue in the comment above it: `// quarantine: #1234 <why>`. Gate on the environment with `skipIf` instead.",
    },
  },
  create(context) {
    if (!isTestFile(context.filename)) return {};

    const checkTimeouts = !isLiveTestFile(context.filename);

    const reportUnlessQuarantined = (node: ESTree.Node): void => {
      const comments = context.sourceCode.getCommentsBefore(
        enclosingStatement(node),
      );

      if (!comments.some((comment) => quarantine.test(comment.value)))
        context.report({ node, messageId: "skip" });
    };

    return {
      CallExpression(node) {
        const callee = unwrap(node.callee);
        const name = dottedName(callee);

        if (name === "setDefaultTimeout" || name === "jest.setTimeout") {
          if (checkTimeouts) context.report({ node, messageId: "timeout" });

          return;
        }

        if (name === "vi.setConfig") {
          if (
            checkTimeouts &&
            hasKey({ node: node.arguments[0], keys: configOverrides })
          )
            context.report({ node, messageId: "timeout" });

          return;
        }

        if (name !== undefined && hooks.has(name)) {
          if (checkTimeouts && node.arguments[1] !== undefined)
            context.report({ node, messageId: "timeout" });

          return;
        }

        if (!isTestCallee(callee)) return;

        if (checkTimeouts && overridesTimeout(node.arguments))
          context.report({ node, messageId: "timeout" });

        // `{ skip: true }` is the options spelling of `test.skip`. A computed value is an environment gate, like `skipIf`.
        const [, second, third] = node.arguments;

        if (
          hasTrueKey({ node: second, keys: focusOrSkip }) ||
          hasTrueKey({ node: third, keys: focusOrSkip })
        )
          reportUnlessQuarantined(node);
      },
      Identifier(node) {
        if (!focusOrSkipFunctions.has(node.name)) return;

        const { parent } = node;

        if (parent.type === "CallExpression" && parent.callee === node)
          reportUnlessQuarantined(node);
      },
      MemberExpression(node) {
        const name = propertyName(node.property);

        if (name === undefined || !focusOrSkip.has(name)) return;

        if (node.computed && node.property.type !== "Literal") return;

        if (node.object.type === "Super") return;

        if (isTestCallee(node.object)) reportUnlessQuarantined(node);
      },
    };
  },
});
