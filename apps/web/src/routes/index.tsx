import {
  createFileRoute,
  useHydrated,
  useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type SubmitEvent } from "react";
import { z } from "zod";

import type { OrderJson } from "@repo/contracts";
import type { Result } from "@repo/core";

import type { ApiError } from "../orders/api-client.ts";
import {
  cancelOrder,
  listOrders,
  placeOrder,
  shipOrder,
} from "../orders/functions.ts";

export const Route = createFileRoute("/")({
  loader: async () => listOrders(),
  component: OrdersPage,
});

/** Runs a command, then reloads the orders, or shows why it was refused. */
function useCommand() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const run = async (
    command: Promise<Result<OrderJson, ApiError>>,
  ): Promise<boolean> => {
    const result = await command;

    if (!result.ok) {
      setError(result.failure.message);

      return false;
    }

    setError(null);
    await router.invalidate();

    return true;
  };

  return { error, run };
}

function OrdersPage() {
  const orders = Route.useLoaderData();
  const { error, run } = useCommand();

  return (
    <>
      <h1>Orders</h1>
      <PlaceOrderForm run={run} />
      {error === null ? null : <p role="alert">{error}</p>}
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <OrdersTable orders={orders} run={run} />
      )}
    </>
  );
}

type Run = ReturnType<typeof useCommand>["run"];

const OrderForm = z.object({
  item: z.string(),
  quantity: z.coerce.number(),
});

function PlaceOrderForm(props: { readonly run: Run }) {
  const place = useServerFn(placeOrder);
  // Until React hydrates, a submit would reload the page instead.
  const hydrated = useHydrated();

  const submit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const form = event.currentTarget;
    // The server function checks the limits. This only reads the fields.
    const data = OrderForm.parse(Object.fromEntries(new FormData(form)));

    if (await props.run(place({ data }))) form.reset();
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <label>
        Item
        <input name="item" required />
      </label>
      <label>
        Quantity
        <input
          name="quantity"
          type="number"
          min={1}
          max={1000}
          required
          defaultValue={1}
        />
      </label>
      <button type="submit" disabled={!hydrated}>
        Place order
      </button>
    </form>
  );
}

function OrdersTable(props: {
  readonly orders: ReadonlyArray<OrderJson>;
  readonly run: Run;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">Quantity</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {props.orders.map((order) => (
          <OrderRow key={order.id} order={order} run={props.run} />
        ))}
      </tbody>
    </table>
  );
}

function OrderRow(props: { readonly order: OrderJson; readonly run: Run }) {
  const { order, run } = props;
  const ship = useServerFn(shipOrder);
  const cancel = useServerFn(cancelOrder);

  return (
    <tr>
      <td>{order.item}</td>
      <td>{order.quantity}</td>
      <td>{order.status}</td>
      <td>
        {order.status === "placed" ? (
          <>
            <button
              type="button"
              onClick={() => void run(ship({ data: { id: order.id } }))}
            >
              Ship
            </button>{" "}
            <button
              type="button"
              onClick={() =>
                void run(
                  cancel({
                    data: { id: order.id, reason: "Cancelled from the web" },
                  }),
                )
              }
            >
              Cancel
            </button>
          </>
        ) : null}
      </td>
    </tr>
  );
}
