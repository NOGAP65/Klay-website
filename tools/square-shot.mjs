// SQUARES A SHOT THAT WAS NOT SHOT SQUARE, by extending one plain edge.
//
// Run: node tools/square-shot.mjs <file> [--top=N] [--bottom=N]
//
// THE CARD'S PICTURE FRAME IS 1:1 AND CROPS WITH `cover`, on the stated
// assumption that the photographs are square — most are 900x900. Three are
// 900x768, and on those the frame throws away 7.5% of the width from each side.
// For an awning high in the frame that costs nothing; for a zip screen, which
// spans the full width of its photograph, it cuts both tracked edges off the
// product — the two things that make it a zip screen rather than a blind.
//
// `object-fit` cannot zoom out, and letterboxing puts grey bands inside the
// frame, so the fix is to give the file the shape the frame expects.
//
// WHAT IS ADDED IS NOT INVENTED, and that is the whole of why this is allowed:
// it stretches the outermost few rows of an edge that is already one flat
// surface — a plain ceiling, a plain soffit. Replicating four rows of unbroken
// cream over 132 rows is invisible, because there was nothing there to lose. It
// is NOT for an edge with anything in it: run against the bottom of the zip
// photograph it would smear the coffee table down the frame. Read the edge
// first and put the extension where the picture is empty.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '../node_modules/playwright-core/index.mjs';

const argv = process.argv.slice(2);
const num = (flag, dflt) => {
  const a = argv.find(x => x.startsWith(flag));
  return a ? Number(a.slice(flag.length)) : dflt;
};
const SRC = argv.find(a => !a.startsWith('--'));
if (!SRC) {
  console.error('  usage: node tools/square-shot.mjs <file> [--top=N] [--bottom=N]');
  process.exit(1);
}
const TOP = num('--top=', 0);
const BOTTOM = num('--bottom=', 0);
// How many source rows are stretched to fill the extension. Few, because the
// point is to replicate a flat surface rather than to scale a gradient.
const FEED = 4;

const b64 = readFileSync(SRC).toString('base64');
const type = SRC.endsWith('.png') ? 'png' : 'webp';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage();
const res = await page.evaluate(async ({ b64, type, TOP, BOTTOM, FEED }) => {
  const im = new Image();
  im.src = `data:image/${type};base64,` + b64;
  await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W; c.height = H + TOP + BOTTOM;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  if (TOP) g.drawImage(im, 0, 0, W, FEED, 0, 0, W, TOP);
  g.drawImage(im, 0, TOP);
  if (BOTTOM) g.drawImage(im, 0, H - FEED, W, FEED, 0, TOP + H, W, BOTTOM);
  return { was: `${W}x${H}`, now: `${c.width}x${c.height}`, url: c.toDataURL('image/webp', 0.9) };
}, { b64, type, TOP, BOTTOM, FEED });

writeFileSync(SRC, Buffer.from(res.url.split(',')[1], 'base64'));
console.log(`  ${SRC}`);
console.log(`  ${res.was} -> ${res.now}   (+${TOP} top, +${BOTTOM} bottom, stretched from ${FEED} rows)`);
await browser.close();
