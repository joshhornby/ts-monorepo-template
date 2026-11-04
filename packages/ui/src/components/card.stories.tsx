import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal } from "lucide-react";

import { Button } from "#components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "#components/card";

const meta = {
  title: "Components/Card",
  component: Card,
  args: { size: "default" },
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
  },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Monthly plan</CardTitle>
        <CardDescription>Renews on 1 December.</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label="More options">
            <MoreHorizontal />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>3 of 5 seats in use.</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button>Manage seats</Button>
        <Button variant="outline">Cancel plan</Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: "sm" },
};

export const ContentOnly: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardContent>No header and no footer.</CardContent>
    </Card>
  ),
};

export const Empty: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>You have no invoices yet.</CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const LongText: Story = {
  render: (args) => (
    <Card {...args} className="max-w-xs">
      <CardHeader>
        <CardTitle>
          A project title that is much too long to fit on one line
        </CardTitle>
        <CardDescription>
          Supercalifragilisticexpialidocious-unbroken-strings-must-wrap-too
        </CardDescription>
      </CardHeader>
      <CardContent className="break-words">
        <p>
          Long content wraps inside the card. It does not push the card wider
          than its container.
        </p>
      </CardContent>
    </Card>
  ),
};
