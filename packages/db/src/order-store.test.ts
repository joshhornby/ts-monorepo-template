import { afterAll, expect, test } from "bun:test";

import {
  cancelOrder,
  OrderId,
  placeOrder,
  shipOrder,
  type Order,
  type Result,
} from "@repo/core";

import { createOrderStore } from "./order-store.ts";
import { orders } from "./schema.ts";
import { createTestDatabase } from "./testing.ts";

// One database for the file. Each test makes its own orders with fresh ids.
const connection = await createTestDatabase();

afterAll(async () => {
  await connection.close();
});

const store = createOrderStore(connection.database);

function createOrder(placedAt = new Date("2026-02-01T10:00:00Z")): Order {
  return placeOrder({
    id: OrderId.parse(crypto.randomUUID()),
    item: "Notebook",
    quantity: 2,
    now: placedAt,
  });
}

function unwrap<Failure>(result: Result<Order, Failure>): Order {
  if (!result.ok) throw new Error("expected the change to succeed");

  return result.value;
}

test("a placed order reads back as it was saved", async () => {
  const order = createOrder();

  await store.save(order);

  expect(await store.find(order.id)).toEqual(order);
});

test("saving a shipped order replaces the placed one", async () => {
  const order = createOrder();

  const shipped = unwrap(
    shipOrder({ order, now: new Date("2026-02-02T10:00:00Z") }),
  );

  await store.save(order);
  await store.save(shipped);

  expect(await store.find(order.id)).toEqual(shipped);
});

test("a cancelled order keeps its reason", async () => {
  const order = createOrder();

  const cancelled = unwrap(
    cancelOrder({
      order,
      reason: "Ordered by mistake",
      now: new Date("2026-02-02T10:00:00Z"),
    }),
  );

  await store.save(cancelled);

  expect(await store.find(order.id)).toEqual(cancelled);
});

test("an order that was never saved is not found", async () => {
  expect(await store.find(OrderId.parse(crypto.randomUUID()))).toBeNull();
});

test("lists orders oldest first", async () => {
  const newer = createOrder(new Date("2030-01-02T00:00:00Z"));
  const older = createOrder(new Date("2030-01-01T00:00:00Z"));

  await store.save(newer);
  await store.save(older);

  const listed = (await store.list()).filter((order) =>
    [newer.id, older.id].includes(order.id),
  );

  expect(listed.map((order) => order.id)).toEqual([older.id, newer.id]);
});

test("the database refuses a shipped order with no ship time", async () => {
  const outcome = connection.database
    .insert(orders)
    .values({
      id: crypto.randomUUID(),
      item: "Notebook",
      quantity: 1,
      status: "shipped",
      placedAt: new Date(),
    })
    .then(
      () => "saved",
      () => "refused",
    );

  expect(await outcome).toBe("refused");
});
