import { test, expect } from '@playwright/test';

test('cold mobile connection keeps 3D off startup and records load timings', async ({page,context},info)=>{
  const session=await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:100000});
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({body:'',contentType:'text/css'}));
  const scripts:string[]=[];
  page.on('request',request=>{if(request.resourceType()==='script')scripts.push(request.url());});
  await page.addInitScript(()=>{
    let lcp=0;
    new PerformanceObserver(list=>{for(const entry of list.getEntries())lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
    Object.defineProperty(window,'__lcp',{get:()=>lcp});
  });
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/The finishing layer/})).toBeVisible();
  await expect(page.locator('.home-hero-media')).toHaveJSProperty('complete',true);
  expect(scripts.some(url=>/three\.module|Canvas2DCurtainRenderer|Wardrobe3D/.test(url))).toBe(false);
  expect(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/images/social/klay-interiors-launch.webp')))).toBe(false);
  await info.attach('cold-load.json',{body:JSON.stringify(await page.evaluate(()=>({
    navigation:performance.getEntriesByType('navigation')[0].toJSON(),
    lcp:Reflect.get(window,'__lcp'),
    resources:performance.getEntriesByType('resource').map(r=>r.toJSON()),
  })),null,2),contentType:'application/json'});
  await session.send('Emulation.setCPUThrottlingRate',{rate:1});
  await session.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await page.getByRole('button',{name:'Design Yours',exact:true}).click();
  await expect(page.locator('canvas[data-render-surface="blind"]')).toBeVisible({timeout:30000});
  await expect(page.locator('canvas[data-render-surface="blind"]')).toBeInViewport();
  const gallery=page.getByRole('heading',{name:'From the feed',exact:true});
  await gallery.scrollIntoViewIfNeeded();
  const galleryPhoto=page.getByAltText('Meet Klay — complete interior solutions designed to transform the way you live.');
  await expect(galleryPhoto).toHaveJSProperty('complete',true);
  await expect.poll(()=>galleryPhoto.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
});
