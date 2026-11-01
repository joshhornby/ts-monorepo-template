import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { CancelOrderRequest, PlaceOrderRequest } from "@repo/contracts";

import { fetchOrders, sendOrderCommand } from "./api-client.ts";

export const listOrders = createServerFn().handler(fetchOrders);

export const placeOrder = createServerFn({ method: "POST" })
  .validator(PlaceOrderRequest)
  .handler(async ({ data }) =>
    sendOrderCommand({ path: "/orders", body: data }),
  );

export const shipOrder = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) =>
    sendOrderCommand({ path: `/orders/${data.id}/ship`, body: {} }),
  );

export const cancelOrder = createServerFn({ method: "POST" })
  .validator(CancelOrderRequest.extend({ id: z.uuid() }))
  .handler(async ({ data }) =>
    sendOrderCommand({
      path: `/orders/${data.id}/cancel`,
      body: { reason: data.reason },
    }),
  );
