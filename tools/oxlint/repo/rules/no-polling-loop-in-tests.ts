import { defineRule } from "@oxlint/plugins";

import type { ESTree } from "@oxlint/plugins";

import {
  ancestorsInFunction,
  dottedName,
  isNumericLiteral,
  isLiveTestFile,
  isTestFile,
  propertyName,
  unwrap,
} from "./ast.ts";

type Loop =
  | ESTree.DoWhileStatement
  | ESTree.ForStatement
  | ESTree.WhileStatement;

interface LoopFacts {
  waits: boolean;
  exitsOnCondition: boolean;
  readonly advanced: Set<string>;
}

const loopTypes: ReadonlySet<string> = new Set([
  "DoWhileStatement",
  "ForStatement",
  "WhileStatement",
]);

const timerModules: ReadonlySet<string> = new Set([
  "node:timers/promises",
  "timers/promises",
]);

const timers: ReadonlySet<string> = new Set([
  "setImmediate",
  "setInterval",
  "setTimeout",
]);

const sleeps: ReadonlySet<string> = new Set([
  "Bun.sleep",
  "Bun.sleepSync",
  "setImmediate",
]);

const comparisons: ReadonlySet<string> = new Set(["<", "<=", ">", ">="]);

const isLoop = (node: ESTree.Node): node is Loop => loopTypes.has(node.type);

// `Promise.resolve()`, or a `new Promise` whose executor starts a timer.
const isTickPromise = (node: ESTree.Node): boolean => {
  const expression = unwrap(node);

  if (expression.type === "CallExpression")
    return dottedName(expression.callee) === "Promise.resolve";

  if (
    expression.type !== "NewExpression" ||
    dottedName(expression.callee) !== "Promise"
  )
    return false;

  const [executor] = expression.arguments;

  if (executor === undefined) return false;

  const name = dottedName(executor);

  if (name !== undefined) return timers.has(name);

  if (executor.type === "ArrowFunctionExpression")
    return callsTimer(executor.body);

  if (executor.type === "FunctionExpression" && executor.body !== null)
    return callsTimer(executor.body);

  return false;
};

// The executor body is small; a timer call at its top level or as its expression body is what matters.
function callsTimer(body: ESTree.Node): boolean {
  const expression = unwrap(body);

  if (expression.type === "CallExpression") {
    const name = dottedName(expression.callee);

    return name !== undefined && timers.has(name);
  }

  if (expression.type !== "BlockStatement") return false;

  return expression.body.some(
    (statement) =>
      statement.type === "ExpressionStatement" &&
      callsTimer(statement.expression),
  );
}

/** Disallow a test loop that sleeps or yields until a predicate holds; await the milestone instead. */
export const noPollingLoopInTestsRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow loops in tests that spin on sleeps or ticks until a predicate holds; await the milestone instead.",
    },
    messages: {
      polling:
        "Polling loop in a test. Spinning on a sleep or a tick depends on the scheduler and runner load. Await the promise, event or message that marks the milestone.",
    },
  },
  create(context) {
    if (!isTestFile(context.filename) || isLiveTestFile(context.filename))
      return {};

    const facts = new Map<Loop, LoopFacts>();
    const timerPromiseLocals = new Set<string>();

    const factsFor = (loop: Loop): LoopFacts => {
      const known = facts.get(loop);

      if (known !== undefined) return known;

      const created = {
        waits: false,
        exitsOnCondition: false,
        advanced: new Set<string>(),
      };

      facts.set(loop, created);

      return created;
    };

    // Each loop that encloses the node in the same function, with whether an `if` sits between them.
    const enclosingLoops = (
      node: ESTree.Node,
    ): ReadonlyArray<{ readonly loop: Loop; readonly underIf: boolean }> => {
      const chain = ancestorsInFunction(node);

      return chain.flatMap((ancestor, index) =>
        isLoop(ancestor)
          ? [
              {
                loop: ancestor,
                underIf: chain
                  .slice(0, index)
                  .some((between) => between.type === "IfStatement"),
              },
            ]
          : [],
      );
    };

    const markWait = (node: ESTree.Node): void => {
      for (const { loop } of enclosingLoops(node)) factsFor(loop).waits = true;
    };

    const markExit = (node: ESTree.Node): void => {
      for (const { loop, underIf } of enclosingLoops(node))
        if (underIf) factsFor(loop).exitsOnCondition = true;
    };

    const markAdvanced = (input: {
      readonly node: ESTree.Node;
      readonly target: ESTree.Node;
    }): void => {
      const target = unwrap(input.target);

      if (target.type !== "Identifier") return;

      for (const { loop } of enclosingLoops(input.node))
        factsFor(loop).advanced.add(target.name);
    };

    // `tries < 15` with `tries` advanced by the loop bounds it without asking the system anything.
    const isCounterTest = ({
      loop,
      known,
    }: {
      readonly loop: Loop;
      readonly known: LoopFacts;
    }): boolean => {
      if (loop.test === null) return false;

      const test = unwrap(loop.test);

      if (test.type !== "BinaryExpression" || !comparisons.has(test.operator))
        return false;

      return [
        [test.left, test.right],
        [test.right, test.left],
      ].some(([counter, bound]) => {
        if (counter === undefined || bound === undefined) return false;

        const name = unwrap(counter);
        const limit = unwrap(bound);
        const isBound = limit.type === "Identifier" || isNumericLiteral(limit);

        return (
          name.type === "Identifier" && isBound && known.advanced.has(name.name)
        );
      });
    };

    const check = (loop: Loop): void => {
      const known = factsFor(loop);

      if (!known.waits) return;

      const test = loop.test === null ? undefined : unwrap(loop.test);

      const loopsForever =
        test === undefined || (test.type === "Literal" && test.value === true);

      const asksTheSystem = !loopsForever && !isCounterTest({ loop, known });

      if (known.exitsOnCondition || asksTheSystem)
        context.report({ node: loop, messageId: "polling" });
    };

    return {
      ImportDeclaration(node) {
        if (!timerModules.has(node.source.value)) return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;

          const imported = propertyName(specifier.imported);

          if (imported !== undefined && timers.has(imported))
            timerPromiseLocals.add(specifier.local.name);
        }
      },
      AwaitExpression(node) {
        if (isTickPromise(node.argument)) markWait(node);
      },
      CallExpression(node) {
        const name = dottedName(node.callee);

        if (
          name !== undefined &&
          (sleeps.has(name) || timerPromiseLocals.has(name))
        )
          markWait(node);
      },
      BreakStatement: markExit,
      ReturnStatement: markExit,
      ThrowStatement: markExit,
      UpdateExpression(node) {
        markAdvanced({ node, target: node.argument });
      },
      AssignmentExpression(node) {
        if (node.operator === "+=" || node.operator === "-=")
          markAdvanced({ node, target: node.left });
      },
      "DoWhileStatement:exit": check,
      "ForStatement:exit": check,
      "WhileStatement:exit": check,
    };
  },
});
