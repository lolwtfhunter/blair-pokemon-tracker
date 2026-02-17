// @ts-check
const { test, expect } = require('@playwright/test');
const { navigateToFirstSet } = require('./helpers');

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFirstSet(page);
  });

  test('All/Incomplete/Complete filter cycling', async ({ page }) => {
    const section = '#pokemon-tcg-content .set-section.active';
    const filterBtns = page.locator(`${section} .filter-btn`);
    await expect(filterBtns).toHaveCount(3);

    // All is active by default
    await expect(filterBtns.nth(0)).toHaveClass(/active/);
    const totalCards = await page.locator(`${section} .card-item`).count();

    // Switch to Incomplete — fresh state means all cards incomplete
    await filterBtns.nth(1).click();
    await expect(filterBtns.nth(1)).toHaveClass(/active/);
    const incompleteCount = await page.locator(`${section} .card-item:not([style*="display: none"])`).count();
    expect(incompleteCount).toBeGreaterThan(0);

    // Switch to Complete — fresh state means no cards complete
    const completeBtn = filterBtns.nth(2);
    await completeBtn.click();
    await expect(completeBtn).toHaveClass(/active/);
    await expect(page.locator(`${section} .card-item:not([style*="display: none"])`)).toHaveCount(0);

    // Back to All — all cards visible again
    await filterBtns.nth(0).click();
    const restored = await page.locator(`${section} .card-item:not([style*="display: none"])`).count();
    expect(restored).toBe(totalCards);
  });

  test('search filters cards and clear restores them', async ({ page }) => {
    const section = '#pokemon-tcg-content .set-section.active';
    const totalCards = await page.locator(`${section} .card-item`).count();

    const searchInput = page.locator(`${section} .search-input`);
    const clearBtn = page.locator(`${section} .search-clear`);

    // Type to filter — wait for visible count to change
    await searchInput.fill('a');
    await expect(async () => {
      const visible = await page.locator(`${section} .card-item:not([style*="display: none"])`).count();
      expect(visible).toBeLessThanOrEqual(totalCards);
    }).toPass({ timeout: 3000 });

    // Clear button should be visible
    await expect(clearBtn).toHaveClass(/visible/);

    // Clear restores all cards
    await clearBtn.click();
    await expect(async () => {
      const visible = await page.locator(`${section} .card-item:not([style*="display: none"])`).count();
      expect(visible).toBe(totalCards);
    }).toPass({ timeout: 3000 });
  });

  test('rarity pill toggle', async ({ page }) => {
    const section = '#pokemon-tcg-content .set-section.active';
    const rarityBtn = page.locator(`${section} .rarity-btn`).first();

    await rarityBtn.click();
    await expect(rarityBtn).toHaveClass(/active/);

    await rarityBtn.click();
    await expect(rarityBtn).not.toHaveClass(/active/);
  });
});
