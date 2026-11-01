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
  }) => Readonly<Record<string, string>>;
}

/** Where the commands run and what they start. Tests pass their own. */
export interface Workspace {
  readonly root: string;
  /** Shared by every checkout on the machine, so copies do not take the same slot. */
  readonly slotsDirectory: string;
  readonly basePort: number;
  readonly services: ReadonlyArray<Service>;
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
    },
    {
      name: "web",
      directory: "apps/web",
      command: ["bun", "--bun", "vite", "dev"],
      portOffset: 1,
      environment: ({ urlOf }) => ({ API_URL: urlOf("api") }),
    },
  ],
};

export function stateDirectory(workspace: Workspace): string {
  return join(workspace.root, ".dev");
}

export function servicePort(options: {
  readonly workspace: Workspace;
  readonly slot: number;
  readonly service: Service;
}): number {
  return (
    options.workspace.basePort +
    options.slot * portsPerSlot +
    options.service.portOffset
  );
}
