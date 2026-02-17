// @ts-check
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');

// 1x1 transparent PNG (68 bytes) — used to stub image requests and avoid 404s on CI
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
  'Nl7BcQAAAABJRU5ErkJggg==', 'base64'
);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// In-memory file cache — avoids repeated fs.readFileSync for the same path within a worker
const _fileCache = new Map();

/**
 * Read a static file from disk and return a route.fulfill-compatible object.
 * Returns null if the file doesn't exist.
 */
function readStaticFile(pathname) {
  if (_fileCache.has(pathname)) return _fileCache.get(pathname);

  const filePath = path.join(PROJECT_ROOT, pathname === '/' ? 'index.html' : pathname);
  try {
    const body = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const entry = { body, headers: { 'content-type': contentType }, status: 200 };
    _fileCache.set(pathname, entry);
    return entry;
  } catch {
    return null;
  }
}

/**
 * Route handler that blocks external requests, stubs images, and serves
 * localhost static files directly from disk — bypassing HTTP entirely.
 * This eliminates ~18,000+ HTTP round-trips to the Python dev server on CI.
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

    // Serve static files directly from disk, bypassing HTTP entirely
    const pathname = new URL(url).pathname;
    const cached = readStaticFile(pathname);
    if (cached) {
      return route.fulfill(cached);
    }

    // File not on disk — let the web server handle it
    return route.continue();
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
