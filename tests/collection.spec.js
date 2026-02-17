// @ts-check
const { test, expect } = require('@playwright/test');
const { navigateToFirstSet } = require('./helpers');

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

    await expect(checkbox).toBeChecked();

    const updatedStats = await activeSetBtn.locator('.set-btn-stats').textContent();
    expect(updatedStats).not.toBe(initialStats);
  });

  test('completed card shows lock icon', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkboxCount = await firstCard.locator('input[type="checkbox"]').count();

    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
      const cb = card.locator('input[type="checkbox"]').nth(i);
      const container = cb.locator('..');
      await container.click();
      await expect(cb).toBeChecked();
    }

    const completedCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await expect(completedCard.locator('.completed-lock')).toBeVisible();
  });

  test('unchecking variant on completed card shows confirmation toast', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const checkboxCount = await firstCard.locator('input[type="checkbox"]').count();

    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
      const cb = card.locator('input[type="checkbox"]').nth(i);
      const container = cb.locator('..');
      await container.click();
      await expect(cb).toBeChecked();
    }

    const completedCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const container = completedCard.locator('input[type="checkbox"]').first().locator('..');
    await container.click();

    const toast = page.locator('.unlock-toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('Uncheck');
  });
});
