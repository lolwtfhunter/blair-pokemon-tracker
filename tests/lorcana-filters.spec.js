// @ts-check
const { test, expect } = require('@playwright/test');
const { navigateToLorcanaSet } = require('./helpers');

test.describe('Lorcana Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLorcanaSet(page);
  });

  test('Incomplete filter persists after toggling a card variant', async ({ page }) => {
    const section = '#lorcana-content .set-section.active';

    // Switch to Incomplete filter
    const filterBtns = page.locator(`${section} .filter-btn`);
    await filterBtns.nth(1).click(); // "Incomplete"
    await expect(filterBtns.nth(1)).toHaveClass(/active/);

    // Count visible cards under Incomplete filter (all should be visible since none collected)
    const visibleBefore = await page.locator(`${section} .card:not([style*="display: none"])`).count();
    expect(visibleBefore).toBeGreaterThan(0);

    // Toggle the first card's checkbox to mark it as collected
    const firstCard = page.locator(`${section} .card:not([style*="display: none"])`).first();
    const cardNumber = await firstCard.getAttribute('data-card-number');
    await firstCard.locator('.single-variant').click();

    // The toggled card should now be hidden (it's complete, filter is Incomplete)
    const toggledCard = page.locator(`${section} .card[data-card-number="${cardNumber}"]`);
    await expect(toggledCard).toHaveCSS('display', 'none');

    // Other incomplete cards should still be visible
    const visibleAfter = await page.locator(`${section} .card:not([style*="display: none"])`).count();
    expect(visibleAfter).toBe(visibleBefore - 1);
  });

  test('Complete filter persists after toggling a card variant', async ({ page }) => {
    const section = '#lorcana-content .set-section.active';

    // Switch to Complete filter — initially no cards should be visible
    const filterBtns = page.locator(`${section} .filter-btn`);
    await filterBtns.nth(2).click(); // "Complete"
    await expect(filterBtns.nth(2)).toHaveClass(/active/);
    await expect(page.locator(`${section} .card:not([style*="display: none"])`)).toHaveCount(0);

    // Switch back to All, toggle a card, then switch to Complete
    await filterBtns.nth(0).click(); // "All"
    const firstCard = page.locator(`${section} .card`).first();
    await firstCard.locator('.single-variant').click();

    // Wait for the card to get the completed class
    await expect(firstCard).toHaveClass(/completed/);

    // Now switch to Complete — should show exactly 1 card
    await filterBtns.nth(2).click(); // "Complete"
    await expect(filterBtns.nth(2)).toHaveClass(/active/);
    await expect(page.locator(`${section} .card:not([style*="display: none"])`)).toHaveCount(1);
  });
});
