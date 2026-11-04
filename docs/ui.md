# UI standards

Read this before you write or review UI code.

Related: [typescript.md](typescript.md), [testing.md](testing.md).

The goal is **one design system**. Every screen uses the same components, tokens and patterns.

## Stack

| Concern          | Tool                                                    |
| ---------------- | ------------------------------------------------------- |
| Components       | [shadcn/ui](https://ui.shadcn.com), style `base-nova`   |
| Primitives       | [Base UI](https://base-ui.com), through shadcn/ui       |
| Styling          | [Tailwind CSS](https://tailwindcss.com) v4              |
| Icons            | [Lucide](https://lucide.dev), through `lucide-react`    |
| Component source | [Storybook](https://storybook.js.org), in `packages/ui` |

Do not add a second component library, icon set or styling method. Do not write CSS modules, inline `style` objects or CSS-in-JS.

## Where code goes

- `packages/ui` (`@repo/ui`) holds the shared component library, the design tokens and the stories.
- An app, such as `apps/web`, composes components from `@repo/ui`. It does not define its own buttons, inputs or cards.
- Import a component by its file: `import { Button } from "@repo/ui/components/button"`.

Storybook is the canonical reference for the component library. A component that has no story is not part of the library.

## Add a component

1. Look for the component in shadcn/ui first. Add it to the library:

   ```sh
   cd packages/ui
   bunx shadcn@latest add <component>
   ```

2. Change the generated file until `bun run lint` and `bun run typecheck` pass. The generated code is ours. Change the code, not the lint config.
3. Write `<component>.stories.tsx` next to it. See [Stories](#stories).
4. Run `bun run test` in `packages/ui`.

When shadcn/ui has no match, compose existing components. Write a new primitive only when composition cannot do the job. Build it on a Base UI primitive, so that focus, keyboard and ARIA behaviour come from Base UI.

Before you add a component, look for one that does the same job. Extend it with a variant. Do not add a second one.

## Design tokens

`packages/ui/src/styles/globals.css` holds every token: colours, radii and fonts, for the light and dark themes.

- Use the semantic Tailwind classes: `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`.
- Do not use raw colour classes such as `bg-red-600`, or arbitrary values such as `text-[#e7000b]`.
- To change a colour, change its token. Every component then changes with it.
- Use the Tailwind spacing and type scales. Do not use arbitrary values such as `p-[13px]`.

A token change must keep every story free of accessibility violations. For example, `--destructive` is darker than the shadcn default, so destructive text on its tint meets WCAG AA contrast.

## Variants

Express a visual option as a `cva` variant on the component, such as `variant` or `size`. Do not pass the same long class string from many callers.

`className` is for layout at the call site: width, margin and position. It is not for restyling a component.

## Accessibility

- Every interactive element works with the keyboard alone.
- Every control has an accessible name. An icon-only button takes `aria-label`.
- An input in error takes `aria-invalid` and `aria-describedby`, which points at its `FieldError`.
- Use the semantic element or the Base UI primitive. Do not put `onClick` on a `div`.

## Responsive behaviour

Components fill their container and do not set a page width. The caller sets the width. Long text wraps or truncates. It does not overflow.

## Stories

Each component has a `*.stories.tsx` file next to it. Storybook builds a documentation page from each one (`autodocs`).

A component's stories cover each case that applies to it:

| Case          | How                                                                        |
| ------------- | -------------------------------------------------------------------------- |
| Variants      | one story that renders every `variant`                                     |
| Sizes         | one story that renders every `size`                                        |
| Hover, focus  | `parameters: { pseudo: { hover: true } }` or `{ focusVisible: true }`      |
| Disabled      | a story with `disabled`, and a `play` function that proves it does nothing |
| Loading       | the component composed with `Spinner`                                      |
| Error         | `aria-invalid`, or a `FieldError`                                          |
| Interaction   | a `play` function that uses `userEvent` and `expect` from `storybook/test` |
| Long text     | a story in a narrow container                                              |
| Empty content | a story with no optional parts                                             |
| Controls      | `argTypes` for each variant prop, so the Controls panel can change it      |

Write `play` functions that test behaviour a user can see: focus, the value, the accessible name, whether a handler ran. Do not test class names.

## Tests

`bun run test` in `packages/ui` runs each story as a Vitest test in headless Chromium. A story fails in three cases:

- It does not render.
- Its `play` function fails.
- axe finds an accessibility violation. `.storybook/preview.tsx` sets `a11y: { test: "error" }`.

Do not turn off the accessibility check for a story to make it pass. Fix the component or the token.

The tests run in the light theme only. Use the theme switch in the Storybook toolbar to check the dark theme by eye.

Visual regression testing is not set up. To add it, connect a hosted service such as Chromatic to the Storybook build. Do not commit screenshot baselines from one operating system, because CI renders fonts differently.

## Commands

```sh
cd packages/ui
bun run storybook   # Storybook on http://localhost:6006
bun run test        # every story as a test, in headless Chromium
bun run build       # static Storybook in dist/storybook
```

`bun run setup` installs Chromium for the tests. `bun run doctor` reports when it is missing.
