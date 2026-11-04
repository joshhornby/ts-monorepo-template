import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent } from "storybook/test";

import { Input } from "#components/input";
import { Label } from "#components/label";

const meta = {
  title: "Components/Label",
  component: Label,
  args: { children: "Email", htmlFor: "label-email" },
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label {...args} />
      <Input id="label-email" />
    </div>
  ),
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FocusesItsControl: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByText("Email"));
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus();
  },
};

export const LongText: Story = {
  args: {
    children:
      "The email address we send invoices, receipts and account notices to",
  },
};
