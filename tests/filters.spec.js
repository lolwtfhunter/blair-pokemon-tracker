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

    // Type to filter
    await searchInput.fill('a');
    await page.waitForTimeout(200);
    const visibleAfterSearch = await page.locator(`${section} .card-item:not([style*="display: none"])`).count();
    expect(visibleAfterSearch).toBeLessThanOrEqual(totalCards);

    // Clear button should be visible
    await expect(clearBtn).toHaveClass(/visible/);

    // Clear restores all cards
    await clearBtn.click();
    await page.waitForTimeout(200);
    const visibleAfterClear = await page.locator(`${section} .card-item:not([style*="display: none"])`).count();
    expect(visibleAfterClear).toBe(totalCards);
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
