import { z } from "zod";

import {
  cancelOrder,
  failure,
  OrderId,
  placeOrder,
  shipOrder,
  success,
  type Order,
  type Result,
} from "@repo/core";

import type { OrderStore } from "./orders/store.ts";
import {
  CancelOrderRequest,
  PlaceOrderRequest,
  toOrderJson,
  type ErrorJson,
} from "@repo/contracts";

/** What the server needs from the outside world. Tests pass their own. */
export interface Dependencies {
  readonly orders: OrderStore;
  readonly now: () => Date;
  readonly newOrderId: () => OrderId;
}

function errorResponse(options: {
  readonly status: number;
  readonly kind: ErrorJson["error"]["kind"];
  readonly message: string;
}): Response {
  const body: ErrorJson = {
    error: { kind: options.kind, message: options.message },
  };

  return Response.json(body, { status: options.status });
}

function orderResponse(options: {
  readonly order: Order;
  readonly status?: number;
}): Response {
  return Response.json(toOrderJson(options.order), {
    status: options.status ?? 200,
  });
}

const notFound = (): Response =>
  errorResponse({ status: 404, kind: "not-found", message: "No such order." });

const invalidRequest = (message: string): Response =>
  errorResponse({ status: 400, kind: "invalid-request", message });

const malformed = Symbol("malformed");

/** Parses a JSON request body. Malformed JSON and invalid fields are both a 400. */
async function parseBody<Body>(options: {
  readonly request: Request;
  readonly schema: z.ZodType<Body>;
}): Promise<Result<Body, Response>> {
  const json = await options.request.json().catch(() => malformed);

  if (json === malformed) {
    return failure(invalidRequest("The body is not valid JSON."));
  }

  const parsed = options.schema.safeParse(json);

  if (!parsed.success) {
    return failure(invalidRequest(z.prettifyError(parsed.error)));
  }

  return success(parsed.data);
}

/** Finds the order named in the path. An id that is not a UUID cannot name one. */
async function findOrder(options: {
  readonly dependencies: Dependencies;
  readonly id: string;
}): Promise<Order | null> {
  const id = OrderId.safeParse(options.id);

  if (!id.success) return null;

  return options.dependencies.orders.find(id.data);
}

export function createServer(options: {
  readonly port: number;
  readonly dependencies: Dependencies;
}): Bun.Server<undefined> {
  const { dependencies } = options;

  return Bun.serve({
    port: options.port,
    routes: {
      // `bun run up` waits for this to answer before it reports the URL.
      "/health": new Response("ok"),

      "/orders": {
        GET: async () => {
          const orders = await dependencies.orders.list();

          return Response.json(orders.map(toOrderJson));
        },
        POST: async (request) => {
          const body = await parseBody({ request, schema: PlaceOrderRequest });

          if (!body.ok) return body.failure;

          const order = placeOrder({
            id: dependencies.newOrderId(),
            item: body.value.item,
            quantity: body.value.quantity,
            now: dependencies.now(),
          });

          await dependencies.orders.save(order);

          return orderResponse({ order, status: 201 });
        },
      },

      "/orders/:id": {
        GET: async (request) => {
          const order = await findOrder({
            dependencies,
            id: request.params.id,
          });

          return order === null ? notFound() : orderResponse({ order });
        },
      },

      "/orders/:id/ship": {
        POST: async (request) => {
          const order = await findOrder({
            dependencies,
            id: request.params.id,
          });

          if (order === null) return notFound();

          const shipped = shipOrder({ order, now: dependencies.now() });

          if (!shipped.ok) {
            return errorResponse({
              status: 409,
              kind: shipped.failure.kind,
              message: `The order cannot ship: ${shipped.failure.kind}.`,
            });
          }

          await dependencies.orders.save(shipped.value);

          return orderResponse({ order: shipped.value });
        },
      },

      "/orders/:id/cancel": {
        POST: async (request) => {
          const body = await parseBody({ request, schema: CancelOrderRequest });

          if (!body.ok) return body.failure;

          const order = await findOrder({
            dependencies,
            id: request.params.id,
          });

          if (order === null) return notFound();

          const cancelled = cancelOrder({
            order,
            reason: body.value.reason,
            now: dependencies.now(),
          });

          if (!cancelled.ok) {
            return errorResponse({
              status: 409,
              kind: cancelled.failure.kind,
              message: `The order cannot be cancelled: ${cancelled.failure.kind}.`,
            });
          }

          await dependencies.orders.save(cancelled.value);

          return orderResponse({ order: cancelled.value });
        },
      },
    },
    fetch: () =>
      errorResponse({ status: 404, kind: "not-found", message: "No route." }),
    error: (error) => {
      console.error(error);

      return errorResponse({
        status: 500,
        kind: "internal-error",
        message: "Something went wrong.",
      });
    },
  });
}
