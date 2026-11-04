import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Spinner } from "#components/spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveAccessibleName("Loading");
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <Spinner {...args} className="size-3" />
      <Spinner {...args} />
      <Spinner {...args} className="size-6" />
      <Spinner {...args} className="size-8" />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: { "aria-label": "Loading invoices" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveAccessibleName(
      "Loading invoices",
    );
  },
};
