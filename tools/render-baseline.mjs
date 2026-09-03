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

/** Each case drives the tool to one fixed configuration. */
const CASES = [
  { name: 'blind-blockout-medium-manual', route: '/visualiser', clicks: ['BLINDS', 'Blockout', 'Medium to 2m', 'Manual'] },
  { name: 'blind-sunscreen-large-motorised', route: '/visualiser', clicks: ['BLINDS', 'Sunscreen', 'Large to 3m', 'Motorised +$150'] },
  { name: 'blind-lightfilter-small-manual', route: '/visualiser', clicks: ['BLINDS', 'Light Filter', 'Small to 1m', 'Manual'] },
  { name: 'blind-dual-medium-manual', route: '/visualiser', clicks: ['BLINDS', 'Dual', 'Medium to 2m', 'Manual'] },
  { name: 'curtain-default', route: '/visualiser', clicks: ['CURTAINS'] },
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

async function stableSignature(page) {
  let previous = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
    const current = await page.evaluate(SIGNATURE, GRID);
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

  const signature = await stableSignature(page);
  // A CASE THAT CANNOT BE READ IS RED, NEVER SKIPPED. getContext('2d') returns
  // null on a WebGL canvas, so a signature of null is not "no picture yet" — it
  // is a case this harness structurally cannot see. Counting it as red is what
  // stops a wardrobe case from being added, recording nothing, and passing.
  if (!signature) {
    problems.push(`${testCase.name}: NO READABLE CANVAS — 2D read failed. If this surface is
    WebGL it needs the screenshot-and-decode capture, not getImageData; see UNFREEZE_MAP.md.`);
    console.log(`  RED    ${testCase.name.padEnd(36)} no readable canvas`);
    red++;
    continue;
  }

  const file = path.join(DIR, `${testCase.name}.json`);
  await page.screenshot({ path: path.join(DIR, `${testCase.name}.png`), clip: await page.evaluate(() => {
    const c = document.querySelector('canvas').getBoundingClientRect();
    return { x: Math.max(0, c.x), y: Math.max(0, c.y), width: Math.min(c.width, 1400), height: Math.min(c.height, 1000) };
  }) });

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
