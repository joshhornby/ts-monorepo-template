import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Info } from "lucide-react";
import { expect } from "storybook/test";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "#components/alert";
import { Button } from "#components/button";

const meta = {
  title: "Components/Alert",
  component: Alert,
  args: { variant: "default" },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "destructive"] },
  },
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <Info />
      <AlertTitle>New version available</AlertTitle>
      <AlertDescription>Reload the page to get the update.</AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "New version available",
    );
  },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <CircleAlert />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>Update your card to keep your plan.</AlertDescription>
    </Alert>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <Info />
      <AlertTitle>New version available</AlertTitle>
      <AlertDescription>Reload the page to get the update.</AlertDescription>
      <AlertAction>
        <Button size="xs">Reload</Button>
      </AlertAction>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-md">
      <AlertTitle>Changes saved.</AlertTitle>
    </Alert>
  ),
};

export const LongText: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-xs">
      <Info />
      <AlertTitle>
        Scheduled maintenance on the billing service this weekend
      </AlertTitle>
      <AlertDescription>
        Invoices and receipts are not available from 22:00 on Saturday to 02:00
        on Sunday. Payments that are due in this time are taken when the service
        is back.
      </AlertDescription>
    </Alert>
  ),
};
