import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { claimSlot, releaseSlot, type SlotClaim } from "./slots.ts";
import {
  healthPath,
  servicePort,
  stateDirectory,
  type Service,
  type Workspace,
} from "./workspace.ts";

const RunningService = z.object({
  name: z.string(),
  pid: z.number().int(),
  url: z.string(),
  log: z.string(),
});

type RunningService = z.infer<typeof RunningService>;

const StackState = z.object({
  slot: z.number().int(),
  services: z.array(RunningService),
});

type StackState = z.infer<typeof StackState>;

const startupTimeoutMs = 30_000;

const stopTimeoutMs = 5_000;

const pollIntervalMs = 250;

function statePath(workspace: Workspace): string {
  return join(stateDirectory(workspace), "state.json");
}

function readState(workspace: Workspace): StackState | null {
  const path = statePath(workspace);

  if (!existsSync(path)) return null;

  return StackState.parse(JSON.parse(readFileSync(path, "utf8")));
}

function writeState(options: {
  readonly workspace: Workspace;
  readonly state: StackState;
}): void {
  writeFileSync(
    statePath(options.workspace),
    `${JSON.stringify(options.state, null, 2)}\n`,
  );
}

/** Removes the state file and frees the slot. Log files stay for `logs`. */
function clearState(options: {
  readonly workspace: Workspace;
  readonly slot: number;
}): void {
  rmSync(statePath(options.workspace), { force: true });
  releaseSlot(options);
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}

async function isHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}${healthPath}`, {
      signal: AbortSignal.timeout(1_000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

function logPath(options: {
  readonly workspace: Workspace;
  readonly name: string;
}): string {
  return join(stateDirectory(options.workspace), `${options.name}.log`);
}

function startService(options: {
  readonly workspace: Workspace;
  readonly slot: number;
  readonly service: Service;
}): RunningService {
  const { workspace, service } = options;
  const port = servicePort(options);
  const log = logPath({ workspace, name: service.name });
  const logFile = openSync(log, "w");

  // Detached into its own process group, so it outlives this command and
  // `down` can stop the whole group, including any children it starts.
  const subprocess = Bun.spawn([...service.command], {
    cwd: join(workspace.root, service.directory),
    env: { ...process.env, PORT: String(port) },
    stdin: "ignore",
    stdout: logFile,
    stderr: logFile,
    detached: true,
  });

  subprocess.unref();
  closeSync(logFile);

  return {
    name: service.name,
    pid: subprocess.pid,
    url: `http://localhost:${String(port)}`,
    log,
  };
}

async function stopService(running: RunningService): Promise<void> {
  if (!isAlive(running.pid)) return;

  process.kill(-running.pid, "SIGTERM");

  const deadline = Date.now() + stopTimeoutMs;

  while (isAlive(running.pid) && Date.now() < deadline) {
    await Bun.sleep(pollIntervalMs);
  }

  if (isAlive(running.pid)) process.kill(-running.pid, "SIGKILL");
}

async function waitUntilHealthy(running: RunningService): Promise<boolean> {
  const deadline = Date.now() + startupTimeoutMs;

  while (Date.now() < deadline) {
    if (!isAlive(running.pid)) return false;

    if (await isHealthy(running.url)) return true;
    await Bun.sleep(pollIntervalMs);
  }

  return false;
}

function tailLog(options: {
  readonly path: string;
  readonly lines: number;
}): ReadonlyArray<string> {
  if (!existsSync(options.path)) return [];

  const all = readFileSync(options.path, "utf8").trimEnd().split("\n");

  return all.slice(-options.lines);
}

export type UpResult =
  | {
      readonly kind: "healthy";
      readonly slot: number;
      readonly services: ReadonlyArray<RunningService>;
    }
  | { readonly kind: "unknown-service"; readonly names: ReadonlyArray<string> }
  | { readonly kind: "no-free-slot"; readonly holders: ReadonlyArray<string> }
  | {
      readonly kind: "unhealthy";
      readonly service: string;
      readonly logTail: ReadonlyArray<string>;
    };

const failureLogLines = 50;

/**
 * Starts the named services, or every service when none is named, and waits
 * until each one answers its health check. Services already running are kept.
 */
export async function up(options: {
  readonly workspace: Workspace;
  readonly names: ReadonlyArray<string>;
}): Promise<UpResult> {
  const { workspace } = options;
  const known = new Set(workspace.services.map((service) => service.name));
  const unknown = options.names.filter((name) => !known.has(name));

  if (unknown.length > 0) return { kind: "unknown-service", names: unknown };

  const requested = workspace.services.filter(
    (service) =>
      options.names.length === 0 || options.names.includes(service.name),
  );

  mkdirSync(stateDirectory(workspace), { recursive: true });

  const previous = readState(workspace);

  const alive = (previous?.services ?? []).filter((running) =>
    isAlive(running.pid),
  );

  // With nothing left running, claim again: the slot may have been freed,
  // for example by a reboot clearing the temporary directory.
  const claim: SlotClaim =
    previous === null || alive.length === 0
      ? claimSlot(workspace)
      : { kind: "claimed", slot: previous.slot };

  if (claim.kind === "full") {
    return { kind: "no-free-slot", holders: claim.holders };
  }

  const { slot } = claim;

  const started = requested.flatMap((service) =>
    alive.some((running) => running.name === service.name)
      ? []
      : [startService({ workspace, slot, service })],
  );

  writeState({ workspace, state: { slot, services: [...alive, ...started] } });

  const health = await Promise.all(started.map(waitUntilHealthy));
  const failed = started.find((_, index) => health[index] !== true);

  if (failed !== undefined) {
    await Promise.all(started.map(stopService));

    if (alive.length === 0) clearState({ workspace, slot });
    else writeState({ workspace, state: { slot, services: alive } });

    return {
      kind: "unhealthy",
      service: failed.name,
      logTail: tailLog({ path: failed.log, lines: failureLogLines }),
    };
  }

  return {
    kind: "healthy",
    slot,
    services: [...alive, ...started].filter((running) =>
      requested.some((service) => service.name === running.name),
    ),
  };
}

/** Stops every service this checkout started and frees its slot. */
export async function down(
  workspace: Workspace,
): Promise<{ readonly stopped: ReadonlyArray<string> }> {
  const state = readState(workspace);

  if (state === null) return { stopped: [] };

  await Promise.all(state.services.map(stopService));
  clearState({ workspace, slot: state.slot });

  return { stopped: state.services.map((running) => running.name) };
}

type ServiceHealth = "healthy" | "unhealthy" | "stopped";

export interface StatusReport {
  readonly slot: number | null;
  readonly services: ReadonlyArray<
    RunningService & { readonly health: ServiceHealth }
  >;
}

async function healthOf(running: RunningService): Promise<ServiceHealth> {
  if (!isAlive(running.pid)) return "stopped";

  return (await isHealthy(running.url)) ? "healthy" : "unhealthy";
}

export async function status(workspace: Workspace): Promise<StatusReport> {
  const state = readState(workspace);

  if (state === null) return { slot: null, services: [] };

  const services = await Promise.all(
    state.services.map(async (running) => ({
      ...running,
      health: await healthOf(running),
    })),
  );

  return { slot: state.slot, services };
}

export type LogsResult =
  | { readonly kind: "lines"; readonly lines: ReadonlyArray<string> }
  | { readonly kind: "unknown-service" }
  | { readonly kind: "no-log" };

export function logs(options: {
  readonly workspace: Workspace;
  readonly name: string;
  readonly lines: number;
}): LogsResult {
  const { workspace, name } = options;

  if (!workspace.services.some((service) => service.name === name)) {
    return { kind: "unknown-service" };
  }

  const path = logPath({ workspace, name });

  if (!existsSync(path)) return { kind: "no-log" };

  return { kind: "lines", lines: tailLog({ path, lines: options.lines }) };
}
