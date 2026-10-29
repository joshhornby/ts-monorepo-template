import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { claimSlot, releaseSlot } from "./slots.ts";
import { servicePort, type Workspace } from "./workspace.ts";

/** Checkouts that share one slots directory, like copies on one machine. */
function createMachine() {
  const directory = mkdtempSync(join(tmpdir(), "dev-slots-test-"));
  const slotsDirectory = join(directory, "slots");

  return {
    checkout: (name: string): Workspace => {
      const root = join(directory, name);

      mkdirSync(root, { recursive: true });

      return { root, slotsDirectory, basePort: 3000, services: [] };
    },
  };
}

test("gives each checkout its own slot and ports ten apart", () => {
  const machine = createMachine();
  const first = machine.checkout("first");
  const second = machine.checkout("second");
  const service = { name: "api", directory: ".", command: [], portOffset: 0 };

  expect(claimSlot(first)).toEqual({ kind: "claimed", slot: 0 });
  expect(claimSlot(second)).toEqual({ kind: "claimed", slot: 1 });
  expect(servicePort({ workspace: second, slot: 1, service })).toBe(3010);
});

test("returns the same slot when a checkout claims again", () => {
  const machine = createMachine();
  const checkout = machine.checkout("first");

  claimSlot(checkout);

  expect(claimSlot(checkout)).toEqual({ kind: "claimed", slot: 0 });
});

test("names the holders when every slot is taken", () => {
  const machine = createMachine();

  for (const name of ["a", "b", "c"]) claimSlot(machine.checkout(name));

  const holders = ["a", "b", "c"].map((name) => machine.checkout(name).root);

  expect(claimSlot(machine.checkout("d"))).toEqual({ kind: "full", holders });
});

test("frees a slot on release, so the next checkout can take it", () => {
  const machine = createMachine();
  const first = machine.checkout("first");

  claimSlot(first);
  releaseSlot({ workspace: first, slot: 0 });

  expect(claimSlot(machine.checkout("second"))).toEqual({
    kind: "claimed",
    slot: 0,
  });
});

test("reclaims a slot whose checkout was deleted", () => {
  const machine = createMachine();
  const deleted = machine.checkout("deleted");

  claimSlot(deleted);
  rmSync(deleted.root, { recursive: true, force: true });

  expect(claimSlot(machine.checkout("next"))).toEqual({
    kind: "claimed",
    slot: 0,
  });
});
