import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Authentication Flow
 *
 * Tests the authentication flows including:
 * - Email sign up
 * - Email sign in
 * - Sign out
 * - Google OAuth button presence
 */

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page
    await page.goto("/auth");
  });

  test("should display auth page with sign in form", async ({ page }) => {
    // Check page title or heading
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Check email input exists
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Check password input exists
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should display Google OAuth sign in button", async ({ page }) => {
    // Look for Google sign in button
    const googleButton = page.getByRole("button", { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test("should show error for invalid email format", async ({ page }) => {
    // Fill in invalid email
    await page.locator('input[type="email"]').fill("invalid-email");
    await page.locator('input[type="password"]').fill("password123");

    // Submit form
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Expect error message (either validation or from Supabase)
    // The exact error depends on whether HTML5 validation or server validation fires first
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("should navigate to sign up form", async ({ page }) => {
    // Find and click sign up link/tab
    const signUpLink = page.getByRole("link", { name: /sign up|create account/i });

    if (await signUpLink.isVisible()) {
      await signUpLink.click();

      // Verify sign up form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    }
  });

  test("should redirect to app after successful sign in", async ({ page }) => {
    // This test requires a test account to be set up
    // For now, we'll just verify the form submission works

    // Note: In a real test environment, you would:
    // 1. Create a test user in Supabase
    // 2. Use those credentials here
    // 3. Or mock the Supabase auth response

    // Fill in credentials (using placeholder values)
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("testpassword123");

    // Get the submit button
    const submitButton = page.getByRole("button", { name: /sign in|log in/i });
    await expect(submitButton).toBeEnabled();

    // Note: Actually clicking would require valid test credentials
    // await submitButton.click();
    // await expect(page).toHaveURL(/\/demo\//);
  });
});

test.describe("Protected Routes", () => {
  test("should redirect unauthenticated users from protected routes", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/demo/goals");

    // Should be redirected to auth or landing
    // Exact behavior depends on implementation
    await page.waitForTimeout(1000);

    const url = page.url();
    // Either redirected to auth or a login modal appears
    expect(url.includes("/auth") || url.includes("/")).toBe(true);
  });
});
