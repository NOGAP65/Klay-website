// CUTS THE TWO MASKS A DYED SHOT NEEDS: the cloth, and the metal.
//
// Run: node tools/cut-fabric-mask.mjs <photo> <product-id>
//   -> public/images/fabrics/<product-id>.mask.png       the fabric
//   -> public/images/fabrics/<product-id>.hardware.png   the headrail and bar
//   -> public/images/fabrics/<product-id>.overlay.png    for a human to check
//
// ---------------------------------------------------------------------------
// HOW THE CLOTH IS FOUND
//
// SATURATION, not brightness. The bone fabric measures 0.06 against a warm
// plaster wall at 0.32, and brightness alone could not separate them because the
// marble benchtop is nearly as light as the cloth.
//
// AN UPPER LUMINANCE BOUND turns the halo of light leaking round the blind into
// a wall the flood fill cannot cross. The light leak a photographer would call a
// flaw is what makes this cheap.
//
// THE HALO PEAKS ALSO GIVE A HARD BOX, so a leak is impossible rather than
// unlikely.
//
// CLOSE FOR TOPOLOGY, THEN INTERSECT WITH THE COLOUR TEST — and this is the fix
// for the first version, which overflowed. A morphological close is needed
// because the fill stopped a few pixels short under the headrail in a jagged
// line, invisible on white and a bright fringe on black. But closing alone
// dilates in EVERY direction, including out past the cloth and over the metal.
// Intersecting the closed mask with "is this pixel plausibly fabric" fills the
// notches while making it impossible for the outline to grow onto anything that
// is not cloth. Topology from the close, boundary from the photograph.
//
// ---------------------------------------------------------------------------
// HOW THE METAL IS FOUND, AND WHY IT IS NOT JUST "BRIGHT AND NEUTRAL"
//
// The headrail and the bottom bar are brighter and far more neutral than the
// cloth — 0.003 against 0.06 — which would be enough, except that the halo is
// also bright and neutral, and the halo is LIGHT rather than metal. Dyeing it
// would turn the glow around the blind black.
//
// What separates them is shape: hardware is a horizontal bar spanning the whole
// blind, the halo is a vertical strip down each side. So a row only counts as
// hardware if most of its width qualifies. A row through the middle of the
// fabric has a few bright pixels at each edge and fails; a row through the
// headrail is bright nearly all the way across and passes.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from '../node_modules/playwright-core/index.mjs';

// ---------------------------------------------------------------------------
// TWO GEOMETRIES, AND A CURTAIN IS NOT A BLIND IN A RECESS.
//
// The blind cutter keys off the halo of light leaking round a window frame: it
// gives a hard box, it walls the flood fill in, and it is the brightest thing in
// the frame. A curtain photograph has none of that. It hangs from a ceiling
// track across nearly the whole wall, its cloth measures 150-190 at 0.11-0.20
// saturation where the plaster wall behind it measures much the same, and the
// brightest thing in the frame is the WINDOW showing through the gap between
// two panels -- which is the one region that must not be dyed.
//
// So `--curtain` finds the cloth differently:
//
//   TOP AND BOTTOM FROM THE CLOTH ITSELF. A curtain runs track to floor, and
//   the floor is timber: saturation above 0.3 where the cloth never is. Scanning
//   each column for that transition finds the hem without needing a halo.
//
//   THE WINDOW GAP IS EXCLUDED BY BRIGHTNESS. Daylight through the panel gap
//   reads 218-254; the cloth tops out around 200. An upper bound drops it.
//
//   TWO SEEDS, ONE PER PANEL, because the gap between them means the cloth is
//   not one connected region -- which is exactly why the blind cutter's single
//   centre seed failed with "seed is not cloth": the middle of a curtain
//   photograph is the window.
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const CURTAIN = argv.includes('--curtain');
/** `--box top,bottom,left,right` as fractions of the frame — the drop, read off
 * the photograph. See the note in the curtain branch on why it is given rather
 * than found. */
const boxArg = argv.find(a => a.startsWith('--box='));
const BOX = boxArg ? boxArg.slice(6).split(',').map(Number) : null;
const args = argv.filter(a => !a.startsWith('--'));
const SRC = args[0];
const ID = args[1];
if (!SRC || !ID) {
  console.error('  usage: node tools/cut-fabric-mask.mjs <photo> <product-id> [--curtain]');
  process.exit(1);
}
const DIR = 'public/images/fabrics';
// THE OVERLAY DOES NOT SHIP. It exists so a person can see what was cut before
// trusting it, which makes it documentation rather than an asset — and anything
// under public/ is bundled and served, so a check artifact there would be dead
// weight on every visitor.
const REVIEW = 'docs/fabric-overlays';
for (const d of [DIR, REVIEW]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

const SIZE = Number(args[2] ?? 900);
const b64 = readFileSync(SRC).toString('base64');

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
});
const page = await browser.newPage();

const res = await page.evaluate(async ({ b64, SIZE, CURTAIN, BOX }) => {
  const im = new Image();
  im.src = 'data:image/png;base64,' + b64;
  await im.decode();
  const W0 = im.naturalWidth;
  const S = Math.min(1, SIZE / W0);
  const W = Math.round(W0 * S), H = Math.round(im.naturalHeight * S);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingQuality = 'high';
  g.drawImage(im, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;

  const L_ = (x, y) => {
    const i = (y * W + x) * 4;
    return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
  };
  const S_ = (x, y) => {
    const i = (y * W + x) * 4;
    const mx = Math.max(px[i], px[i + 1], px[i + 2]);
    const mn = Math.min(px[i], px[i + 1], px[i + 2]);
    return mx === 0 ? 0 : (mx - mn) / mx;
  };

  // --- CURTAINS: their own geometry, and an early return ------------------
  if (CURTAIN) {
    // THE BOX IS GIVEN, NOT FOUND, AND THAT IS THE HONEST ANSWER HERE.
    //
    // A blind's box comes free: the halo of light round the window frame is the
    // brightest thing in the shot and walls the fill in on all four sides. A
    // curtain has no such edge, and measuring this photograph says why no
    // colour test can replace one — the cloth runs 155-195 at 0.11-0.20
    // saturation and the plaster wall behind it runs 165-187 at 0.12-0.17. They
    // overlap almost exactly, because a curtain in shadow and a wall in daylight
    // ARE the same colour. Two passes were spent trying to separate them before
    // measuring proved they cannot be.
    //
    // So the drop is four numbers read off the photograph once: track, hem, and
    // the outside edge of each panel. It is a minute of work per shot, it is
    // exact, and it cannot drift — where a heuristic that half-works would fail
    // silently on the next photograph.
    const [T0, B0, L0, R0] = BOX ?? [0.05, 0.79, 0.065, 0.935];
    const bT = Math.round(H * T0), bB = Math.round(H * B0);
    const bL = Math.round(W * L0), bR = Math.round(W * R0);
    const inDrop = (y) => y >= bT && y <= bB;

    // Inside the box the only thing that is not cloth is the window in the gap
    // between the panels, which is the brightest thing in the frame at 218-254.
    const cloth = (x, y) => x >= bL && x <= bR && L_(x, y) < 214;
    const firstRow = bT, hem = bB;

    // The hem, per column: walking up from the bottom, the first row that is
    // cloth after a run of floor. Timber and rug both break the test, so this
    // finds where the fabric ends without needing to recognise a floor.
    // TWO SEEDS PER PANEL, because the gap between the panels means the cloth
    // is not one connected region — which is exactly why the blind cutter's
    // single centre seed failed here: the middle of a curtain photograph is the
    // window.
    const inCloth = (x, y) => inDrop(y) && cloth(x, y);
    const seeds = [];
    for (const fx of [0.18, 0.3, 0.7, 0.82]) {
      const x = Math.round(W * fx);
      for (let y = firstRow; y <= hem; y += 2) {
        if (inCloth(x, y)) { seeds.push(y * W + x); break; }
      }
    }
    if (!seeds.length) return { error: 'found no curtain cloth to seed from' };

    const m = new Uint8Array(W * H);
    const stack = [];
    for (const s0 of seeds) if (!m[s0]) { m[s0] = 1; stack.push(s0); }
    while (stack.length) {
      const p = stack.pop();
      const x = p % W, y = (p / W) | 0;
      if (x > 0     && !m[p - 1] && inCloth(x - 1, y)) { m[p - 1] = 1; stack.push(p - 1); }
      if (x < W - 1 && !m[p + 1] && inCloth(x + 1, y)) { m[p + 1] = 1; stack.push(p + 1); }
      if (y > 0     && !m[p - W] && inCloth(x, y - 1)) { m[p - W] = 1; stack.push(p - W); }
      if (y < H - 1 && !m[p + W] && inCloth(x, y + 1)) { m[p + W] = 1; stack.push(p + W); }
    }

    // Close, then intersect — same reasoning as the blind: topology from the
    // close, boundary from the photograph, so the outline cannot grow onto the
    // wall or into the window.
    const morphC = (src, r, dilate) => {
      const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let hit = dilate ? 0 : 1;
        for (let k = -r; k <= r; k++) {
          const v = src[y * W + Math.min(W - 1, Math.max(0, x + k))];
          if (dilate) { if (v) { hit = 1; break; } } else if (!v) { hit = 0; break; }
        }
        tmp[y * W + x] = hit;
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let hit = dilate ? 0 : 1;
        for (let k = -r; k <= r; k++) {
          const v = tmp[Math.min(H - 1, Math.max(0, y + k)) * W + x];
          if (dilate) { if (v) { hit = 1; break; } } else if (!v) { hit = 0; break; }
        }
        out[y * W + x] = hit;
      }
      return out;
    };
    const rC = Math.max(3, Math.round(W / 110));
    let cl = morphC(morphC(m, rC, true), rC, false);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (cl[p] && !m[p] && !cloth(x, y)) cl[p] = 0;
    }

    let n = 0, cx0 = W, cy0 = H, cx1 = 0, cy1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (cl[y * W + x]) {
      n++;
      if (x < cx0) cx0 = x; if (x > cx1) cx1 = x;
      if (y < cy0) cy0 = y; if (y > cy1) cy1 = y;
    }

    const png = (paint) => {
      const cc = document.createElement('canvas');
      cc.width = W; cc.height = H;
      paint(cc.getContext('2d'));
      return cc.toDataURL('image/png');
    };
    const maskUrl = png((ctx) => {
      const d = ctx.createImageData(W, H);
      for (let p = 0; p < W * H; p++) {
        let a = cl[p] ? 255 : 0;
        if (!a) {
          const x = p % W, y = (p / W) | 0;
          if (x > 0 && x < W - 1 && y > 0 && y < H - 1 &&
              (cl[p - 1] + cl[p + 1] + cl[p - W] + cl[p + W]) > 0) a = 120;
        }
        d.data[p * 4] = d.data[p * 4 + 1] = d.data[p * 4 + 2] = 255;
        d.data[p * 4 + 3] = a;
      }
      ctx.putImageData(d, 0, 0);
    });
    const overlayUrl = png((ctx) => {
      ctx.drawImage(im, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H);
      for (let p = 0; p < W * H; p++) {
        if (!cl[p]) continue;
        d.data[p * 4]     = Math.round(d.data[p * 4] * 0.35 + 166);
        d.data[p * 4 + 1] = Math.round(d.data[p * 4 + 1] * 0.35);
        d.data[p * 4 + 2] = Math.round(d.data[p * 4 + 2] * 0.35 + 91);
      }
      ctx.putImageData(d, 0, 0);
    });

    return {
      W, H, curtain: true,
      box: { L: cx0, R: cx1, T: cy0, B: cy1 },
      raw: 0, cloth: n, metal: 0, bars: 0, barBands: 'n/a', grew: 0,
      mask: maskUrl, hardware: null, overlay: overlayUrl,
    };
  }

  // --- the halo box -------------------------------------------------------
  const cy = Math.round(H * 0.42), cx = Math.round(W * 0.5);
  const peak = (from, to, horizontal) => {
    let bi = from, bv = -1;
    const step = to > from ? 1 : -1;
    for (let i = from; i !== to; i += step) {
      let s = 0;
      for (let f = -20; f <= 20; f++) s += horizontal ? L_(i, cy + f) : L_(cx + f, i);
      if (s > bv) { bv = s; bi = i; }
    }
    return bi;
  };
  const L = peak(2, Math.round(W * 0.35), true);
  const R = peak(W - 3, Math.round(W * 0.65), true);
  const T = peak(2, Math.round(H * 0.30), false);
  const B = peak(Math.round(H * 0.72), Math.round(H * 0.45), false);

  // --- the metal ----------------------------------------------------------
  // Bright and very neutral, in a row that is mostly bright and very neutral.
  // The second half is what keeps the side halo out of it.
  const metalAt = (x, y) => L_(x, y) > 185 && S_(x, y) < 0.05;
  const hw = new Uint8Array(W * H);
  const searchTop = Math.max(1, T - Math.round(H * 0.03));
  const searchBot = Math.min(H - 2, B + Math.round(H * 0.02));
  const bars = [];
  for (let y = searchTop; y <= searchBot; y++) {
    let n = 0;
    for (let x = L; x <= R; x++) if (metalAt(x, y)) n++;
    if (n / (R - L) > 0.55) {
      bars.push(y);
      for (let x = L; x <= R; x++) if (metalAt(x, y)) hw[y * W + x] = 1;
    }
  }
  // Bridge the end caps and the odd dark pixel, horizontally only — a vertical
  // close here would reach into the fabric.
  for (const y of bars) {
    let run = -1;
    for (let x = L; x <= R; x++) {
      if (hw[y * W + x]) { if (run >= 0 && x - run < 26) for (let k = run; k < x; k++) hw[y * W + k] = 1; run = x; }
    }
  }

  // --- the cloth ----------------------------------------------------------
  const clothAt = (x, y) => {
    if (x <= L || x >= R || y <= T || y >= B) return false;
    if (hw[y * W + x]) return false;
    const s = S_(x, y), l = L_(x, y);
    return s < 0.16 && l > 140 && l < 232;
  };
  if (!clothAt(cx, cy)) return { error: 'seed is not cloth' };

  let mask = new Uint8Array(W * H);
  const stack = [cy * W + cx];
  mask[stack[0]] = 1;
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    if (!mask[p - 1] && clothAt(x - 1, y)) { mask[p - 1] = 1; stack.push(p - 1); }
    if (!mask[p + 1] && clothAt(x + 1, y)) { mask[p + 1] = 1; stack.push(p + 1); }
    if (!mask[p - W] && clothAt(x, y - 1)) { mask[p - W] = 1; stack.push(p - W); }
    if (!mask[p + W] && clothAt(x, y + 1)) { mask[p + W] = 1; stack.push(p + W); }
  }
  const raw = mask.reduce((a, v) => a + v, 0);

  // --- BRIDGE THE CLOTH UP TO THE METAL -----------------------------------
  //
  // On a roller blind the cloth runs bar to bar: there is nothing between the
  // headrail and the fabric, and nothing between the fabric and the bottom bar.
  // The flood fill does not know that, and stops at the hard shadow line the
  // headrail casts — a band a few pixels deep that is too dark to pass the
  // luminance test. Left there it renders as a strip of undyed bone between a
  // black rail and a green blind, which is exactly what it looked like.
  //
  // So each column is extended from where the fill stopped to the bar above and
  // the bar below. It is a structural fact about the product rather than
  // something read out of the pixels, which is why it is safe: a column with no
  // cloth in it at all is left alone, so the side halo cannot be bridged into.
  const bridged = new Uint8Array(W * H);
  const REACH = Math.round(H / 18);
  for (let x = L + 1; x < R; x++) {
    let top = -1, bot = -1;
    for (let y = T + 1; y < B; y++) if (mask[y * W + x]) { top = y; break; }
    for (let y = B - 1; y > T; y--) if (mask[y * W + x]) { bot = y; break; }
    if (top < 0) continue;                       // no cloth in this column
    for (const [from, dir] of [[top, -1], [bot, 1]]) {
      for (let k = 1; k <= REACH; k++) {
        const y = from + dir * k;
        if (y <= T || y >= B) break;
        const p = y * W + x;
        if (hw[p]) break;                        // reached the metal: stop
        if (mask[p]) break;
        // A leaf or a bracket in front of the blind is not cloth in shadow.
        if (S_(x, y) > 0.32) break;
        bridged[p] = 1;
      }
    }
  }
  for (let p = 0; p < W * H; p++) if (bridged[p]) mask[p] = 1;

  // Close, separable.
  const morph = (src, r, dilate) => {
    const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let hit = dilate ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const v = src[y * W + Math.min(W - 1, Math.max(0, x + k))];
        if (dilate) { if (v) { hit = 1; break; } } else if (!v) { hit = 0; break; }
      }
      tmp[y * W + x] = hit;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let hit = dilate ? 0 : 1;
      for (let k = -r; k <= r; k++) {
        const v = tmp[Math.min(H - 1, Math.max(0, y + k)) * W + x];
        if (dilate) { if (v) { hit = 1; break; } } else if (!v) { hit = 0; break; }
      }
      out[y * W + x] = hit;
    }
    return out;
  };
  const R_CLOSE = Math.max(4, Math.round(W / 75));
  let closed = morph(morph(mask, R_CLOSE, true), R_CLOSE, false);

  // THE INTERSECTION. Topology from the close, boundary from the photograph —
  // slightly relaxed so anti-aliased edge pixels are kept, but never the wall,
  // never the halo, never the metal.
  const plausible = (x, y) => {
    if (x <= L || x >= R || y <= T || y >= B) return false;
    if (hw[y * W + x]) return false;
    return S_(x, y) < 0.22 && L_(x, y) > 128 && L_(x, y) < 240;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (closed[p] && !mask[p] && !plausible(x, y)) closed[p] = 0;
  }
  // The bridge is a structural claim, not a colour one, so it survives the
  // intersection — the shadow it recovers is deliberately darker than any
  // colour test would admit.
  for (let p = 0; p < W * H; p++) if (bridged[p]) closed[p] = 1;

  const count = (m) => { let n = 0; for (let i = 0; i < m.length; i++) if (m[i]) n++; return n; };
  const alphaPng = (m) => {
    const cc = document.createElement('canvas');
    cc.width = W; cc.height = H;
    const ctx = cc.getContext('2d');
    const d = ctx.createImageData(W, H);
    for (let p = 0; p < W * H; p++) {
      let a = m[p] ? 255 : 0;
      if (!a) {
        const x = p % W, y = (p / W) | 0;
        if (x > 0 && x < W - 1 && y > 0 && y < H - 1 &&
            (m[p - 1] + m[p + 1] + m[p - W] + m[p + W]) > 0) a = 120;
      }
      d.data[p * 4] = d.data[p * 4 + 1] = d.data[p * 4 + 2] = 255;
      d.data[p * 4 + 3] = a;
    }
    ctx.putImageData(d, 0, 0);
    return cc.toDataURL('image/png');
  };

  const oc = document.createElement('canvas');
  oc.width = W; oc.height = H;
  const og = oc.getContext('2d');
  og.drawImage(im, 0, 0, W, H);
  const od = og.getImageData(0, 0, W, H);
  for (let p = 0; p < W * H; p++) {
    if (closed[p]) {                                   // cloth: magenta
      od.data[p * 4]     = Math.round(od.data[p * 4] * 0.35 + 166);
      od.data[p * 4 + 1] = Math.round(od.data[p * 4 + 1] * 0.35);
      od.data[p * 4 + 2] = Math.round(od.data[p * 4 + 2] * 0.35 + 91);
    } else if (hw[p]) {                                // metal: cyan
      od.data[p * 4]     = Math.round(od.data[p * 4] * 0.3);
      od.data[p * 4 + 1] = Math.round(od.data[p * 4 + 1] * 0.3 + 150);
      od.data[p * 4 + 2] = Math.round(od.data[p * 4 + 2] * 0.3 + 175);
    }
  }
  og.putImageData(od, 0, 0);

  return {
    W, H, box: { L, R, T, B },
    raw, cloth: count(closed), metal: count(hw),
    bars: bars.length,
    barBands: bars.length ? `${bars[0]}..${bars[bars.length - 1]}` : 'none',
    grew: count(closed) - raw,
    mask: alphaPng(closed),
    hardware: alphaPng(hw),
    overlay: oc.toDataURL('image/png'),
  };
}, { b64, SIZE, CURTAIN, BOX });

if (res.error) { console.error('  ' + res.error); await browser.close(); process.exit(1); }
const save = (u, p) => writeFileSync(p, Buffer.from(u.split(',')[1], 'base64'));
save(res.mask, `${DIR}/${ID}.mask.png`);
// A curtain has no metal to cut: it hangs from a track that is not part of the
// product being coloured.
if (res.hardware) save(res.hardware, `${DIR}/${ID}.hardware.png`);
save(res.overlay, `${REVIEW}/${ID}.overlay.png`);

console.log(`  ${res.W}x${res.H}   halo L${res.box.L} R${res.box.R} T${res.box.T} B${res.box.B}`);
console.log(`  cloth  ${res.cloth.toLocaleString()} px  (close recovered ${res.grew >= 0 ? '+' : ''}${res.grew.toLocaleString()})`);
console.log(`  metal  ${res.metal.toLocaleString()} px across ${res.bars} rows, y ${res.barBands}`);
console.log(`  -> ${DIR}/${ID}.{mask,hardware}.png`);
console.log(`  -> ${REVIEW}/${ID}.overlay.png   (check this before trusting it)`);
await browser.close();
