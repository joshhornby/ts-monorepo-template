import { expect, test } from "@playwright/test";

test("a customer places an order, then ships it", async ({ page }) => {
  // Each run uses its own item, because the stack keeps orders between runs.
  const item = `Notebook ${crypto.randomUUID().slice(0, 8)}`;

  await page.goto("/");
  await page.getByLabel("Item").fill(item);
  await page.getByLabel("Quantity").fill("3");
  await page.getByRole("button", { name: "Place order" }).click();

  const row = page.getByRole("row").filter({ hasText: item });

  await expect(row).toContainText("placed");
  await expect(page.getByLabel("Item")).toHaveValue("");

  await row.getByRole("button", { name: "Ship" }).click();

  await expect(row).toContainText("shipped");
  await expect(row.getByRole("button")).toHaveCount(0);
});

test("a customer cancels an order before it ships", async ({ page }) => {
  const item = `Pen ${crypto.randomUUID().slice(0, 8)}`;

  await page.goto("/");
  await page.getByLabel("Item").fill(item);
  await page.getByRole("button", { name: "Place order" }).click();

  const row = page.getByRole("row").filter({ hasText: item });

  await row.getByRole("button", { name: "Cancel" }).click();

  await expect(row).toContainText("cancelled");
});
