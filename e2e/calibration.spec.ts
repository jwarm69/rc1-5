import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Calibration Flow
 *
 * Tests the 7-question calibration flow including:
 * - One question at a time display
 * - G&A draft presentation
 * - G&A confirmation
 * - State transitions
 *
 * Note: These tests require authentication. In a real setup,
 * you would use a test user and handle auth in beforeEach.
 */

test.describe("Calibration Flow", () => {
  // Skip auth setup for now - would need test credentials
  test.skip("should display first calibration question", async ({ page }) => {
    // Assume we're authenticated and on /demo/goals
    await page.goto("/demo/goals");

    // Open coach panel if needed
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Wait for coach panel content
    await page.waitForSelector('[data-testid="coach-panel"]', { timeout: 5000 });

    // Should see first calibration question
    const coachMessage = page.locator('[data-testid="coach-message"]').last();
    await expect(coachMessage).toContainText("?");

    // Should only be one question (check for single question mark pattern)
    const messageText = await coachMessage.textContent();
    const questionCount = (messageText?.match(/\?/g) || []).length;
    expect(questionCount).toBeLessThanOrEqual(1);
  });

  test.skip("should allow answering calibration questions", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Find chat input
    const chatInput = page.locator('textarea[placeholder*="Type"], input[placeholder*="Type"]');
    await expect(chatInput).toBeVisible();

    // Type a response
    await chatInput.fill("I want to close 24 transactions this year.");
    await chatInput.press("Enter");

    // Wait for response
    await page.waitForTimeout(2000);

    // Coach should respond with next question or acknowledgment
    const messages = page.locator('[data-testid="coach-message"]');
    await expect(messages.last()).toBeVisible();
  });

  test.skip("should show G&A draft after calibration", async ({ page }) => {
    // This would require completing all 7 questions
    // For now, we verify the G&A confirmation UI exists

    await page.goto("/demo/goals");

    // Look for G&A confirmation section (may not be visible if not calibrated)
    const goalsSection = page.locator('[data-testid="goals-section"], .goals-section');

    // If user hasn't completed calibration, this should prompt them
    const calibrationPrompt = page.locator('text=/complete.*calibration|start.*calibration/i');

    // Either G&A is shown or calibration prompt exists
    const hasGoals = await goalsSection.isVisible();
    const hasPrompt = await calibrationPrompt.isVisible();

    expect(hasGoals || hasPrompt).toBe(true);
  });

  test.skip("should gate daily actions before G&A confirmation", async ({ page }) => {
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());

    await page.goto("/demo/goals");

    // Look for daily actions section
    const actionsSection = page.locator('[data-testid="daily-actions"], .daily-actions');

    // Should show gating message, not actions
    const gatingMessage = page.locator('text=/complete.*goals|finish.*calibration|confirm.*G&A/i');

    // Either no actions visible or gating message shown
    if (await actionsSection.isVisible()) {
      const actionsText = await actionsSection.textContent();
      // Should mention completing calibration first
      expect(actionsText?.toLowerCase()).toContain("complet");
    }
  });
});

test.describe("Calibration State Persistence", () => {
  test.skip("should persist calibration progress across page reloads", async ({ page }) => {
    await page.goto("/demo/goals");

    // Open coach panel and answer a question
    const coachPanelToggle = page.locator('[data-testid="coach-panel-toggle"]');
    if (await coachPanelToggle.isVisible()) {
      await coachPanelToggle.click();
    }

    // Get current localStorage state
    const stateBefore = await page.evaluate(() =>
      localStorage.getItem("realcoach-calibration")
    );

    // Reload page
    await page.reload();

    // Check state is preserved
    const stateAfter = await page.evaluate(() =>
      localStorage.getItem("realcoach-calibration")
    );

    expect(stateAfter).toBe(stateBefore);
  });
});
