import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
const output=process.argv[2]||'current';
const names=(process.argv[3]||'garden,sliding,sash,picture,casement,awning,french,bay,tall,oblique,bedroom,living').split(',');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--disable-gpu-sandbox']});
const options=new URLSearchParams(process.argv[4]||'');
const mobile=options.get('width')==='390';
const page=await browser.newPage({viewport:{width:mobile?390:1000,height:mobile?844:1100},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir(`tools/curtain-qa/output/${output}`,{recursive:true});
for(const name of names){
 const query=new URLSearchParams({scene:name,width:'900',version:output.startsWith('previous')?'previous':'current'});
 if(process.argv[4])for(const [k,v] of new URLSearchParams(process.argv[4]))query.set(k,v);
 await page.goto(`http://localhost:5173/tools/curtain-qa/?${query}`);
 await page.locator('[data-render-surface="curtain"]').waitFor();
 await page.waitForTimeout(1700);
 await page.locator('#render').screenshot({path:`tools/curtain-qa/output/${output}/${name}.png`});
}
await browser.close();
if(errors.length)throw Error(errors.join('\n'));
console.log(`Captured ${names.length} ${output} views without browser errors.`);
