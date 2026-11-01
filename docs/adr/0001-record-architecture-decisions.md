# 0001 Record architecture decisions

- Status: Accepted
- Date: 2026-11-01

## Context

People and coding agents change this code. They need to know why it is built the way it is. Without a record, they undo a decision by accident or repeat a debate.

## Decision

We record each significant decision as an ADR in `docs/adr/`. The format and rules are in `docs/adr/README.md`.

## Consequences

- The reason for a decision sits next to the code, in version control.
- A significant change takes one more file in its pull request.
- An accepted ADR does not change. A new ADR supersedes it.
