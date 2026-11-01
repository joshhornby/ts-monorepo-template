import { z } from "zod";

import { failure, success, type Result } from "@repo/core";

/** Every variable the API reads. `bun run up` sets both for its slot. */
const Env = z.object({
  PORT: z.coerce.number().int().min(0).max(65_535).default(3000),
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "Set DATABASE_URL to a Postgres URL. `bun run up` sets it.",
  }),
});

export type Env = z.infer<typeof Env>;

/** Parses the environment once, at startup, so a bad value stops the process with a clear message. */
export function parseEnv(
  source: Readonly<Record<string, string | undefined>>,
): Result<Env, string> {
  const parsed = Env.safeParse(source);

  if (parsed.success) return success(parsed.data);

  return failure(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
}
