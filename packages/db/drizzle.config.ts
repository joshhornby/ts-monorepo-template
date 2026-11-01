import { defineConfig } from "drizzle-kit";

// `bun run generate` writes a migration for each change to the schema.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  casing: "snake_case",
});
