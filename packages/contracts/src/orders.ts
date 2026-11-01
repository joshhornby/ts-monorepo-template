import { z } from "zod";

import { orderStatuses, type Order } from "@repo/core";

export const PlaceOrderRequest = z.object({
  item: z.string().trim().min(1).max(200),
  quantity: z.int().min(1).max(1000),
});

export const CancelOrderRequest = z.object({
  reason: z.string().trim().min(1).max(500),
});

/** An order as JSON. Times are ISO 8601 strings. A time that has not happened is null. */
export const OrderJson = z.object({
  id: z.uuid(),
  item: z.string(),
  quantity: z.int(),
  status: z.enum(orderStatuses),
  placedAt: z.iso.datetime(),
  shippedAt: z.iso.datetime().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  cancellationReason: z.string().nullable(),
});

export type OrderJson = z.infer<typeof OrderJson>;

export const errorKinds = [
  "invalid-request",
  "not-found",
  "already-shipped",
  "already-cancelled",
  "order-cancelled",
  "internal-error",
] as const;

export const ErrorJson = z.object({
  error: z.object({ kind: z.enum(errorKinds), message: z.string() }),
});

export type ErrorJson = z.infer<typeof ErrorJson>;

export function toOrderJson(order: Order): OrderJson {
  const details = {
    id: order.id,
    item: order.item,
    quantity: order.quantity,
    status: order.status,
    placedAt: order.placedAt.toISOString(),
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
        shippedAt: order.shippedAt.toISOString(),
        cancelledAt: null,
        cancellationReason: null,
      };
    case "cancelled":
      return {
        ...details,
        shippedAt: null,
        cancelledAt: order.cancelledAt.toISOString(),
        cancellationReason: order.reason,
      };
  }
}
