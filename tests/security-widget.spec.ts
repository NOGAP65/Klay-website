import { test, expect } from '@playwright/test';

test.skip(process.env.SECURITY_WIDGET_TEST !== '1', 'Dedicated local server with a public dummy widget key; all provider traffic is mocked.');

declare global {
  interface Window {
    securityWidget: { callback: (token: string) => void; 'expired-callback': () => void };
    securityWidgetCount: number;
  }
}
const widgetScript = `
window.turnstile = {
  render: (container, options) => {
    window.securityWidget = options;
    window.securityWidgetCount = (window.securityWidgetCount || 0) + 1;
    container.textContent = 'Mock verification widget';
    return String(window.securityWidgetCount);
  },
  reset: () => {}, remove: () => {}
};
window.onTurnstileLoad();`;

test('expired and spent captcha tokens cannot be reused, and retry preserves customer fields', async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ contentType: 'text/javascript', body: widgetScript }));
  let submissions = 0;
  await page.route('**/api/request-quote', route => {
    submissions++;
    return route.fulfill({ status: 503, json: { error: 'Please try again.' } });
  });
  await page.goto('/contact');
  await expect(page.getByText('Mock verification widget')).toBeVisible();
  await page.getByRole('textbox', { name: /^Name/ }).fill('Security Test');
  await page.getByRole('textbox', { name: /^Email/ }).fill('test@example.com');
  await page.evaluate(() => { window.securityWidget.callback('first-token'); window.securityWidget['expired-callback'](); });
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByText('Please complete the verification challenge.')).toBeVisible();
  expect(submissions).toBe(0);
  await page.evaluate(() => window.securityWidget.callback('fresh-token'));
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.securityWidgetCount)).toBeGreaterThan(1);
  expect(submissions).toBe(1);
  await page.getByRole('button', { name: 'Send Message', exact: true }).click();
  await expect(page.getByText('Please complete the verification challenge.')).toBeVisible();
  expect(submissions).toBe(1);
  await expect(page.getByRole('textbox', { name: /^Name/ })).toHaveValue('Security Test');
});

test('a blocked captcha script shows a working retry without clearing the form', async ({ page }) => {
  let attempts = 0;
  await page.route('https://challenges.cloudflare.com/**', route => {
    attempts++;
    return attempts === 1 ? route.abort() : route.fulfill({ contentType: 'text/javascript', body: widgetScript });
  });
  await page.goto('/contact');
  await page.getByRole('textbox', { name: /^Name/ }).fill('Keep my details');
  await page.getByRole('button', { name: 'Retry verification', exact: true }).click();
  await expect(page.getByText('Mock verification widget')).toBeVisible();
  await expect(page.getByRole('textbox', { name: /^Name/ })).toHaveValue('Keep my details');
});
