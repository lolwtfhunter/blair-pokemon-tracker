// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Persistence', () => {
  test('toggle, reload, verify checkbox and progress persist', async ({ page }) => {
    // Block ALL external requests — only allow localhost. Prevents Firebase sync from ever touching production data.
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
      return route.fulfill({ body: '', contentType: 'text/plain' });
    });
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('blair_sync_code', 'Blair2024');
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
    const variantContainer = firstCard.locator('input[type="checkbox"]').first().locator('..');
    await variantContainer.click();
    await page.waitForTimeout(300);

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
