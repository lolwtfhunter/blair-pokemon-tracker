// @ts-check
const { test, expect } = require('@playwright/test');
const { setupPage } = require('./helpers');

test.describe('Card Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('no cards visible before selecting a set', async ({ page }) => {
    const visibleCards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    await expect(visibleCards).toHaveCount(0);
  });

  test('set selection renders cards with name, number, rarity, and variant checkboxes', async ({ page }) => {
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();

    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();

    // Name
    await expect(firstCard.locator('.card-name')).not.toBeEmpty();

    // Number
    await expect(firstCard.locator('.card-number')).toContainText('#');

    // Rarity badge
    await expect(firstCard.locator('.rarity-badge')).toBeVisible();

    // Variant checkboxes
    await expect(firstCard.locator('.variants-section')).toBeVisible();
    const checkboxes = firstCard.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
