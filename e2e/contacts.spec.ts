import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Contact CRUD & Mailchimp Integration
 *
 * Tests the contact management features:
 * - Contact creation
 * - Contact editing
 * - Contact deletion
 * - Mailchimp connection UI
 *
 * Note: Mailchimp sync tests require valid OAuth credentials.
 */

test.describe("Contact Management", () => {
  test.skip("should display database page", async ({ page }) => {
    await page.goto("/demo/database");

    // Page should load
    await expect(page).toHaveURL(/\/demo\/database/);

    // Look for contact list or empty state
    const contactList = page.locator('[data-testid="contact-list"], .contact-list');
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');

    // Either contacts exist or empty state shown
    const hasContacts = await contactList.isVisible();
    const hasEmpty = await emptyState.isVisible();

    expect(hasContacts || hasEmpty).toBe(true);
  });

  test.skip("should open create contact modal", async ({ page }) => {
    await page.goto("/demo/database");

    // Find and click add contact button
    const addButton = page.locator(
      '[data-testid="add-contact"], button:has-text("Add Contact"), button:has-text("New Contact")'
    );

    await expect(addButton).toBeVisible();
    await addButton.click();

    // Modal should open
    const modal = page.locator('[role="dialog"], [data-testid="create-contact-modal"]');
    await expect(modal).toBeVisible();

    // Should have form fields
    await expect(modal.locator('input[name="email"], input[placeholder*="email" i]')).toBeVisible();
  });

  test.skip("should create a new contact", async ({ page }) => {
    await page.goto("/demo/database");

    // Open create modal
    const addButton = page.locator('[data-testid="add-contact"], button:has-text("Add")');
    await addButton.click();

    // Fill form
    const modal = page.locator('[role="dialog"]');
    await modal.locator('input[name="first_name"], input[placeholder*="first" i]').fill("Test");
    await modal.locator('input[name="last_name"], input[placeholder*="last" i]').fill("Contact");
    await modal.locator('input[name="email"], input[placeholder*="email" i]').fill("test@example.com");

    // Submit
    const submitButton = modal.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    await submitButton.click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Contact should appear in list
    const contactRow = page.locator('text=test@example.com');
    await expect(contactRow).toBeVisible();
  });

  test.skip("should edit an existing contact", async ({ page }) => {
    await page.goto("/demo/database");

    // Find a contact row
    const contactRow = page.locator('[data-testid="contact-row"], tr').first();

    if (await contactRow.isVisible()) {
      // Click edit button or row
      const editButton = contactRow.locator('button:has-text("Edit"), [data-testid="edit-contact"]');

      if (await editButton.isVisible()) {
        await editButton.click();

        // Edit modal should open
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
      }
    }
  });

  test.skip("should delete a contact", async ({ page }) => {
    await page.goto("/demo/database");

    // Find a contact row
    const contactRow = page.locator('[data-testid="contact-row"], tr').first();

    if (await contactRow.isVisible()) {
      // Click delete button
      const deleteButton = contactRow.locator('button:has-text("Delete"), [data-testid="delete-contact"]');

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirmation dialog should appear
        const confirmDialog = page.locator('[role="alertdialog"], [data-testid="confirm-delete"]');
        await expect(confirmDialog).toBeVisible();

        // Confirm deletion
        const confirmButton = confirmDialog.locator('button:has-text("Delete"), button:has-text("Confirm")');
        await confirmButton.click();

        // Dialog should close
        await expect(confirmDialog).not.toBeVisible();
      }
    }
  });
});

test.describe("Contact Search & Filter", () => {
  test.skip("should search contacts", async ({ page }) => {
    await page.goto("/demo/database");

    // Find search input
    const searchInput = page.locator(
      '[data-testid="contact-search"], input[placeholder*="search" i]'
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill("test");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Results should be filtered
      const visibleContacts = page.locator('[data-testid="contact-row"]:visible, tr:visible');
      // All visible contacts should match search term
      // (Actual validation depends on test data)
    }
  });
});

test.describe("Mailchimp Integration UI", () => {
  test.skip("should display Mailchimp connection in settings", async ({ page }) => {
    await page.goto("/demo/settings");

    // Look for Mailchimp section
    const mailchimpSection = page.locator(
      '[data-testid="mailchimp-section"], .mailchimp-connection'
    );

    await expect(mailchimpSection).toBeVisible();
  });

  test.skip("should show connect button when not connected", async ({ page }) => {
    await page.goto("/demo/settings");

    // Look for connect button
    const connectButton = page.locator('button:has-text("Connect Mailchimp")');

    // Either connect button or connected status should be visible
    const disconnectButton = page.locator('button:has-text("Disconnect")');

    const hasConnect = await connectButton.isVisible();
    const hasDisconnect = await disconnectButton.isVisible();

    // One should be visible
    expect(hasConnect || hasDisconnect).toBe(true);
  });

  test.skip("should show sync status when connected", async ({ page }) => {
    await page.goto("/demo/settings");

    // If connected, should show status
    const syncStatus = page.locator(
      '[data-testid="sync-status"], .sync-status, text=/connected to|last synced/i'
    );

    // Only check if Mailchimp is connected
    const disconnectButton = page.locator('button:has-text("Disconnect")');

    if (await disconnectButton.isVisible()) {
      await expect(syncStatus).toBeVisible();
    }
  });

  test.skip("should show sync now button when connected", async ({ page }) => {
    await page.goto("/demo/settings");

    // If connected, should have sync now button
    const syncNowButton = page.locator('button:has-text("Sync Now")');
    const disconnectButton = page.locator('button:has-text("Disconnect")');

    if (await disconnectButton.isVisible()) {
      await expect(syncNowButton).toBeVisible();
    }
  });
});

test.describe("One-Way Sync Verification", () => {
  test.skip("should not show Mailchimp import functionality", async ({ page }) => {
    // Mailchimp sync is ONE-WAY: RealCoach -> Mailchimp only
    // There should be no import from Mailchimp option

    await page.goto("/demo/settings");

    // No import button should exist
    const importButton = page.locator(
      'button:has-text("Import from Mailchimp"), button:has-text("Sync from Mailchimp")'
    );

    expect(await importButton.count()).toBe(0);

    // Also check database page
    await page.goto("/demo/database");

    const importFromMailchimp = page.locator('text=/import.*mailchimp/i');
    expect(await importFromMailchimp.count()).toBe(0);
  });
});
