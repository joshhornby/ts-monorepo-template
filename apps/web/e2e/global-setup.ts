import type { FullConfig } from "@playwright/test";

export default function globalSetup(config: FullConfig): void {
  const baseURL = config.projects[0]?.use.baseURL ?? "";

  if (baseURL === "") {
    throw new Error("The web service is not running. Run `bun run up` first.");
  }
}
