import { createFileRoute } from "@tanstack/react-router";

// `bun run up` waits for this to answer before it reports the URL.
export const Route = createFileRoute("/health")({
  server: { handlers: { GET: () => new Response("ok") } },
});
