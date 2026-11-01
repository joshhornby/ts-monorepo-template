import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { z } from "zod";

// `bun run up` sets PORT. `bun run dev` uses the default.
const { PORT } = z
  .object({ PORT: z.coerce.number().int().default(5173) })
  .parse(process.env);

export default defineConfig({
  server: { port: PORT, strictPort: true },
  // tanstackStart must come before the React plugin.
  plugins: [tanstackStart(), viteReact()],
});
