import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "#components/field";
import { Input } from "#components/input";

const orientations = ["vertical", "horizontal", "responsive"] as const;

const meta = {
  title: "Components/Field",
  component: Field,
  args: { orientation: "vertical" },
  argTypes: {
    orientation: { control: "inline-radio", options: orientations },
  },
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel htmlFor="field-name">Display name</FieldLabel>
      <Input id="field-name" />
      <FieldDescription>Other people see this name.</FieldDescription>
    </Field>
  ),
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
};

export const Disabled: Story = {
  render: (args) => (
    <Field {...args} data-disabled="true" className="max-w-sm">
      <FieldLabel htmlFor="field-disabled">Display name</FieldLabel>
      <Input id="field-disabled" disabled defaultValue="Ada" />
      <FieldDescription>You cannot change this name.</FieldDescription>
    </Field>
  ),
};

export const WithError: Story = {
  render: (args) => (
    <Field {...args} data-invalid="true" className="max-w-sm">
      <FieldLabel htmlFor="field-email">Email</FieldLabel>
      <Input
        id="field-email"
        aria-invalid
        aria-describedby="field-email-error"
        defaultValue="ada@"
      />
      <FieldError
        id="field-email-error"
        errors={[{ message: "Enter a full email address." }]}
      />
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("textbox", { name: "Email" }),
    ).toHaveAccessibleDescription("Enter a full email address.");
  },
};

export const ManyErrors: Story = {
  render: (args) => (
    <Field {...args} data-invalid="true" className="max-w-sm">
      <FieldLabel htmlFor="field-password">Password</FieldLabel>
      <Input id="field-password" type="password" aria-invalid />
      <FieldError
        errors={[
          { message: "Use at least 12 characters." },
          { message: "Use at least 12 characters." },
          { message: "Do not use your email address." },
          undefined,
        ]}
      />
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
  },
};

export const NoErrors: Story = {
  render: (args) => (
    <Field {...args} className="max-w-sm">
      <FieldLabel htmlFor="field-ok">Email</FieldLabel>
      <Input id="field-ok" />
      <FieldError errors={[]} />
    </Field>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

export const Form: Story = {
  render: () => (
    <FieldSet className="max-w-sm">
      <FieldLegend>Profile</FieldLegend>
      <FieldDescription>Tell us how to reach you.</FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="form-name">Name</FieldLabel>
          <Input id="form-name" autoComplete="name" />
        </Field>
        <FieldSeparator>or</FieldSeparator>
        <Field>
          <FieldLabel htmlFor="form-email">Email</FieldLabel>
          <Input id="form-email" type="email" autoComplete="email" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
};

export const LongText: Story = {
  render: (args) => (
    <Field {...args} className="max-w-xs">
      <FieldLabel htmlFor="field-long">
        The name printed on invoices, receipts and every account notice
      </FieldLabel>
      <Input id="field-long" />
      <FieldDescription>
        Use the legal name of the organisation. We check it against the company
        register before the first invoice goes out, and it can take up to two
        working days.
      </FieldDescription>
    </Field>
  ),
};
