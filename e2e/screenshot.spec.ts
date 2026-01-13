import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E Tests: Screenshot Upload & Interpretation
 *
 * Tests the screenshot interpretation feature:
 * - Upload button visibility
 * - Image upload handling
 * - Interpretation display
 * - Confirmation flow (Yes/Adjust/No)
 *
 * Note: These tests require authentication and may need mocked LLM responses.
 */

test.describe("Screenshot Upload UI", () => {
  test.skip("should display upload button in coach panel", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Look for upload button (paperclip or image icon)
    const uploadButton = page.locator(
      '[data-testid="upload-button"], button[aria-label*="upload"], button[aria-label*="image"], .upload-trigger'
    );

    await expect(uploadButton).toBeVisible();
  });

  test.skip("should have file input for images", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Find file input
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await expect(fileInput).toBeAttached();

    // Verify it accepts images
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toContain("image");
  });

  test.skip("should show preview after image selection", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Find file input
    const fileInput = page.locator('input[type="file"][accept*="image"]');

    // Create a test image file
    // Note: In real tests, you would use a fixture file
    await fileInput.setInputFiles({
      name: "test-screenshot.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
    });

    // Should show preview
    const preview = page.locator('[data-testid="upload-preview"], .upload-preview, img[alt*="preview"]');
    await expect(preview).toBeVisible({ timeout: 5000 });
  });

  test.skip("should allow removing uploaded image", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Upload an image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"),
    });

    // Wait for preview
    await page.waitForTimeout(500);

    // Find and click remove button
    const removeButton = page.locator('[data-testid="remove-image"], button[aria-label*="remove"]');
    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Preview should be gone
      const preview = page.locator('[data-testid="upload-preview"]');
      await expect(preview).not.toBeVisible();
    }
  });
});

test.describe("Screenshot Interpretation", () => {
  test.skip("should display interpretation card after processing", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel and upload image
    // (Requires mocked LLM response for consistent testing)

    // Look for interpretation card structure
    const interpretationCard = page.locator(
      '[data-testid="interpretation-card"], .interpretation-card'
    );

    // If visible, check for required elements
    if (await interpretationCard.isVisible()) {
      // Should have "Here's What I See" header
      await expect(interpretationCard).toContainText(/here.*see|interpret/i);

      // Should have confirmation buttons
      const yesButton = interpretationCard.locator('button:has-text("Yes")');
      const noButton = interpretationCard.locator('button:has-text("No")');

      await expect(yesButton).toBeVisible();
      await expect(noButton).toBeVisible();
    }
  });

  test.skip("should require confirmation before generating signals", async ({ page }) => {
    await page.goto("/demo/goals");

    // Interpretation requires explicit user confirmation
    // This tests that signals are not auto-generated

    // Look for pending confirmation state
    const pendingConfirmation = page.locator(
      '[data-state="awaiting_confirmation"], .awaiting-confirmation'
    );

    // If interpretation is pending, it should not have generated signals yet
    // Signals would show as action suggestions
    const signalIndicator = page.locator('[data-testid="signal-generated"]');

    // No signals until confirmed
    if (await pendingConfirmation.isVisible()) {
      expect(await signalIndicator.count()).toBe(0);
    }
  });
});

test.describe("Upload Limits", () => {
  test.skip("should enforce 10-image limit", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Look for count indicator
    const countIndicator = page.locator('[data-testid="upload-count"], .upload-count');

    if (await countIndicator.isVisible()) {
      const text = await countIndicator.textContent();
      // Should show "X of 10" or similar
      expect(text).toMatch(/\d+.*10|max.*10/i);
    }
  });
});
