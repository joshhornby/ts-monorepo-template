/** The outcome of an operation whose failure is expected domain behaviour. */
export type Result<Value, Failure> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly failure: Failure };

export function success<Value>(value: Value): Result<Value, never> {
  return { ok: true, value };
}

export function failure<Failure>(reason: Failure): Result<never, Failure> {
  return { ok: false, failure: reason };
}
