import type { Order, OrderId } from "@repo/core";

/** Where orders are kept. The API takes one, so tests and storage can vary. */
export interface OrderStore {
  readonly save: (order: Order) => Promise<void>;
  readonly find: (id: OrderId) => Promise<Order | null>;
  readonly list: () => Promise<ReadonlyArray<Order>>;
}

/** Keeps orders in memory. They are lost when the process stops. */
export function createInMemoryOrderStore(): OrderStore {
  const orders = new Map<OrderId, Order>();

  // The map answers at once. Each method still yields once, like a store
  // that does I/O, so callers cannot come to rely on synchronous answers.
  return {
    save: async (order) => {
      await Promise.resolve();
      orders.set(order.id, order);
    },
    find: async (id) => {
      await Promise.resolve();

      return orders.get(id) ?? null;
    },
    list: async () => {
      await Promise.resolve();

      return [...orders.values()].toSorted(
        (left, right) => left.placedAt.getTime() - right.placedAt.getTime(),
      );
    },
  };
}
