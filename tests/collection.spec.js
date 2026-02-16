// @ts-check
const { test, expect } = require('@playwright/test');

// Helper to navigate to a set with cards
async function navigateToFirstSet(page) {
  await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.goto('/about.html');
  await page.evaluate(() => {
    localStorage.setItem('blair_sync_code', 'Blair2024');
    localStorage.removeItem('pokemonVariantProgress');
  });
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
  await page.locator('.block-btn').first().click();
  await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
  await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');
}

test.describe('Collection Management', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFirstSet(page);
  });

  test('toggling a variant checkbox should check it', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkbox = firstCard.locator('input[type="checkbox"]').first();

    // Should start unchecked (clean state)
    await expect(checkbox).not.toBeChecked();

    // Click the variant container (the checkbox's parent div handles the toggle)
    const variantContainer = checkbox.locator('..');
    await variantContainer.click();

    // After re-render, the card should reflect the checked state
    await page.waitForTimeout(300);

    // Re-query after re-render
    const updatedFirstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const updatedCheckbox = updatedFirstCard.locator('input[type="checkbox"]').first();
    await expect(updatedCheckbox).toBeChecked();
  });

  test('progress bar should update after toggling a variant', async ({ page }) => {
    // Get initial progress text from the active set button
    const activeSetBtn = page.locator('#pokemon-tcg-content .set-buttons.active .set-btn.active');
    const initialStats = await activeSetBtn.locator('.set-btn-stats').textContent();

    // Toggle a variant
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const variantContainer = firstCard.locator('input[type="checkbox"]').first().locator('..');
    await variantContainer.click();
    await page.waitForTimeout(300);

    // Check that progress updated
    const updatedStats = await activeSetBtn.locator('.set-btn-stats').textContent();
    expect(updatedStats).not.toBe(initialStats);
  });

  test('completed card should show lock icon', async ({ page }) => {
    // Find a card and check all its variants to make it "complete"
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkboxes = firstCard.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    // Toggle all checkboxes to complete the card
    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
      const container = card.locator('input[type="checkbox"]').nth(i).locator('..');
      await container.click();
      await page.waitForTimeout(300);
    }

    // After all variants checked, card should have completed lock
    const completedCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const lock = completedCard.locator('.completed-lock');
    await expect(lock).toBeVisible();
  });

  test('unchecking a variant on a completed card should show confirmation toast', async ({ page }) => {
    // Complete the first card
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkboxes = firstCard.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
      const container = card.locator('input[type="checkbox"]').nth(i).locator('..');
      await container.click();
      await page.waitForTimeout(300);
    }

    // Now try to uncheck the first variant — should trigger confirmation toast
    const completedCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const container = completedCard.locator('input[type="checkbox"]').first().locator('..');
    await container.click();

    // Toast should appear
    const toast = page.locator('.unlock-toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('Uncheck');
  });
});
