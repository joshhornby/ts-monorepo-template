import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { z } from "zod";

import type { Workspace } from "./workspace.ts";

export type Check =
  | { readonly name: string; readonly status: "pass" }
  | {
      readonly name: string;
      readonly status: "fail";
      readonly problem: string;
      readonly fix: string;
    };

export interface EnvironmentVariable {
  readonly key: string;
  /** From a `# Needed for: <feature>` comment above the variable. */
  readonly neededFor: string | null;
}

const neededForPattern = /^#\s*Needed for:\s*(.+)$/i;

const variablePattern = /^([A-Za-z_][A-Za-z0-9_]*)=/;

/** Lists the variables in `.env.example`. A commented-out variable is not listed. */
export function parseEnvExample(
  text: string,
): ReadonlyArray<EnvironmentVariable> {
  const variables: EnvironmentVariable[] = [];
  let neededFor: string | null = null;

  for (const line of text.split("\n").map((raw) => raw.trim())) {
    const feature = neededForPattern.exec(line)?.[1];
    const key = variablePattern.exec(line)?.[1];

    if (feature !== undefined) neededFor = feature.trim();

    if (key !== undefined) variables.push({ key, neededFor });

    if (key !== undefined || line === "") neededFor = null;
  }

  return variables;
}

const RootPackage = z.object({
  packageManager: z.string().regex(/^bun@/),
});

function checkBunVersion(workspace: Workspace): Check {
  const name = "bun version";

  const rootPackage = RootPackage.parse(
    JSON.parse(readFileSync(join(workspace.root, "package.json"), "utf8")),
  );

  const wanted = rootPackage.packageManager.slice("bun@".length);

  if (Bun.version === wanted) return { name, status: "pass" };

  return {
    name,
    status: "fail",
    problem: `Bun ${Bun.version} is running; package.json pins ${wanted}. Commands may behave differently from CI.`,
    fix: `Install Bun ${wanted}: curl -fsSL https://bun.sh/install | bash -s "bun-v${wanted}"`,
  };
}

const WorkspacePackage = z.object({
  workspaces: z.array(z.string()).optional(),
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
});

function readPackage(directory: string): z.infer<typeof WorkspacePackage> {
  return WorkspacePackage.parse(
    JSON.parse(readFileSync(join(directory, "package.json"), "utf8")),
  );
}

/** The root and every workspace package, as directories. */
function packageDirectories(workspace: Workspace): ReadonlyArray<string> {
  const patterns = readPackage(workspace.root).workspaces ?? [];

  const workspaces = patterns.flatMap((pattern) =>
    Array.from(
      new Bun.Glob(`${pattern}/package.json`).scanSync({
        cwd: workspace.root,
        onlyFiles: true,
      }),
      (path) => dirname(join(workspace.root, path)),
    ),
  );

  return [workspace.root, ...workspaces];
}

function packageLabel(options: {
  readonly workspace: Workspace;
  readonly directory: string;
}): string {
  const path = relative(options.workspace.root, options.directory);

  return path === "" ? "." : path;
}

/** Dependencies a package declares that are not in its or the root's node_modules. */
function missingDependencies(options: {
  readonly workspace: Workspace;
  readonly directory: string;
}): ReadonlyArray<string> {
  const manifest = readPackage(options.directory);

  const declared = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ];

  const isInstalled = (dependency: string): boolean =>
    [options.directory, options.workspace.root].some((directory) =>
      existsSync(join(directory, "node_modules", dependency, "package.json")),
    );

  return declared.filter((dependency) => !isInstalled(dependency));
}

function checkDependencies(workspace: Workspace): Check {
  const name = "dependencies";

  const missing = packageDirectories(workspace).flatMap((directory) =>
    missingDependencies({ workspace, directory }).map(
      (dependency) =>
        `${packageLabel({ workspace, directory })}: ${dependency}`,
    ),
  );

  if (missing.length === 0) return { name, status: "pass" };

  return {
    name,
    status: "fail",
    problem: `Not installed, so code that imports them fails: ${missing.join(", ")}.`,
    fix: "Run `bun run setup`.",
  };
}

function checkVariable(variable: EnvironmentVariable): Check {
  const name = `env ${variable.key}`;
  const value = process.env[variable.key] ?? "";

  if (value !== "") return { name, status: "pass" };

  const without =
    variable.neededFor === null
      ? "Code that reads it may fail."
      : `Without it: ${variable.neededFor}.`;

  return {
    name,
    status: "fail",
    problem: `${variable.key} is not set. ${without}`,
    fix: `Set ${variable.key} in .env. \`bun run setup\` creates .env from .env.example.`,
  };
}

/** Reports what is missing and what breaks without it. Installs nothing. */
export function doctor(workspace: Workspace): ReadonlyArray<Check> {
  const examplePath = join(workspace.root, ".env.example");

  const variables = existsSync(examplePath)
    ? parseEnvExample(readFileSync(examplePath, "utf8"))
    : [];

  return [
    checkBunVersion(workspace),
    checkDependencies(workspace),
    ...variables.map(checkVariable),
  ];
}
