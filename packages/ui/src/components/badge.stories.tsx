import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check } from "lucide-react";

import { Badge } from "#components/badge";

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { children: "Active" },
  argTypes: {
    variant: { control: "select", options: variants },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <Badge {...args}>
      <Check data-icon="inline-start" />
      Verified
    </Badge>
  ),
};

export const AsLink: Story = {
  args: { variant: "outline", render: <a href="#releases" /> },
  parameters: { pseudo: { hover: true } },
};

export const LongText: Story = {
  args: { children: "Awaiting approval from the finance team" },
  render: (args) => (
    <div className="w-32">
      <Badge {...args} className="max-w-full">
        <span className="truncate">{args.children}</span>
      </Badge>
    </div>
  ),
};
