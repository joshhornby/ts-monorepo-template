import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import { slotCount, type Workspace } from "./workspace.ts";

export type SlotClaim =
  | { readonly kind: "claimed"; readonly slot: number }
  | { readonly kind: "full"; readonly holders: ReadonlyArray<string> };

function slotPath(options: {
  readonly workspace: Workspace;
  readonly slot: number;
}): string {
  return join(options.workspace.slotsDirectory, `slot-${String(options.slot)}`);
}

function ownerPath(slotDirectory: string): string {
  return join(slotDirectory, "owner");
}

/** The checkout that holds the slot, or null while its claim is being written. */
function readOwner(slotDirectory: string): string | null {
  const path = ownerPath(slotDirectory);

  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/** Creates the slot directory. `mkdir` is atomic, so only one checkout wins. */
function tryCreate(slotDirectory: string): boolean {
  try {
    mkdirSync(slotDirectory);

    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      return false;
    }

    throw error;
  }
}

/**
 * Claims the first free slot for this checkout. A slot this checkout already
 * holds is returned again. A slot whose checkout was deleted is reclaimed.
 */
export function claimSlot(workspace: Workspace): SlotClaim {
  mkdirSync(workspace.slotsDirectory, { recursive: true });

  const holders: string[] = [];

  for (let slot = 0; slot < slotCount; slot += 1) {
    const directory = slotPath({ workspace, slot });

    if (tryCreate(directory)) {
      writeFileSync(ownerPath(directory), workspace.root);

      return { kind: "claimed", slot };
    }

    const owner = readOwner(directory);

    if (owner === workspace.root) return { kind: "claimed", slot };

    if (owner !== null && !existsSync(owner)) {
      writeFileSync(ownerPath(directory), workspace.root);

      return { kind: "claimed", slot };
    }

    holders.push(owner ?? "another checkout, claiming now");
  }

  return { kind: "full", holders };
}

/** Frees the slot if this checkout holds it. */
export function releaseSlot(options: {
  readonly workspace: Workspace;
  readonly slot: number;
}): void {
  const directory = slotPath(options);

  if (readOwner(directory) !== options.workspace.root) return;

  rmSync(directory, { recursive: true, force: true });
}
