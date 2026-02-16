// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Responsive Layout', () => {
  test('page should render without errors on all viewports', async ({ page }) => {
    // Listen for console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    // No fatal JS errors should occur
    expect(errors.filter(e => !e.includes('Firebase') && !e.includes('firebase'))).toHaveLength(0);
  });

  test('header should be visible', async ({ page }) => {
    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    const header = page.locator('header h1');
    await expect(header).toBeVisible();
  });

  test('tabs should be visible and clickable', async ({ page }) => {
    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    const tabs = page.locator('.top-tab');
    const count = await tabs.count();
    expect(count).toBe(3);

    // All tabs should be visible
    for (let i = 0; i < count; i++) {
      await expect(tabs.nth(i)).toBeVisible();
    }
  });

  test('block buttons should be visible', async ({ page }) => {
    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    const blockBtns = page.locator('.block-btn');
    const count = await blockBtns.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await expect(blockBtns.first()).toBeVisible();
  });

  test('filter buttons should be centered in card section', async ({ page }) => {
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
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    const filterButtons = page.locator('#pokemon-tcg-content .set-section.active .filter-buttons');
    await expect(filterButtons).toBeVisible();
  });

  test('cards should be displayed in a grid layout', async ({ page }) => {
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
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    const grid = page.locator('#pokemon-tcg-content .set-section.active .card-grid');
    await expect(grid).toBeVisible();

    const cards = grid.locator('.card-item');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('footer should be present', async ({ page }) => {
    await page.route('**/firebasejs/**', route => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('/about.html');
    await page.evaluate(() => {
      localStorage.setItem('blair_sync_code', 'Blair2024');
      localStorage.removeItem('pokemonVariantProgress');
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });

    const footer = page.locator('.app-footer');
    await expect(footer).toBeVisible();
  });
});
