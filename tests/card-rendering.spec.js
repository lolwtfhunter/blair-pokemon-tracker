// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Card Rendering', () => {
  test.beforeEach(async ({ page }) => {
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
