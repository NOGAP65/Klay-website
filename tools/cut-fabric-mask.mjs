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
/** A louvred blind — venetian or plantation shutter. Everything inside the box
 * takes colour except the daylight between the slats. */
const SLATS = argv.includes('--slats');
/** `--box top,bottom,left,right` as fractions of the frame — the drop, read off
 * the photograph. See the note in the curtain branch on why it is given rather
 * than found. */
const boxArg = argv.find(a => a.startsWith('--box='));
const BOX = boxArg ? boxArg.slice(6).split(',').map(Number) : null;
/** `--glass top,bottom,left,right`, repeatable — the openings a louvred blind
 * covers, in the same fractions. See the note in the slats branch. */
const GLASS = argv.filter(a => a.startsWith('--glass=')).map(a => a.slice(8).split(',').map(Number));
/** `--front top,bottom,left,right`, repeatable — what STANDS IN FRONT of the
 * blind and must not take its colour: the table lamp whose shade crosses the
 * bottom corner of the venetian, a pot plant leaning over a shutter frame.
 *
 * It is given for the same reason the box is. A lamp shade in warm white is not
 * a colour away from a slat in warm white, so nothing in the pixels says which
 * is which — and the cost of guessing is a charcoal smear across a lamp in the
 * one image a customer is judging the product by. Left out entirely, the blind
 * simply ends where the lamp begins, which loses a little colour in a corner
 * rather than putting it somewhere it cannot be. */
const FRONT = argv.filter(a => a.startsWith('--front=')).map(a => a.slice(8).split(',').map(Number));
/** `--lit top,bottom,left,right`, repeatable — cloth the brightness test cannot
 * admit. A curtain's leading edge faces the window and is lit through it: it
 * measures 243-255 where a shaded fold reads 155-195, so any bound set to keep
 * daylight out keeps that edge out too. Inside these rectangles the test is not
 * asked. See the note in the curtain branch. */
const LIT = argv.filter(a => a.startsWith('--lit=')).map(a => a.slice(6).split(',').map(Number));
/** `--track top,bottom,left,right`, repeatable — the curtain track, so the
 * hardware colour has something to paint. See the note in the curtain branch
 * on why it is given and on how little of it this photograph holds. */
const TRACK = argv.filter(a => a.startsWith('--track=')).map(a => a.slice(8).split(',').map(Number));
/** A folding arm awning. Not a blind in a recess and not a curtain on a wall:
 * a sheet of acrylic held out over a garden on two elbowed arms, photographed
 * from underneath against the sky. See the note in its branch. */
const AWNING = argv.includes('--awning');
/** `--cloth` and `--metal x1,y1,x2,y2,...`, repeatable — polygons in fractions
 * of the frame, forced to cloth and to metal whatever the pixels say. The
 * awning's cassette and the valance hanging off its front bar; see its branch. */
const poly = (flag) => argv.filter(a => a.startsWith(flag)).map(a =>
  a.slice(flag.length).split(',').map(Number));
const CLOTH_POLY = poly('--cloth=');
const METAL_POLY = poly('--metal=');
/** `--keep x1,y1,x2,y2,...` — the awning's silhouette, drawn generously. The
 * fill may not leave it.
 *
 * A BOX IS NOT ENOUGH FOR A DIAGONAL PRODUCT, which is the difference between
 * this photograph and every other one here. A blind and a curtain are upright
 * rectangles, so a rectangle bounds them and bounds nothing else. An awning
 * crosses the frame corner to corner, and any rectangle around it also contains
 * the house wall below its left end — cream, unsaturated, and connected to the
 * cassette, so the fill walks straight down the wall and out along the bottom of
 * the box into the garden. Run without this, that is exactly what it did. */
const KEEP_POLY = poly('--keep=');
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

const res = await page.evaluate(async ({ b64, SIZE, CURTAIN, SLATS, AWNING, BOX, GLASS, FRONT, LIT, TRACK, CLOTH_POLY, METAL_POLY, KEEP_POLY }) => {
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

  // --- SLATS: a venetian or a shutter, and an early return ----------------
  //
  // A LOUVRED BLIND IS NOT A SHEET OF CLOTH, and treating it as one is wrong in
  // a way the roller cutter cannot see. Between every slat is a GAP showing the
  // garden, and dyeing the blind's rectangle tints the view through it — run
  // against this photograph, the flood fill took slats and gaps together and
  // turned the trees pink.
  //
  // The slats are horizontal bars spanning the blind — which is the same shape
  // test the roller's headrail already uses, applied forty times instead of
  // twice. Every row is one thing or the other, all the way across, so the
  // decision is taken per row rather than per pixel.
  //
  // BUT THE SLATS ARE NOT THE PRODUCT, only the louvred part of it. The first
  // version stopped there and dyed the blades alone, which put charcoal louvres
  // in a cream frame — see the note on the openings below for what the frame
  // measures and why no threshold reaches it.
  //
  // The box is given rather than found, for the reason the curtains give: the
  // white architrave round this window is the same tone as the slats, so no
  // threshold separates them. It runs frame to frame — the whole unit, not the
  // louvred part of it.
  if (SLATS) {
    const [T0, B0, L0, R0] = BOX ?? [0.11, 0.70, 0.17, 0.82];
    const bT = Math.round(H * T0), bB = Math.round(H * B0);
    const bL = Math.round(W * L0), bR = Math.round(W * R0);

    // THE OPENINGS THE BLIND COVERS — and everything in the box that is not one
    // of them is the product.
    //
    // This is the fix for a mask that dyed the slats and nothing else. A
    // shutter's frame, its centre stile and its top and bottom rails are as
    // much the shutter as its louvres are, and a venetian's headrail and bottom
    // bar are colour-matched to its slats; choosing Charcoal and getting
    // charcoal blades in a cream frame is not a product anyone sells. The first
    // version could not reach them because it looked for slats by COLOUR — and
    // measured on this photograph, the frame is not a colour that can be found:
    // in shade it runs 158-189 at 0.14-0.20 saturation, and the plaster wall
    // behind it runs 152-205 at 0.15-0.24. They overlap, for the reason the
    // curtain branch gives at length — a white frame in shadow and a warm wall
    // in daylight ARE the same colour.
    //
    // So the glass is given, like the box, read off the photograph once. What
    // is left is structure by construction rather than by threshold: outside
    // every opening, inside the box, it is the product, full stop.
    //
    // One rectangle per opening, not one per panel, so a tilt rod standing in
    // front of the view keeps its colour — the rod splits its panel into two.
    // Given none, the whole box is glass, which is what the first version
    // assumed.
    const rect = ([t, b, l, r]) => ({
      T: Math.round(H * t), B: Math.round(H * b),
      L: Math.round(W * l), R: Math.round(W * r),
    });
    const glass = (GLASS.length ? GLASS : [[T0, B0, L0, R0]]).map(rect);
    const front = FRONT.map(rect);
    const behind = (x, y) => front.some(f => x >= f.L && x <= f.R && y >= f.T && y <= f.B);

    // A SLAT IS FLAT ACROSS THE OPENING; THE VIEW IS NOT.
    //
    // One slat is one piece of painted timber, so a row through it reads the
    // same at the left of the opening as at the right. A row through a gap reads
    // the window reveal at one end, a tree in the middle and sky at the other.
    // So the test is p90 minus p10 of luminance across the opening: measured on
    // both photographs, a slat row spans 5-32 and a gap row 38-121.
    //
    // THIS REPLACES A COLOUR TEST — "a slat is neutral, the garden is not" —
    // which was here first, is the obvious thing to reach for, and is wrong
    // twice over. Worth recording both, because both look like the sort of
    // photograph anyone would shoot next.
    //
    // It broke on the VENETIAN'S TOP SLATS, which are seen from underneath. Warm
    // bounce puts their undersides at 0.22-0.30 saturation against a painted
    // face's 0.05, while the gaps between them show flat blown sky at 0.03-0.09
    // — so colour called every one of those rows backwards and dyed the sky
    // instead of the slat. That was the banding across the top of the blind.
    // Spread reads the same slats at 14-28 and the same gaps at 48-74.
    //
    // It broke again on the SHUTTER'S BLOWN LOWER LIPS. The lit underside of
    // each louvre reads 237-254, and a colour test with an upper bound to keep
    // sky out scores those rows at 0.00-0.17, so a cream line was left under
    // every blade. Spread reads them at 5-12, because a blown slat is still a
    // flat one.
    //
    // PER OPENING, AND THE WORST ONE DECIDES. This is what lets one number serve
    // both. Pooling the shutter's two panels would fail on its own terms — at
    // the same height its left slats sit near 240 and its right near 200, so a
    // pooled spread on a good slat row reads 50 — and taking the worst is also
    // what covers the one opening spread cannot read alone: flat sky through the
    // right panel's gap is as flat as a slat, 10-19 against 9-19, but the left
    // panel is looking at a tree on that same row and reads 95-121. The slats of
    // two panels of one shutter are at the same height by construction, so one
    // opening that can see the difference is enough.
    //
    // IT IS ASKED OF THE GLASS ONLY. The box runs frame to frame, and the frame
    // is flat on every row — so a spread taken across all of it would call every
    // gap row a slat and dye the view after all. The question a row has to
    // answer is "is the opening covered here", so the opening is what it is
    // asked about.
    const pct = (a, p) => a[Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))))];
    const spreadOf = (g, y) => {
      const ls = [];
      for (let x = g.L; x <= g.R; x++) ls.push(L_(x, y));
      ls.sort((a, b) => a - b);
      return pct(ls, 0.9) - pct(ls, 0.1);
    };

    const m = new Uint8Array(W * H);
    let rows = 0, frameRows = 0;
    for (let y = bT; y <= bB; y++) {
      const open = glass.filter(g => y >= g.T && y <= g.B);
      let spread = 0;
      for (const g of open) spread = Math.max(spread, spreadOf(g, y));
      // Above the top rail and below the bottom one there is no opening to
      // cover, and the row is solid product — a headrail, a bottom bar, the
      // head and sill of a shutter frame.
      //
      // 40 sits in the middle of the empty band between a slat row's 32 and a
      // gap row's 38, with the transition row either side of it landing on the
      // right answer.
      if (open.length && spread >= 40) {
        // A row the light comes through. The stiles, the rails and the rod
        // still cross it; only the openings are cut out of it.
        frameRows++;
        for (let x = bL; x <= bR; x++) {
          if (open.some(g => x >= g.L && x <= g.R)) continue;
          if (behind(x, y)) continue;
          m[y * W + x] = 1;
        }
        continue;
      }
      rows++;
      // THE WHOLE ROW, NOT SOME SELECTION WITHIN IT. A slat has a lit face and
      // a shadowed leading edge, and every per-pixel rule tried here passed one
      // and failed the other — which dyed half of each slat and left the rest
      // cream, reading as a fault rather than a colour. The row-level decision
      // is the honest one: a slat spans the blind, so this row IS a slat, across
      // its width, or it is not one at all.
      for (let x = bL; x <= bR; x++) if (!behind(x, y)) m[y * W + x] = 1;
    }

    let n = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) {
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
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
        d.data[p * 4] = d.data[p * 4 + 1] = d.data[p * 4 + 2] = 255;
        d.data[p * 4 + 3] = m[p] ? 255 : 0;
      }
      ctx.putImageData(d, 0, 0);
    });
    const overlayUrl = png((ctx) => {
      ctx.drawImage(im, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H);
      for (let p = 0; p < W * H; p++) {
        if (!m[p]) continue;
        d.data[p * 4]     = Math.round(d.data[p * 4] * 0.35 + 166);
        d.data[p * 4 + 1] = Math.round(d.data[p * 4 + 1] * 0.35);
        d.data[p * 4 + 2] = Math.round(d.data[p * 4 + 2] * 0.35 + 91);
      }
      ctx.putImageData(d, 0, 0);
    });
    return {
      W, H, box: { L: x0, R: x1, T: y0, B: y1 },
      raw: 0, cloth: n, metal: 0, bars: rows,
      barBands: `${rows} covered, ${frameRows} open`,
      grew: 0, mask: maskUrl, hardware: null, overlay: overlayUrl,
    };
  }

  // --- AWNINGS: a third geometry, and a third early return ----------------
  //
  // A FOLDING ARM AWNING IS NOT A BLIND AND NOT A CURTAIN. It is a sheet of
  // acrylic held out over a garden on two elbowed arms, photographed from
  // underneath. There is no recess, no halo, no track and no hem: the thing is
  // an oblique quadrilateral hanging in the middle of the frame with sky behind
  // it, and none of the earlier machinery has an edge to hold on to.
  //
  // BUT THE SKY IS BLUE, AND THAT IS THE WHOLE OF THE OUTLINE. Measured down
  // five columns of this photograph, the sky runs 0.24-0.36 saturation and the
  // canopy 0.10-0.14 — the widest gap between a product and its background of
  // any shot in this directory. A flood fill that refuses anything saturated
  // finds the awning's silhouette exactly, arms and all, with nothing to tune.
  // The house is on the far side of the same test, at 0.19-0.55.
  //
  // AND THE ARMS ARE DARKER THAN THE CLOTH THEY HOLD UP, which is the other
  // half. Column by column the canopy reads 205-222 and the arm crossing it
  // reads 151-192, because an arm is in its own shadow under a lit sheet. So
  // the fill is split by brightness: the dark part of the awning is its
  // metalwork and takes the cassette colour, the bright part is its cloth and
  // takes the fabric colour. Two colours, both landing where they belong,
  // without a single arm being traced by hand.
  //
  // TWO THINGS THE SPLIT CANNOT GET, and both are given rather than guessed at.
  // The VALANCE hangs off the front bar into shade and reads 123-192 — arm
  // brightness doing a cloth's job — so it is declared cloth. The CASSETTE is
  // bright white and would go to the fabric, so it is declared metal. Neither
  // is a threshold that can be nudged into working: they are two shapes the
  // photograph is never going to explain.
  if (AWNING) {
    const [T0, B0, L0, R0] = BOX ?? [0.01, 0.62, 0.05, 0.94];
    const bT = Math.round(H * T0), bB = Math.round(H * B0);
    const bL = Math.round(W * L0), bR = Math.round(W * R0);

    const asPoly = (nums) => {
      const pts = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i] * W, nums[i + 1] * H]);
      return pts;
    };
    // Even-odd ray cast. A polygon here is read off the photograph by eye, so it
    // is a handful of points and speed does not come into it.
    const inPoly = (pts, x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    const cloths = CLOTH_POLY.map(asPoly), metals = METAL_POLY.map(asPoly);
    const keeps = KEEP_POLY.map(asPoly);
    const inAnyPoly = (ps, x, y) => ps.some(p => inPoly(p, x, y));

    // The awning against the sky. The lower luminance bound keeps the dark
    // glazing of the door out; nothing on the awning itself is under 60.
    const awning = (x, y) =>
      x >= bL && x <= bR && y >= bT && y <= bB
      && (!keeps.length || inAnyPoly(keeps, x, y))
      && (inAnyPoly(cloths, x, y) || (S_(x, y) < 0.17 && L_(x, y) > 60));

    const seeds = [[0.45, 0.26], [0.72, 0.35]].map(([fx, fy]) =>
      [Math.round(W * fx), Math.round(H * fy)]);
    const m = new Uint8Array(W * H);
    const stack = [];
    for (const [sx, sy] of seeds) {
      if (!awning(sx, sy)) return { error: 'seed ' + sx + ',' + sy + ' is not on the awning' };
      const p = sy * W + sx;
      if (!m[p]) { m[p] = 1; stack.push(p); }
    }
    while (stack.length) {
      const p = stack.pop();
      const x = p % W, y = (p / W) | 0;
      if (x > 0     && !m[p - 1] && awning(x - 1, y)) { m[p - 1] = 1; stack.push(p - 1); }
      if (x < W - 1 && !m[p + 1] && awning(x + 1, y)) { m[p + 1] = 1; stack.push(p + 1); }
      if (y > 0     && !m[p - W] && awning(x, y - 1)) { m[p - W] = 1; stack.push(p - W); }
      if (y < H - 1 && !m[p + W] && awning(x, y + 1)) { m[p + W] = 1; stack.push(p + W); }
    }
    for (let y = bT; y <= bB; y++) for (let x = bL; x <= bR; x++)
      if (inAnyPoly(metals, x, y)) m[y * W + x] = 1;

    // CLOSE THE GAPS THE LIT EDGES PUNCH IN IT, THEN INTERSECT WITH THE KEEP.
    // Same shape of fix as the roller's, and for a related reason: topology from
    // the close, boundary from a rule the close cannot cross.
    //
    // The near arm is the case that needs it. It runs the length of the awning
    // and it is the brightest thing in the frame — a lit aluminium rail seen
    // against sky — so its own edge pixels blend toward blue, cross the
    // saturation bound, and the fill steps around the whole rail. What that
    // leaves is not a speckle but a sixteen-pixel band of undyed cream running
    // corner to corner, invisible against Natural and a bright stripe across a
    // Navy awning. The arms of a folding arm awning are the one part a colour
    // row must not miss.
    //
    // Raising the bound instead was tried and is worse: the blue sky starts at
    // 0.24 and the hazy sky near the horizon is lower than that, so a bound
    // loose enough to admit the rail admits half the horizon with it.
    //
    // The close cannot grow the silhouette, because `keeps` bounds the result
    // and the keep polygon is the silhouette. Radius 8 — the rail is 16 across.
    const morphA = (src, r, dilate) => {
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
    const closed = morphA(morphA(m, 8, true), 8, false);
    for (let y = bT; y <= bB; y++) for (let x = bL; x <= bR; x++) {
      const p = y * W + x;
      if (closed[p] && (!keeps.length || inAnyPoly(keeps, x, y))) m[p] = 1;
    }

    // 198, in the empty band between the canopy's 205 and the arms' 192.
    const cl = new Uint8Array(W * H), hw = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) {
      if (!m[p]) continue;
      const x = p % W, y = (p / W) | 0;
      const metal = inAnyPoly(metals, x, y)
        || (!inAnyPoly(cloths, x, y) && L_(x, y) < 198);
      if (metal) hw[p] = 1; else cl[p] = 1;
    }

    let n = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) {
      n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    const png = (paint) => {
      const cc = document.createElement('canvas');
      cc.width = W; cc.height = H;
      paint(cc.getContext('2d'));
      return cc.toDataURL('image/png');
    };
    // THE SOFT FRINGE GOES ON THE SILHOUETTE ONLY, NEVER ON THE SEAM BETWEEN
    // CLOTH AND METAL. Elsewhere in this file a mask is alone in the frame and a
    // half-alpha edge is simply how it meets the room. Here two masks partition
    // one object, and a fringe on both sides of their shared border paints that
    // border 47% fabric plus 47% cassette over undyed cream — a pale seam down
    // every arm, worst on exactly the dark colours a customer is looking hardest
    // at. Inside the awning the two masks meet hard and add to 255; outside it
    // they still fade into the sky.
    const alpha = (src) => png((ctx) => {
      const d = ctx.createImageData(W, H);
      for (let p = 0; p < W * H; p++) {
        let a = src[p] ? 255 : 0;
        if (!a && !m[p] && p > W && p < W * H - W &&
            (src[p - 1] + src[p + 1] + src[p - W] + src[p + W]) > 0) a = 120;
        d.data[p * 4] = d.data[p * 4 + 1] = d.data[p * 4 + 2] = 255;
        d.data[p * 4 + 3] = a;
      }
      ctx.putImageData(d, 0, 0);
    });
    const overlayUrl = png((ctx) => {
      ctx.drawImage(im, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H);
      for (let p = 0; p < W * H; p++) {
        if (cl[p]) {
          d.data[p * 4]     = Math.round(d.data[p * 4] * 0.35 + 166);
          d.data[p * 4 + 1] = Math.round(d.data[p * 4 + 1] * 0.35);
          d.data[p * 4 + 2] = Math.round(d.data[p * 4 + 2] * 0.35 + 91);
        } else if (hw[p]) {
          d.data[p * 4]     = Math.round(d.data[p * 4] * 0.3);
          d.data[p * 4 + 1] = Math.round(d.data[p * 4 + 1] * 0.3 + 150);
          d.data[p * 4 + 2] = Math.round(d.data[p * 4 + 2] * 0.3 + 175);
        }
      }
      ctx.putImageData(d, 0, 0);
    });
    const count = (a) => { let k = 0; for (let i = 0; i < a.length; i++) if (a[i]) k++; return k; };
    return {
      W, H, box: { L: x0, R: x1, T: y0, B: y1 },
      raw: 0, cloth: count(cl), metal: count(hw), bars: 0,
      barBands: n.toLocaleString() + ' px of awning', grew: 0,
      mask: alpha(cl), hardware: alpha(hw), overlay: overlayUrl,
    };
  }

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

    // THE WINDOW IS GIVEN NOW, AND THE UPPER BOUND CAME OFF WITH IT.
    //
    // The bound used to be 214 and it was doing two jobs: keeping the window out
    // of the fill, and keeping the fill on cloth. It could not do the first
    // without failing the second. The leading edge of the right-hand panel faces
    // the window and is lit through — it measures 229-245 against a shaded fold's
    // 155-195 — so a threshold set to exclude daylight excluded the brightest
    // cloth in the photograph too. What that left was a ragged bright strip a
    // dozen pixels wide running the full drop, a jagged line between dyed and
    // undyed down the middle of the picture, which reads as a fault rather than
    // as a gap.
    //
    // A straight edge in the right place is the whole fix, and geometry gives
    // one where a threshold cannot. `--glass` is the opening between the panels
    // and `--lit` is the strip of cloth beside it that faces the window, both
    // read off the photograph like the box. Inside `--lit` the brightness test is
    // not asked at all — the claim is structural, the way the roller's bridge up
    // to the headrail is: a curtain runs to its own leading edge, and no reading
    // of that edge's pixels is going to say so.
    //
    // The bound stays, at 248, because it is still doing the job it is good at:
    // keeping the fill off the floor between the waves of the hem. That hem is
    // the one edge in this photograph worth finding rather than giving.
    //
    // `--front` is what stands between the camera and the cloth — the sofa back
    // that crosses the bottom-left corner. Same reasoning as the venetian's lamp:
    // a cream sofa in front of a cream curtain is not a colour away from it, so
    // nothing in the pixels says which is which, and the fill walks straight from
    // one onto the other.
    const rect = ([t, b, l, r]) => ({
      T: Math.round(H * t), B: Math.round(H * b),
      L: Math.round(W * l), R: Math.round(W * r),
    });
    const inAny = (rs) => (x, y) => rs.some(g => x >= g.L && x <= g.R && y >= g.T && y <= g.B);
    const isGlass = inAny(GLASS.map(rect));
    const behind = inAny(FRONT.map(rect));
    const isLit = inAny(LIT.map(rect));

    const cloth = (x, y) =>
      x >= bL && x <= bR && !isGlass(x, y) && !behind(x, y)
      && (isLit(x, y) || L_(x, y) < 248);
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
    // A GIVEN EDGE HAS TO BE FEATHERED OR IT READS AS A CUT-OUT.
    //
    // The boundary the fill finds is already soft — it wanders with the cloth and
    // carries a half-alpha fringe. A rectangle typed in by hand has neither, and
    // against a sheer that is glaringly obvious: the gap between the panels stops
    // being a gap and becomes a white column with two ruled sides, wider and
    // harder than anything in the photograph. "The dye is like a square" is
    // exactly right, and it is the cost of trading the ragged edge for a straight
    // one without also trading hard for soft.
    //
    // So alpha ramps to nothing over FEATHER pixels approaching a given
    // rectangle. Eight, which is about what the sheer's own edge diffuses over
    // where it crosses the daylight. The fill's own boundary keeps the fringe it
    // always had.
    const FEATHER = Math.max(4, Math.round(W / 110));
    const softness = (x, y) => {
      let a = 1;
      for (const r of [...GLASS, ...FRONT].map(rect)) {
        const d = Math.max(r.L - x, x - r.R, r.T - y, y - r.B);
        a = Math.min(a, Math.max(0, Math.min(1, d / FEATHER)));
      }
      return a;
    };
    const maskUrl = png((ctx) => {
      const d = ctx.createImageData(W, H);
      for (let p = 0; p < W * H; p++) {
        const x = p % W, y = (p / W) | 0;
        let a = cl[p] ? 255 : 0;
        if (!a) {
          if (x > 0 && x < W - 1 && y > 0 && y < H - 1 &&
              (cl[p - 1] + cl[p + 1] + cl[p - W] + cl[p + W]) > 0) a = 120;
        }
        if (a) a = Math.round(a * softness(x, y));
        d.data[p * 4] = d.data[p * 4 + 1] = d.data[p * 4 + 2] = 255;
        d.data[p * 4 + 3] = a;
      }
      ctx.putImageData(d, 0, 0);
    });

    // THE TRACK, WHICH IS THE ONLY HARDWARE A CURTAIN HAS. It is given rather
    // than found for a reason peculiar to it: the blind cutter finds metal by
    // looking for a bright neutral bar spanning the frame, and this track is
    // neither bright nor neutral — it is a face in shadow under a ceiling, the
    // same tone as the cornice above it and the curtain heading below.
    //
    // It is a seven-pixel band at this size and it will never be much more: the
    // master runs 1254 and the track is nine pixels there, because the curtain
    // is ceiling-mounted and the track sits most of the way into the recess.
    // Painting it black puts a line across the top of the picture; painting it
    // white takes the line away. That is the whole of what this photograph can
    // say about a track — and it is more than the hardware row on a curtain card
    // was saying before, which was nothing at all.
    const trackUrl = TRACK.length ? png((ctx) => {
      const d = ctx.createImageData(W, H);
      const rs = TRACK.map(rect);
      for (let p = 0; p < W * H; p++) {
        const x = p % W, y = (p / W) | 0;
        d.data[p * 4] = d.data[p * 4 + 1] = d.data[p * 4 + 2] = 255;
        d.data[p * 4 + 3] = rs.some(t => x >= t.L && x <= t.R && y >= t.T && y <= t.B) ? 255 : 0;
      }
      ctx.putImageData(d, 0, 0);
    }) : null;

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
      raw: 0, cloth: n, metal: 0, bars: 0, barBands: TRACK.length ? 'track' : 'n/a', grew: 0,
      mask: maskUrl, hardware: trackUrl, overlay: overlayUrl,
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
}, { b64, SIZE, CURTAIN, SLATS, AWNING, BOX, GLASS, FRONT, LIT, TRACK, CLOTH_POLY, METAL_POLY, KEEP_POLY });

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
