// @ts-check
const { test, expect } = require('@playwright/test');

async function navigateToFirstSet(page) {
  // Block ALL external requests — only allow localhost. Prevents Firebase sync from ever touching production data.
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
    return route.fulfill({ body: '', contentType: 'text/plain' });
  });
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

  test('toggle variant checks it and updates progress bar', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkbox = firstCard.locator('input[type="checkbox"]').first();
    await expect(checkbox).not.toBeChecked();

    const activeSetBtn = page.locator('#pokemon-tcg-content .set-buttons.active .set-btn.active');
    const initialStats = await activeSetBtn.locator('.set-btn-stats').textContent();

    const variantContainer = checkbox.locator('..');
    await variantContainer.click();
    await page.waitForTimeout(300);

    const updatedCheckbox = page.locator('#pokemon-tcg-content .set-section.active .card-item').first().locator('input[type="checkbox"]').first();
    await expect(updatedCheckbox).toBeChecked();

    const updatedStats = await activeSetBtn.locator('.set-btn-stats').textContent();
    expect(updatedStats).not.toBe(initialStats);
  });

  test('completed card shows lock icon', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkboxCount = await firstCard.locator('input[type="checkbox"]').count();

    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
      const container = card.locator('input[type="checkbox"]').nth(i).locator('..');
      await container.click();
      await page.waitForTimeout(300);
    }

    const completedCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await expect(completedCard.locator('.completed-lock')).toBeVisible();
  });

  test('unchecking variant on completed card shows confirmation toast', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkboxCount = await firstCard.locator('input[type="checkbox"]').count();

    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
      const container = card.locator('input[type="checkbox"]').nth(i).locator('..');
      await container.click();
      await page.waitForTimeout(300);
    }

    const completedCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const container = completedCard.locator('input[type="checkbox"]').first().locator('..');
    await container.click();

    const toast = page.locator('.unlock-toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('Uncheck');
  });
});
