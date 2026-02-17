// @ts-check

// 1x1 transparent PNG (68 bytes) — used to stub image requests and avoid 8000+ 404s on CI
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
  'Nl7BcQAAAABJRU5ErkJggg==', 'base64'
);

/**
 * Block all external requests — only allow localhost.
 * Stub local image requests with a transparent pixel to avoid thousands of 404s.
 * Prevents Firebase sync from ever touching production data.
 */
async function blockExternalRequests(page) {
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      // Stub image requests to /Images/ — these files don't exist in the repo
      if (url.includes('/Images/')) {
        return route.fulfill({ body: TRANSPARENT_PIXEL, contentType: 'image/png' });
      }
      return route.continue();
    }
    return route.fulfill({ body: '', contentType: 'text/plain' });
  });
}

/**
 * Standard page setup: block external requests, set test auth user,
 * clear localStorage via addInitScript (avoids double-navigation), load app.
 */
async function setupPage(page) {
  await blockExternalRequests(page);
  await page.addInitScript(() => {
    window.__TEST_AUTH_USER = { uid: 'test-123', email: 'test@test.com', displayName: 'Test' };
    localStorage.removeItem('pokemonVariantProgress');
  });
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
}

/**
 * Setup + navigate to first Pokemon set with cards visible.
 */
async function navigateToFirstSet(page) {
  await setupPage(page);
  await page.locator('.block-btn').first().click();
  await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
  await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');
}

/**
 * Setup + navigate to first Lorcana set with cards visible.
 */
async function navigateToLorcanaSet(page) {
  await setupPage(page);
  await page.locator('.top-tab', { hasText: 'Disney Lorcana' }).click();
  const { expect } = require('@playwright/test');
  await expect(page.locator('#lorcana-content')).toHaveClass(/active/);
  await page.locator('#lorcanaSetButtons .set-btn').first().click();
  await page.waitForSelector('#lorcana-content .set-section.active .card');
}

/**
 * Setup + navigate to first Custom Set with cards visible.
 * Uses provided route handler (for mock pricing) or default blockExternalRequests.
 */
async function navigateToCustomSet(page, customRouteSetup) {
  if (customRouteSetup) {
    await customRouteSetup(page);
  } else {
    await blockExternalRequests(page);
  }
  await page.addInitScript(() => {
    window.__TEST_AUTH_USER = { uid: 'test-123', email: 'test@test.com', displayName: 'Test' };
    localStorage.removeItem('pokemonVariantProgress');
  });
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('.top-tab').length > 0, null, { timeout: 15000 });
  const customTab = page.locator('.top-tab:has-text("Custom")');
  await customTab.click();
  await page.waitForSelector('#customSetButtons .set-btn', { timeout: 15000 });
  await page.locator('#customSetButtons .set-btn').first().click();
  await page.waitForSelector('#custom-sets-grids .set-section.active .card-item', { timeout: 15000 });
}

module.exports = { TRANSPARENT_PIXEL, blockExternalRequests, setupPage, navigateToFirstSet, navigateToLorcanaSet, navigateToCustomSet };
