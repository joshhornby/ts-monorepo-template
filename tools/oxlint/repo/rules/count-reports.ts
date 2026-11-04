import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pluginPath = join(import.meta.dir, "..", "index.ts");

/**
 * Lints one TypeScript source with only the given repo rule turned on.
 * Oxlint's RuleTester does not run under Bun, so this drives the real CLI.
 */
export const countReports = ({
  rule,
  code,
}: {
  readonly rule: string;
  readonly code: string;
}): number => {
  const directory = mkdtempSync(join(tmpdir(), "repo-oxlint-"));

  try {
    const config = join(directory, ".oxlintrc.json");
    const source = join(directory, "source.ts");

    writeFileSync(
      config,
      JSON.stringify({
        categories: { correctness: "off" },
        jsPlugins: [{ name: "repo", specifier: pluginPath }],
        rules: { [`repo/${rule}`]: "error" },
      }),
    );
    writeFileSync(source, code);

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
