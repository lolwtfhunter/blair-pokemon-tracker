// @ts-check
const { test, expect } = require('@playwright/test');
const { blockExternalRequests } = require('./helpers');

test.describe('Persistence', () => {
  test('toggle, reload, verify checkbox and progress persist', async ({ page }) => {
    await blockExternalRequests(page);
    await page.addInitScript(() => {
      window.__TEST_AUTH_USER = { uid: 'test-123', email: 'test@test.com', displayName: 'Test' };
      // Only clear on first load, not on reload — sessionStorage persists within tab session
      if (!sessionStorage.getItem('__test_cleared')) {
        sessionStorage.setItem('__test_cleared', '1');
        localStorage.clear();
      }
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    // Navigate to a set
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    const setKey = await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn.active').getAttribute('data-set-key');

    // Toggle a variant
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkbox = firstCard.locator('input[type="checkbox"]').first();
    const variantContainer = checkbox.locator('..');
    await variantContainer.click();
    await expect(checkbox).toBeChecked();

    // Read progress from the block button
    const blockBtnStats = await page.locator('.block-btn.active .block-btn-stats').textContent();

    // Reload
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    // Block button progress should match
    const restoredStats = await page.locator('.block-btn').first().locator('.block-btn-stats').textContent();
    expect(restoredStats).toBe(blockBtnStats);

    // Navigate back to same set
    await page.locator('.block-btn').first().click();
    await page.locator(`#pokemon-tcg-content .set-buttons.active .set-btn[data-set-key="${setKey}"]`).click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    // Checkbox should still be checked
    const restoredCheckbox = page.locator('#pokemon-tcg-content .set-section.active .card-item').first().locator('input[type="checkbox"]').first();
    await expect(restoredCheckbox).toBeChecked();
  });
});
