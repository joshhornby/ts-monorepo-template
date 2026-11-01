import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { Connection } from "./connect.ts";
import { migrationsFolder } from "./database.ts";
import * as schema from "./schema.ts";

/**
 * A migrated Postgres database in this process (PGlite: Postgres compiled to
 * WebAssembly), so tests need no server. It starts in about two seconds, so
 * open one per test file and give each test its own rows.
 */
export async function createTestDatabase(): Promise<Connection> {
  const client = await PGlite.create();
  const database = drizzle({ client, schema, casing: "snake_case" });

  await migrate(database, { migrationsFolder });

  const close = async (): Promise<void> => {
    await client.close();
  };

  return { database, close, [Symbol.asyncDispose]: close };
}
