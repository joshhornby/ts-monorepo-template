import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen.ts";

const createAppRouter = () =>
  createRouter({ routeTree, scrollRestoration: true });

type AppRouter = ReturnType<typeof createAppRouter>;

/** TanStack Start calls this once per request on the server, and once in the browser. */
export function getRouter(): AppRouter {
  return createAppRouter();
}

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
