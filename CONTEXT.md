# Context

The terms this project uses. Each term has one meaning. Use the term in code, docs and conversation.

## Glossary

Add each term as `**Term** — Definition.`

**Slot** — One of three port ranges on a machine. A checkout claims one with `bun run up`, so copies of the stack do not share ports.

**Infrastructure** — The containers `bun run up` starts with Docker Compose before the services, such as Postgres. Each checkout has its own.

**Order** — A request for a quantity of one item. It is placed, then either shipped or cancelled.

**Placed** — The state of a new order. It can ship or be cancelled.

**Shipped** — The state of an order that has left. It cannot be cancelled.

**Cancelled** — The state of an order stopped before it shipped. It records why.
