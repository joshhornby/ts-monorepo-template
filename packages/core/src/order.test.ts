import { expect, test } from "bun:test";

import {
  cancelOrder,
  OrderId,
  placeOrder,
  shipOrder,
  type Order,
} from "./index.ts";

const placedAt = new Date("2026-01-05T09:00:00Z");
const later = new Date("2026-01-06T09:00:00Z");

function createOrder(overrides: { readonly item?: string } = {}): Order {
  return placeOrder({
    id: OrderId.parse(crypto.randomUUID()),
    item: overrides.item ?? "Notebook",
    quantity: 2,
    now: placedAt,
  });
}

test("a new order is placed with the time it was placed", () => {
  const order = createOrder({ item: "Pen" });

  expect(order).toMatchObject({
    status: "placed",
    item: "Pen",
    quantity: 2,
    placedAt,
  });
});

test("a placed order ships and records when it shipped", () => {
  const result = shipOrder({ order: createOrder(), now: later });

  expect(result).toMatchObject({
    ok: true,
    value: { status: "shipped", shippedAt: later },
  });
});

test("a shipped order cannot ship again", () => {
  const shipped = shipOrder({ order: createOrder(), now: later });

  if (!shipped.ok) throw new Error("expected the order to ship");

  expect(shipOrder({ order: shipped.value, now: later })).toEqual({
    ok: false,
    failure: { kind: "already-shipped" },
  });
});

test("a placed order can be cancelled with a reason", () => {
  const result = cancelOrder({
    order: createOrder(),
    reason: "Ordered by mistake",
    now: later,
  });

  expect(result).toMatchObject({
    ok: true,
    value: {
      status: "cancelled",
      reason: "Ordered by mistake",
      cancelledAt: later,
    },
  });
});

test("a shipped order cannot be cancelled", () => {
  const shipped = shipOrder({ order: createOrder(), now: later });

  if (!shipped.ok) throw new Error("expected the order to ship");

  expect(
    cancelOrder({ order: shipped.value, reason: "Too late", now: later }),
  ).toEqual({ ok: false, failure: { kind: "already-shipped" } });
});

test("a cancelled order cannot ship or be cancelled again", () => {
  const cancelled = cancelOrder({
    order: createOrder(),
    reason: "Changed my mind",
    now: later,
  });

  if (!cancelled.ok) throw new Error("expected the order to cancel");

  expect(shipOrder({ order: cancelled.value, now: later })).toEqual({
    ok: false,
    failure: { kind: "order-cancelled" },
  });
  expect(
    cancelOrder({ order: cancelled.value, reason: "Again", now: later }),
  ).toEqual({ ok: false, failure: { kind: "already-cancelled" } });
});

test("an order id must be a UUID", () => {
  expect(OrderId.safeParse("order-1").success).toBe(false);
});
