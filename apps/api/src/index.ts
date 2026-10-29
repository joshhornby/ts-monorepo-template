import { greet } from "@repo/core";

const server = Bun.serve({
  port: Number(process.env["PORT"] ?? 3000),
  fetch(req) {
    const url = new URL(req.url);

    // `bun run up` waits for this to answer before it reports the URL.
    if (url.pathname === "/health") return new Response("ok");

    const name = url.searchParams.get("name") ?? "world";

    return new Response(greet(name));
  },
});

console.log(`api listening on ${server.url.href}`);
