import { test, expect } from '@playwright/test';

test.describe('Interview Question Loop Regression Prevention', () => {
  test('Submitting typed answers progresses questions without repeating previous question', async ({ page }) => {
    // 1. Authorize guest / demo access
    await page.addInitScript(() => {
      localStorage.setItem('prepsphere_guest_mode', 'true');
      localStorage.setItem('prepsphere_onboarding_completed', 'true');
    });

    // 2. Navigate directly to live interview room
    await page.goto('/app/interview/sess-101/live');

    // 3. Question 1 must be visible on the main stage
    const questionCard = page.locator('h2.text-base.font-bold');
    await expect(questionCard).toBeVisible({ timeout: 10000 });
    const q1Text = (await questionCard.textContent())?.trim() || '';
    expect(q1Text.length).toBeGreaterThan(15);

    // 4. Open typed answer dialog
    const keyboardBtn = page.locator('button[title="Type your answer to Gemini"]');
    await keyboardBtn.click();

    // 5. Submit candidate answer
    const textarea = page.locator('textarea.input');
    await expect(textarea).toBeVisible();
    await textarea.fill('I would implement a distributed sliding window rate limiter using Redis with cluster replication.');
    await page.locator('button:has-text("Submit to Agent")').click();

    // Allow state update and dialog close
    await page.waitForTimeout(600);

    // 6. Advance to next planned question
    const nextBtn = page.locator('button[title="Advance to next question"]');
    await nextBtn.click();

    // 7. Verify Question 2 is updated on stage
    await page.waitForTimeout(400);
    const q2Text = (await questionCard.textContent())?.trim() || '';
    expect(q2Text.length).toBeGreaterThan(15);

    // 8. Core Proof: Question 2 text strictly !== Question 1 text
    expect(q2Text).not.toEqual(q1Text);
  });
});
