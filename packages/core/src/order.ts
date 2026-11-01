import { z } from "zod";

import { failure, success, type Result } from "./result.ts";

export const OrderId = z.uuid().brand<"OrderId">();

export type OrderId = z.infer<typeof OrderId>;

export const orderStatuses = ["placed", "shipped", "cancelled"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

interface OrderDetails {
  readonly id: OrderId;
  readonly item: string;
  readonly quantity: number;
  readonly placedAt: Date;
}

/** An order in one of its lifecycle states. Each state carries only the data it has. */
export type Order =
  | (OrderDetails & { readonly status: "placed" })
  | (OrderDetails & { readonly status: "shipped"; readonly shippedAt: Date })
  | (OrderDetails & {
      readonly status: "cancelled";
      readonly cancelledAt: Date;
      readonly reason: string;
    });

export function placeOrder(options: {
  readonly id: OrderId;
  readonly item: string;
  readonly quantity: number;
  readonly now: Date;
}): Order {
  return {
    id: options.id,
    item: options.item,
    quantity: options.quantity,
    placedAt: options.now,
    status: "placed",
  };
}

export type ShipOrderFailure =
  { readonly kind: "already-shipped" } | { readonly kind: "order-cancelled" };

/** Ships a placed order. A cancelled order cannot ship. */
export function shipOrder(options: {
  readonly order: Order;
  readonly now: Date;
}): Result<Order, ShipOrderFailure> {
  const { order } = options;

  switch (order.status) {
    case "placed":
      return success({ ...order, status: "shipped", shippedAt: options.now });
    case "shipped":
      return failure({ kind: "already-shipped" });
    case "cancelled":
      return failure({ kind: "order-cancelled" });
  }
}

export type CancelOrderFailure =
  { readonly kind: "already-shipped" } | { readonly kind: "already-cancelled" };

/** Cancels an order that has not shipped. */
export function cancelOrder(options: {
  readonly order: Order;
  readonly reason: string;
  readonly now: Date;
}): Result<Order, CancelOrderFailure> {
  const { order } = options;

  switch (order.status) {
    case "placed":
      return success({
        ...order,
        status: "cancelled",
        cancelledAt: options.now,
        reason: options.reason,
      });
    case "shipped":
      return failure({ kind: "already-shipped" });
    case "cancelled":
      return failure({ kind: "already-cancelled" });
  }
}
