import { Result, TaggedError } from "better-result";
import { z } from "zod";

export const Name = z.string().trim().min(1).max(50).brand<"Name">();

export type Name = z.infer<typeof Name>;

export class InvalidName extends TaggedError("InvalidName")<{
  readonly input: string;
  readonly message: string;
}> {}

export class ReservedName extends TaggedError("ReservedName")<{
  readonly name: Name;
  readonly message: string;
}> {}

const reservedNames: ReadonlySet<string> = new Set(["admin", "root"]);

const parseName = (input: string): Result<Name, InvalidName> => {
  const parsed = Name.safeParse(input);

  return parsed.success
    ? Result.ok(parsed.data)
    : Result.err(
        new InvalidName({ input, message: z.prettifyError(parsed.error) }),
      );
};

const rejectReservedName = (name: Name): Result<Name, ReservedName> =>
  reservedNames.has(name.toLowerCase())
    ? Result.err(
        new ReservedName({ name, message: `"${name}" is a reserved name.` }),
      )
    : Result.ok(name);

export const greet = (
  input: string,
): Result<string, InvalidName | ReservedName> =>
  Result.gen(function* () {
    const name = yield* parseName(input);
    const allowedName = yield* rejectReservedName(name);

    return Result.ok(`Hello, ${allowedName}!`);
  });
