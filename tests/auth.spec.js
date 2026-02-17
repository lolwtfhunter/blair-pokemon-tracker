// @ts-check
const { test, expect } = require('@playwright/test');
const { blockExternalRequests } = require('./helpers');

test.describe('Auth Modal', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
    // Force auth modal to show by setting a test flag that bypasses Firebase auth
    // and directly calls showAuthModal()
    await page.addInitScript(() => {
      window.__TEST_FORCE_AUTH_MODAL = true;
    });
  });

  test('auth modal renders with correct structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    const modal = page.locator('.auth-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.auth-modal-title')).toHaveText('Sign In');
    await expect(page.locator('#authEmail')).toBeVisible();
    await expect(page.locator('#authPassword')).toBeVisible();
    await expect(page.locator('#authSubmitBtn')).toBeVisible();
    await expect(page.locator('#authGoogleBtn')).toBeVisible();
    await expect(page.locator('#authGoogleBtn')).toContainText('Google');
  });

  test('switch to register view', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await page.locator('#authShowRegister').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Create Account');
    await expect(page.locator('#authName')).toBeVisible();
  });

  test('switch to forgot password view', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await page.locator('#authShowForgot').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Reset Password');
    await expect(page.locator('#authPassword')).toHaveCount(0);
  });

  test('switch views: register then back to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.auth-modal', { timeout: 15000 });
    await page.locator('#authShowRegister').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Create Account');
    await page.locator('#authShowLogin').click();
    await expect(page.locator('.auth-modal-title')).toHaveText('Sign In');
  });

  test('test user bypasses auth modal and renders app', async ({ page }) => {
    // Override the beforeEach script — set test user instead of force-modal
    await page.addInitScript(() => {
      window.__TEST_FORCE_AUTH_MODAL = false;
      window.__TEST_AUTH_USER = { uid: 'test-123', email: 'test@test.com', displayName: 'Test' };
    });
    await page.goto('/');
    await page.waitForFunction(() => document.querySelectorAll('.block-btn').length > 0, null, { timeout: 15000 });
    await expect(page.locator('.auth-modal')).toHaveCount(0);
    await expect(page.locator('#userDisplayName')).toHaveText('Test');
  });
});
