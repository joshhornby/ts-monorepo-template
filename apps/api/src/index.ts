import { OrderId } from "@repo/core";
import { connect, createOrderStore } from "@repo/db";

import { parseEnv } from "./env.ts";
import { createServer } from "./server.ts";

const env = parseEnv(process.env);

if (!env.ok) {
  console.error(env.failure);
  process.exit(1);
}

// Applies pending migrations before the server answers its health check.
const connection = await connect(env.value.DATABASE_URL);

const server = createServer({
  port: env.value.PORT,
  dependencies: {
    orders: createOrderStore(connection.database),
    now: () => new Date(),
    newOrderId: () => OrderId.parse(crypto.randomUUID()),
  },
});

console.log(`api listening on ${server.url.href}`);

process.on("SIGTERM", () => {
  void server.stop().then(connection.close);
});
