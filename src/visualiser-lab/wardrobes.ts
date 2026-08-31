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

/** How close to neutral a pixel must be to count as checkerboard. The checker
 * is pure grey; the joinery, even at its palest, carries a warm cast. */
const CHECKER_MAX_CHROMA = 10;
/** And how light. The two checker greys measure ~245 and ~254 across the set;
 * 236 clears both with room for the resampling that softened their edges. */
const CHECKER_MIN_LEVEL = 236;

/** Strips the baked-in checkerboard and returns a canvas with real alpha.
 *
 * FLOOD FILL FROM THE BORDER, not a colour threshold over the whole image, and
 * the difference matters. A white carcass and a light grey checker are within a
 * few levels of each other, so thresholding alone eats the joinery. Filling
 * inward from the edge adds the constraint that actually separates them —
 * connectivity to the outside. A white shelf enclosed by the cabinet is never
 * reached; the checker, which surrounds the product on all sides, always is.
 *
 * Every sticker was measured to confirm the product does not touch its own
 * border, which is what makes the seed safe.
 *
 * Enclosed background — the gap inside a bag handle, say — stays opaque,
 * because it is not connected to the outside. Those are a few dozen pixels
 * apiece and read as part of the object.
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

  const isChecker = (i: number) => {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return max - min <= CHECKER_MAX_CHROMA && min >= CHECKER_MIN_LEVEL;
  };

  const stack: number[] = [];
  for (let x = 0; x < w; x++) {
    stack.push(x, (h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w, y * w + w - 1);
  }

  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !isChecker(i)) continue;
    seen[i] = 1;
    px[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }

  ctx.putImageData(image, 0, 0);

  // CROP TO WHAT IS ACTUALLY THERE. The stickers are square-ish frames with the
  // product floating in the middle, so a good half of some files is empty
  // margin. Left in, that margin is what the renderer stands on the floor —
  // the cabinet hangs above the skirting by however much blank space sits under
  // it, which is the exact hovering-decal look the contact shadow exists to
  // avoid. Cropping to the opaque bounds makes the canvas's bottom edge the
  // cabinet's own base, and its aspect ratio the cabinet's real proportions.
  let minX = w, minY = h, maxX = -1, maxY = -1;
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
