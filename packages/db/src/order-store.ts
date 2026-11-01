import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { OrderId, type Order, type OrderStore } from "@repo/core";

import type { Database } from "./database.ts";
import { orders } from "./schema.ts";

const storedDetails = {
  id: OrderId,
  item: z.string(),
  quantity: z.int(),
  placedAt: z.date(),
};

/** A row as stored. The schema checks the columns match the status, and builds the `Order`. */
const StoredOrder = z
  .discriminatedUnion("status", [
    z.object({ ...storedDetails, status: z.literal("placed") }),
    z.object({
      ...storedDetails,
      status: z.literal("shipped"),
      shippedAt: z.date(),
    }),
    z.object({
      ...storedDetails,
      status: z.literal("cancelled"),
      cancelledAt: z.date(),
      cancellationReason: z.string(),
    }),
  ])
  .transform((row): Order => {
    switch (row.status) {
      case "placed":
      case "shipped":
        return row;
      case "cancelled": {
        const { cancellationReason, ...rest } = row;

        return { ...rest, reason: cancellationReason };
      }
    }
  });

type OrderRow = typeof orders.$inferInsert;

function toRow(order: Order): OrderRow {
  const details = {
    id: order.id,
    item: order.item,
    quantity: order.quantity,
    status: order.status,
    placedAt: order.placedAt,
  };

  switch (order.status) {
    case "placed":
      return {
        ...details,
        shippedAt: null,
        cancelledAt: null,
        cancellationReason: null,
      };
    case "shipped":
      return {
        ...details,
        shippedAt: order.shippedAt,
        cancelledAt: null,
        cancellationReason: null,
      };
    case "cancelled":
      return {
        ...details,
        shippedAt: null,
        cancelledAt: order.cancelledAt,
        cancellationReason: order.reason,
      };
  }
}

/** Keeps orders in Postgres. */
export function createOrderStore(database: Database): OrderStore {
  return {
    save: async (order) => {
      const row = toRow(order);

      await database
        .insert(orders)
        .values(row)
        .onConflictDoUpdate({ target: orders.id, set: row });
    },
    find: async (id) => {
      const [row] = await database
        .select()
        .from(orders)
        .where(eq(orders.id, id));

      return row === undefined ? null : StoredOrder.parse(row);
    },
    list: async () => {
      const rows = await database
        .select()
        .from(orders)
        .orderBy(asc(orders.placedAt), asc(orders.id));

      return rows.map((row) => StoredOrder.parse(row));
    },
  };
}
