import sharp from 'sharp';
import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async({page})=>{
  await page.route(/^https?:\/\/[^/]+\/api\//,route=>route.fulfill({status:503,json:{error:'Test service unavailable'}}));
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({body:'',contentType:'text/css'}));
});
async function upload(page:Page, buffer:Buffer, mimeType='image/jpeg') {
  const chooser=page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'Upload photo',exact:true}).click();
  await (await chooser).setFiles({name:mimeType==='image/jpeg'?'room.jpg':'invalid.txt',mimeType,buffer});
}

for (const surface of [{ url: '/visualiser', selector: 'body' }, { url: '/#visualiser', selector: '#visualiser' }]) {
  test(`${surface.url}: every visualiser category adds to cart in place and survives reload`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(surface.url);
    const panel = page.locator(surface.selector);
    const cart = () => page.evaluate(() => JSON.parse(localStorage.getItem('klay-cart')!).state.items);
    const add = async (count: number) => {
      await panel.getByRole('button', { name: 'Add to cart', exact: true }).click();
      await expect.poll(async () => (await cart()).length).toBe(count);
      await expect(page).not.toHaveURL(/\/(cart|contact|book)/);
      await expect(page.locator('.cart-feedback-announcement')).toContainText('Added to your cart');
      await page.getByRole('button', { name: 'Dismiss cart confirmation', exact: true }).click();
      await expect(panel.getByRole('link', { name: 'or get a free quote →', exact: true })).toHaveAttribute('href', /^\/book\?items=/);
    };
    await add(1);
    await panel.getByRole('button', { name: 'Curtains', exact: true }).click();
    await add(2);
    await panel.getByRole('button', { name: 'Wardrobes', exact: true }).click();
    await add(3);
    await panel.getByRole('button', { name: 'Walk-in', exact: true }).click();
    await panel.getByRole('button', { name: 'Forma 5', exact: true }).click();
    await add(4);
    await panel.getByRole('button', { name: 'Shelving', exact: true }).click();
    await add(5);
    const saved = await cart();
    await page.goto('/cart');
    await expect(page.locator('main')).toContainText('Walk-in wardrobe — Forma 5');
    await page.reload();
    expect(await cart()).toEqual(saved);
    await expect(page.locator('main')).toContainText('Walk-in wardrobe — Forma 5');
    await expect(page.locator('main')).toContainText('2400 × 2400 mm');
    await expect(page.locator('main')).toContainText('Price on measure');
    expect(errors).toEqual([]);
  });
}

test('fabric preview recovers from a missing texture and real fabric choices persist', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/visualiser');
  const canvas=page.locator('canvas[data-render-surface="blind"]');
  await expect(canvas).toBeVisible();
  const before=await canvas.evaluate((el:HTMLCanvasElement)=>el.toDataURL());
  await page.route('**/essence-carbon-texture.webp',route=>route.abort());
  await page.getByRole('button',{name:'Essence Carbon',exact:true}).click();
  await expect.poll(()=>canvas.evaluate((el:HTMLCanvasElement)=>el.toDataURL())).not.toBe(before);
  await page.unroute('**/essence-carbon-texture.webp');
  await page.getByRole('button',{name:'Montecarlo',exact:true}).click();
  await page.getByRole('button',{name:'Montecarlo Oak',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('/montecarlo-oak-texture.webp')))).toBe(true);
  await page.goto('/products');
  await page.getByRole('searchbox',{name:'Search products'}).fill('roller blinds');
  const roller=page.locator('.shop-result-card').first();
  await roller.getByRole('button',{name:'Montecarlo',exact:true}).click();
  await roller.getByRole('button',{name:'Montecarlo Oak',exact:true}).click();
  await roller.getByRole('button',{name:'Cream',exact:true}).click();
  await roller.getByRole('button',{name:'Add to cart',exact:true}).click();
  await page.goto('/cart');
  await page.reload();
  await expect(page.locator('main')).toContainText('Montecarlo Oak');
  await expect(page.locator('main')).toContainText('Cream');
  expect(errors).toEqual([]);
});

test('photo validation, EXIF rotation, downscaling, tracing, export and resource cleanup',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const created=new Set<string>();
    const originalCreate=URL.createObjectURL.bind(URL),originalRevoke=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=blob=>{const url=originalCreate(blob);created.add(url);return url;};
    URL.revokeObjectURL=url=>{created.delete(url);originalRevoke(url);};
    Object.defineProperty(window,'__photoUrls',{get:()=>[...created]});
  });
  await page.goto('/visualiser');
  await page.getByRole('button',{name:'Visualise in your own room',exact:true}).click();
  await upload(page,Buffer.alloc(15*1024*1024+1));
  await expect(page.getByRole('alert')).toContainText('under 15MB');
  await upload(page,Buffer.from('not an image'),'text/plain');
  await expect(page.getByRole('alert')).toContainText('Please use a JPG, PNG, WebP, GIF, AVIF or HEIC photo.');
  await upload(page,Buffer.from('invalid jpeg'));
  await expect(page.getByRole('alert')).toBeVisible();
  // Landscape sensor pixels with portrait EXIF orientation, like a phone camera.
  const rotated=await sharp('public/images/rooms/room-living.webp').resize(2400,1200,{fit:'fill'}).withMetadata({orientation:6}).jpeg().toBuffer();
  await upload(page,rotated);
  const photo=page.getByAltText('Your room',{exact:true});
  await expect(photo).toBeVisible();
  await expect(photo).toHaveJSProperty('naturalWidth',800);
  await expect(photo).toHaveJSProperty('naturalHeight',1600);
  const handle=page.locator('svg circle[fill="transparent"]').first();
  const box=await handle.boundingBox();expect(box).not.toBeNull();
  if(box){await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+12,box.y+box.height/2+20,{steps:4});await page.mouse.up();}
  await page.getByRole('button',{name:'Confirm outline',exact:true}).click();
  const canvas=page.locator('canvas[data-render-surface="blind"]');
  await expect(canvas).toBeVisible();
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download',exact:true}).click();
  expect((await download).suggestedFilename()).toMatch(/\.jpg$/);
  await page.getByRole('button',{name:'Retrace',exact:true}).click();
  await expect(photo).toBeVisible();
  await page.getByRole('button',{name:'Confirm outline',exact:true}).click();
  await page.getByRole('button',{name:'Back to preview',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'__photoUrls').length)).toBe(0);
  await expect(page.getByRole('button',{name:'Visualise in your own room',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Visualise in your own room',exact:true}).click();
  await upload(page,rotated);
  await expect(photo).toBeVisible();
  // SPA navigation must release blob resources and allow a clean remount.
  const menu=page.getByRole('button',{name:'Open menu'});
  if(await menu.isVisible())await menu.click();
  await page.locator('a[href="/products"]').filter({visible:true}).first().click();
  await expect.poll(()=>page.evaluate(()=>Reflect.get(window,'__photoUrls').length)).toBe(0);
  await page.goBack();
  await expect(page.locator('canvas[data-render-surface="blind"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('curtain and shelving quote links retain their configuration on reload',async({page})=>{
  for(const category of ['Curtains','Shelving']){
    await page.goto('/visualiser');
    await page.getByRole('button',{name:category,exact:true}).click();
    await page.getByRole('link',{name:'or get a free quote →',exact:true}).click();
    await expect(page).toHaveURL(/\/book\?items=/);
    await page.reload();
    await expect(page.locator('aside')).toContainText(category);
    await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Request a quote',exact:true})).toBeEnabled();
  }
  await page.goto('/book?items=broken');
  await expect(page.getByText('This configuration link is incomplete.',{exact:false})).toBeVisible();
  await expect(page.getByRole('button',{name:/^Pay /})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Request a quote',exact:true})).toBeDisabled();
});
