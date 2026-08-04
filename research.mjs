import pw from 'playwright-core';
const browser = await pw.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Current site - full page
await page.goto('http://localhost:5176/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'current-home-full.png', fullPage: true });
console.log('Saved current homepage');

// Blinds page
await page.goto('http://localhost:5176/blinds', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'current-blinds-full.png', fullPage: true });
console.log('Saved current blinds page');

// Product page
await page.goto('http://localhost:5176/products/dusk', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'current-product-full.png', fullPage: true });
console.log('Saved current product page');

await browser.close();
console.log('Done with current site');
