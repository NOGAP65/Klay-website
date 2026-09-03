// ---------------------------------------------------------------------------
// THE RENDER BASELINE — the gate that has to exist before the visualiser moves.
//
// WHY THE BROWSER CHECKS USED IN PHASES 1–7 ARE NOT ENOUGH HERE.
//
// Those checks asked: did the page render, did any image 404, did the console
// throw. Every failure mode they cover is LOUD — a page that fails to render is
// obvious, a broken <img> reports itself, an exception appears in the console.
//
// A renderer has a different failure mode. It draws to a canvas. If a texture
// path is wrong the fallback silently substitutes a legacy sticker; if a colour
// lookup misses, the blind draws in the wrong colour; if a geometry constant is
// off, the fold pitch changes. **Nothing throws. Nothing 404s. The page renders
// perfectly and the picture is wrong.**
//
// So this check reads the CANVAS PIXELS and compares them to a recorded
// baseline. It is the only check in the project that can see a wrong picture.
//
//   npm run baseline:update    record (or re-record) the baselines
//   npm run baseline           compare against them — exit 1 on any drift
//
// THE SIGNATURE, AND WHY IT IS NOT A HASH. A hash of the pixel buffer would go
// red on one antialiased pixel and tell you nothing about what moved. Each
// canvas is downsampled to a 48x48 luminance grid; a cell differing by more
// than THRESHOLD counts as changed, and the report is a count and a percentage.
// That survives GPU dithering and catches a blind drawn in the wrong colour, in
// the wrong place, or not at all.
//
// STABILITY. Textures load asynchronously and the curtain renderer animates on
// entry, so a capture taken too early is noise. Each case polls until two
// consecutive signatures agree before recording.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../node_modules/playwright-core/index.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DIR = path.join(ROOT, 'tools/render-baseline');
const BASE = process.env.BASE_URL ?? 'http://localhost:5173';

const GRID = 48;        // signature resolution
const THRESHOLD = 12;   // 0-255 luminance delta before a cell counts as changed
const TOLERANCE = 0;    // cells allowed to differ before a case is RED

/** Each case drives the tool to one fixed configuration.
 *
 * `capture` says HOW to read the picture, and it is not a preference:
 *
 *   'canvas'      getImageData off the canvas. Blinds and curtains draw in 2D.
 *   'screenshot'  screenshot the canvas element and decode it back into a fresh
 *                 2D context. THE WARDROBE SURFACE IS WEBGL — getContext('2d')
 *                 returns null on it, so the 2D read sees nothing at all.
 *
 * `finish` clicks a swatch by its title attribute, because the finish controls
 * are colour chips with no text to match on. */
const CASES = [
  { name: 'blind-blockout-medium-manual', route: '/visualiser', capture: 'canvas', clicks: ['BLINDS', 'Blockout', 'Medium to 2m', 'Manual'] },
  { name: 'blind-sunscreen-large-motorised', route: '/visualiser', capture: 'canvas', clicks: ['BLINDS', 'Sunscreen', 'Large to 3m', 'Motorised +$150'] },
  { name: 'blind-lightfilter-small-manual', route: '/visualiser', capture: 'canvas', clicks: ['BLINDS', 'Light Filter', 'Small to 1m', 'Manual'] },
  { name: 'blind-dual-medium-manual', route: '/visualiser', capture: 'canvas', clicks: ['BLINDS', 'Dual', 'Medium to 2m', 'Manual'] },
  { name: 'curtain-default', route: '/visualiser', capture: 'canvas', clicks: ['CURTAINS'] },

  // WARDROBES — added before U4, which moves 27 MB of wardrobe assets through a
  // constructed path. R1 in the one area that had no coverage.
  //
  // They are driven from the HOMEPAGE, because /visualiser offers blinds and
  // curtains only: the wardrobe entry point was /visualizer, deleted when E-07
  // closed. Both surfaces that reach wardrobes are exercised — the showcase's
  // own WARDROBES tab, and RangeRow's "SEE IN 3D", which selects that tab from
  // a range card and is a second entry path worth its own case.
  //
  // COVERAGE IS DELIBERATE, not a sample: a built-in and a walk-in, white and
  // two different non-white finishes. The non-white cases matter most —
  // suppliedAssetPath returns null for anything but white, so a white-only set
  // would never exercise the fallback, and the finishes are the only part drawn
  // from a texture file rather than geometry.
  { name: 'wardrobe-builtin-forma1-white', route: '/', capture: 'screenshot', clicks: ['WARDROBES', 'Built-in', 'Forma 1'], finish: 'Matt Wardrobe White' },
  { name: 'wardrobe-builtin-forma2-walnut', route: '/', capture: 'screenshot', clicks: ['WARDROBES', 'Built-in', 'Forma 2'], finish: 'Woodmatt Notaio Walnut' },
  { name: 'wardrobe-walkin-12u-white', route: '/', capture: 'screenshot', clicks: ['WARDROBES', 'Walk-in', 'Forma 12.0U'], finish: 'Matt Wardrobe White' },
  { name: 'wardrobe-walkin-9l-oak', route: '/', capture: 'screenshot', clicks: ['WARDROBES', 'Walk-in', 'Forma 9.0L'], finish: 'Matt Natural Oak' },
  { name: 'wardrobe-see-in-3d', route: '/', capture: 'screenshot', clicks: ['SEE IN 3D'] },
];

/** Read the canvas as a coarse luminance grid, in the page. */
const SIGNATURE = (grid) => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let data;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    return null; // tainted or WebGL — handled by the caller
  }
  const out = [];
  const cw = canvas.width / grid;
  const ch = canvas.height / grid;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      let sum = 0;
      let n = 0;
      const x0 = Math.floor(gx * cw), x1 = Math.floor((gx + 1) * cw);
      const y0 = Math.floor(gy * ch), y1 = Math.floor((gy + 1) * ch);
      for (let y = y0; y < y1; y += 3) {
        for (let x = x0; x < x1; x += 3) {
          const i = (y * canvas.width + x) * 4;
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          n++;
        }
      }
      out.push(n ? Math.round(sum / n) : 0);
    }
  }
  return out;
};

/** Grid a PNG by decoding it back into a 2D context inside the page.
 *
 * The only way to read a WebGL canvas here. toDataURL comes back blank without
 * preserveDrawingBuffer, and getImageData needs a 2D context that does not
 * exist — but the compositor will screenshot it, and once it is a PNG it can be
 * drawn into a canvas we own and read normally. */
const DECODE = async ({ b64, grid }) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const out = [];
  const cw = c.width / grid;
  const ch = c.height / grid;
  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      let sum = 0;
      let n = 0;
      const x0 = Math.floor(gx * cw), x1 = Math.floor((gx + 1) * cw);
      const y0 = Math.floor(gy * ch), y1 = Math.floor((gy + 1) * ch);
      for (let y = y0; y < y1; y += 3) {
        for (let x = x0; x < x1; x += 3) {
          const i = (y * c.width + x) * 4;
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          n++;
        }
      }
      out.push(n ? Math.round(sum / n) : 0);
    }
  }
  return out;
};

async function readSignature(page, capture) {
  if (capture === 'screenshot') {
    const canvas = page.locator('canvas').first();
    if (!(await canvas.count())) return null;
    const shot = await canvas.screenshot();
    return page.evaluate(DECODE, { b64: shot.toString('base64'), grid: GRID });
  }
  return page.evaluate(SIGNATURE, GRID);
}

async function stableSignature(page, capture) {
  let previous = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
    const current = await readSignature(page, capture);
    if (!current) continue;
    if (previous && current.every((v, i) => Math.abs(v - previous[i]) <= 2)) return current;
    previous = current;
  }
  return previous;
}

function compare(a, b) {
  if (!a || !b || a.length !== b.length) return { changed: -1, pct: 100 };
  let changed = 0;
  for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > THRESHOLD) changed++;
  return { changed, pct: +((changed / a.length) * 100).toFixed(1) };
}

const update = process.argv.includes('--update');
fs.mkdirSync(DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const problems = [];
let red = 0;

console.log(update ? '\nRECORDING baselines\n' : '\nCOMPARING against baselines\n');

for (const testCase of CASES) {
  await page.goto(BASE + testCase.route, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));

  // The homepage cases need the showcase on screen before its controls are
  // clickable, and the screenshot capture needs the canvas actually painted.
  if (testCase.route === '/') {
    await page.evaluate(() => document.querySelector('canvas')?.scrollIntoView({ block: 'center' }));
    await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));
  }

  for (const label of testCase.clicks) {
    const clicked = await page.evaluate((text) => {
      const norm = (v) => v.replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll('button')].find((b) => norm(b.innerText) === text);
      if (!el) return false;
      el.click();
      return true;
    }, label);
    if (!clicked) problems.push(`${testCase.name}: control "${label}" not found`);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 350)));
  }

  if (testCase.finish) {
    const picked = await page.evaluate((title) => {
      const el = [...document.querySelectorAll('button')].find((b) => b.getAttribute('title') === title);
      if (!el) return false;
      el.click();
      return true;
    }, testCase.finish);
    if (!picked) problems.push(`${testCase.name}: finish "${testCase.finish}" not found`);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  }

  const signature = await stableSignature(page, testCase.capture);
  // A CASE THAT CANNOT BE READ IS RED, NEVER SKIPPED. getContext('2d') returns
  // null on a WebGL canvas, so a signature of null is not "no picture yet" — it
  // is a case this harness structurally cannot see. Counting it as red is what
  // stops a wardrobe case from being added, recording nothing, and passing.
  if (!signature) {
    problems.push(`${testCase.name}: NO READABLE CANVAS via '${testCase.capture}'. A WebGL
    surface must use capture: 'screenshot' — getContext('2d') returns null on it and the 2D read
    sees nothing. See UNFREEZE_MAP.md.`);
    console.log(`  RED    ${testCase.name.padEnd(36)} no readable canvas`);
    red++;
    continue;
  }

  const file = path.join(DIR, `${testCase.name}.json`);
  await page.locator('canvas').first().screenshot({ path: path.join(DIR, `${testCase.name}.png`) });

  if (update) {
    fs.writeFileSync(file, JSON.stringify({ grid: GRID, signature }) + '\n');
    console.log(`  recorded  ${testCase.name}`);
    continue;
  }

  if (!fs.existsSync(file)) { problems.push(`${testCase.name}: NO BASELINE — run baseline:update`); red++; continue; }
  const { signature: want } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { changed, pct } = compare(want, signature);
  const isRed = changed > TOLERANCE;
  if (isRed) red++;
  console.log(`  ${isRed ? 'RED  ' : 'green'}  ${testCase.name.padEnd(36)} ${changed} of ${GRID * GRID} cells changed (${pct}%)`);
}

await browser.close();

if (problems.length) { console.log('\nPROBLEMS:'); for (const p of problems) console.log('  ' + p); }
if (update) { console.log(`\n${CASES.length} baselines recorded in tools/render-baseline/.`); process.exit(0); }
if (red) { console.error(`\nRED: ${red} of ${CASES.length} render(s) differ from the baseline.`); process.exit(1); }
console.log(`\nGreen: all ${CASES.length} renders match the baseline.`);
