import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

const answerHealth = (middlewares: Connect.Server): void => {
  middlewares.use((request, response, next) => {
    if (request.url !== "/health") {
      next();

      return;
    }

    response.end("ok");
  });
};

// `bun run up` waits for GET /health to answer 200 before it reports the URL.
const health: Plugin = {
  name: "health",
  configureServer: (server) => {
    answerHealth(server.middlewares);
  },
  configurePreviewServer: (server) => {
    answerHealth(server.middlewares);
  },
};

const port = Number(process.env["PORT"] ?? 5173);

export default defineConfig({
  plugins: [react(), tailwindcss(), health],
  server: { port, strictPort: true },
  preview: { port, strictPort: true },
});
