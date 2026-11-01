import { expect, test } from "bun:test";
import { z } from "zod";

import { OrderId } from "@repo/core";

import { createInMemoryOrderStore } from "./orders/store.ts";
import { ErrorJson, OrderJson } from "./orders/wire.ts";
import { createServer } from "./server.ts";

const now = new Date("2026-03-01T12:00:00Z");

interface RunningApi extends Disposable {
  readonly url: string;
}

/** A server on a free port, with its own store. `using` stops it. */
function startApi(): RunningApi {
  const server = createServer({
    port: 0,
    dependencies: {
      orders: createInMemoryOrderStore(),
      now: () => now,
      newOrderId: () => OrderId.parse(crypto.randomUUID()),
    },
  });

  return {
    url: server.url.origin,
    [Symbol.dispose]: () => {
      void server.stop(true);
    },
  };
}

async function request(options: {
  readonly api: RunningApi;
  readonly path: string;
  readonly body?: string;
}): Promise<Response> {
  if (options.body === undefined)
    return fetch(`${options.api.url}${options.path}`);

  return fetch(`${options.api.url}${options.path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: options.body,
  });
}

async function placeOrder(options: {
  readonly api: RunningApi;
  readonly item?: string;
}): Promise<OrderJson> {
  const response = await request({
    api: options.api,
    path: "/orders",
    body: JSON.stringify({ item: options.item ?? "Notebook", quantity: 2 }),
  });

  return OrderJson.parse(await response.json());
}

test("answers the health check", async () => {
  using api = startApi();

  const response = await request({ api, path: "/health" });

  expect(response.status).toBe(200);
  expect(await response.text()).toBe("ok");
});

test("places an order and lists it", async () => {
  using api = startApi();

  const response = await request({
    api,
    path: "/orders",
    body: JSON.stringify({ item: "Notebook", quantity: 2 }),
  });

  expect(response.status).toBe(201);

  const order = OrderJson.parse(await response.json());

  expect(order).toMatchObject({
    item: "Notebook",
    quantity: 2,
    status: "placed",
    placedAt: now.toISOString(),
    shippedAt: null,
  });

  const listed = z
    .array(OrderJson)
    .parse(await (await request({ api, path: "/orders" })).json());

  expect(listed).toEqual([order]);
});

test("refuses an order with no item or a quantity below one", async () => {
  using api = startApi();

  const response = await request({
    api,
    path: "/orders",
    body: JSON.stringify({ item: " ", quantity: 0 }),
  });

  expect(response.status).toBe(400);
  expect(ErrorJson.parse(await response.json()).error.kind).toBe(
    "invalid-request",
  );
});

test("refuses a body that is not JSON", async () => {
  using api = startApi();

  const response = await request({ api, path: "/orders", body: "{" });

  expect(response.status).toBe(400);
  expect(ErrorJson.parse(await response.json()).error.message).toBe(
    "The body is not valid JSON.",
  );
});

test("answers 404 for an order that does not exist, or an id that is not a UUID", async () => {
  using api = startApi();

  const missing = await request({
    api,
    path: `/orders/${crypto.randomUUID()}`,
  });

  const malformed = await request({ api, path: "/orders/order-1" });

  expect(missing.status).toBe(404);
  expect(malformed.status).toBe(404);
});

test("ships a placed order", async () => {
  using api = startApi();
  const order = await placeOrder({ api });

  const response = await request({
    api,
    path: `/orders/${order.id}/ship`,
    body: "{}",
  });

  expect(response.status).toBe(200);
  expect(OrderJson.parse(await response.json())).toMatchObject({
    status: "shipped",
    shippedAt: now.toISOString(),
  });
});

test("cancels a placed order with a reason", async () => {
  using api = startApi();
  const order = await placeOrder({ api });

  const response = await request({
    api,
    path: `/orders/${order.id}/cancel`,
    body: JSON.stringify({ reason: "Ordered by mistake" }),
  });

  expect(response.status).toBe(200);
  expect(OrderJson.parse(await response.json())).toMatchObject({
    status: "cancelled",
    cancellationReason: "Ordered by mistake",
  });
});

test("refuses to cancel an order that has shipped", async () => {
  using api = startApi();
  const order = await placeOrder({ api });

  await request({ api, path: `/orders/${order.id}/ship`, body: "{}" });

  const response = await request({
    api,
    path: `/orders/${order.id}/cancel`,
    body: JSON.stringify({ reason: "Too late" }),
  });

  expect(response.status).toBe(409);
  expect(ErrorJson.parse(await response.json()).error.kind).toBe(
    "already-shipped",
  );

  const current = OrderJson.parse(
    await (await request({ api, path: `/orders/${order.id}` })).json(),
  );

  expect(current.status).toBe("shipped");
});
