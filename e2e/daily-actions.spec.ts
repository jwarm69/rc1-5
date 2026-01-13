import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Daily Actions
 *
 * Tests the daily actions display and behavior:
 * - Max 1 primary + 2 supporting actions
 * - No urgency indicators
 * - Action completion tracking
 *
 * Note: These tests require an authenticated user with completed G&A.
 */

test.describe("Daily Actions Display", () => {
  test.skip("should display daily actions page", async ({ page }) => {
    await page.goto("/demo/goals");

    // Page should load
    await expect(page).toHaveURL(/\/demo\/goals/);

    // Look for main content area
    const mainContent = page.locator("main, [data-testid='main-content']");
    await expect(mainContent).toBeVisible();
  });

  test.skip("should enforce max action limits", async ({ page }) => {
    // Requires authenticated user with actions
    await page.goto("/demo/goals");

    // Count action cards
    const primaryActions = page.locator('[data-testid="primary-action"], .primary-action');
    const supportingActions = page.locator('[data-testid="supporting-action"], .supporting-action');

    const primaryCount = await primaryActions.count();
    const supportingCount = await supportingActions.count();

    // Max 1 primary, max 2 supporting
    expect(primaryCount).toBeLessThanOrEqual(1);
    expect(supportingCount).toBeLessThanOrEqual(2);
  });

  test.skip("should not display urgency indicators", async ({ page }) => {
    await page.goto("/demo/goals");

    // Check for absence of urgency UI elements
    const urgencyIndicators = page.locator(
      '[class*="timer"], [class*="countdown"], [class*="overdue"], [class*="streak"]'
    );

    // Also check for urgency text
    const urgencyText = page.locator(
      'text=/overdue|days left|streak|countdown|hurry|urgent/i'
    );

    expect(await urgencyIndicators.count()).toBe(0);
    expect(await urgencyText.count()).toBe(0);
  });

  test.skip("should not use banned motivational words", async ({ page }) => {
    await page.goto("/demo/goals");

    // Get all text content on the page
    const pageText = await page.locator("body").textContent();
    const textLower = pageText?.toLowerCase() || "";

    // Banned words from CLAUDE.md
    const bannedWords = ["crush", "hustle", "grind", "empower", "synergy", "game-changer"];

    for (const word of bannedWords) {
      expect(textLower).not.toContain(word);
    }
  });
});

test.describe("Action Completion", () => {
  test.skip("should allow marking actions as complete", async ({ page }) => {
    // Requires authenticated user with actions
    await page.goto("/demo/goals");

    // Find a complete button or checkbox
    const completeButton = page.locator(
      '[data-testid="complete-action"], button:has-text("Complete"), input[type="checkbox"]'
    ).first();

    if (await completeButton.isVisible()) {
      // Get initial state
      const wasChecked = await completeButton.isChecked?.() || false;

      // Click to complete
      await completeButton.click();

      // Wait for state update
      await page.waitForTimeout(500);

      // State should have changed
      const isNowChecked = await completeButton.isChecked?.() || true;
      expect(isNowChecked).not.toBe(wasChecked);
    }
  });

  test.skip("should persist action completion across page reload", async ({ page }) => {
    await page.goto("/demo/goals");

    // Complete an action (if available)
    const completeButton = page.locator('[data-testid="complete-action"]').first();

    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(1000);

      // Reload page
      await page.reload();

      // Action should still be marked complete
      const completedAction = page.locator('[data-completed="true"], .completed');
      expect(await completedAction.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("No-Guilt Design", () => {
  test.skip("should not show guilt-inducing language for incomplete actions", async ({ page }) => {
    await page.goto("/demo/goals");

    // Get all visible text
    const pageText = await page.locator("body").textContent();
    const textLower = pageText?.toLowerCase() || "";

    // No guilt language
    const guiltPhrases = [
      "you missed",
      "you failed",
      "incomplete tasks",
      "falling behind",
      "catch up",
      "don't break",
    ];

    for (const phrase of guiltPhrases) {
      expect(textLower).not.toContain(phrase);
    }
  });
});
