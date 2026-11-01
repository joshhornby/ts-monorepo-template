import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { orderStatuses } from "@repo/core";

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey(),
    item: text().notNull(),
    quantity: integer().notNull(),
    status: text({ enum: orderStatuses }).notNull(),
    placedAt: timestamp({ withTimezone: true }).notNull(),
    shippedAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    cancellationReason: text(),
  },
  (table) => [
    check("orders_quantity_positive", sql`${table.quantity} > 0`),
    // Each status has exactly the columns it needs, as `Order` does in @repo/core.
    check(
      "orders_status_columns",
      sql`(${table.status} = 'placed' and ${table.shippedAt} is null and ${table.cancelledAt} is null and ${table.cancellationReason} is null)
       or (${table.status} = 'shipped' and ${table.shippedAt} is not null and ${table.cancelledAt} is null and ${table.cancellationReason} is null)
       or (${table.status} = 'cancelled' and ${table.shippedAt} is null and ${table.cancelledAt} is not null and ${table.cancellationReason} is not null)`,
    ),
  ],
);
