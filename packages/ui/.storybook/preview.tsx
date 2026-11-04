import type { Preview } from "@storybook/react-vite";

import "../src/styles/globals.css";

const themes = ["light", "dark"] as const;

type Theme = (typeof themes)[number];

const isTheme = (value: string): value is Theme =>
  themes.some((theme) => theme === value);

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    // An accessibility violation fails the story's test, not only the panel.
    a11y: { test: "error" },
    controls: { expanded: true },
  },
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: { icon: "contrast", items: [...themes], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => {
      const requested = String(context.globals.theme);
      const theme: Theme = isTheme(requested) ? requested : "light";

      document.documentElement.classList.toggle("dark", theme === "dark");

      return <Story />;
    },
  ],
};

export default preview;
