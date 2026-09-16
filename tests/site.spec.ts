import { test, expect, type Page } from '@playwright/test';

import * as routes from '../src/config/routes';

const activePagePaths = Object.values(routes).filter(value => typeof value === 'string');

test.beforeEach(async ({page}) => {
  // No automated test can email a customer, create a live order or charge a card.
  await page.route(/^https?:\/\/[^/]+\/api\//, route => route.fulfill({status:503,json:{error:'Test service unavailable'}}));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({body:'',contentType:'text/css'}));
});

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test('all public pages render, images decode, layouts fit and navigation works', async ({page}, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of ['/', '/products', '/visualiser', '/about', '/contact', '/how-it-works', '/cart', '/book', '/booking/confirmed', '/does-not-exist']) {
    await page.goto(route);
    if (route === '/visualiser') await expect(page.locator('canvas[data-render-surface="blind"]')).toBeVisible();
    else await expect(page.locator('h1').first()).toBeVisible();
    await noOverflow(page);
    const internalLinks = await page.locator('a[href]').evaluateAll(links => links.map(link => {
      const href = link.getAttribute('href')!;
      const url = new URL(href, location.href);
      return { href, local: url.origin === location.origin, pathname: url.pathname };
    }));
    for (const link of internalLinks) {
      expect(link.href, `${route}: empty or placeholder link`).not.toMatch(/^(?:#?$|javascript:)/i);
      if (link.local) expect(activePagePaths, `${route}: ${link.href}`).toContain(link.pathname);
    }
    const images = page.locator('img:visible');
    for (const img of await images.all()) {
      if (await img.getAttribute('loading') === 'lazy') continue;
      await expect(img).toHaveJSProperty('complete', true);
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth), `${route}: ${await img.getAttribute('src')}`).toBeGreaterThan(0);
    }
    if (['/', '/book', '/visualiser'].includes(route)) await page.screenshot({path: info.outputPath(`${route.replaceAll('/','') || 'home'}.png`)});
    if (route === '/') {
      await page.getByRole('heading',{name:'From the feed',exact:true}).scrollIntoViewIfNeeded();
      const galleryPhoto=page.getByAltText('Meet Klay — complete interior solutions designed to transform the way you live.');
      await expect.poll(()=>galleryPhoto.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
    }
  }
  expect(errors).toEqual([]);
  await page.goto('/products');
  const menu = page.getByRole('button',{name:'Open menu'});
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole('button',{name:'Close menu'}).click();
    await expect(menu).toBeVisible();
  }
});

test('retired and unknown URLs stay unavailable instead of redirecting to the shop', async ({ page }) => {
  for (const route of ['/products/dusk', '/products/veil', '/products/duo', '/products/haze', '/products/dusk-white',
    '/blinds', '/blinds/roller-blinds', '/indoor', '/outdoor', '/wardrobes', '/visualizer', '/unknown-page']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: "This page doesn't exist.", exact: true })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(route);
    await expect(page.locator('.shop-result-card')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"][content="noindex, nofollow"]')).toHaveCount(1);
  }
  await page.getByRole('link', { name: 'Back to Klay', exact: false }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('meta[name="robots"][content="noindex, nofollow"]')).toHaveCount(0);
});

test('hosted not-found page is script-free and offers working recovery links', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { name: "This page doesn't exist.", exact: true })).toBeVisible();
  await expect(page.locator('script')).toHaveCount(0);
  await noOverflow(page);
  await page.getByRole('link', { name: 'Shop the range', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /^(Privacy|Terms|Warranty)$/ })).toHaveCount(0);
});

test('shop search, sort, filters, choices and persisted multi-product quote', async ({page}) => {
  await page.goto('/products');
  const search = page.getByRole('searchbox',{name:'Search products'});
  await search.fill('nonexistentxyz');
  await expect(page.locator('.shop-result-card')).toHaveCount(0);
  await page.getByRole('search').getByRole('button',{name:'Clear search',exact:true}).click();
  await expect(page.locator('.shop-result-card')).toHaveCount(21);
  const filters = page.getByRole('button',{name:/^Filters/});
  if (await filters.isVisible()) await filters.click();
  const mirrors = page.getByRole('checkbox',{name:'Mirrors',exact:true}).filter({visible:true});
  await mirrors.click();
  await expect(mirrors).toBeChecked();
  if (await filters.isVisible()) await page.getByRole('button',{name:/Show 3 products/}).click();
  await expect(page.locator('.shop-result-card')).toHaveCount(3);
  await page.getByRole('button',{name:'Clear all',exact:true}).click();
  await page.getByRole('combobox',{name:'Sort products'}).selectOption({label:'Name: A to Z'});
  await search.fill('roller blinds');
  const roller = page.locator('.shop-result-card').filter({has:page.getByRole('heading',{name:'Roller Blinds',exact:true})});
  await roller.getByRole('button',{name:'Sunscreen',exact:true}).click();
  await expect(roller).toContainText('Panorama');
  await roller.getByRole('combobox',{name:'Location',exact:true}).selectOption({label:'Bedroom 2'});
  await roller.getByRole('button',{name:'Add to cart',exact:true}).click();
  await search.fill('shelving');
  const shelving = page.locator('.shop-result-card').first();
  await shelving.getByRole('button',{name:'Add for quote',exact:true}).click();
  await page.goto('/cart');
  await expect(page.getByRole('heading',{name:'Roller Blinds',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Shelving',exact:true})).toBeVisible();
  await page.reload();
  await page.locator('a[href="/book?cart=1"]').click();
  await expect(page.getByRole('heading',{name:'Your basket'})).toBeVisible();
  await expect(page.locator('aside')).toContainText('Bedroom 2');
  await expect(page.locator('aside')).toContainText('Shelving');
  await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);
  await page.getByRole('textbox',{name:/^Name/}).fill('Test Customer');
  await page.getByRole('textbox',{name:/^Email/}).fill('test@example.com');
  let submitted: Record<string,unknown> | undefined;
  await page.route('**/api/request-quote', route => { submitted = route.request().postDataJSON(); return route.fulfill({json:{id:'test-quote'}}); });
  await page.getByRole('button',{name:'Request a quote',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Request received'})).toBeVisible();
  expect(submitted?.items).toHaveLength(2);
});

test('contact validation, server errors and successful enquiry', async ({page}) => {
  await page.goto('/contact?product=Mirrors');
  await page.getByRole('button',{name:'Send Message'}).click();
  await expect(page.getByText('Please tell us your name.',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:/^Name/}).fill('Test Customer');
  await page.getByRole('textbox',{name:/^Email/}).fill('test@example.com');
  await page.getByRole('button',{name:'Send Message'}).click();
  await expect(page.getByRole('alert')).toContainText('Test service unavailable');
  await page.route('**/api/request-quote', route => route.fulfill({json:{id:'test-enquiry'}}));
  await page.getByRole('button',{name:'Send Message'}).click();
  await expect(page.getByText(/Thanks — we'll be in touch/i).first()).toBeVisible();
});

test('payment return confirms server status and never assumes a payment', async ({page}) => {
  await page.route('**/api/order-status?*', route => route.fulfill({json:{found:true,status:'paid',amountCents:38000}}));
  await page.goto('/booking/confirmed?session_id=test-session');
  await expect(page.getByRole('heading',{name:/Thank you/})).toBeVisible();
  await expect(page.locator('main')).toContainText('$380');
  await page.goto('/booking/confirmed');
  await expect(page.getByRole('heading',{name:/No booking/i})).toBeVisible();
});

test('visualiser colours, operating controls, cloth and 3D orbit', async ({page}, info) => {
  const errors: string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/visualiser');
  const blind = page.locator('canvas[data-render-surface="blind"]');
  await expect(blind).toBeVisible();
  const before = await blind.screenshot();
  await page.getByRole('button',{name:'Verve',exact:true}).click();
  await page.getByRole('button',{name:'Verve Steel Gray',exact:true}).click();
  await page.waitForTimeout(250);
  expect((await blind.screenshot()).equals(before)).toBe(false);
  await page.getByRole('button',{name:'Curtains',exact:true}).click();
  await expect(page.locator('canvas[data-render-surface="curtain"]')).toBeVisible();
  await page.screenshot({path:info.outputPath('curtains.png')});
  await page.getByRole('button',{name:'Wardrobes',exact:true}).click();
  const reset = page.getByRole('button',{name:'Reset 3D view to 30 degrees'});
  await expect(reset).toBeEnabled({timeout:30000});
  await page.getByRole('button',{name:'Rotate view left'}).click();
  await reset.click();
  await expect.poll(async () => Number(await page.locator('canvas[data-view-angle]').getAttribute('data-view-angle'))).toBeCloseTo(30, 3);
  await page.getByRole('button',{name:'Shelving',exact:true}).click();
  await expect(reset).toBeEnabled();
  await noOverflow(page);
  expect(errors).toEqual([]);
});
