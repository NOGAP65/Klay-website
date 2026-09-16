import { test, expect, type Page } from '@playwright/test';

async function fillInstallation(page: Page) {
  await page.getByLabel(/^Name/).fill("Chloë O'Connor");
  await page.getByLabel(/^Email/).fill('test+curtains@example.com');
  await page.getByLabel(/^Phone/).fill('+61 412 345 678');
  await page.getByLabel(/^Street address/).fill('Unit 2, 18 Smith Street');
  await page.getByLabel(/^Suburb/).fill('Epping');
  await page.getByLabel(/^Postcode/).fill('3076');
}

test('invalid booking fields explain errors, allow correction and never reach the API', async ({ page }) => {
  let submissions = 0;
  await page.route('**/api/**', route => { submissions++; return route.fulfill({ json: { id: 'test-quote' } }); });
  await page.goto('/book');
  await page.getByLabel(/^Name/).fill('faf');
  await page.getByLabel(/^Email/).click();
  await expect(page.getByLabel(/^Email/)).toBeFocused(); // Blur validation must not trap focus.
  await expect(page.getByLabel(/^Name/)).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel(/^Email/).fill('fafa@gmail.com');
  await page.getByLabel(/^Phone/).fill('746449');
  await page.getByLabel(/^Street address/).fill('fafa');
  await page.getByLabel(/^Suburb/).fill('fafa');
  await page.getByLabel(/^Postcode/).fill('6059');
  await page.getByLabel(/^Preferred date/).fill('9999-04-06');
  await page.getByRole('button', { name: 'Request a quote instead', exact: true }).click();
  for (const field of [/^Name/, /^Phone/, /^Street address/, /^Suburb/, /^Preferred date/]) {
    await expect(page.getByLabel(field)).toHaveAttribute('aria-invalid', 'true');
  }
  expect(submissions).toBe(0);
  await fillInstallation(page);
  await page.getByLabel(/^Preferred date/).fill('');
  await page.getByRole('button', { name: 'Request a quote instead', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Request received', exact: true })).toBeVisible();
  expect(submissions).toBe(1);
});

test('suburb lookup rejects mismatches and recovers from a failed download on basic browsers', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(AbortSignal, 'timeout', { value: undefined }));
  let loads = 0, submissions = 0;
  await page.route('**/au-localities-*.json', route => { loads++; return loads === 1 ? route.abort() : route.continue(); });
  await page.route('**/api/**', route => { submissions++; return route.fulfill({ json: { id: 'test-quote' } }); });
  await page.goto('/book');
  await fillInstallation(page);
  const date = page.getByLabel(/^Preferred date/);
  await expect(date).toHaveAttribute('min', /^\d{4}-\d{2}-\d{2}$/);
  await expect(date).toHaveAttribute('max', /^\d{4}-\d{2}-\d{2}$/);
  await page.getByRole('button', { name: 'Request a quote instead', exact: true }).click();
  await expect(page.getByText(/The suburb list could not load/)).toBeVisible();
  expect(submissions).toBe(0);
  await page.getByLabel(/^Suburb/).fill('Sydney');
  await page.getByRole('button', { name: 'Request a quote instead', exact: true }).click();
  await expect(page.getByText(/This suburb does not match 3076/)).toBeVisible();
  expect(submissions).toBe(0);
  await page.getByLabel(/^Suburb/).fill('Epping');
  await page.getByRole('button', { name: 'Request a quote instead', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Request received', exact: true })).toBeVisible();
  expect(submissions).toBe(1);
});

test('contact validates optional phone and required message without requesting an installation address', async ({ page }) => {
  let submissions = 0;
  await page.route('**/api/**', route => { submissions++; expect(route.request().postDataJSON().enquiryType).toBe('contact'); return route.fulfill({ json: { id: 'test-contact' } }); });
  await page.goto('/contact');
  await page.getByLabel(/^Name/).fill('Test Customer');
  await page.getByLabel(/^Email/).fill('test@example.com');
  await page.getByLabel(/^Phone/).fill('746449');
  await page.getByLabel(/^Message/).fill('afaf');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByLabel(/^Phone/)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel(/^Message/)).toHaveAttribute('aria-invalid', 'true');
  expect(submissions).toBe(0);
  await page.getByLabel(/^Phone/).fill('');
  await page.getByLabel(/^Message/).fill('Please help me choose curtains.');
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByText(/Thanks — we'll be in touch/).first()).toBeVisible();
  expect(submissions).toBe(1);
});
