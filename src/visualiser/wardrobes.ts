// ---------------------------------------------------------------------------
// THE WARDROBE RANGE — the Forma layouts, their finishes, and their artwork.
//
// TWO KINDS OF PRODUCT, and this is the distinction everything else follows
// from. The supplied renders are not one set of ten:
//
//   BUILT-IN   2.9, 3.0, 4.0, 4.9, 5.0, 6.0, 8.0 — straight runs. Objects. They
//              stand against a wall, and the visualiser puts them on one.
//
//   WALK-IN    7.0L, 9.0L, 12.0U — an L or a U. These renders are taken from
//              INSIDE the robe looking at two or three walls receding away. They
//              are not objects in a room; they are the room. Pasting one onto a
//              bedroom wall cannot work, so they are placed by their own rule —
//              see Canvas2DWardrobeRenderer.
//
// TWO VIEWPOINTS PER BUILT-IN, chosen from the customer's own trace. A wall
// traced as a rectangle was photographed square-on and takes the front-on
// render; a wall traced as a trapezium was photographed at an angle and takes
// the three-quarter one, which has the 447mm depth showing on its return. This
// is the only honest way to get the viewpoint right: a photograph cannot be
// turned to face a different direction after the fact, because the faces the
// camera never saw are not in the file. The render has to exist.
//
// ARTWORK IS CUT OUT AND PRE-COLOURED AT SOURCE. One file per layout, finish
// and viewpoint, with a real alpha channel — 68 in all. Nothing is keyed and
// nothing is recoloured at runtime, which is what the first version did and the
// reason it is gone:
//
//   THE SUPPLIED STICKERS CARRY NO ALPHA. The checkerboard that reads as
//   transparency is painted into them as pixels, so it had to be guessed at
//   from colour and flatness — and against a white carcass those guesses went
//   wrong in both directions, eating the product in places and leaving a grey
//   fringe in others. There is no threshold that fixes it, because the file
//   does not contain the information.
//
//   AND RECOLOURING CANNOT TELL A SHIRT FROM A PANEL. Repainting the board
//   meant finding it by colour, and the white shirts and pale knitwear staged
//   in every shot share a white carcass's signature exactly. They moved with
//   it. No colour test separates them; only a render made in that finish does.
//
// Until the new artwork lands, the legacy path at the foot of this file keeps
// the page working off the original ten. It still keys and still tints, with
// all the faults above, and it is temporary.
// ---------------------------------------------------------------------------

import { cutoutFor, type WardrobeCutout } from './wardrobeCutouts';

const DIR = '/images/Textures/wardrobes';

export type WardrobeKind = 'built-in' | 'walk-in';
/** Which render to draw. Walk-ins have only the one. */
export type WardrobeView = 'front' | 'angle' | 'interior';

export interface WardrobeModel {
  id: string;
  /** WHAT THE PRODUCT IS CALLED — "Forma 4.0". The range name and the
   * supplier's own number, which is what a customer is quoted and what the
   * artwork has always been filed under. */
  name: string;
  /** WHAT IS INSIDE IT — "Shelf tower + double hang".
   *
   * This used to BE the name, which conflated the product with its internal
   * arrangement: two units can be built the same way at different widths, and
   * no one orders "Divider + Double Hang". It is a caption under the name now,
   * which is the job it was always doing. */
  layout: string;
  /** The supplier's product code, where there is one. This is what goes on a
   * quote, so it is carried rather than reconstructed from the name. */
  code?: string;
  kind: WardrobeKind;
  /** Cabinet widths this SKU is made in, mm. Not shared across the range: a
   * tower is 507 of the cabinet, so the tower products start at 1500 where the
   * divider-only one starts at 1200. */
  widths: number[];
  /** WHICH SUPPLIED RENDER DRESSES THIS SKU.
   *
   * Kept separate from the id because the two are no longer the same thing. The
   * artwork is filed under the names the stickers arrived with; the products
   * are filed under their codes, and one render can serve a SKU whose id looks
   * nothing like it. Null where no supplied render is that product — those draw
   * from the geometry in board. */
  artworkId: string | null;
  /** The original single render, used until the cut-out set arrives. */
  legacyFile: string;
}

/** Every layout in the range is the same height and the same depth — only the
 * width and the internal arrangement change. Held once rather than repeated on
 * ten entries, because a per-model copy is ten places for them to disagree. */
export const WARDROBE_HEIGHT_MM = 2016;
/** 500mm on every unit in the range, and it is not a variable.
 *
 * There was briefly a control for the opening's depth, on the reasoning that a
 * cabinet deeper than its alcove would stand proud of the wall. The premise was
 * wrong: these are built to the opening, so the depth is a property of the
 * product like the height, and a slider for it was a question with one answer.
 * Held here as a constant for the same reason 2016 is. */
export const WARDROBE_DEPTH_MM = 500;

/** The width a layout opens on.
 *
 * MATCHED TO THE PREVIEW PHOTOGRAPH, which is the 1500 alcove. A wardrobe
 * arriving at 2400 in a 1500 opening is a cabinet visibly overrunning its
 * alcove, and the first thing a customer sees should be the product fitting
 * rather than a warning they did not ask for.
 *
 * It costs a little: 1500 is not the width the renders were shot at, so the
 * artwork is sliced from the first frame rather than shown unsliced. The
 * slicing is exact — that is the whole point of it — so this is the right trade. */
export const DEFAULT_WIDTH_MM = 1500;

/** THE BUILT-IN RANGE, FROM THE PRODUCT CODES.
 *
 * These are the SKUs, not a set of names invented to label the artwork. What
 * was here before was the ten supplied stickers treated as ten products —
 * "Forma 2.9" through "Forma 12.0U" — with widths guessed at and, in four
 * cases, guessed wrong.
 *
 * ONLY THE 2016mm PRODUCTS. The catalogue also lists SR02, SRDT02 and SRST02,
 * which are the same three internals at 1668mm. Height is the visualiser's
 * scale anchor — the traced box IS 2016mm tall, and that single fact fixes
 * millimetres-per-pixel — so a 1668 unit is not a variant of these, it is a
 * second anchor and a second set of artwork. Out of scope until it has both.
 *
 * WIDTHS DIFFER BY SKU, which the previous version got wrong in the other
 * direction: one shared list of five, applied to everything. SRDH starts at
 * 1200 and stops at 2400; the two tower products start at 1500 and run to 2700.
 * A tower is 507mm of the cabinet, so a 1200 opening with a tower in it has
 * under 700 left for hanging, which is why they do not offer it.
 *
 * THE PHOTOGRAPHS DO NOT COVER EVERY WIDTH, and that must not change this list.
 * The supplied alcove shots are 1500 / 1800 / 2100 / 2400, so a customer
 * choosing 2700 sees it against the 2400 room. 2700 was briefly deleted here
 * because no sample was shot at it — which is backwards: this is the product
 * range, and a missing photograph is a gap in the sample rooms, not a width
 * the supplier stops making. */
export const WARDROBE_MODELS: WardrobeModel[] = [
  {
    id: 'SRDH',
    name: 'Forma 1',
    layout: 'Divider + double hang',
    code: 'SRDH',
    kind: 'built-in',
    widths: [1200, 1500, 1800, 2100, 2400],
    // No tower, so nothing in the supplied artwork matches it — every render
    // has one. Drawn from the geometry until its own render exists.
    artworkId: null,
    legacyFile: 'Forma Wardrobe 3.0 Sticker.png',
  },
  {
    id: 'SRSTDH02',
    name: 'Forma 2',
    layout: 'Shelf tower + double hang',
    code: 'SRSTDH02',
    kind: 'built-in',
    widths: [1500, 1800, 2100, 2400, 2700],
    // 4.0's render is this product: shelf tower, divider, double-hung bay.
    artworkId: '4.0',
    legacyFile: 'Forma Wardrobe 4.0 Sticker.png',
  },
  {
    id: 'SRDTDH01',
    name: 'Forma 3',
    layout: 'Drawer tower + double hang',
    code: 'SRDTDH01',
    kind: 'built-in',
    widths: [1500, 1800, 2100, 2400, 2700],
    // 6.0's render is this one: drawer tower, divider, double-hung bay.
    artworkId: '6.0',
    legacyFile: 'Forma Wardrobe 6.0 Sticker.png',
  },
  // WALK-INS ARE A DIFFERENT FAMILY and are left as they were — the catalogue
  // above is the built-in robe range (BIR), and these are not in it.
  { id: '7.0L', name: 'Forma 7.0L', layout: 'L-shaped walk-in', kind: 'walk-in', widths: [2400, 3000], artworkId: '7.0L', legacyFile: 'Forma Wardrobe 7.0L Sticker.png' },
  { id: '9.0L', name: 'Forma 9.0L', layout: 'L-shaped walk-in, long run', kind: 'walk-in', widths: [2400], artworkId: '9.0L', legacyFile: 'Forma Wardrobe 9.0L Sticker.png' },
  { id: '12.0U', name: 'Forma 12.0U', layout: 'U-shaped walk-in', kind: 'walk-in', widths: [2400], artworkId: '12.0U', legacyFile: 'Forma Wardrobe 12.0U Sticker.png' },
];

export const modelsOfKind = (kind: WardrobeKind) => WARDROBE_MODELS.filter(m => m.kind === kind);

/** EVERY WIDTH THE BUILT-IN RANGE IS MADE IN, deduplicated and in order.
 *
 * Derived rather than written out, so adding a width to one SKU cannot leave
 * this behind. It is the list for a surface that has to offer widths BEFORE a
 * model is known — the range card, where width and model are two chips in the
 * same panel and neither has been answered first. The visualiser asks in order
 * and can therefore offer the chosen SKU's own narrower list, which is why that
 * one reads `wardrobeModelById(...).widths` instead. */
export const WARDROBE_WIDTHS: number[] = [
  ...new Set(modelsOfKind('built-in').flatMap(m => m.widths)),
].sort((a, b) => a - b);

export const wardrobeModelById = (id: string): WardrobeModel =>
  WARDROBE_MODELS.find(m => m.id === id) ?? WARDROBE_MODELS[0];

/** "2400 / 3000 W × 2016 H × 447 D mm" */
export const wardrobeDimensions = (m: WardrobeModel): string =>
  `${m.widths.join(' / ')} W × ${WARDROBE_HEIGHT_MM} H × ${WARDROBE_DEPTH_MM} D mm`;

/** THE FOUR BOARD FINISHES the range is made in — the manufacturer's own names,
 * verbatim, so what is chosen here is what gets written on the quote. The slug
 * is what appears in the artwork filename. */
export const WARDROBE_COLOURS: { name: string; slug: string; hex: string }[] = [
  // THE HEXES ARE MEASURED FROM THE BOARDS, not chosen to look like them.
  //
  // They were eyeballed, and the eye was wrong in a way that mattered: Notaio
  // Walnut was set at #6A4A34, a dark chocolate, where the real decor averages
  // #866750 — a mid brown. So the swatch in the picker promised one board and
  // the render, once it had the supplier's own sheet on it, delivered another.
  // Averaged over the decor sheet, they now agree.
  { name: 'Matt Wardrobe White', slug: 'white', hex: '#F1EFEB' },
  { name: 'Matt Natural Oak', slug: 'natural-oak', hex: '#B7A486' },
  { name: 'Woodmatt Antico Oak', slug: 'antico-oak', hex: '#7F7262' },
  { name: 'Woodmatt Notaio Walnut', slug: 'notaio-walnut', hex: '#866750' },
];

/** THE BOARD'S OWN PHOTOGRAPH, for the three timber finishes.
 *
 * These are the supplier's decor sheets — the actual Polytec boards the Forma
 * range is pressed in, which is what the customer receives. Woodgrain drawn
 * procedurally was standing in for them: it gave the board SOME figure, which
 * beat a flat brown rectangle, but it was invented figure and it looked it.
 * Antico Oak in particular is a grey oak with dark knots and splits running
 * through it, and no amount of sine waves produces a knot.
 *
 * White has none, and needs none: Matt Wardrobe White is a plain surface, and
 * the photographic renders already cover it. */
export const FINISH_TEXTURE: Record<string, string> = {
  'natural-oak': `${DIR}/finishes/natural-oak.jpg`,
  'antico-oak': `${DIR}/finishes/antico-oak.jpg`,
  'notaio-walnut': `${DIR}/finishes/notaio-walnut.jpg`,
};

/** How much real board one tile of the texture covers, millimetres.
 *
 * Set from the sheet it was cropped from rather than chosen to look right: the
 * crop is about this much of a real Polytec sheet, so at this size the grain
 * comes out the size grain actually is. Get it wrong and the board reads as
 * veneer on a dolls' house or as a barn door. */
export const FINISH_TILE_MM = { w: 900, h: 1800 };

export const wardrobeColour = (name: string) =>
  WARDROBE_COLOURS.find(c => c.name === name) ?? WARDROBE_COLOURS[0];

export const wardrobeColourHex = (name: string): string => wardrobeColour(name).hex;

/** Where a finished render lives: `<layout>-<finish>-<view>.png`.
 *
 * Flat, lower-case and hyphenated rather than the supplier's own spaced
 * filenames, because these are addressed by three separate choices and a name
 * built out of those choices cannot drift from them. */
export const wardrobeAssetPath = (model: WardrobeModel, colourName: string, view: WardrobeView) =>
  `${DIR}/${model.id}-${wardrobeColour(colourName).slug}-${view}.png`;

/** How far out of square a trace has to be before it counts as an angled wall.
 * Enough that a hand traced rectangle with a wobble in it still reads as
 * square-on, small enough that a genuinely receding wall is caught.
 *
 * RAISED FROM 0.06, which was set by eye and turned out to be about 6° of yaw —
 * well inside what a front-on render survives. Warping the 8.0 cut-out onto a
 * wall rotated through a normal lens puts 15° at a skew of 0.149 and still
 * looking right, with the failure arriving between 30° and 45°. At 0.06 a wall
 * six degrees off square was already being sent to artwork drawn at
 * twenty-five, which is a bigger error than the one it was avoiding. */
const TRAPEZOID_THRESHOLD = 0.15;

/** The viewpoint a built-in should be drawn in, decided by the shape the
 * customer traced.
 *
 * A wall photographed square-on traces as a rectangle: its left and right edges
 * are the same height. A wall photographed at an angle traces as a trapezium,
 * because the far end is further away and therefore shorter. That difference is
 * measurable, and it is exactly the question "should this wardrobe show its
 * depth" — so the trace answers it rather than the customer having to.
 *
 * Walk-ins have one render and ignore this. */
export function viewForTrace(corners: [number, number][], kind: WardrobeKind): WardrobeView {
  if (kind === 'walk-in') return 'interior';
  if (corners.length !== 4) return 'front';
  const [tl, tr, br, bl] = corners;
  const leftEdge = Math.abs(bl[1] - tl[1]);
  const rightEdge = Math.abs(br[1] - tr[1]);
  const mean = (leftEdge + rightEdge) / 2;
  if (mean <= 0) return 'front';
  return Math.abs(leftEdge - rightEdge) / mean >= TRAPEZOID_THRESHOLD ? 'angle' : 'front';
}

/** True when the trace's LEFT edge is the shorter one, meaning the wall recedes
 * to the left. The angled renders are drawn receding to the right, so this is
 * what tells the renderer to mirror one.
 *
 * Mirroring flips the internal layout with it — drawers that were on the left
 * end up on the right. That is a real cost and it is accepted deliberately: a
 * wardrobe leaning against the room's own perspective is the error people see
 * immediately, and which end the drawers sit on is not. */
export function tracedRecedesLeft(corners: [number, number][]): boolean {
  if (corners.length !== 4) return false;
  const [tl, tr, br, bl] = corners;
  return Math.abs(bl[1] - tl[1]) < Math.abs(br[1] - tr[1]);
}

// --- Loading ---------------------------------------------------------------

const assetCache = new Map<string, Promise<HTMLImageElement | null>>();

/** Loads a finished render, or resolves null if that file is not there yet. */
function loadAsset(src: string): Promise<HTMLImageElement | null> {
  const hit = assetCache.get(src);
  if (hit) return hit;
  const job = new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    // A missing file is expected while the set is being produced, so this
    // resolves rather than rejecting — the caller falls back to the legacy
    // sticker and the page keeps working.
    img.onerror = () => resolve(null);
    img.src = encodeURI(src);
  });
  assetCache.set(src, job);
  return job;
}

export interface WardrobeArtwork {
  image: CanvasImageSource;
  width: number;
  height: number;
  /** True while this is a keyed-and-tinted legacy sticker rather than a
   * supplied cut-out. The panel uses it to say so. */
  legacy: boolean;
}

/** The artwork for one configuration: a supplied cut-out where one exists, and
 * the old keyed sticker where it does not. */
export async function wardrobeArtwork(
  model: WardrobeModel,
  colourName: string,
  view: WardrobeView,
): Promise<WardrobeArtwork> {
  const supplied = await loadAsset(wardrobeAssetPath(model, colourName, view));
  if (supplied) {
    return { image: supplied, width: supplied.naturalWidth, height: supplied.naturalHeight, legacy: false };
  }
  const canvas = await legacyStickerFallback(model, wardrobeColourHex(colourName));
  return { image: canvas, width: canvas.width, height: canvas.height, legacy: true };
}

/** THE CUT-OUT FOR A LAYOUT AND FINISH, or null where there is not one yet.
 *
 * The supplied stickers are cut out at build time by
 * scripts/cut-wardrobe-stickers.mjs and land here as `<id>-<finish>-<view>.png`
 * with a real alpha channel and a manifest saying where the CARCASS sits inside
 * each file — see wardrobeCutouts.ts for why that box is not the file's own
 * bounds.
 *
 * ONLY THE FINISH THAT WAS PHOTOGRAPHED. The ten renders are all Matt Wardrobe
 * White, so that is the only finish this can answer for, and the note at the
 * top of this file explains why the missing three cannot be faked from it:
 * recolouring finds the board by colour and white shirts share a white
 * carcass's signature exactly. Grain makes it worse still — there is no figure
 * in a white melamine render to modulate into walnut, so no tint invents one.
 * The other three finishes take the modelled carcass, which is honest about
 * being modelled and gets the colour right, until their renders land.
 */
export async function wardrobeCutoutFor(
  model: WardrobeModel,
  colourName: string,
): Promise<{ image: HTMLImageElement; carcass: WardrobeCutout; view: WardrobeView } | null> {
  const entry = model.artworkId ? cutoutFor(model.artworkId) : undefined;
  if (!entry) return null;
  if (wardrobeColour(colourName).slug !== 'white') return null;
  const image = await loadAsset(`${DIR}/${entry.file}`);
  if (!image) return null;
  return { image, carcass: entry, view: entry.view };
}

/** Is the finished set in place for this configuration? */
export async function hasSuppliedArtwork(
  model: WardrobeModel,
  colourName: string,
  view: WardrobeView,
): Promise<boolean> {
  return (await loadAsset(wardrobeAssetPath(model, colourName, view))) !== null;
}

// --- Legacy fallback -------------------------------------------------------
// EVERYTHING BELOW THIS LINE IS TEMPORARY and goes when the cut-out set lands.
//
// It keys the checkerboard out of the original stickers and repaints the board,
// which is the approach the note at the top of this file explains cannot be
// made reliable. It is kept only so the wardrobe tab is not blank in the
// meantime, and it is deliberately CONSERVATIVE now rather than thorough: where
// the previous version tried to clear every last background pixel and took
// chunks of product with it, this one clears what is unambiguous and leaves the
// rest. A faint fringe is a much smaller fault than a hole in the cabinetry.

const CHECKER_MAX_CHROMA = 6;
const CHECKER_LEVEL_FALLBACK = 236;
const CARCASS_TOLERANCE = 0.18;
const CARCASS_FALLOFF = 2.2;
const BOARD_SHADOW_FLOOR = 0.42;
const BOARD_SHADOW_CEIL = 0.72;

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

function signature(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b, 1);
  return [r / max, g / max, b / max];
}

/** The darkest grey this file's checkerboard is printed in, read off its own
 * border. The ten files were resampled at different times and their greys
 * drifted — 235 on some, 247 on others — so no single constant fits them. */
function checkerFloor(px: Uint8ClampedArray, w: number, h: number): number {
  const levels: number[] = [];
  let sampled = 0;
  const consider = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    sampled++;
    if (Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]) > 4) return;
    levels.push(Math.min(px[i], px[i + 1], px[i + 2]));
  };
  for (let y = 0; y < 4 && y < h; y++) {
    for (let x = 0; x < w; x++) { consider(x, y); consider(x, h - 1 - y); }
  }
  for (let x = 0; x < 4 && x < w; x++) {
    for (let y = 4; y < h - 4; y++) { consider(x, y); consider(w - 1 - x, y); }
  }
  if (levels.length < sampled * 0.2) return CHECKER_LEVEL_FALLBACK;
  levels.sort((a, b) => a - b);
  return Math.max(200, levels[Math.floor(levels.length * 0.01)] - 2);
}

function keyLegacySticker(source: HTMLImageElement): HTMLCanvasElement {
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
  const floor = checkerFloor(px, w, h);
  const seen = new Uint8Array(n);

  const isChecker = (i: number) => {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) <= CHECKER_MAX_CHROMA && Math.min(r, g, b) >= floor;
  };

  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);

  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !isChecker(i)) continue;
    seen[i] = 1;
    px[i * 4 + 3] = 0;
    const x = i % w;
    const y = (i / w) | 0;
    const L = x > 0, R = x < w - 1, U = y > 0, D = y < h - 1;
    if (L) stack.push(i - 1);
    if (R) stack.push(i + 1);
    if (U) stack.push(i - w);
    if (D) stack.push(i + w);
    if (L && U) stack.push(i - w - 1);
    if (R && U) stack.push(i - w + 1);
    if (L && D) stack.push(i + w - 1);
    if (R && D) stack.push(i + w + 1);
  }

  ctx.putImageData(image, 0, 0);

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
  if (maxX < minX || maxY < minY) return canvas;

  const cropped = document.createElement('canvas');
  cropped.width = maxX - minX + 1;
  cropped.height = maxY - minY + 1;
  cropped
    .getContext('2d')!
    .drawImage(canvas, minX, minY, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
  return cropped;
}

function carcassSignature(px: Uint8ClampedArray): [number, number, number] {
  const BINS = 12;
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (Math.max(r, g, b) < 40) continue;
    const [sr, sg, sb] = signature(r, g, b);
    const key = ((sr * (BINS - 1)) | 0) * BINS * BINS + ((sg * (BINS - 1)) | 0) * BINS + ((sb * (BINS - 1)) | 0);
    const slot = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    slot.n++; slot.r += sr; slot.g += sg; slot.b += sb;
    counts.set(key, slot);
  }
  let best = { n: 0, r: 1, g: 1, b: 1 };
  for (const slot of counts.values()) if (slot.n > best.n) best = slot;
  const n = Math.max(1, best.n);
  return [best.r / n, best.g / n, best.b / n];
}

function tintLegacySticker(keyed: HTMLCanvasElement, hex: string): HTMLCanvasElement {
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
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const [sr, sg, sb] = signature(r, g, b);
    const dist = Math.hypot(sr - cr, sg - cg, sb - cb);
    if (dist >= CARCASS_TOLERANCE) continue;
    const level = smoothstep(BOARD_SHADOW_FLOOR, BOARD_SHADOW_CEIL, luma(r, g, b) / carcassLuma);
    if (level <= 0) continue;
    const weight = Math.pow(1 - dist / CARCASS_TOLERANCE, CARCASS_FALLOFF) * level;
    const scale = luma(r, g, b) / carcassLuma;
    px[i] = r + (tr * scale - r) * weight;
    px[i + 1] = g + (tg * scale - g) * weight;
    px[i + 2] = b + (tb * scale - b) * weight;
  }

  ctx.putImageData(image, 0, 0);
  return out;
}

const legacyKeyed = new Map<string, Promise<HTMLCanvasElement>>();
const legacyTinted = new Map<string, HTMLCanvasElement>();

function legacyStickerFallback(model: WardrobeModel, hex: string): Promise<HTMLCanvasElement> {
  const cacheKey = `${model.id}|${hex}`;
  const done = legacyTinted.get(cacheKey);
  if (done) return Promise.resolve(done);

  let keyed = legacyKeyed.get(model.legacyFile);
  if (!keyed) {
    keyed = new Promise<HTMLCanvasElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(keyLegacySticker(img));
      img.onerror = reject;
      img.src = encodeURI(`${DIR}/${model.legacyFile}`);
    });
    keyed.catch(() => legacyKeyed.delete(model.legacyFile));
    legacyKeyed.set(model.legacyFile, keyed);
  }

  return keyed.then(canvas => {
    const tinted = tintLegacySticker(canvas, hex);
    legacyTinted.set(cacheKey, tinted);
    return tinted;
  });
}
