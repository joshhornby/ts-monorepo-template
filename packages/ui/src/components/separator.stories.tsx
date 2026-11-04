import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "#components/separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  args: { orientation: "horizontal" },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-3 text-sm">
      <p>Account</p>
      <Separator {...args} />
      <p>Billing</p>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-5 items-center gap-3 text-sm">
      <span>Docs</span>
      <Separator {...args} />
      <span>Changelog</span>
      <Separator {...args} />
      <span>Support</span>
    </div>
  ),
};
