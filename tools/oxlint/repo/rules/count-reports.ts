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
 * Some rules look only at test files, so the file name can be set.
 */
export const countReports = ({
  rule,
  code,
  filename = "source.ts",
  files = [],
}: {
  readonly rule: string;
  readonly code: string;
  /** Relative to the temporary directory. A rule may depend on the name or the location. */
  readonly filename?: string;
  /** Other files the rule reads, such as a `package.json`. */
  readonly files?: ReadonlyArray<File>;
}): number => {
  const directory = mkdtempSync(join(tmpdir(), "repo-oxlint-"));

  try {
    const config = join(directory, ".oxlintrc.json");
    const source = join(directory, filename);

    for (const file of [...files, { path: filename, content: code }]) {
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
