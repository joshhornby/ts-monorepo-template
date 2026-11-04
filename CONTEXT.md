# Context

The terms this project uses. Each term has one meaning. Use the term in code, docs and conversation.

## Glossary

Add each term as `**Term** — Definition.`

**Component library** — The shared UI components in `packages/ui` (`@repo/ui`). Apps compose these components. They do not define their own.

**Design token** — A named CSS variable in `packages/ui/src/styles/globals.css`, such as `--primary`, that sets one colour, radius or font for every component.

**Story** — One rendered state of a component in Storybook. Each story is also a test.

**Slot** — One of three port ranges on a machine. A checkout claims one with `bun run up`, so copies of the stack do not share ports.
