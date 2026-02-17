// @ts-check

// 1x1 transparent PNG (68 bytes) — used to stub image requests and avoid 404s on CI
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
  'Nl7BcQAAAABJRU5ErkJggg==', 'base64'
);

// Module-level response cache shared across all tests in the same worker.
// Static files (JS, CSS, JSON) never change during a test run, so caching them
// eliminates ~18,000 HTTP round-trips to the Python dev server on CI.
const _responseCache = new Map();

/**
 * Route handler that blocks external requests, stubs images, and caches
 * localhost responses so each unique URL only hits the web server once per worker.
 *
 * @param {import('@playwright/test').Page} page
 * @param {function} [middleware] — optional handler for custom responses (e.g. mock APIs).
 *   Receives (route, url) and should return true if it handled the route, or falsy to continue.
 */
async function blockExternalRequests(page, middleware) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();

    // Custom middleware gets first crack (e.g. TCGCSV mock pricing)
    if (middleware) {
      const handled = await middleware(route, url);
      if (handled) return;
    }

    // Block all external requests
    if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      return route.fulfill({ body: '', contentType: 'text/plain' });
    }

    // Stub image requests — these files don't exist in the repo
    if (url.includes('/Images/')) {
      return route.fulfill({ body: TRANSPARENT_PIXEL, contentType: 'image/png' });
    }

    // Serve cached response if available (same static file across all tests)
    const pathname = new URL(url).pathname;
    if (_responseCache.has(pathname)) {
      const cached = _responseCache.get(pathname);
      return route.fulfill(cached);
    }

    // First request for this URL — fetch from server, cache, and fulfill
    try {
      const response = await route.fetch();
      const body = await response.body();
      const status = response.status();
      const headers = response.headers();
      const entry = { body, headers, status };
      _responseCache.set(pathname, entry);
      return route.fulfill(entry);
    } catch {
      // Fallback if fetch fails
      return route.continue();
    }
  });
}

/**
 * Standard page setup: block external requests, set test auth user,
 * clear localStorage via addInitScript (avoids double-navigation), load app.
 */
async function setupPage(page, middleware) {
  await blockExternalRequests(page, middleware);
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
 */
async function navigateToCustomSet(page, middleware) {
  await blockExternalRequests(page, middleware);
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
