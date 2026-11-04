import { greet } from "@repo/core";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Hand } from "lucide-react";
import { useState } from "react";

type Outcome =
  | { readonly kind: "none" }
  | { readonly kind: "greeted"; readonly greeting: string }
  | { readonly kind: "rejected"; readonly message: string };

const rejected = (message: string): Outcome => ({ kind: "rejected", message });

const describe = (input: string): Outcome =>
  greet(input).match<Outcome>({
    ok: (greeting) => ({ kind: "greeted", greeting }),
    err: (error) =>
      error.match({
        InvalidName: () => rejected("Enter a name from 1 to 50 characters."),
        ReservedName: ({ message }) => rejected(message),
      }),
  });

export function App(): React.JSX.Element {
  const [outcome, setOutcome] = useState<Outcome>({ kind: "none" });

  const [name, setName] = useState("");

  const isRejected = outcome.kind === "rejected";

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setOutcome(describe(name));
          }}
        >
          <CardHeader>
            <CardTitle>Say hello</CardTitle>
            <CardDescription>
              This page uses only components from @repo/ui.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 py-4">
            <Field data-invalid={isRejected}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                id="name"
                name="name"
                autoComplete="given-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                aria-invalid={isRejected}
                aria-describedby={isRejected ? "name-error" : "name-help"}
              />
              {isRejected ? (
                <FieldError id="name-error">{outcome.message}</FieldError>
              ) : (
                <FieldDescription id="name-help">
                  &ldquo;admin&rdquo; and &ldquo;root&rdquo; are reserved.
                </FieldDescription>
              )}
            </Field>
            {outcome.kind === "greeted" && (
              <Alert>
                <Hand />
                <AlertTitle>{outcome.greeting}</AlertTitle>
                <AlertDescription>
                  The greeting comes from @repo/core.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="py-4">
            <Button type="submit">Greet</Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
