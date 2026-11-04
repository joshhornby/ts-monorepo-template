import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { Input } from "#components/input";

const meta = {
  title: "Components/Input",
  component: Input,
  args: {
    "aria-label": "Email",
    placeholder: "name@example.com",
    onChange: fn(),
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "file"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Typing: Story = {
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Email" });

    await userEvent.type(input, "ada@example.com");
    await expect(input).toHaveValue("ada@example.com");
    await expect(args.onChange).toHaveBeenCalled();
  },
};

export const Focused: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole("textbox")).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "ada@example.com" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toBeDisabled();
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "not-an-email" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toBeInvalid();
  },
};

export const Password: Story = {
  args: { type: "password", "aria-label": "Password", placeholder: "" },
};

export const File: Story = {
  args: { type: "file", "aria-label": "Avatar", placeholder: "" },
};

export const LongValue: Story = {
  args: {
    defaultValue:
      "a.very.long.email.address.that.does.not.fit@subdomain.example.com",
  },
};

export const Empty: Story = {
  args: { placeholder: "" },
};
