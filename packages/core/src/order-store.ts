import type { Order, OrderId } from "./order.ts";

/** Where orders are kept. Apps take one, so storage can vary. `@repo/db` provides one. */
export interface OrderStore {
  readonly save: (order: Order) => Promise<void>;
  readonly find: (id: OrderId) => Promise<Order | null>;
  /** Every order, oldest first. */
  readonly list: () => Promise<ReadonlyArray<Order>>;
}
