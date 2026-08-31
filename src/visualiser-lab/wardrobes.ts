// ---------------------------------------------------------------------------
// THE WARDROBE STICKERS — the Forma range, as supplied.
//
// Ten product photographs in public/images/Textures/wardrobes. They are the
// whole wardrobe offer for now: no door styles, no panel counts, no sizing.
// The one thing a customer changes is the FINISH COLOUR, and everything in this
// file exists to make that possible on a photograph.
//
// TWO PROBLEMS HAD TO BE SOLVED BEFORE ANY OF THEM COULD BE DRAWN.
//
// 1. THEY HAVE NO TRANSPARENCY. Every file is 8-bit RGB with no alpha channel
//    at all — the grey checkerboard that reads as "transparent" is painted into
//    the picture as real pixels. Composited as supplied, each wardrobe would
//    arrive in the customer's room inside a grey checked box. So the background
//    has to be keyed out at runtime; see keyStickerBackground.
//
// 2. THEY ARE NOT ALL THE SAME FINISH. Forma 3.0 is a white carcass, 12.0U is
//    oak. A recolour cannot assume it is painting over white, and it must not
//    repaint the clothes, shoes and luggage that are staged in every shot. See
//    tintSticker.
//
// Both results are cached, because both are a full pass over ~1.5M pixels and
// the customer flicks between colours far faster than that wants redoing.
// ---------------------------------------------------------------------------

const DIR = '/images/Textures/wardrobes';

export interface WardrobeModel {
  id: string;
  /** Shown on the picker. */
  name: string;
  file: string;
  /** Cabinet widths this layout is made in, mm. First is the one the sticker
   * was photographed at and the one the visualiser draws. */
  widths: number[];
}

/** Every layout in the range is the same height and the same depth — only the
 * width and the internal arrangement change. Held once rather than repeated on
 * ten entries, because a per-model copy is ten places for them to disagree. */
export const WARDROBE_HEIGHT_MM = 2016;
export const WARDROBE_DEPTH_MM = 447;

/** "2400 × 2016 × 447mm", or with the alternates when a layout offers them. */
export const wardrobeDimensions = (m: WardrobeModel): string =>
  `${m.widths.join(' / ')} W × ${WARDROBE_HEIGHT_MM} H × ${WARDROBE_DEPTH_MM} D mm`;

/** The ten stickers, in the order the filenames sort by size. The codes are the
 * supplier's own — L and U appear to denote the L-shaped and U-shaped walk-in
 * configurations, and the numbers track overall run. They are presented as
 * given rather than renamed, so what the customer picks matches what the
 * business quotes. */
export const WARDROBE_MODELS: WardrobeModel[] = [
  { id: '2.9', name: 'Forma 2.9', file: 'Forma Wardrobe 2.9 Sticker.png', widths: [1800] },
  { id: '3.0', name: 'Forma 3.0', file: 'Forma Wardrobe 3.0 Sticker.png', widths: [2400, 3000] },
  { id: '4.0', name: 'Forma 4.0', file: 'Forma Wardrobe 4.0 Sticker.png', widths: [1800, 2400, 3000] },
  { id: '4.9', name: 'Forma 4.9', file: 'Forma Wardrobe 4.9 Sticker.png', widths: [1800] },
  { id: '5.0', name: 'Forma 5.0', file: 'Forma Wardrobe 5.0 Sticker.png', widths: [2400, 3000] },
  { id: '6.0', name: 'Forma 6.0', file: 'Forma Wardrobe 6.0 Sticker.png', widths: [1800] },
  { id: '7.0L', name: 'Forma 7.0L', file: 'Forma Wardrobe 7.0L Sticker.png', widths: [2400, 3000] },
  { id: '8.0', name: 'Forma 8.0', file: 'Forma Wardrobe 8.0 Sticker.png', widths: [2400] },
  { id: '9.0L', name: 'Forma 9.0L', file: 'Forma Wardrobe 9.0L Sticker.png', widths: [2400] },
  { id: '12.0U', name: 'Forma 12.0U', file: 'Forma Wardrobe 12.0U Sticker.png', widths: [2400] },
];

export const wardrobeModelById = (id: string): WardrobeModel =>
  WARDROBE_MODELS.find(m => m.id === id) ?? WARDROBE_MODELS[0];

/** THE FOUR BOARD FINISHES, and it is four rather than a palette because that
 * is the whole card the range is made in — every layout in the collection
 * offers these and nothing else.
 *
 * An earlier version of this file invented ten: Snow, Chalk, Linen, Stone,
 * Pewter, Charcoal and so on. They looked like a reasonable joinery card and
 * every one of them was fiction. A finish a customer can pick on screen and
 * cannot order is worse than no picker, because it is discovered at quoting
 * time by someone who has already decided.
 *
 * Names are the manufacturer's own, verbatim, so what is chosen here is what
 * gets written on the quote. The hexes are matched to the finish each name
 * describes: white board, a deep yellow-brown natural oak, an aged warm
 * mid-grey oak, and a dark walnut. Ordered light to dark, the way a finish card
 * is laid out. */
export const WARDROBE_COLOURS: { name: string; hex: string }[] = [
  { name: 'Matt Wardrobe White', hex: '#F1EFEB' },
  { name: 'Matt Natural Oak', hex: '#C2A175' },
  { name: 'Woodmatt Antico Oak', hex: '#9C8C7A' },
  { name: 'Woodmatt Notaio Walnut', hex: '#6A4A34' },
];

export const wardrobeColourHex = (name: string): string =>
  (WARDROBE_COLOURS.find(c => c.name === name) ?? WARDROBE_COLOURS[0]).hex;

// --- Keying ----------------------------------------------------------------
//
// THE THRESHOLD IS MEASURED FROM EACH FILE, NOT HARDCODED, and that is the
// whole lesson of this pass. A single constant was used at first — clear
// anything neutral and brighter than 236 — which worked on the stickers it was
// written against and quietly failed on others: Forma 4.0 and 6.0 print their
// darker checker square at 235, four levels under the line, so half of every
// checkerboard cell survived and the product arrived on a grey lattice. The
// files were resampled to different sizes at different times and their greys
// drifted with them, so no one number can be right for all ten.
//
// The border is the calibration. It is background by construction, so the two
// greys the checkerboard is actually printed in on THIS file can be read
// straight off it, and the flood then runs against those.
//
// CHROMA IS WHAT KEEPS IT OFF THE PRODUCT. The floor can sit as low as 229 on
// some files, and white board sits not far above it, so brightness alone would
// let the flood walk out of the background and into the carcass. The checker is
// printed in a pure grey and measures a chroma of 1 to 3 everywhere; the
// joinery, lit by a warm room, never gets below about 10. That gap does the
// separating, and it is why the flood tests colour and brightness together.

/** Chroma above which a neutral-looking pixel is taken to be part of the
 * product. Measured: checkerboard 1–3 across all ten files, white board 10–13.
 * Eight sits in the gap. */
const CHECKER_MAX_CHROMA = 8;
/** The fringe pass runs tighter still, because it is allowed to take pixels the
 * flood decided to keep. */
const FRINGE_MAX_CHROMA = 6;
/** Margin below the darkest checker grey the border shows, to catch the same
 * squares where resampling has softened them a level or two. */
const CHECKER_LEVEL_MARGIN = 4;
/** Used only if a file's border turns out to be too contaminated to measure —
 * see checkerProfile. */
const CHECKER_LEVEL_FALLBACK = 236;

/** A region is trapped checkerboard rather than pale cloth if this share of it
 * is perfectly flat.
 *
 * Measured over whole connected regions on the raw files, which is the only
 * measurement that counts — a hand-picked patch in the middle of the checker
 * reads 83% flat, but the region the pass actually gets includes its own
 * anti-aliased rim and comes out near 0.5. The legitimate pale regions on the
 * same stickers — shelf edges, shirt highlights, board — measure 0.00 to 0.06.
 * The gap either side of 0.30 is wide enough that nothing sits near it. */
const TRAPPED_FLATNESS = 0.3;
/** And it has to be a REGION, not a speck. Several stickers carry small
 * blown-out highlights that are perfectly flat by this test — 40 to 90 pixels
 * apiece, sitting in cloth — and clearing those would punch holes in the
 * product. Every genuine pool of trapped background measures in the hundreds. */
const TRAPPED_MIN_PX = 250;
/** How still a 3×3 neighbourhood has to be to count as flat. The checkerboard
 * is printed in two exact greys and has no texture inside a cell; cloth and
 * board always carry some. */
const FLAT_RANGE = 2;
/** How near a pixel must sit to one of the two checker greys to count as that
 * square. Wide enough to survive the resampling that softened them, narrow
 * enough that the levels stay distinct on the tightest file (8.0, a gap of 7). */
const LEVEL_TOLERANCE = 3;
/** How near a pixel must sit to one of the two squares for the FLOOD to travel
 * through it. Wider than LEVEL_TOLERANCE, which only has to label a pixel after
 * the fact, because the flood has to cross squares that resampling has spread
 * over several levels. */
const BAND_TOLERANCE = 6;
/** How many times the fringe sweep runs. The first clears the rim around the
 * product; the rest eat inward along the seams between squares, which need
 * several passes to travel the length of a long one. Safe to run this many
 * because every sweep after the first requires background on two sides — see
 * the pass itself. */
const FRINGE_SWEEPS = 4;
/** A detached island bigger than this is treated as part of the product — the
 * shoes and the bag stand apart from the cabinet and are several thousand
 * pixels each. Checker debris never approaches it. */
const SPECK_MAX_PX = 1500;
/** And this much of an island has to BE checker grey before it is called
 * debris, which is what keeps a pale detached object out of the sweep. */
const SPECK_MIN_SHARE = 0.8;
/** And how much of a trapped region each square has to account for before the
 * region is called checkerboard rather than a flat panel. */
const TRAPPED_MIN_SHARE = 0.15;

/** The darkest grey this file's checkerboard is printed in.
 *
 * Read off the outer frame, which is background on every one of these files.
 * NOT off every border pixel, though: on Forma 9.0L and 12.0U the product runs
 * out to the edge, so the frame carries cabinet as well as checker — 12.0U's
 * border has a chroma of 54 at the 98th percentile and drops to level 116.
 * Sampling only the near-neutral border pixels leaves the checker behind, and a
 * low percentile of those ignores whatever grey trim slipped through.
 *
 * Falls back to the old constant if the border turns out to be mostly product,
 * which none of the current ten are, but a future file might be. */
interface CheckerProfile {
  /** The two greys this file's checkerboard is printed in — light, then dark. */
  light: number;
  dark: number;
  /** Everything from the dark square down to the softest resampled edge. */
  floor: number;
}

function checkerProfile(px: Uint8ClampedArray, w: number, h: number): CheckerProfile {
  const levels: number[] = [];
  let sampled = 0;
  const consider = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    sampled++;
    if (Math.max(r, g, b) - Math.min(r, g, b) > 4) return;
    levels.push(Math.min(r, g, b));
  };
  const band = 4;
  for (let y = 0; y < band && y < h; y++) {
    for (let x = 0; x < w; x++) {
      consider(x, y);
      consider(x, h - 1 - y);
    }
  }
  for (let x = 0; x < band && x < w; x++) {
    for (let y = band; y < h - band; y++) {
      consider(x, y);
      consider(w - 1 - x, y);
    }
  }

  if (levels.length < sampled * 0.2) {
    return { light: 254, dark: CHECKER_LEVEL_FALLBACK, floor: CHECKER_LEVEL_FALLBACK };
  }

  // The two squares are the two commonest levels on the border, and they are
  // always well apart — measured, the light square is 254 on every one of the
  // ten and the dark runs from 235 to 247.
  const hist = new Uint32Array(256);
  for (const v of levels) hist[v]++;
  const ranked = [...hist.entries()]
    .map(([v, c]) => ({ v, c }))
    .sort((a, b) => b.c - a.c);
  const light = ranked[0].v;
  const dark = (ranked.find(r => Math.abs(r.v - light) >= 4) ?? ranked[0]).v;

  levels.sort((a, b) => a - b);
  const floor = Math.max(200, levels[Math.floor(levels.length * 0.01)] - CHECKER_LEVEL_MARGIN);
  return { light: Math.max(light, dark), dark: Math.min(light, dark), floor };
}

/** Strips the baked-in checkerboard and returns a canvas with real alpha.
 *
 * FLOOD FILL FROM THE BORDER, not a colour threshold over the whole image, and
 * the difference matters. A white carcass and a light grey checker are within a
 * few levels of each other, so thresholding alone eats the joinery. Filling
 * inward from the edge adds the constraint that actually separates them —
 * connectivity to the outside. A white shelf enclosed by the cabinet is never
 * reached; the checker, which surrounds the product, always is.
 *
 * The stack is a plain array of pixel indices rather than a recursive fill:
 * these images run to 1.5M pixels and a recursive version overflows the stack
 * on the first large one. */
function keyStickerBackground(source: HTMLImageElement): HTMLCanvasElement {
  const w = source.naturalWidth;
  const h = source.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);

  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;
  const n = w * h;
  const seen = new Uint8Array(n);

  const profile = checkerProfile(px, w, h);
  const minLevel = profile.floor;

  /** TWO BANDS, NOT ONE RANGE, and this is what keeps the flood off the
   * joinery. Testing "neutral and brighter than the floor" makes one continuous
   * band from the dark square up to white, and a painted drawer front sits
   * inside it — so on four of the ten stickers the flood walked out of the
   * background and ate holes through the white cabinetry.
   *
   * The checkerboard is only ever its two greys. Admitting just those two, each
   * with enough tolerance to survive resampling, leaves the gap between them
   * closed: on Forma 6.0 the squares are 254 and 235, so a drawer front at 244
   * matches neither and is safe, where a single range would have taken it. */
  const isChecker = (i: number) => {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min > CHECKER_MAX_CHROMA) return false;
    return (
      Math.abs(min - profile.light) <= BAND_TOLERANCE ||
      Math.abs(min - profile.dark) <= BAND_TOLERANCE
    );
  };

  // --- PASS 1: the surrounding background ---------------------------------
  const stack: number[] = [];
  for (let x = 0; x < w; x++) {
    stack.push(x, (h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w, y * w + w - 1);
  }

  // DIAGONAL STEPS ALLOWED. Squares of the same grey touch only at their
  // corners, and the soft line where two squares meet is neither grey, so a
  // four-way flood gets trapped inside the first square it enters. Eight-way,
  // it crosses the whole board.
  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !isChecker(i)) continue;
    seen[i] = 1;
    px[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    const left = x > 0;
    const right = x < w - 1;
    const up = y > 0;
    const down = y < h - 1;
    if (left) stack.push(i - 1);
    if (right) stack.push(i + 1);
    if (up) stack.push(i - w);
    if (down) stack.push(i + w);
    if (left && up) stack.push(i - w - 1);
    if (right && up) stack.push(i - w + 1);
    if (left && down) stack.push(i + w - 1);
    if (right && down) stack.push(i + w + 1);
  }

  // --- PASS 2: the fringe -------------------------------------------------
  // Where the checkerboard meets the product its pixels are blended with the
  // object's edge, which drags them under the flood's threshold and leaves a
  // hairline of grey all the way round. One bounded sweep removes it: any
  // surviving pixel that is checker-coloured AND already touching cleared
  // background is cleared too.
  //
  // A FEW SWEEPS, not one, because the two-band flood also leaves the soft
  // seam where two squares meet — it is neither grey, so the flood steps over
  // it rather than clearing it, and a lattice of hairlines would otherwise
  // survive across the whole background. Each sweep peels one ring.
  //
  // BOUNDED, and the chroma test is tighter than the flood's, because this rule
  // is allowed to take pixels the flood chose to keep. Left to run until it
  // stopped finding work it would walk inward along any pale neutral surface
  // until it hit something warm.
  for (let sweep = 0; sweep < FRINGE_SWEEPS; sweep++) {
  const fringe: number[] = [];
  for (let i = 0; i < n; i++) {
    if (px[i * 4 + 3] === 0) continue;
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) > FRINGE_MAX_CHROMA) continue;
    if (Math.min(r, g, b) < minLevel - 20) continue;
    const x = i % w;
    const y = (i / w) | 0;
    let cleared = 0;
    if (x > 0 && px[(i - 1) * 4 + 3] === 0) cleared++;
    if (x < w - 1 && px[(i + 1) * 4 + 3] === 0) cleared++;
    if (y > 0 && px[(i - w) * 4 + 3] === 0) cleared++;
    if (y < h - 1 && px[(i + w) * 4 + 3] === 0) cleared++;
    // THE FIRST SWEEP TAKES ANYTHING ON THE EDGE OF THE BACKGROUND; the rest
    // demand background on two sides. That difference is what tells a seam from
    // a shelf.
    //
    // The soft line where two checker squares meet is background with
    // background either side of it, so it clears. The lit front edge of a shelf
    // is just as bright and just as neutral, but it has cabinet behind it and
    // only ever shows background on one side — so it survives. Sweeping
    // one-sided pixels repeatedly is what stripped those edges away in lines
    // when every sweep took anything it touched.
    if (cleared >= (sweep === 0 ? 1 : 2)) fringe.push(i);
  }
  for (const i of fringe) px[i * 4 + 3] = 0;
  if (!fringe.length) break;
  }

  // --- PASS 3: trapped background -----------------------------------------
  // The flood reaches only what is connected to the outside, so checkerboard
  // fully enclosed by the product survives it — the gap inside the bag handle
  // on Forma 3.0 is the visible one, a grey window through the photograph.
  //
  // Colour alone cannot clear it. A white shirt and a lit shelf edge sit in the
  // same bright neutral band as the checker, and keying on brightness takes the
  // shirt with it. FLATNESS is what separates them: the checkerboard is two
  // exact greys with no texture inside a cell, while cloth and board are never
  // perfectly still. Measured whole-region, trapped checker runs about 0.5
  // against cloth's 0.06.
  //
  // Each enclosed pool is measured as a whole and cleared only if it is that
  // flat — a judgment made per region rather than per pixel, because flatness
  // means nothing on one pixel and a great deal averaged over an area.
  const pool = new Uint8Array(n);
  for (let start = 0; start < n; start++) {
    if (pool[start] || px[start * 4 + 3] === 0 || !isChecker(start)) continue;
    const region: number[] = [];
    const queue = [start];
    pool[start] = 1;
    while (queue.length) {
      const i = queue.pop()!;
      region.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      const step = (j: number) => {
        if (pool[j] || px[j * 4 + 3] === 0 || !isChecker(j)) return;
        pool[j] = 1;
        queue.push(j);
      };
      if (x > 0) step(i - 1);
      if (x < w - 1) step(i + 1);
      if (y > 0) step(i - w);
      if (y < h - 1) step(i + w);
    }
    if (region.length < TRAPPED_MIN_PX) continue;

    // IT HAS TO SHOW BOTH SQUARES, and this is what stopped the pass eating
    // the product. Flatness and size alone also describe a painted drawer
    // front: smooth, pale, neutral, and far bigger than the threshold. Clearing
    // those punched magenta holes through the white joinery on four of the ten.
    //
    // A checkerboard is two greys by definition and a drawer front is one. So
    // the region has to carry a real share of BOTH of this file's squares
    // before it can be called background — which no single flat surface does,
    // however flat it is.
    let nearLight = 0;
    let nearDark = 0;
    for (const i of region) {
      const v = px[i * 4];
      if (Math.abs(v - profile.light) <= LEVEL_TOLERANCE) nearLight++;
      else if (Math.abs(v - profile.dark) <= LEVEL_TOLERANCE) nearDark++;
    }
    const share = region.length * TRAPPED_MIN_SHARE;
    if (nearLight < share || nearDark < share) continue;

    let flat = 0;
    let measured = 0;
    for (const i of region) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) continue;
      let min = 255;
      let max = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = px[(i + dy * w + dx) * 4];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      measured++;
      if (max - min <= FLAT_RANGE) flat++;
    }
    if (measured && flat / measured >= TRAPPED_FLATNESS) {
      for (const i of region) px[i * 4 + 3] = 0;
    }
  }

  // --- PASS 4: detached specks --------------------------------------------
  // The two-band flood steps over the soft seam where two squares meet rather
  // than clearing it, and where a seam crosses an isolated corner of background
  // the fringe sweeps cannot always reach it. What survives is a scatter of
  // bright dots and hairlines standing in open background, which on a
  // photograph read as dirt on the lens.
  //
  // They are all islands: not one of them touches the cabinet. So the product
  // is found as the largest surviving region and everything else is examined —
  // an island only goes if it is small AND made of this file's checker greys.
  // Both conditions are needed, because the shoes and the bag are islands too;
  // they are large, and they are brown.
  const island = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  const checkerShare: number[] = [];
  for (let start = 0; start < n; start++) {
    if (island[start] !== -1 || px[start * 4 + 3] === 0) continue;
    const id = sizes.length;
    let count = 0;
    let checker = 0;
    const queue = [start];
    island[start] = id;
    while (queue.length) {
      const i = queue.pop()!;
      count++;
      // THE WHOLE BACKGROUND RANGE HERE, not the two bands the flood uses, and
      // that distinction is what this pass turned on. The survivors are mostly
      // seam pixels — the soft line where two squares meet — and a seam is by
      // definition BETWEEN the two greys, so testing band membership scored
      // them at zero and left every streak on the picture.
      //
      // Widening to the range is safe here in a way it is not for the flood:
      // this pass only ever looks at islands that are already known not to be
      // the cabinet, and it still has the size and share tests to clear.
      const v = px[i * 4];
      const r2 = px[i * 4 + 1];
      const b2 = px[i * 4 + 2];
      const neutral = Math.max(v, r2, b2) - Math.min(v, r2, b2) <= FRINGE_MAX_CHROMA;
      if (neutral && v >= profile.dark - BAND_TOLERANCE && v <= profile.light + BAND_TOLERANCE) {
        checker++;
      }
      const x = i % w;
      const y = (i / w) | 0;
      const step = (j: number) => {
        if (island[j] !== -1 || px[j * 4 + 3] === 0) return;
        island[j] = id;
        queue.push(j);
      };
      if (x > 0) step(i - 1);
      if (x < w - 1) step(i + 1);
      if (y > 0) step(i - w);
      if (y < h - 1) step(i + w);
    }
    sizes.push(count);
    checkerShare.push(checker / Math.max(1, count));
  }

  let biggest = 0;
  for (let id = 1; id < sizes.length; id++) if (sizes[id] > sizes[biggest]) biggest = id;

  for (let i = 0; i < n; i++) {
    const id = island[i];
    if (id === -1 || id === biggest) continue;
    if (sizes[id] > SPECK_MAX_PX) continue;
    if (checkerShare[id] < SPECK_MIN_SHARE) continue;
    px[i * 4 + 3] = 0;
  }

  ctx.putImageData(image, 0, 0);

  // CROP TO WHAT IS ACTUALLY THERE. The stickers are square-ish frames with the
  // product floating in the middle, so a good half of some files is empty
  // margin. Left in, that margin is what the renderer stands on the floor —
  // the cabinet hangs above the skirting by however much blank space sits under
  // it. Cropping to the opaque bounds makes the canvas's bottom edge the
  // cabinet's own base, and its aspect ratio the cabinet's real proportions.
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return canvas; // fully keyed — nothing to crop to

  const cropped = document.createElement('canvas');
  cropped.width = maxX - minX + 1;
  cropped.height = maxY - minY + 1;
  cropped
    .getContext('2d')!
    .drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
}

// --- Tinting ---------------------------------------------------------------

/** How far a pixel's colour signature may sit from the carcass's before it is
 * left alone. Loose enough to catch the carcass through its own shading, tight
 * enough to leave a navy suit or a tan shoe where it is. */
const CARCASS_TOLERANCE = 0.18;
/** Selectivity. Similarity is raised to this power before it is used as a blend
 * weight, so a near-exact match tints fully and a passing resemblance barely
 * registers, rather than everything shifting a little. */
const CARCASS_FALLOFF = 2.2;
/** Where the brightness gate opens and closes, as a fraction of the board's own
 * level. Below the lower figure a neutral pixel is taken to be dark clothing and
 * is left alone; above the upper it is taken to be board and is fully repainted;
 * between them it crosses over smoothly. 0.42 sits under the deepest shelf
 * shadow and over the palest of the hanging suits. */
const BOARD_SHADOW_FLOOR = 0.42;
const BOARD_SHADOW_CEIL = 0.72;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** A pixel's colour independent of how brightly it is lit — rgb divided by its
 * own maximum. This is what lets one test find the carcass in shadow and in
 * full light, which a flat colour match cannot: a shaded oak shelf and a lit
 * one are far apart in rgb and identical here. */
function signature(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b, 1);
  return [r / max, g / max, b / max];
}

/** The carcass's own colour, found rather than assumed.
 *
 * The stickers are not one finish — 3.0 is white, 12.0U is oak — so nothing can
 * be hardcoded. The joinery is however always the largest thing in frame, so
 * the most common colour signature among the opaque pixels IS the carcass. A
 * coarse histogram over quantised signatures finds it in one pass, and the
 * winning bucket's mean is returned so the answer is not quantised itself. */
function carcassSignature(px: Uint8ClampedArray): [number, number, number] {
  const BINS = 12;
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>();

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    // Near-black carries no reliable signature — everything divided by a small
    // maximum lands in the same corner — and would otherwise win on the dark
    // clothing alone.
    if (Math.max(r, g, b) < 40) continue;
    const [sr, sg, sb] = signature(r, g, b);
    const key =
      ((sr * (BINS - 1)) | 0) * BINS * BINS + ((sg * (BINS - 1)) | 0) * BINS + ((sb * (BINS - 1)) | 0);
    const slot = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    slot.n++;
    slot.r += sr;
    slot.g += sg;
    slot.b += sb;
    counts.set(key, slot);
  }

  let best = { n: 0, r: 1, g: 1, b: 1 };
  for (const slot of counts.values()) if (slot.n > best.n) best = slot;
  const n = Math.max(1, best.n);
  return [best.r / n, best.g / n, best.b / n];
}

/** Repaints the joinery in `hex`, leaving what is staged inside it alone.
 *
 * SHADING IS KEPT, COLOUR IS REPLACED. Each pixel holds its own brightness and
 * takes the target's hue, so every shelf edge, cast shadow and highlight that
 * makes the photograph read as a real cabinet survives the recolour. Painting
 * the target colour on flat would return a silhouette.
 *
 * WHAT IT DELIBERATELY WILL NOT DO is repaint the clothes. The blend weight is
 * how closely a pixel matches the carcass's own colour signature, so the
 * cabinet moves and the navy suits, tan shoes and leather bag staged against it
 * stay where they are.
 *
 * THE KNOWN LIMIT, since it is visible: white shirts and near-neutral folded
 * knitwear share a signature with a white carcass, and on the white stickers
 * they take some of the tint. Separating them needs to know what a shirt is,
 * which no colour test can. It reads as the light in the room having changed
 * rather than as an error, which is why it is left. */
function tintSticker(keyed: HTMLCanvasElement, hex: string): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = keyed.width;
  out.height = keyed.height;
  const ctx = out.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(keyed, 0, 0);

  const image = ctx.getImageData(0, 0, out.width, out.height);
  const px = image.data;

  const tr = parseInt(hex.slice(1, 3), 16);
  const tg = parseInt(hex.slice(3, 5), 16);
  const tb = parseInt(hex.slice(5, 7), 16);


  const [cr, cg, cb] = carcassSignature(px);

  // THE CARCASS'S OWN AVERAGE BRIGHTNESS, which is what the finish's brightness
  // has to be measured against.
  //
  // The first version of this held each pixel's luminance and swapped only the
  // hue. That is right for a tint and wrong for a finish: a white carcass sits
  // around 230, so asking for walnut kept it at 230 and returned a pale tan —
  // walnut's hue at white board's brightness. Every dark finish came out light.
  //
  // Scaling against the carcass mean instead makes the finish's own brightness
  // the anchor: the average of the joinery lands exactly on the chosen colour,
  // and every pixel keeps its RATIO to that average, so shelf shadows and lit
  // top surfaces stay as far apart as they were. Walnut goes dark, white stays
  // white, and the cabinet keeps its modelling either way.
  // A HIGH PERCENTILE, NOT THE MEAN, and this is the second thing that had to
  // be got right about brightness. On a white-carcass sticker the joinery's
  // colour signature is near-neutral — and so is a charcoal suit's. The dark
  // clothing therefore joins the carcass sample and drags its mean down, which
  // inflates every pixel's ratio to it, which lifts the whole finish: asking
  // for walnut returned a mid tan a second time, from the opposite direction.
  //
  // Measured on the white stickers, 88% of the object matches the carcass
  // signature — the board, the white shirts and the charcoal suits are all
  // near-neutral and colour alone cannot part them. The mean of that set sits
  // around 190 where the board itself is nearer 245, so every board pixel got a
  // ratio above 1 and the finish came out lighter than asked for.
  //
  // A high percentile answers the question actually being asked, which is not
  // "how bright is this photograph" but "how bright is the board under normal
  // light". The contaminating darks sit below it and cannot move it.
  const hist = new Uint32Array(256);
  let carcassCount = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const [sr, sg, sb] = signature(px[i], px[i + 1], px[i + 2]);
    if (Math.hypot(sr - cr, sg - cg, sb - cb) >= CARCASS_TOLERANCE) continue;
    hist[Math.min(255, luma(px[i], px[i + 1], px[i + 2]) | 0)]++;
    carcassCount++;
  }
  let carcassLuma = 200;
  if (carcassCount) {
    const target = carcassCount * 0.92;
    let running = 0;
    for (let v = 0; v < 256; v++) {
      running += hist[v];
      if (running >= target) { carcassLuma = Math.max(1, v); break; }
    }
  }

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];

    const [sr, sg, sb] = signature(r, g, b);
    const dist = Math.hypot(sr - cr, sg - cg, sb - cb);
    if (dist >= CARCASS_TOLERANCE) continue;

    // BRIGHTNESS AS THE SECOND TEST, because on a white carcass colour is not
    // enough on its own: board and charcoal suit have the same signature and
    // only their level tells them apart. Board is the bright neutral mass and
    // clothing the dark one, so the gate keeps the cabinet — including its own
    // shelf shadows, which is why the floor sits as low as it does — and leaves
    // the hanging clothes at the brightness the photograph gave them.
    //
    // It cannot save the white shirts. Those are as bright and as neutral as the
    // board and take the finish with it; no test on colour and brightness can
    // separate a white shirt from a white panel. It reads as the light in the
    // room having changed rather than as a fault, which is why it stands.
    const level = smoothstep(BOARD_SHADOW_FLOOR, BOARD_SHADOW_CEIL, luma(r, g, b) / carcassLuma);
    if (level <= 0) continue;
    const weight = Math.pow(1 - dist / CARCASS_TOLERANCE, CARCASS_FALLOFF) * level;

    // The finish, re-lit to this pixel's share of the carcass's brightness.
    const scale = luma(r, g, b) / carcassLuma;
    const nr = tr * scale;
    const ng = tg * scale;
    const nb = tb * scale;

    px[i] = r + (nr - r) * weight;
    px[i + 1] = g + (ng - g) * weight;
    px[i + 2] = b + (nb - b) * weight;
  }

  ctx.putImageData(image, 0, 0);
  return out;
}

// --- Cached loading --------------------------------------------------------

const keyedCache = new Map<string, Promise<HTMLCanvasElement>>();
const tintedCache = new Map<string, HTMLCanvasElement>();

function loadKeyed(file: string): Promise<HTMLCanvasElement> {
  const hit = keyedCache.get(file);
  if (hit) return hit;
  const job = new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(keyStickerBackground(img));
    img.onerror = reject;
    // encodeURI, not encodeURIComponent: the filenames carry spaces, which must
    // be escaped, but the slashes in the path must not be.
    img.src = encodeURI(`${DIR}/${file}`);
  });
  // Not cached on failure, so a request that lost the network can be retried.
  job.catch(() => keyedCache.delete(file));
  keyedCache.set(file, job);
  return job;
}

/** The sticker for this model in this colour, keyed and tinted, ready to draw. */
export async function wardrobeSticker(model: WardrobeModel, colourHex: string): Promise<HTMLCanvasElement> {
  const cacheKey = `${model.id}|${colourHex}`;
  const hit = tintedCache.get(cacheKey);
  if (hit) return hit;
  const keyed = await loadKeyed(model.file);
  const tinted = tintSticker(keyed, colourHex);
  tintedCache.set(cacheKey, tinted);
  return tinted;
}
