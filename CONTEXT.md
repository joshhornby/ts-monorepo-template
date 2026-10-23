# Context

## Glossary

**Interface** — The layer a human uses to drive an agent: prompt input, transcript, diffs, approvals. It presents state and collects intent; it executes nothing.

**Harness** — The runtime that lets an LLM act. It exposes a set of tools with descriptions, defines the syntax for calling them, parses and executes those calls, and feeds results back to the model in a loop.

**Agent** — An LLM running inside a harness.

Interface and harness are separable: one harness can sit behind many interfaces, and one interface can drive different harnesses.

**Remote workspace** — A disposable cloud machine where an agent's harness runs one task, separate from the user's computer and reachable from any interface.
