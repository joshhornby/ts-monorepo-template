import type { ESTree } from "@oxlint/plugins";

const testFile = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

const liveTestFile = /\.live\.(?:test|spec)\.[cm]?[jt]sx?$/u;

const functionTypes: ReadonlySet<string> = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
]);

const testFunctions: ReadonlySet<string> = new Set([
  "describe",
  "it",
  "suite",
  "test",
]);

const quoted = /^["']/u;

const numeral = /^\.?\d[\d_.eExXoObB]*$/u;

// The raw source tells a string or a number literal apart without a runtime `typeof`.
/** The value of a string literal, or undefined for any other node. */
const stringValue = (node: ESTree.Node): string | undefined =>
  node.type === "Literal" && node.raw !== null && quoted.test(node.raw)
    ? String(node.value)
    : undefined;

/** Whether the node is a number literal. */
export const isNumericLiteral = (node: ESTree.Node): boolean =>
  node.type === "Literal" && node.raw !== null && numeral.test(node.raw);

/** Whether the file is a test file. */
export const isTestFile = (filename: string): boolean =>
  testFile.test(filename);

/**
 * Whether the file is a Live Test: an opt-in suite that drives a real outside system or process.
 * Real time is what it measures, so the test-clock rules leave it alone.
 */
export const isLiveTestFile = (filename: string): boolean =>
  liveTestFile.test(filename);

/** Whether the node starts a new function, so code inside it runs on its own schedule. */
export const isFunction = (node: ESTree.Node): boolean =>
  functionTypes.has(node.type);

/** Strips parentheses, `?.`, `!` and type assertions from an expression. */
export const unwrap = (node: ESTree.Node): ESTree.Node => {
  let current = node;

  while (
    current.type === "ChainExpression" ||
    current.type === "ParenthesizedExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSTypeAssertion"
  )
    current = current.expression;

  return current;
};

/** The dotted name of an identifier or a member chain, such as `Date.now`. */
export const dottedName = (node: ESTree.Node): string | undefined => {
  const expression = unwrap(node);

  if (expression.type === "Identifier") return expression.name;

  if (expression.type !== "MemberExpression") return undefined;

  const { object, property } = expression;

  if (object.type === "Super") return undefined;

  const objectName = dottedName(object);

  if (objectName === undefined) return undefined;

  if (!expression.computed && property.type === "Identifier")
    return `${objectName}.${property.name}`;

  const key = stringValue(property);

  return key === undefined ? undefined : `${objectName}.${key}`;
};

/** The identifier a call chain starts from: `test` in `test.each(cases)(name, fn)`. */
export const chainRoot = (node: ESTree.Node): string | undefined => {
  const expression = unwrap(node);

  if (expression.type === "Identifier") return expression.name;

  if (expression.type === "MemberExpression") {
    if (expression.object.type === "Super") return undefined;

    return chainRoot(expression.object);
  }

  if (expression.type === "CallExpression") return chainRoot(expression.callee);

  return undefined;
};

/** Whether the callee registers a test or a suite, such as `test`, `describe.each(cases)` or `it.skipIf(x)`. */
export const isTestCallee = (node: ESTree.Node): boolean => {
  const root = chainRoot(node);

  return root !== undefined && testFunctions.has(root);
};

/** The name of an object key or a member property, when it is written out. */
export const propertyName = (node: ESTree.Node): string | undefined => {
  if (node.type === "Identifier") return node.name;

  return stringValue(node);
};

/** The node's ancestors, nearest first, ending at the Program. */
export const ancestors = (node: ESTree.Node): ReadonlyArray<ESTree.Node> => {
  const found: ESTree.Node[] = [];
  let current = node.parent;

  while (current !== null) {
    found.push(current);
    current = current.parent;
  }

  return found;
};

/** The ancestors that sit in the same function as the node, nearest first. */
export const ancestorsInFunction = (
  node: ESTree.Node,
): ReadonlyArray<ESTree.Node> => {
  const all = ancestors(node);
  const boundary = all.findIndex(isFunction);

  return boundary === -1 ? all : all.slice(0, boundary);
};
