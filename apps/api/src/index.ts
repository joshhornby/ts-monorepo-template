import { OrderId } from "@repo/core";

import { parseEnv } from "./env.ts";
import { createInMemoryOrderStore } from "./orders/store.ts";
import { createServer } from "./server.ts";

const env = parseEnv(process.env);

if (!env.ok) {
  console.error(env.failure);
  process.exit(1);
}

const server = createServer({
  port: env.value.PORT,
  dependencies: {
    orders: createInMemoryOrderStore(),
    now: () => new Date(),
    newOrderId: () => OrderId.parse(crypto.randomUUID()),
  },
});

console.log(`api listening on ${server.url.href}`);
