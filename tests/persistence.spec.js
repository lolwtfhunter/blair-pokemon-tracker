// @ts-check
const { test, expect } = require('@playwright/test');

// Helper: seed sync code and clear collection data, then navigate
async function freshStart(page) {
  await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
  await page.goto('/about.html');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('blair_sync_code', 'Blair2024');
  });
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
}

test.describe('Persistence', () => {
  test('collection should be saved to localStorage', async ({ page }) => {
    await freshStart(page);

    // Navigate to a set
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    // Toggle a variant
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const variantContainer = firstCard.locator('input[type="checkbox"]').first().locator('..');
    await variantContainer.click();
    await page.waitForTimeout(300);

    // Check localStorage has data
    const savedData = await page.evaluate(() => localStorage.getItem('pokemonVariantProgress'));
    expect(savedData).not.toBeNull();
    const parsed = JSON.parse(savedData);
    expect(Object.keys(parsed).length).toBeGreaterThan(0);
  });

  test('collection should survive page reload', async ({ page }) => {
    await freshStart(page);

    // Navigate to a set
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    // Get the set key from the active set button
    const setKey = await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn.active').getAttribute('data-set-key');

    // Toggle the first card's first variant
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const variantContainer = firstCard.locator('input[type="checkbox"]').first().locator('..');
    await variantContainer.click();
    await page.waitForTimeout(300);

    // Reload the page (sync code persists in localStorage)
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    // Navigate back to the same set
    await page.locator('.block-btn').first().click();
    await page.locator(`#pokemon-tcg-content .set-buttons.active .set-btn[data-set-key="${setKey}"]`).click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    // The first card's first checkbox should still be checked
    const restoredCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const restoredCheckbox = restoredCard.locator('input[type="checkbox"]').first();
    await expect(restoredCheckbox).toBeChecked();
  });

  test('progress counters should restore after reload', async ({ page }) => {
    await freshStart(page);

    // Navigate and toggle a variant
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const variantContainer = firstCard.locator('input[type="checkbox"]').first().locator('..');
    await variantContainer.click();
    await page.waitForTimeout(300);

    // Read the progress from the block button
    const blockBtnStats = await page.locator('.block-btn.active .block-btn-stats').textContent();

    // Reload
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    // Block button should show same progress
    const restoredStats = await page.locator('.block-btn').first().locator('.block-btn-stats').textContent();
    expect(restoredStats).toBe(blockBtnStats);
  });
});
