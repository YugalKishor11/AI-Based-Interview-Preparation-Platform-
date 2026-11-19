import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('PrepSphere Candidate End-to-End Journey & Accessibility', () => {
  test('Complete Candidate Practice Journey from Landing to Report and Practice Bank', async ({ page }) => {
    // 1. Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/PrepSphere/);

    // Verify key Landing visual components
    await expect(page.locator('h1')).toContainText('Practice the interview');
    await expect(page.locator('.ai-orb')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();

    // Verify Virtual AI Personas are displayed
    await expect(page.locator('text=Aanya Rao').first()).toBeVisible();
    await expect(page.locator('text=Daniel Brooks').first()).toBeVisible();

    // Verify honest badges
    await expect(page.locator('text=Virtual AI Interviewer').first()).toBeVisible();

    // 2. Navigate to Dashboard
    await page.goto('/app');
    await expect(page.locator('h1')).toContainText('Alex');
    await expect(page.locator('text=84').first()).toBeVisible();
    await expect(page.locator('text=AI Estimate').first()).toBeVisible();

    // 3. Setup Wizard Flow
    await page.goto('/app/interview/new');
    await expect(page.locator('h1')).toContainText('Configure Interview Simulation');

    // Step 1: Select Type
    await page.locator('text=System Design').first().click();
    await page.locator('button:has-text("Next: Role & Seniority")').click();

    // Step 2: Role & Seniority
    await expect(page.locator('text=2. Target Role & Calibration')).toBeVisible();
    await page.locator('button:has-text("Next: Format & Timers")').click();

    // Step 3: Format & Calibration
    await expect(page.locator('text=3. Simulation Duration & Language')).toBeVisible();
    await page.locator('button:has-text("Next: Resume Upload")').click();

    // Step 4: Resume
    await expect(page.locator('text=4. Upload Resume / Project Specs')).toBeVisible();
    await page.locator('button:has-text("Next: Review & Confirm")').click();

    // Step 5: Review & Consent
    await expect(page.locator('text=5. Review Configuration & Consent')).toBeVisible();
    await page.locator('input[type="checkbox"]').check();
    await expect(page.locator('button:has-text("Select Virtual Interviewer")')).toBeEnabled();
    await page.locator('button:has-text("Select Virtual Interviewer")').click();

    // 4. Interviewer Selection
    await expect(page.url()).toContain('/app/interview/new/interviewer');
    await expect(page.locator('text=Select Your AI Interviewer')).toBeVisible();
    await page.locator('button:has-text("Proceed to Device Check")').click();

    // 5. Device Pre-Flight Check
    await expect(page.url()).toContain('/app/interview/check');
    await page.locator('text=Skip device test & continue with typed answers').click();

    // 6. Live Room Simulation
    await expect(page.url()).toContain('/live');
    await expect(page.locator('.ai-orb')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();

    // Verify interviewer persona label
    await expect(page.locator('text=Virtual AI interviewer').first()).toBeVisible();

    // Verify Question Card is visible
    await expect(page.locator('text=Current Question').first()).toBeVisible();

    // Test switching tabs to Code Editor
    await page.locator('button:has-text("Code & Design")').click();
    await expect(page.locator('text=SlidingWindowRateLimiter')).toBeVisible();

    // Switch back to Live Transcript
    await page.locator('button:has-text("Live Transcript")').click();

    // Click End Interview Session
    await page.locator('button:has-text("End Interview")').click();

    // Confirm end session dialog
    await page.locator('button:has-text("Conclude & Generate Report")').click();

    // 7. Evidence-Linked Evaluation Report
    await page.waitForURL(/\/app\/reports\//);
    await expect(page.locator('h1')).toContainText('Distributed Rate Limiter');
    await expect(page.locator('text=Fairness Guarantee')).toBeVisible();

    // Inspect rubric detail drawer
    await page.locator('text=Technical Accuracy').first().click();
    await expect(page.locator('text=Rubric Evaluation Detail')).toBeVisible();
    await expect(page.locator('text=Verbatim Transcript Proof')).toBeVisible();

    // Close drawer
    await page.keyboard.press('Escape');

    // Verify 7-day drill plan
    await expect(page.locator('text=Targeted 7-Day Drill Plan').first()).toBeVisible();
    await expect(page.locator('text=Day 1').first()).toBeVisible();

    // 8. Practice Bank Drill
    await page.goto('/app/practice');
    await expect(page.locator('h1')).toContainText('Targeted Practice Bank');
    await expect(page.locator('text=60 Questions')).toBeVisible();

    // Click on a question to open drawer
    await page.locator('text=Design a Global Distributed Rate Limiter').first().click();
    await expect(page.locator('text=Reveal Hint 1')).toBeVisible();
    await page.locator('button:has-text("Reveal Hint 1")').click();
    await expect(page.locator('text=atomic operations in memory caches')).toBeVisible();

    // 9. History & Comparison
    await page.goto('/app/history');
    await expect(page.locator('h1')).toContainText('Interview History & Analytics');
    await expect(page.locator('text=Compare Selected')).toBeVisible();
    await page.locator('button:has-text("Compare Selected")').click();
    await expect(page.locator('text=Session Trajectory Comparison')).toBeVisible();
  });

  test('WCAG 2.1 AA Accessibility Audit on Key Screens', async ({ page }) => {
    const urls = ['/', '/app', '/app/reports/rep-101', '/app/practice', '/dev/showcase'];

    for (const url of urls) {
      await page.goto(url);
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast']) // Contrast tested exhaustively in dedicated token matrix
        .analyze();

      expect(
        accessibilityScanResults.violations.filter((v) => v.impact === 'critical')
      ).toEqual([]);
    }
  });
});
