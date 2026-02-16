// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
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

  test('app loads with tabs, block buttons, and Pokemon tab active', async ({ page }) => {
    const tabs = page.locator('.top-tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveText('Pokemon');
    await expect(tabs.nth(1)).toHaveText('Custom Sets');
    await expect(tabs.nth(2)).toHaveText('Disney Lorcana');

    await expect(page.locator('.top-tab').first()).toHaveClass(/active/);
    await expect(page.locator('#pokemon-tcg-content')).toHaveClass(/active/);

    const blockButtons = page.locator('.block-btn');
    const count = await blockButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('tab switching works for all three tabs', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await expect(page.locator('#custom-sets-content')).toHaveClass(/active/);
    await expect(page.locator('#pokemon-tcg-content')).not.toHaveClass(/active/);

    await page.locator('.top-tab', { hasText: 'Disney Lorcana' }).click();
    await expect(page.locator('#lorcana-content')).toHaveClass(/active/);
    await expect(page.locator('#custom-sets-content')).not.toHaveClass(/active/);

    await page.locator('.top-tab', { hasText: 'Pokemon' }).click();
    await expect(page.locator('#pokemon-tcg-content')).toHaveClass(/active/);
  });

  test('block and set selection shows cards', async ({ page }) => {
    const firstBlock = page.locator('.block-btn').first();
    await firstBlock.click();
    await expect(firstBlock).toHaveClass(/active/);

    const activeSetButtons = page.locator('#pokemon-tcg-content .set-buttons.active');
    await expect(activeSetButtons).toHaveCount(1);
    const setButtons = activeSetButtons.locator('.set-btn');
    const count = await setButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await setButtons.first().click();
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('deselecting block and set hides content', async ({ page }) => {
    const firstBlock = page.locator('.block-btn').first();
    await firstBlock.click();
    await expect(firstBlock).toHaveClass(/active/);

    await firstBlock.click();
    await expect(firstBlock).not.toHaveClass(/active/);
    const activeSetButtons = page.locator('#pokemon-tcg-content .set-buttons.active');
    await expect(activeSetButtons).toHaveCount(0);
  });
});
