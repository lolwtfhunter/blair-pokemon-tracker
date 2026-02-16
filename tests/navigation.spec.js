// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Block Firebase SDK from loading to prevent production data sync
    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    // Set sync code to bypass the sync modal
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
  });

  test('should display all three top-level tabs', async ({ page }) => {
    const tabs = page.locator('.top-tab');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveText('Pokemon');
    await expect(tabs.nth(1)).toHaveText('Custom Sets');
    await expect(tabs.nth(2)).toHaveText('Disney Lorcana');
  });

  test('Pokemon tab should be active by default', async ({ page }) => {
    await expect(page.locator('.top-tab').first()).toHaveClass(/active/);
    await expect(page.locator('#pokemon-tcg-content')).toHaveClass(/active/);
  });

  test('should switch to Custom Sets tab', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await expect(page.locator('#custom-sets-content')).toHaveClass(/active/);
    await expect(page.locator('#pokemon-tcg-content')).not.toHaveClass(/active/);
  });

  test('should switch to Disney Lorcana tab', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Disney Lorcana' }).click();
    await expect(page.locator('#lorcana-content')).toHaveClass(/active/);
    await expect(page.locator('#pokemon-tcg-content')).not.toHaveClass(/active/);
  });

  test('should switch back to Pokemon tab from another tab', async ({ page }) => {
    await page.locator('.top-tab', { hasText: 'Custom Sets' }).click();
    await page.locator('.top-tab', { hasText: 'Pokemon' }).click();
    await expect(page.locator('#pokemon-tcg-content')).toHaveClass(/active/);
  });

  test('should display block buttons in Pokemon tab', async ({ page }) => {
    const blockButtons = page.locator('.block-btn');
    const count = await blockButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clicking a block button should show set buttons', async ({ page }) => {
    const firstBlock = page.locator('.block-btn').first();
    await firstBlock.click();
    await expect(firstBlock).toHaveClass(/active/);

    // At least one set-buttons container should become active
    const activeSetButtons = page.locator('#pokemon-tcg-content .set-buttons.active');
    await expect(activeSetButtons).toHaveCount(1);
  });

  test('clicking a block button should reveal set buttons for that block', async ({ page }) => {
    const firstBlock = page.locator('.block-btn').first();
    await firstBlock.click();

    // Set buttons should now be visible in the active container
    const activeContainer = page.locator('#pokemon-tcg-content .set-buttons.active');
    const setButtons = activeContainer.locator('.set-btn');
    const count = await setButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('no set section should be visible before selecting a set', async ({ page }) => {
    // Click a block first
    await page.locator('.block-btn').first().click();
    // No set section should be active yet
    const activeSections = page.locator('#pokemon-tcg-content .set-section.active');
    await expect(activeSections).toHaveCount(0);
  });

  test('clicking active block again should deselect it', async ({ page }) => {
    const firstBlock = page.locator('.block-btn').first();
    await firstBlock.click();
    await expect(firstBlock).toHaveClass(/active/);

    // Click again to deselect
    await firstBlock.click();
    await expect(firstBlock).not.toHaveClass(/active/);

    // Set buttons should be hidden
    const activeSetButtons = page.locator('#pokemon-tcg-content .set-buttons.active');
    await expect(activeSetButtons).toHaveCount(0);
  });
});
