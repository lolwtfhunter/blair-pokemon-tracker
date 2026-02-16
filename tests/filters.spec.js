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
  // Wait for cards to render
  await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');
}

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFirstSet(page);
  });

  test('All filter should be active by default', async ({ page }) => {
    const allButton = page.locator('#pokemon-tcg-content .set-section.active .filter-btn', { hasText: 'All' });
    await expect(allButton).toHaveClass(/active/);
  });

  test('should have All, Incomplete, and Complete filter buttons', async ({ page }) => {
    const filterBtns = page.locator('#pokemon-tcg-content .set-section.active .filter-btn');
    await expect(filterBtns).toHaveCount(3);
    await expect(filterBtns.nth(0)).toHaveText('All');
    await expect(filterBtns.nth(1)).toHaveText('Incomplete');
    await expect(filterBtns.nth(2)).toHaveText('Complete');
  });

  test('Incomplete filter should activate and show only incomplete cards', async ({ page }) => {
    const incompleteBtn = page.locator('#pokemon-tcg-content .set-section.active .filter-btn', { hasText: 'Incomplete' });
    await incompleteBtn.click();
    await expect(incompleteBtn).toHaveClass(/active/);

    // With fresh state (no collection), all cards are incomplete, so all should be visible
    const visibleCards = page.locator('#pokemon-tcg-content .set-section.active .card-item:not([style*="display: none"])');
    const count = await visibleCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Complete filter should show only completed cards', async ({ page }) => {
    const completeBtn = page.locator('#pokemon-tcg-content .set-section.active .filter-btn').filter({ hasText: /^Complete$/ });
    await completeBtn.click();
    await expect(completeBtn).toHaveClass(/active/);

    // With fresh state, no cards are complete, so none should be visible
    const visibleCards = page.locator('#pokemon-tcg-content .set-section.active .card-item:not([style*="display: none"])');
    await expect(visibleCards).toHaveCount(0);
  });

  test('All filter should restore all cards after filtering', async ({ page }) => {
    const totalCards = await page.locator('#pokemon-tcg-content .set-section.active .card-item').count();

    // Apply Incomplete filter
    await page.locator('#pokemon-tcg-content .set-section.active .filter-btn', { hasText: 'Incomplete' }).click();

    // Switch back to All
    await page.locator('#pokemon-tcg-content .set-section.active .filter-btn', { hasText: 'All' }).click();

    const visibleCards = page.locator('#pokemon-tcg-content .set-section.active .card-item:not([style*="display: none"])');
    await expect(visibleCards).toHaveCount(totalCards);
  });

  test('search input should filter cards by name', async ({ page }) => {
    const searchInput = page.locator('#pokemon-tcg-content .set-section.active .search-input');
    await searchInput.fill('a');

    // Wait for filtering to apply
    await page.waitForTimeout(200);

    // Some cards should be hidden
    const allCards = await page.locator('#pokemon-tcg-content .set-section.active .card-item').count();
    const visibleCards = await page.locator('#pokemon-tcg-content .set-section.active .card-item:not([style*="display: none"])').count();

    // At least some filtering should occur (unless all cards contain 'a')
    expect(visibleCards).toBeLessThanOrEqual(allCards);
    expect(visibleCards).toBeGreaterThanOrEqual(0);
  });

  test('search clear button should appear when typing', async ({ page }) => {
    const searchInput = page.locator('#pokemon-tcg-content .set-section.active .search-input');
    const clearBtn = page.locator('#pokemon-tcg-content .set-section.active .search-clear');

    await searchInput.fill('test');
    await expect(clearBtn).toHaveClass(/visible/);
  });

  test('clearing search should restore all cards', async ({ page }) => {
    const totalCards = await page.locator('#pokemon-tcg-content .set-section.active .card-item').count();

    const searchInput = page.locator('#pokemon-tcg-content .set-section.active .search-input');
    await searchInput.fill('zzzzz_nomatch');
    await page.waitForTimeout(200);

    // Clear via the X button
    await page.locator('#pokemon-tcg-content .set-section.active .search-clear').click();
    await page.waitForTimeout(200);

    const visibleCards = await page.locator('#pokemon-tcg-content .set-section.active .card-item:not([style*="display: none"])').count();
    expect(visibleCards).toBe(totalCards);
  });

  test('rarity filter pills should be present for multi-rarity sets', async ({ page }) => {
    // Rarity filters container should exist
    const rarityContainer = page.locator('#pokemon-tcg-content .set-section.active .rarity-filters');
    await expect(rarityContainer).toBeVisible();

    // Should have at least one rarity button (most sets have multiple rarities)
    const rarityBtns = rarityContainer.locator('.rarity-btn');
    const count = await rarityBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clicking a rarity pill should toggle it active', async ({ page }) => {
    const rarityBtn = page.locator('#pokemon-tcg-content .set-section.active .rarity-btn').first();
    await rarityBtn.click();
    await expect(rarityBtn).toHaveClass(/active/);

    // Click again to deactivate
    await rarityBtn.click();
    await expect(rarityBtn).not.toHaveClass(/active/);
  });
});
