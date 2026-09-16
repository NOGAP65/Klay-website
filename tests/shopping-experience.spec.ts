import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/[^/]+\/api\//, route => route.fulfill({ status: 503, json: { error: 'Test service unavailable' } }));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
});

test('clearing filters and typing before React commits never restores the old category', async ({ page }) => {
  await page.goto('/products?area=Outdoor');
  await expect(page.locator('.shop-result-card')).toHaveCount(4);
  // Deliver both real DOM events in one task, modelling input arriving while a
  // slower phone is still preparing the cleared result list.
  await page.evaluate(() => {
    const clear = [...document.querySelectorAll('button')].find(button => button.textContent === 'Clear all');
    clear!.click();
    const search = document.querySelector<HTMLInputElement>('input[type="search"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(search, 'roller blinds');
    search.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page).not.toHaveURL(/area=Outdoor/);
  await expect(page.locator('.shop-result-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Roller Blinds', exact: true })).toBeVisible();
});

test('requested guidance contains focus, explains measuring and applies the right product filters', async ({ page }, info) => {
  await page.goto('/products');
  const trigger = page.getByRole('button', { name: 'Help me choose' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Find your starting point.' });
  await expect(dialog.getByRole('heading')).toBeFocused();
  await dialog.getByRole('link', { name: 'Ask Klay' }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close guide' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'Ask Klay' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Sizes & measuring' }).click();
  await expect(dialog).toContainText('Products labelled “Price on measure” are added as a quote request.');
  await page.screenshot({ path: info.outputPath('shopping-guide.png') });
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: /^Outdoor living/ }).click();
  await expect(page.locator('.shop-result-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Folding Arm Awnings', exact: true })).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Clear all', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Search products' });
  for (const term of ['mirror', 'no-such-product', 'roller blind']) await search.fill(term);
  await expect(page.locator('.shop-result-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Roller Blinds', exact: true })).toBeVisible();
  await expect(page.locator('.shop-results')).toHaveAttribute('aria-busy', 'false');
  await expect(search).toBeFocused();
});

test('cart feedback, single-use undo and saved-basket recovery preserve the chosen configuration', async ({ page }, info) => {
  await page.goto('/products?q=roller+blinds');
  const card = page.locator('.shop-result-card');
  await card.getByRole('combobox', { name: 'Location', exact: true }).selectOption({ label: 'Bedroom 2' });
  await card.getByRole('button', { name: 'Add one', exact: true }).click();
  await card.getByRole('button', { name: 'Add 2 to cart', exact: true }).click();
  const feedback = page.getByRole('region', { name: 'Cart confirmation' });
  await expect(feedback).toContainText('2 × Roller Blinds');
  await expect(page.locator('.cart-feedback-announcement')).toContainText('Added to your cart');
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('klay-cart')!).state))).toEqual(['items']);
  expect(await feedback.evaluate(el => el.contains(document.activeElement))).toBe(false);
  expect(await feedback.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
  await page.screenshot({ path: info.outputPath('cart-confirmation.png') });
  await feedback.getByRole('button', { name: 'Continue shopping' }).click();
  await expect(feedback).not.toBeVisible();
  await page.reload();
  await expect(feedback).not.toBeVisible();
  const recovery = page.getByRole('complementary', { name: 'Saved cart' });
  await expect(recovery).toContainText('2 items');
  await recovery.getByRole('button', { name: 'Dismiss saved cart reminder' }).click();
  await page.reload();
  await expect(recovery).not.toBeVisible();
  await page.goto('/cart');
  await expect(page.locator('main')).toContainText('Bedroom 2');
  await page.getByRole('button', { name: 'Remove Roller Blinds', exact: true }).click();
  await expect(page.getByText('Your cart is empty', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('klay-cart')!).state.items)).toEqual([]);
  await feedback.getByRole('button', { name: 'Undo removal' }).click();
  await expect(page.getByRole('heading', { name: 'Roller Blinds', exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('Bedroom 2');
  await expect(feedback.getByRole('button', { name: 'Undo removal' })).toHaveCount(0);
  await expect(feedback.getByRole('button', { name: 'Dismiss cart confirmation' })).toBeFocused();
  await feedback.getByRole('button', { name: 'Dismiss cart confirmation' }).click();
  await page.reload();
  await expect(page.locator('main')).toContainText('$440');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('slower route loads have a real skeleton and reduced motion has no shimmer', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/assets\/ProductsPage-[^/]+\.js/, async route => { await gate; await route.continue(); });
  try {
    await page.goto('/products', { waitUntil: 'commit' });
    const loading = page.getByRole('status', { name: 'Loading page' });
    await expect(loading).toBeVisible();
    await expect(loading.locator('.loading-placeholder-content')).toHaveCSS('opacity', '1');
    expect(await loading.locator('.loading-placeholder-image').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
    await page.screenshot({ path: info.outputPath('loading-skeleton.png') });
    release();
    await expect(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible();
    await expect(loading).toHaveCount(0);
  } finally { release(); }
});

test('contact and booking bring invalid fields into view while retaining entered details', async ({ page }) => {
  for (const route of ['/contact', '/book']) {
    await page.goto(route);
    const submit = page.getByRole('button', { name: route === '/contact' ? 'Send Message' : 'Request a quote instead', exact: true });
    await submit.click();
    const name = page.getByRole('textbox', { name: /^Name/ });
    const email = page.getByRole('textbox', { name: /^Email/ });
    await expect(name).toBeFocused();
    await name.fill('Test Customer');
    await email.fill('not-an-email');
    await submit.click();
    await expect(email).toBeFocused();
    await expect(name).toHaveValue('Test Customer');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
  }
});
