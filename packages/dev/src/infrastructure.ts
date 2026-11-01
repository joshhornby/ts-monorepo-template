import { createHash } from "node:crypto";
import { basename, join } from "node:path";

import {
  infrastructurePorts,
  type Infrastructure,
  type Workspace,
} from "./workspace.ts";

export type InfrastructureResult =
  | { readonly kind: "started" }
  | { readonly kind: "failed"; readonly output: ReadonlyArray<string> };

/** One compose project per checkout, so each checkout keeps its own data. */
export function composeProject(root: string): string {
  const name = basename(root)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  const hash = createHash("sha256").update(root).digest("hex").slice(0, 8);

  return `${name}-${hash}`;
}

async function compose(options: {
  readonly workspace: Workspace;
  readonly infrastructure: Infrastructure;
  readonly slot: number;
  readonly arguments: ReadonlyArray<string>;
}): Promise<{ readonly ok: boolean; readonly output: ReadonlyArray<string> }> {
  const { workspace } = options;

  const subprocess = Bun.spawn(
    [
      "docker",
      "compose",
      "--project-name",
      composeProject(workspace.root),
      "--file",
      join(workspace.root, options.infrastructure.composeFile),
      ...options.arguments,
    ],
    {
      cwd: workspace.root,
      env: { ...process.env, ...infrastructurePorts(options) },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(subprocess.stdout).text(),
    new Response(subprocess.stderr).text(),
    subprocess.exited,
  ]);

  const output = `${stdout}${stderr}`.trimEnd().split("\n");

  return { ok: exitCode === 0, output };
}

/** Starts the containers and waits until their health checks pass. Safe to repeat. */
export async function startInfrastructure(options: {
  readonly workspace: Workspace;
  readonly slot: number;
}): Promise<InfrastructureResult> {
  const { infrastructure } = options.workspace;

  if (infrastructure === null) return { kind: "started" };

  const result = await compose({
    ...options,
    infrastructure,
    arguments: ["up", "--detach", "--wait"],
  });

  if (result.ok) return { kind: "started" };

  const logs = await compose({
    ...options,
    infrastructure,
    arguments: ["logs", "--tail", "50"],
  });

  return { kind: "failed", output: [...result.output, ...logs.output] };
}

/** Stops and removes the containers. Their data volumes stay. */
export async function stopInfrastructure(options: {
  readonly workspace: Workspace;
  readonly slot: number;
}): Promise<void> {
  const { infrastructure } = options.workspace;

  if (infrastructure === null) return;

  await compose({ ...options, infrastructure, arguments: ["down"] });
}
