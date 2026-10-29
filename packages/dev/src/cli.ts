#!/usr/bin/env bun
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import type { Check } from "./doctor.ts";
import type { UpResult } from "./stack.ts";
import { defaultWorkspace, slotCount, type Workspace } from "./workspace.ts";

const usage = `Usage: bun run <command> [--json]

  setup             install dependencies, create .env, then run doctor
  doctor            report what is missing and what breaks without it
  up [service...]   start services and wait until healthy; prints their URLs
  down              stop every service and free this checkout's slot
  status            show what is running and where
  logs <service>    show recent log lines (-n <lines>, default 100)`;

export interface Arguments {
  readonly command: string;
  readonly positional: ReadonlyArray<string>;
  readonly json: boolean;
  readonly lines: number;
}

export type ParsedArguments =
  | { readonly kind: "valid"; readonly arguments: Arguments }
  | { readonly kind: "invalid"; readonly message: string };

const defaultLogLines = 100;

export function parseArguments(argv: ReadonlyArray<string>): ParsedArguments {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  let json = false;
  let lines = defaultLogLines;

  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];

    if (argument === "--json") {
      json = true;
    } else if (argument === "-n") {
      index += 1;
      lines = Number(rest[index]);

      if (!Number.isInteger(lines) || lines <= 0) {
        return {
          kind: "invalid",
          message: "-n takes a positive whole number.",
        };
      }
    } else if (argument?.startsWith("-") === true) {
      return { kind: "invalid", message: `Unknown option ${argument}.` };
    } else if (argument !== undefined) {
      positional.push(argument);
    }
  }

  return { kind: "valid", arguments: { command, positional, json, lines } };
}

function fail(message: string): void {
  console.error(message);
  process.exitCode = 1;
}

function setup(workspace: Workspace): void {
  const example = join(workspace.root, ".env.example");
  const env = join(workspace.root, ".env");

  if (existsSync(env) || !existsSync(example)) return;

  copyFileSync(example, env);
  console.log("Created .env from .env.example.");
}

function reportDoctor(options: {
  readonly checks: ReadonlyArray<Check>;
  readonly json: boolean;
}): void {
  const ok = options.checks.every((check) => check.status === "pass");

  if (!ok) process.exitCode = 1;

  if (options.json) {
    console.log(JSON.stringify({ ok, checks: options.checks }, null, 2));

    return;
  }

  for (const check of options.checks) {
    if (check.status === "pass") console.log(`ok    ${check.name}`);
    else
      console.log(`FAIL  ${check.name}: ${check.problem}\n      ${check.fix}`);
  }
}

function reportUp(options: {
  readonly result: UpResult;
  readonly json: boolean;
}): void {
  const { result } = options;

  if (result.kind !== "healthy") process.exitCode = 1;

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));

    return;
  }

  switch (result.kind) {
    case "healthy":
      for (const service of result.services) {
        console.log(
          `${service.name}  ${service.url}  (pid ${String(service.pid)}, log ${service.log})`,
        );
      }

      return;
    case "unknown-service":
      console.error(`Unknown service: ${result.names.join(", ")}.`);

      return;
    case "no-free-slot":
      console.error(
        `All ${String(slotCount)} slots are taken by:\n  ${result.holders.join("\n  ")}\nRun \`bun run down\` in one of them.`,
      );

      return;
    case "unhealthy":
      console.error(
        `${result.service} did not become healthy. Last log lines:\n${result.logTail.join("\n")}`,
      );

      return;
  }
}

async function run(options: {
  readonly workspace: Workspace;
  readonly arguments: Arguments;
}): Promise<void> {
  const { workspace } = options;
  const { command, positional, json, lines } = options.arguments;

  switch (command) {
    case "setup":
      setup(workspace);

      return;
    case "doctor": {
      const { doctor } = await import("./doctor.ts");

      reportDoctor({ checks: doctor(workspace), json });

      return;
    }

    case "up": {
      const { up } = await import("./stack.ts");

      reportUp({ result: await up({ workspace, names: positional }), json });

      return;
    }

    case "down": {
      const { down } = await import("./stack.ts");
      const result = await down(workspace);

      if (json) console.log(JSON.stringify(result, null, 2));
      else
        console.log(
          result.stopped.length === 0
            ? "Nothing was running."
            : `Stopped ${result.stopped.join(", ")}.`,
        );

      return;
    }

    case "status": {
      const { status } = await import("./stack.ts");
      const report = await status(workspace);

      if (json) console.log(JSON.stringify(report, null, 2));
      else if (report.slot === null) console.log("Nothing is running.");
      else {
        for (const service of report.services) {
          console.log(
            `${service.name}  ${service.health}  ${service.url}  (pid ${String(service.pid)})`,
          );
        }
      }

      return;
    }

    case "logs": {
      const [name] = positional;

      if (name === undefined) {
        fail("logs takes a service name.");

        return;
      }

      const { logs } = await import("./stack.ts");
      const result = logs({ workspace, name, lines });

      if (result.kind === "unknown-service") fail(`Unknown service: ${name}.`);
      else if (result.kind === "no-log")
        fail(`${name} has no log yet. Run \`bun run up ${name}\`.`);
      else if (json) console.log(JSON.stringify(result, null, 2));
      else console.log(result.lines.join("\n"));

      return;
    }

    case "help":
      console.log(usage);

      return;
    default:
      fail(`Unknown command ${command}.\n\n${usage}`);
  }
}

async function main(argv: ReadonlyArray<string>): Promise<void> {
  const parsed = parseArguments(argv);

  if (parsed.kind === "invalid") {
    fail(`${parsed.message}\n\n${usage}`);

    return;
  }

  try {
    await run({ workspace: defaultWorkspace, arguments: parsed.arguments });
  } catch (error) {
    // Commands import their modules when called, so `doctor` can still
    // answer when the packages those modules import are not installed.
    const missingPackage =
      error instanceof Error &&
      "code" in error &&
      error.code === "ERR_MODULE_NOT_FOUND";

    if (!missingPackage) throw error;

    reportDoctor({
      checks: [
        {
          name: "dependencies",
          status: "fail",
          problem: `Dependencies are not installed. ${error.message}`,
          fix: "Run `bun run setup`.",
        },
      ],
      json: parsed.arguments.json,
    });
  }
}

if (import.meta.main) await main(Bun.argv.slice(2));
