// ---------------------------------------------------------------------------
// WHAT GOES IN THE WARDROBE — the contents, as separate cut-outs.
//
// WHY THESE ARE NOT CROPPED OUT OF THE PRODUCT PHOTOGRAPHS, which is what the
// previous version tried and is worth recording so it is not tried again.
//
// The supplied stickers are finished pictures of the whole product, structure
// included. Cropping one per compartment and placing the crops back onto a
// model of the same product tiles the picture across the model and hands back
// the picture: the photographed shelves land on the modelled shelves at a
// different pitch, the opaque board hides the geometry behind it, and the model
// stops contributing anything but its outer edge. That is exactly what it
// looked like.
//
// Separating the contents from the board by colour does not work either. A
// white shirt and a white melamine panel are the same pixels — the same problem
// that defeated recolouring the board.
//
// So the contents arrive already separated: a folded stack, a row of shirts, a
// pair of shoes, a storage box, each its own PNG with real transparency and
// nothing but the object in it. Then the model does all the structure and the
// photographs do all the surface, which is the division of labour that was
// wanted all along.
//
// SIZED IN MILLIMETRES, and that is the point of doing it this way. A folded
// stack is about 300mm across whatever wardrobe it sits in, so it is declared
// at 300 and the projection handles the rest: it scales with the cabinet,
// foreshortens on an angled wall, and sits at whatever depth its shelf is at.
// Nothing has to be re-tuned per layout.
// ---------------------------------------------------------------------------

const DIR = '/images/Textures/wardrobes/contents';

export type ContentKind =
  /** A run of shirts or jackets on hangers — a short drop, for a double-hang
   * bay or the lower half of a tall one. */
  | 'hanging-short'
  /** Coats and dresses. The full drop of a single-hang bay. */
  | 'hanging-long'
  /** A stack of folded clothes, sitting on a shelf. */
  | 'stack'
  /** A fabric storage box or basket, sitting on a shelf. */
  | 'box'
  /** A pair of shoes, on the floor of the carcass or a low shelf. */
  | 'shoes';

export interface ContentAsset {
  kind: ContentKind;
  file: string;
  /** The object's real size, mm. Width is what drives the scale; height follows
   * from the file's own aspect ratio, so a slightly differently-proportioned
   * replacement asset still sits correctly. */
  widthMm: number;
  /** How far back from the front of the carcass the object sits, as a fraction
   * of its depth.
   *
   * Not one number for everything: clothes on a rail hang forward, a folded
   * stack is pushed to the back of its shelf, a box sits somewhere between. It
   * is a small difference and it is most of what stops the interior reading as
   * one flat plane of objects. */
  depth: number;
  /** How deep the object really is, mm — front to back on its shelf.
   *
   * Only standing objects need this, and they need it because they are built
   * as solids rather than as billboards: a folded stack seen from the side is
   * a slab about 300mm deep, and without a real figure here it would be
   * guessed from the width, which is wrong for anything that is not square in
   * plan. A pair of shoes is the clear case — narrow across, long front to
   * back. */
  depthMm?: number;
  /** True for things that hang FROM a rail — positioned by their top edge.
   * Everything else stands ON a surface and is positioned by its bottom. */
  hangs?: boolean;
  /** True for things that repeat across the width of an opening rather than
   * sitting once in the middle of it. A rail of shirts fills its bay; a single
   * folded stack does not. */
  repeats?: boolean;
}

/** THE SIZES ARE MEASURED OFF THE RENDERS THEY WERE CUT FROM, not chosen.
 *
 * Each crop's width in pixels, divided by the carcass's own width in pixels,
 * times that layout's real width in millimetres. So a run of three coats comes
 * out at 370mm because three coats packed on a rail really do take about
 * 120mm each — which is also the sanity check that the arithmetic was right.
 *
 * Getting these wrong is not subtle: the projection scales everything by
 * widthMm, so a stack declared at twice its size arrives as a piece of luggage
 * on a shelf. */
export const CONTENT_ASSETS: Record<ContentKind, ContentAsset> = {
  // Dark trousers off 4.0's lower rail — the short drop of a double-hang.
  'hanging-short': { kind: 'hanging-short', file: 'hanging-short.png', widthMm: 200, depth: 0.30, hangs: true, repeats: true },
  // Three charcoal coats off 3.0's left-hand run, at their full drop.
  'hanging-long': { kind: 'hanging-long', file: 'hanging-long.png', widthMm: 370, depth: 0.30, hangs: true, repeats: true },
  // Depths are the objects' real front-to-back sizes: a folded stack is about
  // as deep as it is wide, a storage box a little less than its width, and a
  // pair of shoes far deeper than they are across.
  stack: { kind: 'stack', file: 'stack.png', widthMm: 280, depthMm: 300, depth: 0.46 },
  box: { kind: 'box', file: 'box.png', widthMm: 400, depthMm: 330, depth: 0.44 },
  shoes: { kind: 'shoes', file: 'shoes.png', widthMm: 250, depthMm: 300, depth: 0.40 },
};

export interface LoadedContent {
  asset: ContentAsset;
  image: HTMLImageElement;
  /** Real height in mm, from the asset's declared width and the file's own
   * aspect ratio. */
  heightMm: number;
}

const cache = new Map<ContentKind, Promise<LoadedContent | null>>();

/** Loads one content cut-out, or resolves null while the file does not exist.
 *
 * Null rather than throwing, because these are additive: a wardrobe with no
 * contents assets yet is still a correct wardrobe, and the renderer falls back
 * to its modelled blocks. They can be added one at a time. */
export function loadContent(kind: ContentKind): Promise<LoadedContent | null> {
  const hit = cache.get(kind);
  if (hit) return hit;
  const asset = CONTENT_ASSETS[kind];
  const job = new Promise<LoadedContent | null>(resolve => {
    const img = new Image();
    img.onload = () =>
      resolve({
        asset,
        image: img,
        heightMm: asset.widthMm * (img.naturalHeight / Math.max(1, img.naturalWidth)),
      });
    img.onerror = () => resolve(null);
    img.src = encodeURI(`${DIR}/${asset.file}`);
  });
  cache.set(kind, job);
  return job;
}

/** Everything, in one go — the renderer needs whatever exists before it can
 * decide what to draw, and there are only a handful. */
export async function loadAllContents(): Promise<Map<ContentKind, LoadedContent>> {
  const kinds = Object.keys(CONTENT_ASSETS) as ContentKind[];
  const loaded = await Promise.all(kinds.map(loadContent));
  const out = new Map<ContentKind, LoadedContent>();
  kinds.forEach((k, i) => {
    const item = loaded[i];
    if (item) out.set(k, item);
  });
  return out;
}
