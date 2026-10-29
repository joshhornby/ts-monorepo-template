import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const pluginPath = fileURLToPath(import.meta.resolve("./index.ts"));

const oxlintPath = join(
  dirname(fileURLToPath(import.meta.resolve("oxlint/package.json"))),
  "bin",
  "oxlint",
);

const LintOutput = z.object({
  diagnostics: z.array(z.object({ code: z.string().optional() })),
});

/** Lint one TypeScript file with only the named rule on. Returns how often it reported. */
const countReports = async ({
  rule,
  code,
}: {
  readonly rule: string;
  readonly code: string;
}): Promise<number> => {
  const directory = await mkdtemp(join(tmpdir(), "lint-rules-"));

  try {
    const config = {
      jsPlugins: [pluginPath],
      categories: { correctness: "off" },
      rules: { [`repo/${rule}`]: "error" },
    };

    await writeFile(join(directory, ".oxlintrc.json"), JSON.stringify(config));
    await writeFile(join(directory, "input.ts"), code);

    const lint = Bun.spawn({
      cmd: [oxlintPath, "--format=json", "input.ts"],
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = LintOutput.parse(JSON.parse(await lint.stdout.text()));
    await lint.exited;

    return output.diagnostics.filter(
      (diagnostic) => diagnostic.code === `repo(${rule})`,
    ).length;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

describe("options-object-parameters", () => {
  const rule = "options-object-parameters";

  test.each([
    "function one(options: { a: number; b: number }): number { return options.a; }",
    "const one = (a: number): number => a;",
    "const total = [1, 2].reduce((sum, item) => sum + item, 0);",
    "[1].forEach(function (item, index) { console.log(item, index); });",
  ])("allows one parameter or an inline callback: %s", async (code) => {
    expect(await countReports({ rule, code })).toBe(0);
  });

  test.each([
    "function two(a: number, b: number): number { return a + b; }",
    "const two = (a: number, b: number): number => a + b;",
    "const two = function (a: number, b: number): number { return a + b; };",
    "class Box { add(a: number, b: number): number { return a + b; } }",
  ])("refuses two positional parameters: %s", async (code) => {
    expect(await countReports({ rule, code })).toBe(1);
  });
});

describe("no-null-and-undefined", () => {
  const rule = "no-null-and-undefined";

  test.each([
    "type Name = string | null;",
    "type Name = string | undefined;",
    "type Order = { shippedAt: Date | null };",
    "type Order = { note?: string };",
  ])("allows null or undefined alone: %s", async (code) => {
    expect(await countReports({ rule, code })).toBe(0);
  });

  test.each([
    "type Name = string | null | undefined;",
    "function read(name: string | undefined | null): void { console.log(name); }",
    "type Order = { shippedAt?: Date | null };",
  ])("refuses a type that allows both: %s", async (code) => {
    expect(await countReports({ rule, code })).toBe(1);
  });
});

describe("no-nested-conditional-types", () => {
  const rule = "no-nested-conditional-types";

  test.each([
    "type Flag<T> = T extends string ? 1 : 2;",
    "type Pair<T> = [T extends string ? 1 : 2, T extends number ? 3 : 4];",
  ])("allows conditional types side by side: %s", async (code) => {
    expect(await countReports({ rule, code })).toBe(0);
  });

  test.each([
    'type Kind<T> = T extends string ? (T extends "a" ? 1 : 2) : 3;',
    "type Kind<T> = T extends string ? 1 : { value: T extends number ? 2 : 3 };",
  ])("refuses a conditional type inside another: %s", async (code) => {
    expect(await countReports({ rule, code })).toBe(1);
  });

  test("reports each nested level of a conditional chain", async () => {
    const code =
      "type Kind<T> = T extends 1 ? 1 : T extends 2 ? 2 : T extends 3 ? 3 : 4;";

    expect(await countReports({ rule, code })).toBe(2);
  });
});
