# Architecture decision records

An architecture decision record (ADR) is a short note about one significant decision. It says what we decided, why, and what follows from it.

## When to write one

Write an ADR when a decision is hard to reverse or shapes how other code is written. For example:

- adding or replacing a framework, database or major dependency
- changing how packages depend on each other
- choosing a pattern every package must follow
- turning off or changing a lint rule, compiler flag or CI step

Do not write one for a choice that one pull request can undo.

## How to write one

1. Copy `0000-template.md` to `NNNN-title.md`. `NNNN` is the next free number, padded to four digits. `title` is a short kebab-case summary, such as `0002-use-postgres.md`.
2. Fill in each section. Keep it short.
3. Open it in the same pull request as the change it records.

An accepted ADR does not change. To reverse a decision, write a new ADR. Set the old one's status to `Superseded by NNNN`.

## Records

- [0001 Record architecture decisions](0001-record-architecture-decisions.md)
