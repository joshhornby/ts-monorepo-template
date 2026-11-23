import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const pluginPath = join(import.meta.dir, "..", "index.ts");

interface File {
  /** Relative to the temporary directory. */
  readonly path: string;
  readonly content: string;
}

/**
 * Lints one TypeScript source with only the given repo rule turned on.
 * Oxlint's RuleTester does not run under Bun, so this drives the real CLI.
 */
export const countReports = ({
  rule,
  code,
  path = "source.ts",
  files = [],
}: {
  readonly rule: string;
  readonly code: string;
  /** Where the source sits, for a rule that depends on the file's location. */
  readonly path?: string;
  /** Other files the rule reads, such as a `package.json`. */
  readonly files?: ReadonlyArray<File>;
}): number => {
  const directory = mkdtempSync(join(tmpdir(), "repo-oxlint-"));

  try {
    const config = join(directory, ".oxlintrc.json");
    const source = join(directory, path);

    for (const file of [...files, { path, content: code }]) {
      mkdirSync(dirname(join(directory, file.path)), { recursive: true });
      writeFileSync(join(directory, file.path), file.content);
    }

    writeFileSync(
      config,
      JSON.stringify({
        categories: { correctness: "off" },
        jsPlugins: [{ name: "repo", specifier: pluginPath }],
        rules: { [`repo/${rule}`]: "error" },
      }),
    );

    const result = Bun.spawnSync([
      "oxlint",
      "-c",
      config,
      "-f",
      "unix",
      source,
    ]);

    const output = result.stdout.toString();

    return output.split("\n").filter((line) => line.endsWith(`repo(${rule})]`))
      .length;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};
