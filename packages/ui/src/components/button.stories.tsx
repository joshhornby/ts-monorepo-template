import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { expect, fn, userEvent } from "storybook/test";

import { Button } from "#components/button";
import { Spinner } from "#components/spinner";

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const sizes = ["xs", "sm", "default", "lg"] as const;

const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const;

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Save changes",
    onClick: fn(),
  },
  argTypes: {
    variant: { control: "select", options: variants },
    size: { control: "select", options: [...sizes, ...iconSizes] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const renderVariants: Story["render"] = (args) => (
  <div className="flex flex-wrap gap-2">
    {variants.map((variant) => (
      <Button key={variant} {...args} variant={variant}>
        {variant}
      </Button>
    ))}
  </div>
);

export const Variants: Story = { render: renderVariants };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {sizes.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};

export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      {iconSizes.map((size) => (
        <Button key={size} {...args} size={size} aria-label="Add item">
          <Plus />
        </Button>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Button {...args}>
        <Plus data-icon="inline-start" />
        Add item
      </Button>
      <Button {...args} variant="outline">
        Continue
        <ArrowRight data-icon="inline-end" />
      </Button>
      <Button {...args} variant="destructive">
        <Trash2 data-icon="inline-start" />
        Delete
      </Button>
    </div>
  ),
};

export const Hover: Story = {
  render: renderVariants,
  parameters: { pseudo: { hover: true } },
};

export const FocusVisible: Story = {
  render: renderVariants,
  parameters: { pseudo: { focusVisible: true } },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });

    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Loading: Story = {
  render: (args) => (
    <Button {...args} disabled>
      <Spinner data-icon="inline-start" />
      Saving
    </Button>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status")).toHaveAccessibleName("Loading");
    await expect(canvas.getByRole("button", { name: /Saving/ })).toBeDisabled();
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, variant: "outline" },
};

export const KeyboardActivation: Story = {
  play: async ({ args, canvas }) => {
    const button = canvas.getByRole("button", { name: "Save changes" });

    await userEvent.tab();
    await expect(button).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const LongText: Story = {
  args: {
    children:
      "Save every change to this very long project name before you leave",
  },
  render: (args) => (
    <div className="w-48">
      <Button {...args} className="max-w-full">
        <span className="truncate">{args.children}</span>
      </Button>
    </div>
  ),
};
