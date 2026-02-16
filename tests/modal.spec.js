// @ts-check
const { test, expect } = require('@playwright/test');

// Helper to navigate to a set with cards
async function navigateToFirstSet(page) {
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
}

test.describe('Card Modal', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFirstSet(page);
  });

  test('clicking a card should open the modal', async ({ page }) => {
    // Click on the card image area (not the checkbox)
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);
  });

  test('modal should display card name', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const cardName = await firstCard.locator('.card-name').textContent();

    await firstCard.locator('.card-img-wrapper').click();

    const modalName = page.locator('#modalCardName');
    await expect(modalName).toHaveText(cardName);
  });

  test('modal should display card number', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    const modalNumber = page.locator('#modalCardNumber');
    await expect(modalNumber).toContainText('#');
  });

  test('modal should display card image', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    const modalImage = page.locator('#modalCardImage');
    await expect(modalImage).toHaveAttribute('src', /.+/);
  });

  test('modal should display rarity', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    const modalRarity = page.locator('#modalCardRarity');
    await expect(modalRarity).not.toBeEmpty();
  });

  test('modal should have variant checkboxes', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    const variantList = page.locator('#modalVariantList');
    const checkboxes = variantList.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('toggling variant in modal should update checkbox state', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();
    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    const checkbox = page.locator('#modalVariantList input[type="checkbox"]').first();
    const wasChecked = await checkbox.isChecked();

    await checkbox.click();

    // The toggle re-renders cards and re-opens the modal after 50ms delay
    // Wait for modal to re-appear with updated state
    await page.waitForTimeout(500);
    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    const updatedCheckbox = page.locator('#modalVariantList input[type="checkbox"]').first();
    const isNowChecked = await updatedCheckbox.isChecked();
    expect(isNowChecked).not.toBe(wasChecked);
  });

  test('close button should close the modal', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    await page.locator('.card-modal-close').click();
    await expect(page.locator('#cardModal')).not.toHaveClass(/visible/);
  });

  test('ESC key should close the modal', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#cardModal')).not.toHaveClass(/visible/);
  });

  test('clicking overlay should close the modal', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();

    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    // Click on the modal overlay (outside the content)
    await page.locator('#cardModal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#cardModal')).not.toHaveClass(/visible/);
  });
});
