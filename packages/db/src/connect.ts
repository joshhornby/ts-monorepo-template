import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";

import { migrationsFolder, type Database } from "./database.ts";
import * as schema from "./schema.ts";

export interface Connection extends AsyncDisposable {
  readonly database: Database;
  readonly close: () => Promise<void>;
}

/** Connects to Postgres and applies any migrations not yet applied. */
export async function connect(url: string): Promise<Connection> {
  const client = new SQL(url);
  const database = drizzle({ client, schema, casing: "snake_case" });

  await migrate(database, { migrationsFolder });

  const close = async (): Promise<void> => {
    await client.close();
  };

  return { database, close, [Symbol.asyncDispose]: close };
}
