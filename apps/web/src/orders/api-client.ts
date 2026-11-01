import { z } from "zod";

import { ErrorJson, OrderJson } from "@repo/contracts";
import { failure, success, type Result } from "@repo/core";

// Server-only: server functions import this module, so it never reaches the browser.

/** `bun run up` sets API_URL to the API in the same slot. */
const Env = z.object({ API_URL: z.url().default("http://localhost:3000") });

export type ApiError = ErrorJson["error"];

async function send(options: {
  readonly path: string;
  readonly body?: Readonly<Record<string, string | number>>;
}): Promise<Response> {
  const { API_URL } = Env.parse(process.env);
  const url = new URL(options.path, API_URL);

  if (options.body === undefined) return fetch(url);

  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options.body),
  });
}

export async function fetchOrders(): Promise<ReadonlyArray<OrderJson>> {
  const response = await send({ path: "/orders" });

  if (!response.ok) {
    throw new Error(`The API answered ${String(response.status)}.`);
  }

  return z.array(OrderJson).parse(await response.json());
}

/** Sends a command that answers with the changed order, or an expected error. */
export async function sendOrderCommand(options: {
  readonly path: string;
  readonly body: Readonly<Record<string, string | number>>;
}): Promise<Result<OrderJson, ApiError>> {
  const response = await send(options);
  const json = await response.json();

  if (response.ok) return success(OrderJson.parse(json));

  return failure(ErrorJson.parse(json).error);
}
