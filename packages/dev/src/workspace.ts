import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** A long-running process that `up` starts and `down` stops. */
export interface Service {
  readonly name: string;
  /** Working directory, relative to the workspace root. */
  readonly directory: string;
  readonly command: ReadonlyArray<string>;
  /** Added to the slot's base port. Keep it below `portsPerSlot`. */
  readonly portOffset: number;
  /**
   * Variables to set besides PORT, such as the URL of another service.
   * `urlOf` answers for this checkout's slot.
   */
  readonly environment?: (context: {
    readonly urlOf: (name: string) => string;
    /** The port given to an infrastructure variable, such as POSTGRES_PORT. */
    readonly portOf: (variable: string) => number;
  }) => Readonly<Record<string, string>>;
}

/** Containers that `up` starts with Docker Compose before any service, and `down` stops. */
export interface Infrastructure {
  /** Relative to the workspace root. */
  readonly composeFile: string;
  /** Variables the compose file reads, each set to a port in the slot. */
  readonly ports: ReadonlyArray<{
    readonly variable: string;
    /** Added to the slot's base port, like a service's. */
    readonly portOffset: number;
  }>;
}

/** Where the commands run and what they start. Tests pass their own. */
export interface Workspace {
  readonly root: string;
  /** Shared by every checkout on the machine, so copies do not take the same slot. */
  readonly slotsDirectory: string;
  readonly basePort: number;
  readonly services: ReadonlyArray<Service>;
  readonly infrastructure: Infrastructure | null;
}

export const slotCount = 3;

const portsPerSlot = 10;

/** Every service answers 200 on this path once it is ready. */
export const healthPath = "/health";

export const defaultWorkspace: Workspace = {
  root: resolve(import.meta.dir, "../../.."),
  slotsDirectory: join(tmpdir(), "repo-dev-slots"),
  basePort: 3000,
  services: [
    {
      name: "api",
      directory: "apps/api",
      command: ["bun", "--watch", "src/index.ts"],
      portOffset: 0,
      environment: ({ portOf }) => ({
        DATABASE_URL: `postgres://postgres:postgres@localhost:${String(portOf("POSTGRES_PORT"))}/app`,
      }),
    },
    {
      name: "web",
      directory: "apps/web",
      command: ["bun", "--bun", "vite", "dev"],
      portOffset: 1,
      environment: ({ urlOf }) => ({ API_URL: urlOf("api") }),
    },
  ],
  infrastructure: {
    composeFile: "compose.yaml",
    ports: [{ variable: "POSTGRES_PORT", portOffset: 9 }],
  },
};

export function stateDirectory(workspace: Workspace): string {
  return join(workspace.root, ".dev");
}

export function servicePort(options: {
  readonly workspace: Workspace;
  readonly slot: number;
  readonly service: Pick<Service, "portOffset">;
}): number {
  return (
    options.workspace.basePort +
    options.slot * portsPerSlot +
    options.service.portOffset
  );
}

/** Each infrastructure variable, set to its port in the slot. */
export function infrastructurePorts(options: {
  readonly workspace: Workspace;
  readonly slot: number;
}): Readonly<Record<string, string>> {
  const ports = options.workspace.infrastructure?.ports ?? [];

  return Object.fromEntries(
    ports.map((port) => [
      port.variable,
      String(servicePort({ ...options, service: port })),
    ]),
  );
}
