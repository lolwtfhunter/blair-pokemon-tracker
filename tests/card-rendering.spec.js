// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Card Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
  });

  test('no cards should be visible before selecting a set', async ({ page }) => {
    // All card grids should be empty or hidden
    const visibleCards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    await expect(visibleCards).toHaveCount(0);
  });

  test('cards should appear when a set is selected', async ({ page }) => {
    // Click the first block button
    await page.locator('.block-btn').first().click();

    // Click the first set button
    const setBtn = page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first();
    await setBtn.click();

    // Cards should now be visible
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each card should display name, number, and rarity', async ({ page }) => {
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();

    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();

    // Card should have name
    const cardName = firstCard.locator('.card-name');
    await expect(cardName).not.toBeEmpty();

    // Card should have number
    const cardNumber = firstCard.locator('.card-number');
    await expect(cardNumber).toContainText('#');

    // Card should have rarity badge
    const rarityBadge = firstCard.locator('.rarity-badge');
    await expect(rarityBadge).toBeVisible();
  });

  test('each card should have an image element', async ({ page }) => {
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();

    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const img = firstCard.locator('.card-img-wrapper img');
    await expect(img).toHaveAttribute('src', /.+/);
  });

  test('cards should have variant checkboxes', async ({ page }) => {
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();

    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const variantsSection = firstCard.locator('.variants-section');
    await expect(variantsSection).toBeVisible();

    // Should have at least one checkbox (single variant or multi-variant)
    const checkboxes = firstCard.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('images should use lazy loading', async ({ page }) => {
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();

    const images = page.locator('#pokemon-tcg-content .set-section.active .card-img-wrapper img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    // Check first few images for lazy loading attribute
    const checkCount = Math.min(count, 5);
    for (let i = 0; i < checkCount; i++) {
      await expect(images.nth(i)).toHaveAttribute('loading', 'lazy');
    }
  });
});
