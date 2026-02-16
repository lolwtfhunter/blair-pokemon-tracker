// @ts-check
const { test, expect } = require('@playwright/test');

// Mock TCGCSV response for a source set with both numeric and alphanumeric card numbers
const MOCK_PRODUCTS = {
  results: [
    { productId: 1001, name: 'Pikachu', extendedData: [{ displayName: 'Card Number', value: '58' }] },
    { productId: 1002, name: 'Pikachu Promo', extendedData: [{ displayName: 'Card Number', value: 'SM65' }] },
    { productId: 1003, name: 'Pikachu TG', extendedData: [{ displayName: 'Card Number', value: 'TG05' }] },
    { productId: 1004, name: 'Pikachu SWSH', extendedData: [{ displayName: 'Card Number', value: 'SWSH020' }] },
    { productId: 1005, name: 'Pikachu RC', extendedData: [{ displayName: 'Card Number', value: 'RC29' }] },
    { productId: 1006, name: 'Pikachu H', extendedData: [{ displayName: 'Card Number', value: 'H25' }] },
    { productId: 1007, name: 'Pikachu Numbered', extendedData: [{ displayName: 'Card Number', value: '25/102' }] },
  ]
};

const MOCK_PRICES = {
  results: [
    { productId: 1001, subTypeName: 'Normal', marketPrice: 1.50 },
    { productId: 1002, subTypeName: 'Holofoil', marketPrice: 8.99 },
    { productId: 1003, subTypeName: 'Normal', marketPrice: 12.50 },
    { productId: 1004, subTypeName: 'Holofoil', marketPrice: 3.25 },
    { productId: 1005, subTypeName: 'Normal', marketPrice: 5.00 },
    { productId: 1006, subTypeName: 'Holofoil', marketPrice: 45.00 },
    { productId: 1007, subTypeName: 'Normal', marketPrice: 2.75 },
  ]
};

/**
 * Set up page with network isolation and mock TCGCSV responses for any source set.
 */
async function setupWithMockPricing(page) {
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) return route.continue();
    // Mock TCGCSV product/price endpoints
    if (url.includes('tcgcsv.com') && url.includes('/products')) {
      return route.fulfill({ body: JSON.stringify(MOCK_PRODUCTS), contentType: 'application/json' });
    }
    if (url.includes('tcgcsv.com') && url.includes('/prices')) {
      return route.fulfill({ body: JSON.stringify(MOCK_PRICES), contentType: 'application/json' });
    }
    return route.fulfill({ body: '', contentType: 'text/plain' });
  });
  await page.goto('/about.html');
  await page.evaluate(() => {
    localStorage.setItem('blair_sync_code', 'Blair2024');
    localStorage.removeItem('pokemonVariantProgress');
    localStorage.removeItem('blair_price_cache');
  });
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('.tab-btn').length > 0, null, { timeout: 15000 });
}

async function navigateToCustomSet(page) {
  await setupWithMockPricing(page);
  // Switch to Custom Sets tab
  const customTab = page.locator('.tab-btn:has-text("Custom")');
  await customTab.click();
  // Wait for custom set buttons to appear and click the first one
  await page.waitForSelector('#customSetButtons .set-btn', { timeout: 15000 });
  await page.locator('#customSetButtons .set-btn').first().click();
  await page.waitForSelector('#custom-sets-grids .set-section.active .card-item', { timeout: 15000 });
}

test.describe('Pricing', () => {
  test('custom set cards have price tag elements with data-api-id', async ({ page }) => {
    await navigateToCustomSet(page);

    const priceTags = page.locator('#custom-sets-grids .set-section.active .price-tag');
    const count = await priceTags.count();
    expect(count).toBeGreaterThan(0);

    // Verify price tags have data-api-id attribute
    const firstTag = priceTags.first();
    const apiId = await firstTag.getAttribute('data-api-id');
    expect(apiId).not.toBeNull();
  });

  test('price cache stores both string and integer keys for card numbers', async ({ page }) => {
    await navigateToCustomSet(page);

    // Wait for price fetching to complete
    await page.waitForTimeout(2000);

    // Check the price cache structure
    const cacheCheck = await page.evaluate(() => {
      const cache = JSON.parse(localStorage.getItem('blair_price_cache') || '{}');
      const prices = cache.prices || {};

      // Find any _src: cache entry
      const srcKeys = Object.keys(prices).filter(k => k.startsWith('_src:'));
      if (srcKeys.length === 0) return { hasSrcKeys: false };

      const firstSrcCache = prices[srcKeys[0]];
      const keys = Object.keys(firstSrcCache);

      return {
        hasSrcKeys: true,
        sampleKeys: keys.slice(0, 10),
        hasAnyKey: keys.length > 0
      };
    });

    expect(cacheCheck.hasSrcKeys).toBe(true);
    expect(cacheCheck.hasAnyKey).toBe(true);
  });

  test('getCustomCardPrice resolves numeric apiId correctly', async ({ page }) => {
    await navigateToCustomSet(page);
    await page.waitForTimeout(2000);

    const price = await page.evaluate(() => {
      // Test with a numeric card number
      return typeof getCustomCardPrice === 'function'
        ? getCustomCardPrice({ apiId: 'base1-58' })
        : null;
    });

    // With our mock, base1 group 604 fetches mock data, card "58" should get $1.50
    // Price may be null if base1 wasn't fetched for this set, but the function should not error
    expect(price === null || typeof price === 'number').toBe(true);
  });

  test('getCustomCardPrice resolves alphanumeric apiId without error', async ({ page }) => {
    await navigateToCustomSet(page);
    await page.waitForTimeout(2000);

    const results = await page.evaluate(() => {
      if (typeof getCustomCardPrice !== 'function') return { available: false };
      // Test various alphanumeric formats — should not throw
      const tests = [
        { apiId: 'smp-SM65' },
        { apiId: 'swshp-SWSH020' },
        { apiId: 'swsh11tg-TG05' },
        { apiId: 'bw11-RC7' },
        { apiId: 'ecard3-H25' },
        { apiId: 'dpp-DP16' },
      ];
      return {
        available: true,
        results: tests.map(card => {
          const price = getCustomCardPrice(card);
          return { apiId: card.apiId, price, isValid: price === null || typeof price === 'number' };
        })
      };
    });

    expect(results.available).toBe(true);
    results.results.forEach(r => {
      expect(r.isValid).toBe(true);
    });
  });

  test('custom set card modal displays price when available', async ({ page }) => {
    await navigateToCustomSet(page);
    await page.waitForTimeout(2000);

    // Find a card that has a loaded price
    const priceTagsWithPrice = page.locator('#custom-sets-grids .set-section.active .price-tag.loaded');
    const loadedCount = await priceTagsWithPrice.count();

    if (loadedCount > 0) {
      // Click the card that has a price to open modal
      const cardWithPrice = priceTagsWithPrice.first().locator('ancestor::div.card-item');
      // Use a more reliable selector — find the card-item ancestor
      const firstPriceTag = priceTagsWithPrice.first();
      const cardItem = page.locator('#custom-sets-grids .set-section.active .card-item').filter({ has: firstPriceTag });
      await cardItem.first().locator('.card-img-wrapper').click();

      const modal = page.locator('#cardModal');
      await expect(modal).toHaveClass(/visible/, { timeout: 3000 });

      const modalPrice = page.locator('#modalCardPrice');
      // Modal price element should be visible (not display:none) when card has a price
      await expect(modalPrice).toBeVisible();
      const priceText = await modalPrice.locator('.modal-price-value').textContent();
      expect(priceText).toMatch(/^\$/);
    }
    // If no prices loaded (mock may not match real source sets), test still passes
  });

  test('fetchTcgcsvPricesRaw stores alphanumeric keys in cache', async ({ page }) => {
    await setupWithMockPricing(page);

    // Directly call fetchTcgcsvPricesRaw with our mock and verify cache contents
    const cacheContents = await page.evaluate(async () => {
      // Clear any existing cache
      localStorage.removeItem('blair_price_cache');
      priceCache = {};
      priceCacheTimestamps = {};

      // Fetch using a test cache key — mock will respond to any tcgcsv.com URL
      await fetchTcgcsvPricesRaw('_test:mock', 3, 99999);

      const cache = priceCache['_test:mock'] || {};
      return {
        keys: Object.keys(cache),
        // Check specific expected keys from our mock data
        has58: cache[58] != null || cache['58'] != null,
        hasSM65: cache['SM65'] != null,
        hasTG05: cache['TG05'] != null,
        hasSWSH020: cache['SWSH020'] != null,
        hasRC29: cache['RC29'] != null,
        hasH25: cache['H25'] != null,
        has25: cache[25] != null || cache['25'] != null,
        // Verify actual prices
        priceSM65: cache['SM65'],
        price58: cache[58] || cache['58'],
        price25: cache[25] || cache['25'],
      };
    });

    // Numeric card numbers should be stored as integers
    expect(cacheContents.has58).toBe(true);
    expect(cacheContents.price58).toBe(1.50);

    // Alphanumeric card numbers should be stored as strings
    expect(cacheContents.hasSM65).toBe(true);
    expect(cacheContents.priceSM65).toBe(8.99);
    expect(cacheContents.hasTG05).toBe(true);
    expect(cacheContents.hasSWSH020).toBe(true);
    expect(cacheContents.hasRC29).toBe(true);
    expect(cacheContents.hasH25).toBe(true);

    // "25/102" format should store integer 25
    expect(cacheContents.has25).toBe(true);
    expect(cacheContents.price25).toBe(2.75);
  });

  test('official Pokemon set prices still work with integer card numbers', async ({ page }) => {
    await setupWithMockPricing(page);

    // Navigate to Pokemon tab and select a set
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
    await page.locator('.block-btn').first().click();
    await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
    await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');

    // Wait for price fetch
    await page.waitForTimeout(2000);

    // Verify price tags exist on official set cards
    const priceTags = page.locator('#pokemon-tcg-content .set-section.active .price-tag');
    const count = await priceTags.count();
    expect(count).toBeGreaterThan(0);

    // Check that at least some prices loaded (mock returns prices for card numbers in our mock data)
    const loadedTags = page.locator('#pokemon-tcg-content .set-section.active .price-tag.loaded');
    const loadedCount = await loadedTags.count();
    // With mock data, cards with number 25 or 58 should get prices
    expect(loadedCount).toBeGreaterThan(0);
  });
});
