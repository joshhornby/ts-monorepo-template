import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import type * as schema from "./schema.ts";

/** A Drizzle database over this schema, whichever driver opened it. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/** Where `drizzle-kit generate` writes migrations. */
export const migrationsFolder = new URL("../migrations", import.meta.url)
  .pathname;
