import { greet } from "@repo/core";

const server = Bun.serve({
  port: Number(process.env["PORT"] ?? 3000),
  fetch(req) {
    const name = new URL(req.url).searchParams.get("name") ?? "world";

    return new Response(greet(name));
  },
});

console.log(`api listening on ${server.url.href}`);
