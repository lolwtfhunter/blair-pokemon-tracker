// @ts-check
const { test, expect } = require('@playwright/test');

async function navigateToFirstSet(page) {
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
  await page.locator('.block-btn').first().click();
  await page.locator('#pokemon-tcg-content .set-buttons.active .set-btn').first().click();
  await page.waitForSelector('#pokemon-tcg-content .set-section.active .card-item');
}

test.describe('Card Modal', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToFirstSet(page);
  });

  test('open modal shows correct details', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const cardName = await firstCard.locator('.card-name').textContent();

    await firstCard.locator('.card-img-wrapper').click();
    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);

    await expect(page.locator('#modalCardName')).toHaveText(cardName);
    await expect(page.locator('#modalCardNumber')).toContainText('#');
    await expect(page.locator('#modalCardRarity')).not.toBeEmpty();
    const checkboxes = page.locator('#modalVariantList input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('variant toggle in modal works', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    await firstCard.locator('.card-img-wrapper').click();
    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    const checkbox = page.locator('#modalVariantList input[type="checkbox"]').first();
    const wasChecked = await checkbox.isChecked();

    await checkbox.click();
    await page.waitForTimeout(500);
    await expect(page.locator('#cardModal')).toHaveClass(/visible/);

    const updatedCheckbox = page.locator('#modalVariantList input[type="checkbox"]').first();
    const isNowChecked = await updatedCheckbox.isChecked();
    expect(isNowChecked).not.toBe(wasChecked);
  });

  test('close via close button', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const modal = page.locator('#cardModal');

    await firstCard.locator('.card-img-wrapper').click();
    await expect(modal).toHaveClass(/visible/);
    await page.locator('.card-modal-close').click();
    await expect(modal).not.toHaveClass(/visible/);
  });

  test('close via ESC key', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const modal = page.locator('#cardModal');

    await firstCard.locator('.card-img-wrapper').click();
    await expect(modal).toHaveClass(/visible/);
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/visible/);
  });

  test('close via overlay click', async ({ page }) => {
    const firstCard = page.locator('#pokemon-tcg-content .set-section.active .card-item').first();
    const modal = page.locator('#cardModal');

    await firstCard.locator('.card-img-wrapper').click();
    await expect(modal).toHaveClass(/visible/);
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toHaveClass(/visible/);
  });

  test('open second card after closing first', async ({ page }) => {
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const count = await cards.count();
    if (count < 2) return;

    const modal = page.locator('#cardModal');

    // Open first card modal
    await cards.first().locator('.card-img-wrapper').click();
    await expect(modal).toHaveClass(/visible/);
    const firstName = await page.locator('#modalCardName').textContent();

    // Close via close button
    await page.locator('.card-modal-close').click();
    await expect(modal).not.toHaveClass(/visible/);

    // Open second card modal — this failed before fix because img element was destroyed
    await cards.nth(1).locator('.card-img-wrapper').click();
    await expect(modal).toHaveClass(/visible/);
    const secondName = await page.locator('#modalCardName').textContent();
    expect(secondName).not.toBe(firstName);

    // Verify the modal image element still exists
    const imgExists = await page.locator('#modalCardImage').count();
    expect(imgExists).toBe(1);
  });

  test('arrow right navigates to next card', async ({ page }) => {
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const count = await cards.count();
    if (count < 2) return;

    await cards.first().locator('.card-img-wrapper').click();
    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);
    const firstName = await page.locator('#modalCardName').textContent();

    await page.keyboard.press('ArrowRight');
    await expect(modal).toHaveClass(/visible/);
    const secondName = await page.locator('#modalCardName').textContent();
    expect(secondName).not.toBe(firstName);
  });

  test('arrow left navigates to previous card', async ({ page }) => {
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const count = await cards.count();
    if (count < 2) return;

    // Open first card, go right, then go left — should return to first
    await cards.first().locator('.card-img-wrapper').click();
    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);
    const firstName = await page.locator('#modalCardName').textContent();

    await page.keyboard.press('ArrowRight');
    const secondName = await page.locator('#modalCardName').textContent();
    expect(secondName).not.toBe(firstName);

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#modalCardName')).toHaveText(firstName);
  });

  test('navigation stops at first card', async ({ page }) => {
    await page.locator('#pokemon-tcg-content .set-section.active .card-item').first().locator('.card-img-wrapper').click();
    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);
    const firstName = await page.locator('#modalCardName').textContent();

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#modalCardName')).toHaveText(firstName);
  });

  test('navigation stops at last card', async ({ page }) => {
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const count = await cards.count();
    if (count < 2) return;

    // Open last card
    await cards.last().locator('.card-img-wrapper').click();
    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);
    const lastName = await page.locator('#modalCardName').textContent();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#modalCardName')).toHaveText(lastName);
  });

  test('navigateModal function advances to next card', async ({ page }) => {
    const cards = page.locator('#pokemon-tcg-content .set-section.active .card-item');
    const count = await cards.count();
    if (count < 2) return;

    await cards.first().locator('.card-img-wrapper').click();
    const modal = page.locator('#cardModal');
    await expect(modal).toHaveClass(/visible/);
    const firstName = await page.locator('#modalCardName').textContent();

    // Call navigateModal(1) directly — same function swipe handler invokes
    await page.evaluate(() => window.navigateModal(1));
    const secondName = await page.locator('#modalCardName').textContent();
    expect(secondName).not.toBe(firstName);
  });
});
