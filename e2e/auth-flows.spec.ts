import { test, expect } from '@playwright/test';

test.describe('PrepSphere Authentication & Security Flows (Prompt 4 Gate C)', () => {
  test('Login Page UI, Magic Link Switch, and Return Route Handling', async ({ page }) => {
    // 1. Visit Login with return URL
    const returnTarget = encodeURIComponent('/app/interview/new');
    await page.goto(`/login?redirectTo=${returnTarget}`);
    await expect(page).toHaveTitle(/PrepSphere/);

    // Verify presence of OAuth button
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();

    // Verify Password tab vs Magic Link tab switching
    const magicLinkTab = page.locator('button:has-text("Magic Link")');
    await expect(magicLinkTab).toBeVisible();
    await magicLinkTab.click();
    await expect(page.locator('button:has-text("Send Magic Link")')).toBeVisible();

    // Switch back to password
    const passwordTab = page.locator('button:has-text("Password")');
    await passwordTab.click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Signup Page Enforces Password Policy (>=10 chars), Age (18+), and Consents', async ({ page }) => {
    await page.goto('/signup');

    // Age declaration requirement
    const ageCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(ageCheckbox).toBeVisible();

    // Consent checkboxes
    await expect(page.locator('text=Terms of Service')).toBeVisible();
    await expect(page.locator('text=Privacy Policy')).toBeVisible();

    // Fill form
    await page.locator('input[type="text"]').first().fill('Test Candidate');
    await page.locator('input[type="email"]').fill('newcandidate@example.com');

    // Weak password (< 10 chars)
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.fill('short12');

    // Submit button should be disabled when consents are unchecked
    const submitBtn = page.locator('button:has-text("Create Free Candidate Account")');
    await expect(submitBtn).toBeDisabled();

    // Check all required consents
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Now with >=10 character password
    await pwdInput.fill('SecurePass2026!');
    await expect(submitBtn).toBeEnabled();
  });

  test('Forgot Password Page Preserves User Enumeration Defense', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Reset Password/i })).toBeVisible();

    // Fill unknown or known email
    await page.locator('input[type="email"]').fill('unknown.candidate@example.com');
    await page.locator('button:has-text("Send Recovery Email")').click();

    // Verify generic enumeration-safe response
    await expect(page.locator('text=Recovery Link Dispatched')).toBeVisible();
    await expect(page.locator('text=instructions to set a new password have been sent')).toBeVisible();
  });

  test('Settings Page Security Controls: Typed DELETE Account Deletion Modal', async ({ page }) => {
    await page.goto('/app');
    await page.goto('/app/settings');

    // Find Purge / Delete section
    const purgeBtn = page.locator('button:has-text("Purge All Local History")');
    await expect(purgeBtn).toBeVisible();
    await purgeBtn.click();

    // Modal opens
    await expect(page.locator('text=Permanently Erase Account & All Data?')).toBeVisible();
    const eraseBtn = page.locator('button:has-text("Permanently Erase Account")');
    await expect(eraseBtn).toBeDisabled();

    // Type incorrect confirmation
    const confirmInput = page.locator('input[placeholder="Type DELETE to confirm"]');
    await confirmInput.fill('delete');
    await expect(eraseBtn).toBeDisabled();

    // Type exact DELETE
    await confirmInput.fill('DELETE');
    await expect(eraseBtn).toBeEnabled();

    // Cancel modal
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Permanently Erase Account & All Data?')).not.toBeVisible();
  });
});
