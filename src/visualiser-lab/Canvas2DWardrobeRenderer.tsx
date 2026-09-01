// ---------------------------------------------------------------------------
// THE WARDROBE RENDERER.
//
// BUILT-INS ARE MODELLED, NOT PHOTOGRAPHED. The carcass is built in
// millimetres â€” 2016 high, 447 deep, the layout's own width â€” and projected
// onto the wall the customer traced. Trace a square-on wall and it comes out
// square on; trace a wall running away to one side and the side return
// foreshortens, the shelf fronts converge and the rails run to the same
// vanishing point as the room, because the geometry is doing it rather than an
// image being stretched into place.
//
// Same idea as the blind and the curtain â€” solve in the product's own space,
// put it back on the traced quad â€” with the one difference that a wardrobe has
// depth, so a flat homography is not enough on its own. See projectorFromQuad.
//
// WHY NOT THE SUPPLIED PHOTOGRAPHS. Each carries one viewpoint, and the ten did
// not agree: some front on, some three-quarter, some looking into a corner. A
// photograph cannot be turned to face a different way afterwards, because the
// faces the camera never saw are not in the file. Modelling removes the
// question â€” there is no baked viewpoint left to disagree with the room. It
// also ends the keying, since there is no background to cut away.
//
// DRAWN IN 2D, and deliberately. The carcass is a few dozen boxes, which is a
// few hundred flat quads â€” far below the point where a GPU earns its
// complication, and this way the projection can be the exact one the wall needs
// rather than whatever a perspective camera can be talked into. Faces are
// sorted back to front and filled, which is all the depth ordering a convex
// open box requires.
//
// WALK-INS ARE STILL ARTWORK. 7.0L, 9.0L and 12.0U are rooms rather than
// objects â€” those renders look INTO the robe at two or three walls receding
// away. Modelling one would mean modelling a room; the honest placement is a
// view through the trace.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { wardrobeArtwork, wardrobeModelById, wardrobeColourHex, wardrobeColour, wardrobeCutoutFor, WARDROBE_HEIGHT_MM, WARDROBE_DEPTH_MM } from './wardrobes';
import { loadAllContents, type ContentKind, type LoadedContent } from './wardrobeContents';
import { projectorFromQuad, columnsFor, BOARD_MM, RAIL_DROP_MM, type Projector } from './wardrobeGeometry';
import { profilePhoto, relightCutout, drawSeatingShadow, applyGrain, makeGrainTile, isWoodFinish } from './wardrobeComposite';
import { computeHomography, applyHomography, type Point } from './homography';

export interface WardrobeRendererProps {
  photoUrl: string;
  /** The traced quad in photo pixels, TL TR BR BL. */
  corners: [number, number][];
  modelId: string;
  colourName: string;
}

export default function Canvas2DWardrobeRenderer({
  photoUrl,
  corners,
  modelId,
  colourName,
}: WardrobeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const photo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = photoUrl;
      });
      if (cancelled) return;

      canvas.width = photo.naturalWidth;
      canvas.height = photo.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(photo, 0, 0);

      const model = wardrobeModelById(modelId);

      if (model.kind === 'walk-in') {
        const art = await wardrobeArtwork(model, colourName, 'interior');
        if (cancelled) return;
        drawWalkIn(ctx, art.image, art.width, art.height, corners);
        return;
      }

      // THE PHOTOGRAPH'S OWN ARTWORK FIRST, where it exists for this finish.
      //
      // A cut-out is the product, photographed. Nothing modelled competes with
      // it on a wall the customer traced square-on, which is most of them, so
      // this is the path that runs whenever it can. See drawCutout for the one
      // thing it cannot do.
      const cut = await wardrobeCutoutFor(model, colourName);
      if (cancelled) return;
      if (cut && !tooSkewedForCutout(corners, cut.view)) {
        drawCutout(ctx, corners, cut.image, cut.carcass, canvas.width, canvas.height);
        return;
      }

      // The contents, if they have been supplied yet. Absent, the carcass draws
      // its own modelled blocks instead â€” see buildCarcass.
      const contents = await loadAllContents();
      if (cancelled) return;
      drawBuiltIn(ctx, corners, model.id, model.widths[0], colourName, canvas.width, canvas.height, contents);
    };

    render().catch(() => {
      /* photo or artwork failed â€” leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, modelId, colourName, JSON.stringify(corners)]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}

// --- Built-in: the supplied cut-out ----------------------------------------

/** HOW FAR A FIXED VIEWPOINT CAN BE PUSHED, and this number is measured rather
 * than picked.
 *
 * A cut-out is a plane. Warping one onto a receding wall is geometrically exact
 * for a picture and progressively wrong for a cabinet, because the 447mm of
 * depth never reveals a side return and the bays that ought to occlude each
 * other never do. Rotating a test wall through a normal lens and warping the
 * 8.0 cut-out onto it puts the failure at:
 *
 *     15Â°  skew 0.149   holds -- reads as a wardrobe on an angled wall
 *     30Â°  skew 0.288   doubtful -- the drawer stack starts to shear
 *     45Â°  skew 0.408   gone -- a leaning decal
 *
 * So the cut-out is used out to a skew of 0.30 and the modelled carcass takes
 * over past it. The modelled one is less photographic but it has real depth,
 * and at that angle depth is the thing being looked at.
 *
 * viewForTrace's own TRAPEZOID_THRESHOLD is a different and smaller number on
 * purpose: it only decides WHICH render to ask for, and it should switch to the
 * angled artwork well before the front-on one is in trouble.
 *
 * An angled render is already turned, so it starts from its own viewpoint and
 * has the same latitude either side of it. */
const CUTOUT_SKEW_LIMIT = 0.30;

function traceSkew(corners: Point[]): number {
  if (corners.length !== 4) return 0;
  const [tl, tr, br, bl] = corners;
  const left = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
  const right = Math.hypot(br[0] - tr[0], br[1] - tr[1]);
  const mean = (left + right) / 2;
  return mean > 0 ? Math.abs(left - right) / mean : 0;
}

function tooSkewedForCutout(corners: Point[], view: string): boolean {
  const skew = traceSkew(corners);
  // The angled render is drawn at roughly 25Â° already, so the wall it suits is
  // one that is ALREADY skewed -- it is the near-square trace that is wrong for
  // it, and a steeper one it handles better than the front-on render would.
  if (view === 'angle') return skew > CUTOUT_SKEW_LIMIT * 2.1;
  return skew > CUTOUT_SKEW_LIMIT;
}

/** Places a cut-out on the traced wall and makes it belong there.
 *
 * THE TRACE IS THE CARCASS, NOT THE FILE. Every sticker is staged with cases on
 * top and shoes on the floor in front, so mapping the file's own bounds onto
 * the trace would land the cabinet short of the floor by the height of a pair
 * of shoes and float it. The homography is solved from the CARCASS box to the
 * traced quad, then the whole file is drawn through it -- so the cabinet lands
 * exactly on the trace and the staging falls outside it, which is where a real
 * suitcase on top of a real wardrobe would be.
 *
 * WHICH ALSO MEANS NO CLIPPING TO THE TRACE. The old modelled path clips,
 * because a modelled carcass extrudes forward out of the traced plane and has
 * to be contained. Here the overspill is the point.
 */
function drawCutout(
  ctx: CanvasRenderingContext2D,
  corners: Point[],
  image: HTMLImageElement,
  carcass: { x0: number; y0: number; x1: number; y1: number },
  imageW: number,
  imageH: number,
) {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  if (!w || !h) return;

  // Measured before anything is drawn over the photograph, or the wardrobe
  // would be sampled as though it were the wall.
  const profile = profilePhoto(ctx, corners, imageW, imageH);

  const src: Point[] = [
    [carcass.x0 * w, carcass.y0 * h],
    [carcass.x1 * w, carcass.y0 * h],
    [carcass.x1 * w, carcass.y1 * h],
    [carcass.x0 * w, carcass.y1 * h],
  ];

  let hom: number[];
  try {
    hom = computeHomography(src, corners);
  } catch {
    return;
  }

  drawSeatingShadow(ctx, corners);

  const relit = relightCutout(image, profile);

  // A LITTLE SOFTER, TO SIT IN THE SAME FOCAL PLANE. A hand-held room photo is
  // never quite critically sharp, and a render at full acuity on top of one
  // reads as a different exposure rather than a different object.
  ctx.save();
  if (profile.softness > 0.12) ctx.filter = `blur(${profile.softness.toFixed(2)}px)`;

  // Subdivided, because Canvas 2D has only affine transforms and an affine map
  // keeps parallel lines parallel -- the one thing that must not happen on a
  // receding wall. Over a cell a few pixels across the perspective is very
  // nearly linear, so the error falls off as the square of the cell size.
  const N = 14;
  const P: Point[][] = [];
  for (let j = 0; j <= N; j++) {
    const row: Point[] = [];
    for (let i = 0; i <= N; i++) row.push(applyHomography(hom, [(i / N) * w, (j / N) * h]));
    P.push(row);
  }

  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const u0 = (i / N) * w, u1 = ((i + 1) / N) * w;
      const v0 = (j / N) * h, v1 = ((j + 1) / N) * h;
      const a = { p: P[j][i], uv: [u0, v0] as Point };
      const b = { p: P[j][i + 1], uv: [u1, v0] as Point };
      const c = { p: P[j + 1][i + 1], uv: [u1, v1] as Point };
      const d = { p: P[j + 1][i], uv: [u0, v1] as Point };
      skinTriangle(ctx, relit, a, b, c);
      skinTriangle(ctx, relit, a, c, d);
    }
  ctx.restore();

  // Grain LAST and only over what was drawn, since the render is the one part
  // of the frame that arrived with none of its own.
  const xs = P.flat().map(p => p[0]);
  const ys = P.flat().map(p => p[1]);
  const pad = 3;
  applyGrain(
    ctx,
    {
      x: Math.min(...xs) - pad,
      y: Math.min(...ys) - pad,
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    },
    profile.grain,
  );
}

// --- Built-in: the modelled carcass ----------------------------------------

/** One axis-aligned box in model millimetres, plus how its faces are shaded.
 *
 * EXPORTED because the 3D scene builds from the same list. One description of
 * what a Forma actually is, two things drawing it. */
export interface Box {
  x: number; y: number; z: number;
  w: number; h: number; d: number;
  /** Multiplies the board colour. Lets the back panel and the drawer fronts sit
   * at their own value without needing a second material. */
  tone?: number;
  /** Overrides the board colour outright â€” the hanging rails. */
  colour?: [number, number, number];
}

/** FACE SHADING, fixed per orientation rather than lit.
 *
 * A room photograph already carries its own light, and a second one from a
 * different direction is what makes a composite read as pasted on. These are
 * the values a matt white board actually shows in a room: the front edge
 * catches most, an upward face next, the two side faces fall away, and the
 * inside of the box is in its own shade because nothing lights the inside of a
 * cupboard. It reads as depth without claiming to know where the sun is. */
/** How much darker the back of the carcass is than its front edge.
 *
 * Gentler than it first looks like it should be, because it compounds with the
 * per-face tone and the back panel's own: at 0.34 a white wardrobe came out
 * mid-grey, which is a cupboard lit by nothing at all. A cupboard in a bright
 * room is still mostly white. */
const INTERIOR_FALLOFF = 0.16;

const FACE_TONE = {
  front: 1.0,
  top: 0.94,
  bottom: 0.62,
  left: 0.80,
  right: 0.72,
  back: 0.58,
};

const CORNERS_OF_FACE: Record<keyof typeof FACE_TONE, [number, number, number][]> = {
  // Each as unit offsets within the box: [x, y, z] each 0 or 1.
  front: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
  back: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
  left: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
  right: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
  top: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
  bottom: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
};

function drawBuiltIn(
  ctx: CanvasRenderingContext2D,
  corners: Point[],
  layoutId: string,
  widthMm: number,
  colourName: string,
  imageW: number,
  imageH: number,
  contents: Map<ContentKind, LoadedContent>,
) {
  const projector = projectorFromQuad(corners, widthMm, WARDROBE_HEIGHT_MM, imageW, imageH);
  if (!projector) return;

  const base = hexToRgb(wardrobeColourHex(colourName));
  const { boxes, compartments } = buildCarcass(layoutId, widthMm, contents.size > 0);

  // Built once per draw and reused across every face, because a fresh tile per
  // face would put a visible seam at each joint.
  const grain = isWoodFinish(wardrobeColour(colourName).slug) ? grainTile() : null;

  // Every face of every box, sorted back to front. A painter's sort is enough
  // here: the carcass is a set of boxes that do not interpenetrate, so no two
  // faces can need splitting.
  type Face = {
    pts: [number, number][];
    depth: number;
    /** Tone at the face's nearest and furthest corner, and where those land on
     * screen â€” enough to shade the face across itself rather than flat. */
    near: [number, number];
    far: [number, number];
    toneNear: number;
    toneFar: number;
    rgb: [number, number, number];
    /** The face's own corners in model millimetres, for projecting the skin. */
    model: [number, number, number][];
    /** True where this face is carcass board rather than a garment block, a
     * rail or a handle â€” the only surfaces timber grain belongs on. */
    board: boolean;
    /** Whether the grain runs up the face or across it. An upright panel is
     * cut with the grain running its length and a shelf across its width, and
     * getting that wrong is more obvious than having no grain at all. */
    grainUpright: boolean;
    /** True for the faces pointing at the room â€” the only ones an elevation
     * has anything to say about. */
    skinnable: boolean;
  };
  const faces: Face[] = [];

  for (const box of boxes) {
    const rgb = box.colour ?? base;
    for (const name of Object.keys(FACE_TONE) as (keyof typeof FACE_TONE)[]) {
      const unit = CORNERS_OF_FACE[name];
      const pts: [number, number][] = [];
      const modelPts: [number, number, number][] = [];
      let depthSum = 0;
      for (const [ux, uy, uz] of unit) {
        const X = box.x + ux * box.w;
        const Y = box.y + uy * box.h;
        const Z = box.z + uz * box.d;
        pts.push(projector.project(X, Y, Z));
        modelPts.push([X, Y, Z]);
        depthSum += projector.depth(X, Y, Z);
      }

      // The corner closest to the room and the one deepest into the carcass.
      // A face spanning the full 447mm â€” a side panel, a shelf â€” runs from full
      // light at its front edge to the back of the box, and filling it with one
      // value is what made the whole thing read as cut paper.
      //
      // Model Z runs negative into the wall, so the LARGER z is the nearer one.
      let nz = -Infinity;
      let fz = Infinity;
      let nearPt: [number, number] = pts[0];
      let farPt: [number, number] = pts[0];
      unit.forEach(([, , uz], k) => {
        const Z = box.z + uz * box.d;
        if (Z > nz) { nz = Z; nearPt = pts[k]; }
        if (Z < fz) { fz = Z; farPt = pts[k]; }
      });

      const flat = FACE_TONE[name] * (box.tone ?? 1);
      const shade = (z: number) =>
        flat * (1 - Math.max(0, Math.min(1, -z / WARDROBE_DEPTH_MM)) * INTERIOR_FALLOFF);
      faces.push({
        pts,
        depth: depthSum / 4,
        near: nearPt,
        far: farPt,
        toneNear: shade(nz),
        toneFar: shade(fz),
        rgb,
        model: modelPts,
        // NOTHING ON THE CARCASS IS SKINNED any more. Projecting the elevation
        // onto the front faces put the photograph's shelves and clothes on the
        // plane of the frame â€” flat, in front of the geometry, which is what it
        // looked like. The board is board, so the finish swap works on it, and
        // the photograph supplies only what is standing INSIDE. See the content
        // quads below.
        skinnable: false,
        // A box with its own colour is a rail, a handle or a garment; only the
        // ones taking the finish are board.
        board: !box.colour,
        grainUpright: box.h >= box.w,
      });
    }
  }

  // Larger depth is further away, so those go down first.
  faces.sort((a, b) => b.depth - a.depth);

  ctx.save();
  // Clipped to the traced opening. A wardrobe drawn past the wall it was traced
  // on is the one error that cannot be explained away, and the carcass overruns
  // by design â€” the side returns project forward, out of the plane.
  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i][0], corners[i][1]);
  ctx.closePath();
  ctx.clip();

  const toRgb = (c: [number, number, number], t: number) =>
    `rgb(${clamp255(c[0] * t)},${clamp255(c[1] * t)},${clamp255(c[2] * t)})`;

  for (const face of faces) {
    ctx.beginPath();
    ctx.moveTo(face.pts[0][0], face.pts[0][1]);
    for (let i = 1; i < face.pts.length; i++) ctx.lineTo(face.pts[i][0], face.pts[i][1]);
    ctx.closePath();

    const nearFill = toRgb(face.rgb, face.toneNear);
    let paint: string | CanvasGradient = nearFill;
    const run = Math.hypot(face.far[0] - face.near[0], face.far[1] - face.near[1]);
    if (run > 1 && Math.abs(face.toneNear - face.toneFar) > 0.004) {
      const g = ctx.createLinearGradient(face.near[0], face.near[1], face.far[0], face.far[1]);
      g.addColorStop(0, nearFill);
      g.addColorStop(1, toRgb(face.rgb, face.toneFar));
      paint = g;
    }
    // THE CARCASS IS BOARD, always. Nothing photographic is projected onto it
    // any more: an elevation mapped onto the front faces puts the picture's own
    // shelves and clothes on the plane of the frame, flat and in front of the
    // geometry, which is exactly what it looked like. The photographs now
    // contribute only the objects standing inside â€” see drawContents.
    ctx.fillStyle = paint;
    ctx.fill();
    // A hairline over the fill closes the seams that anti-aliasing opens
    // between two quads meeting edge to edge.
    ctx.strokeStyle = nearFill;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // THE FIGURE, on timber finishes only. Multiplied over board that has
    // already been shaded, so it darkens the grain without disturbing the
    // modelled lighting â€” and clipped to the face that was just filled, so it
    // follows that face's own perspective rather than lying flat across the
    // picture.
    if (grain && face.board) {
      ctx.save();
      ctx.clip();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 1;
      drawGrainOnFace(ctx, grain, face.model, face.grainUpright, projector);
      ctx.restore();
    }
  }

  // WHAT IS STANDING IN THE WARDROBE, drawn after the carcass so it sits inside
  // the openings the carcass has already framed.
  if (contents.size) {
    drawContents(ctx, projector, compartments, contents);
  }

  // Balances the save() that set the opening's clip. It was missing, which left
  // a clip and a saved state on the context after every draw.
  ctx.restore();

  drawContactShadow(ctx, projector, widthMm);
}

/** The carcass as a list of boxes, in millimetres, with the opening's
 * bottom-left at the origin: X right along the wall, Y up, Z out of the wall
 * toward the room.
 *
 * OPEN-FRONTED, which is what the Forma range is â€” every supplied photograph
 * shows shelves and hanging with no doors on. That is also what makes the
 * modelling worth doing: with an open front you see straight into the carcass,
 * so the side returns, the shelf edges and the back panel are all on show, and
 * those receding surfaces are what tell the eye how deep it is. */
/** A compartment's opening, in model millimetres â€” the rectangle you would
 * reach through. What goes IN it comes from the photograph. */
export interface Compartment {
  x0: number; y0: number; x1: number; y1: number;
  /** What belongs in it. The layout knows this â€” a bay under a rail takes
   * hanging clothes, a shelf opening takes a stack or a box â€” so the renderer
   * does not have to guess from the geometry. */
  role: 'shelf' | 'hang-long' | 'hang-short' | 'floor';
}

export function buildCarcass(
  layoutId: string,
  widthMm: number,
  skinned: boolean,
): { boxes: Box[]; compartments: Compartment[] } {
  const D = WARDROBE_DEPTH_MM;
  const H = WARDROBE_HEIGHT_MM;
  const boxes: Box[] = [];
  const compartments: Compartment[] = [];

  // Shell: back, two sides, top, bottom.
  // The back panel sits a little down in value. Nothing lights the inside of a
  // cupboard, and at the same tone as the front frame the box has no inside â€”
  // which is what made the first render read as a white slab on the wall. It is
  // the largest surface in the opening, though, so it sets the colour of the
  // whole thing: too dark and a white wardrobe reads grey, which is what 0.66
  // did.
  boxes.push({ x: 0, y: 0, z: 0, w: widthMm, h: H, d: BOARD_MM, tone: 0.95 });
  boxes.push({ x: 0, y: 0, z: 0, w: BOARD_MM, h: H, d: D });
  boxes.push({ x: widthMm - BOARD_MM, y: 0, z: 0, w: BOARD_MM, h: H, d: D });
  boxes.push({ x: 0, y: H - BOARD_MM, z: 0, w: widthMm, h: BOARD_MM, d: D });
  boxes.push({ x: 0, y: 0, z: 0, w: widthMm, h: BOARD_MM, d: D });

  const inner = widthMm - 2 * BOARD_MM;
  const innerH = H - 2 * BOARD_MM;
  const y0 = BOARD_MM;
  let x = BOARD_MM;

  const shelf = (cx: number, cw: number, y: number) =>
    boxes.push({ x: cx, y, z: BOARD_MM, w: cw, h: BOARD_MM, d: D - BOARD_MM });

  const rail = (cx: number, cw: number, y: number) =>
    boxes.push({
      x: cx, y, z: D * 0.42,
      w: cw, h: 26, d: 26,
      colour: [185, 188, 192],
    });

  /** WHAT HANGS ON THE RAIL, and it is there for a reason rather than for
   * decoration. An empty modelled carcass is a set of white boxes inside a
   * white box: truthful, and almost impossible to read, because every surface
   * takes nearly the same tone and the depth cues cancel out. Something dark
   * hanging in the opening is what gives the eye a back to the box and a scale
   * for the shelf above it â€” which is exactly why every supplied photograph is
   * staged with clothes in it.
   *
   * Deliberately coarse: blocks of muted colour at the pitch of hanging
   * garments, not modelled clothing. At the size this renders, a block reads as
   * a row of coats and anything more detailed reads as noise. */
  const garments = (cx: number, cw: number, railY: number, dropMm: number) => {
    // WITH A SKIN THERE ARE ALREADY CLOTHES ON THIS RAIL â€” the real ones, in
    // the elevation, at the pitch and in the colours the product was
    // photographed with. Modelling a second set only paints flat bars over
    // them, which is what the first pass at this did.
    //
    // They stay for the unskinned case, where they are the only thing standing
    // between a hanging section and an empty white slot.
    if (skinned) return;
    const PITCH = 110;
    const count = Math.max(3, Math.floor(cw / PITCH));
    const gw = (cw - 20) / count;
    for (let i = 0; i < count; i++) {
      const tone = GARMENT_TONES[(i * 5 + 1) % GARMENT_TONES.length];
      // Lengths vary a little, the way a rail of real clothes does â€” a dead
      // level hem is the one thing that gives away a repeated block.
      const drop = dropMm * (0.84 + ((i * 37) % 100) / 100 * 0.16);
      const gx = cx + 10 + i * gw;
      // Depth varies too, so the rail reads as a row of things at slightly
      // different distances rather than one ribbed slab.
      const gz = D * 0.26 + ((i * 53) % 100) / 100 * D * 0.10;

      // THE SHOULDER IS NARROWER THAN THE BODY, which is the whole silhouette
      // of a hung garment and the difference between a rail of clothes and a
      // row of coloured bars. Two boxes is enough to say it at this size.
      boxes.push({
        x: gx + gw * 0.02, y: railY - drop * 0.24, z: gz,
        w: gw * 0.94, h: drop * 0.24, d: 140,
        colour: tone,
      });
      boxes.push({
        x: gx + gw * 0.10, y: railY - drop, z: gz + 6,
        w: gw * 0.78, h: drop * 0.78, d: 128,
        colour: tone,
      });
      // The hanger hook over the rail.
      boxes.push({
        x: gx + gw * 0.46, y: railY - 4, z: D * 0.40,
        w: gw * 0.06, h: 62, d: 14,
        colour: HANDLE,
      });
    }
  };

  const columns = columnsFor(layoutId);
  columns.forEach((column, i) => {
    const cw = inner * column.width;
    if (i < columns.length - 1) {
      boxes.push({ x: x + cw, y: y0, z: 0, w: BOARD_MM, h: innerH, d: D });
    }

    const fill = column.fill;
    if (fill.kind === 'shelves') {
      // count COMPARTMENTS needs count-1 boards: the carcass's own top and
      // bottom close the first and last openings.
      for (let s = 1; s < fill.count; s++) shelf(x, cw, y0 + (innerH / fill.count) * s);
      for (let s = 0; s < fill.count; s++) {
        compartments.push({
          x0: x, x1: x + cw,
          y0: y0 + (innerH / fill.count) * s,
          y1: y0 + (innerH / fill.count) * (s + 1),
          // The lowest opening in a tower gets the shoes, which is where shoes
          // actually go.
          role: s === 0 ? 'floor' : 'shelf',
        });
      }
    } else if (fill.kind === 'hang') {
      const shelfY = y0 + innerH * 0.82;
      shelf(x, cw, shelfY);
      const railY = shelfY - RAIL_DROP_MM;
      garments(x, cw, railY, innerH * 0.56);
      rail(x, cw, railY);
      // The bay under the rail, and the shelf over it.
      compartments.push({ x0: x, x1: x + cw, y0: railY, y1: railY, role: 'hang-long' });
      compartments.push({ x0: x, x1: x + cw, y0: shelfY + BOARD_MM, y1: y0 + innerH, role: 'shelf' });
    } else if (fill.kind === 'hang2') {
      const upper = y0 + innerH * 0.86;
      const mid = y0 + innerH * 0.46;
      shelf(x, cw, upper);
      shelf(x, cw, mid);
      garments(x, cw, upper - RAIL_DROP_MM, innerH * 0.34);
      garments(x, cw, mid - RAIL_DROP_MM, innerH * 0.34);
      rail(x, cw, upper - RAIL_DROP_MM);
      rail(x, cw, mid - RAIL_DROP_MM);
      // Two rails, so two runs of short hanging, and the shelf above the top
      // one. A hanging compartment is recorded at its RAIL â€” the clothes hang
      // from it, so its own height is the asset's business, not the opening's.
      compartments.push({ x0: x, x1: x + cw, y0: mid - RAIL_DROP_MM, y1: mid - RAIL_DROP_MM, role: 'hang-short' });
      compartments.push({ x0: x, x1: x + cw, y0: upper - RAIL_DROP_MM, y1: upper - RAIL_DROP_MM, role: 'hang-short' });
      compartments.push({ x0: x, x1: x + cw, y0: upper + BOARD_MM, y1: y0 + innerH, role: 'shelf' });
    } else {
      // A TOWER, not a rail over drawers. The bank fills the lower half and
      // open shelving stacks above it, which is what every one of these towers
      // is in the photographs.
      const bankH = innerH * 0.46;
      const dh = bankH / fill.count;
      for (let d = 0; d < fill.count; d++) {
        const fy = y0 + d * dh + 4;
        // Fronts stand proud of the carcass, which is what casts the shadow
        // line between one drawer and the next.
        boxes.push({
          x: x + 4, y: fy, z: D - BOARD_MM,
          w: cw - 8, h: dh - 8, d: BOARD_MM,
          tone: 1.02,
        });
        // THE HANDLE. A drawer without one reads as a blank panel, and a bank of
        // blank panels reads as a fridge. It is the one detail at this scale
        // that says "this opens" â€” which is most of what a drawer has to say.
        // Standing proud of the front by its own depth, so it catches the light
        // on top and casts a line underneath.
        const hw = Math.min(cw * 0.42, 320);
        boxes.push({
          x: x + (cw - hw) / 2, y: fy + (dh - 8) * 0.72, z: D,
          w: hw, h: 22, d: 26,
          colour: HANDLE,
        });
      }
      shelf(x, cw, y0 + bankH);
      const above = innerH - bankH;
      for (let sh = 1; sh < fill.shelves; sh++) {
        shelf(x, cw, y0 + bankH + (above / fill.shelves) * sh);
      }
      for (let sh = 0; sh < fill.shelves; sh++) {
        compartments.push({
          x0: x, x1: x + cw,
          y0: y0 + bankH + (above / fill.shelves) * sh,
          y1: y0 + bankH + (above / fill.shelves) * (sh + 1),
          role: 'shelf',
        });
      }
    }

    x += cw + BOARD_MM;
  });

  // THE TRACE IS THE FRONT OF THE WARDROBE, not its back.
  //
  // Everything above is laid out with the back panel at z = 0 and the opening
  // at z = D, which is the natural way to describe a cabinet. But the plane the
  // customer traced is the plane the projector puts z = 0 on, and if that is
  // the back then the whole carcass projects FORWARD out of the outline â€” the
  // front face, the one thing that has to land on the trace, ends up outside it
  // and clipped away. Which is what happened: the hanging section lost its
  // right-hand end to the clip and read as half empty.
  //
  // Shifting the model back by its own depth puts the opening on z = 0 and the
  // back panel at z = -D, so the front lands exactly on the traced quad and
  // everything else recedes behind it â€” which is also just what looking into an
  // open wardrobe is.
  for (const box of boxes) box.z -= WARDROBE_DEPTH_MM;

  return { boxes, compartments };
}

/** Places every content cut-out into the compartment it belongs to.
 *
 * HOW EACH ONE IS ANCHORED. A thing that hangs is placed by its TOP edge, at
 * the rail, because that is the only edge whose position is known â€” how far it
 * drops is the garment's business. A thing that stands is placed by its BOTTOM
 * edge, on the surface under it, for the same reason in reverse. Getting this
 * backwards is what makes a composite look like it is floating.
 *
 * WHAT REPEATS AND WHAT DOES NOT. A rail of shirts fills its bay, so the asset
 * is tiled across the width as many times as fits. A folded stack sits once, in
 * the middle of its shelf. Both are declared on the asset rather than decided
 * here, so a new asset arrives already knowing how it behaves.
 *
 * SORTED BACK TO FRONT among themselves. Contents sit inside compartments the
 * carcass has already drawn, so they only have to be ordered against each
 * other. */
function drawContents(
  ctx: CanvasRenderingContext2D,
  projector: Projector,
  compartments: Compartment[],
  contents: Map<ContentKind, LoadedContent>,
) {
  const forRole = (role: Compartment['role'], index: number): ContentKind => {
    if (role === 'hang-long') return 'hanging-long';
    if (role === 'hang-short') return 'hanging-short';
    if (role === 'floor') return 'shoes';
    // Shelves alternate between folded clothes and a storage box, which is how
    // every one of the product photographs is styled. Keyed off the
    // compartment's own index so a given shelf always shows the same thing
    // rather than reshuffling on each redraw.
    return index % 3 === 1 ? 'box' : 'stack';
  };

  type Placed = {
    item: LoadedContent;
    x0: number; y0: number; x1: number; y1: number; z: number; depth: number;
  };
  const placed: Placed[] = [];

  compartments.forEach((c, i) => {
    const item = contents.get(forRole(c.role, i));
    if (!item) return;

    const z = -WARDROBE_DEPTH_MM * item.asset.depth;
    const openingW = c.x1 - c.x0;
    if (openingW <= 0) return;

    if (item.asset.repeats) {
      // Fill the bay with whole repeats, sharing out the remainder so the run
      // is centred rather than left-aligned with a gap at one end.
      const n = Math.max(1, Math.round(openingW / item.asset.widthMm));
      const w = openingW / n;
      const h = item.heightMm * (w / item.asset.widthMm);
      for (let k = 0; k < n; k++) {
        const x0 = c.x0 + k * w;
        placed.push({
          item, x0, x1: x0 + w, y0: c.y0 - h, y1: c.y0, z,
          depth: projector.depth(x0, c.y0, z),
        });
      }
      return;
    }

    // Stands on the surface below it, centred, and never wider than the opening
    // â€” a 320mm box in a 240mm shelf has to come down to fit.
    const w = Math.min(item.asset.widthMm, openingW * 0.86);
    const h = item.heightMm * (w / item.asset.widthMm);
    const x0 = c.x0 + (openingW - w) / 2;
    const y0 = c.y0 + BOARD_MM;
    placed.push({
      item, x0, x1: x0 + w, y0, y1: y0 + h, z,
      depth: projector.depth(x0, y0, z),
    });
  });

  placed.sort((p, q) => q.depth - p.depth);

  for (const p of placed) {
    drawContentQuad(ctx, p.item.image, [
      [p.x0, p.y0, p.z],
      [p.x1, p.y0, p.z],
      [p.x1, p.y1, p.z],
      [p.x0, p.y1, p.z],
    ], projector);
  }
}

/** One cut-out, warped onto its quad. Subdivided for the same reason as
 * everything else here: Canvas 2D has only affine transforms, and an affine map
 * keeps parallel lines parallel. */
function drawContentQuad(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  model: [number, number, number][],
  projector: Projector,
) {
  const imgW = image.naturalWidth;
  const imgH = image.naturalHeight;
  if (!imgW || !imgH) return;
  const N = 5;
  const at = (s: number, u: number): [number, number, number] => {
    const [c0, c1, c2, c3] = model;
    return [0, 1, 2].map(
      k => (1 - s) * (1 - u) * c0[k] + s * (1 - u) * c1[k] + s * u * c2[k] + (1 - s) * u * c3[k],
    ) as [number, number, number];
  };
  const P: [number, number][][] = [];
  const UV: [number, number][][] = [];
  for (let j = 0; j <= N; j++) {
    const rp: [number, number][] = [];
    const ru: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const [X, Y, Z] = at(i / N, j / N);
      rp.push(projector.project(X, Y, Z));
      // The quad's own parameter space IS the image. The corners are listed
      // bottom-left, bottom-right, top-right, top-left and the bitmap's rows
      // run the other way, so u is flipped.
      ru.push([(i / N) * imgW, (1 - j / N) * imgH]);
    }
    P.push(rp);
    UV.push(ru);
  }
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const v00 = { p: P[j][i], uv: UV[j][i] };
      const v10 = { p: P[j][i + 1], uv: UV[j][i + 1] };
      const v11 = { p: P[j + 1][i + 1], uv: UV[j + 1][i + 1] };
      const v01 = { p: P[j + 1][i], uv: UV[j + 1][i] };
      skinTriangle(ctx, image, v00, v10, v11);
      skinTriangle(ctx, image, v00, v11, v01);
    }
  }
}

/** ONE GRAIN TILE for the whole session. Regenerating it per draw would make
 * the board crawl every time a control moved, which is the sort of thing that
 * reads as a rendering fault rather than as timber. */
let grainCache: HTMLCanvasElement | null = null;
const grainTile = () => (grainCache ??= makeGrainTile(7));

/** Lays the grain tile over one face of the carcass.
 *
 * Mapped through the face's own model corners rather than drawn in screen
 * space, so on an angled wall the figure foreshortens with the panel it is on.
 * The tile is repeated at a fixed size in MILLIMETRES â€” grain does not scale
 * with the cabinet, and a 3000mm wardrobe with the same number of rings across
 * it as an 1800mm one is a giveaway. */
function drawGrainOnFace(
  ctx: CanvasRenderingContext2D,
  tile: HTMLCanvasElement,
  model: [number, number, number][],
  upright: boolean,
  projector: Projector,
) {
  // How much board one tile covers. Roughly a plank's width.
  const TILE_MM = 620;
  const [c0, c1, c2, c3] = model;
  const span = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const wMm = Math.max(1, span(c0, c1));
  const hMm = Math.max(1, span(c1, c2));

  // How many whole tiles the face is worth, capped so a very large panel does
  // not turn into hundreds of draws.
  const repU = Math.max(1, Math.min(8, Math.round(wMm / TILE_MM)));
  const repV = Math.max(1, Math.min(8, Math.round(hMm / TILE_MM)));

  const at = (s: number, u: number): [number, number, number] =>
    [0, 1, 2].map(
      k => (1 - s) * (1 - u) * c0[k] + s * (1 - u) * c1[k] + s * u * c2[k] + (1 - s) * u * c3[k],
    ) as [number, number, number];

  // ONE PASS PER TILE, rather than one pass with wrapped texture coordinates.
  // Wrapping was the first attempt and it silently drew almost nothing: a cell
  // straddling a repeat has its u running backwards, those cells were skipped
  // as degenerate, and with several repeats across a panel that is most of
  // them. The board came out flat, which looked like the grain being too subtle
  // rather than the grain being absent.
  //
  // Walking whole tiles has no seam to straddle. The last tile in each
  // direction may overhang the face; the caller has already clipped to the
  // face's own path, so the overhang costs nothing and needs no special case.
  const N = 3;
  for (let tv = 0; tv < repV; tv++) {
    for (let tu = 0; tu < repU; tu++) {
      const P: [number, number][][] = [];
      const UV: [number, number][][] = [];
      for (let j = 0; j <= N; j++) {
        const rp: [number, number][] = [];
        const ru: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const s = (tu + i / N) / repU;
          const u = (tv + j / N) / repV;
          const [X, Y, Z] = at(s, u);
          rp.push(projector.project(X, Y, Z));
          // The tile's own rings run down it. An upright panel is cut with the
          // grain along its length, a shelf across its width, so a shelf takes
          // the tile turned a quarter — done by swapping the axes rather than
          // by keeping a second tile. The tile is square, so this is free.
          ru.push(
            upright
              ? [(i / N) * tile.width, (j / N) * tile.height]
              : [(j / N) * tile.width, (i / N) * tile.height],
          );
        }
        P.push(rp);
        UV.push(ru);
      }
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N; i++) {
          const v00 = { p: P[j][i], uv: UV[j][i] };
          const v10 = { p: P[j][i + 1], uv: UV[j][i + 1] };
          const v11 = { p: P[j + 1][i + 1], uv: UV[j + 1][i + 1] };
          const v01 = { p: P[j + 1][i], uv: UV[j + 1][i] };
          skinTriangle(ctx, tile, v00, v10, v11);
          skinTriangle(ctx, tile, v00, v11, v01);
        }
    }
  }
}

/** The darkening where the carcass meets the floor. Without it the unit reads
 * as hovering however well it is placed â€” the eye takes the shade at an
 * object's base as the proof that it is standing on something. Drawn along the
 * projected front-bottom edge, so it follows the wall's own perspective rather
 * than sitting level across the picture. */
function drawContactShadow(ctx: CanvasRenderingContext2D, projector: Projector, widthMm: number) {
  const left = projector.project(0, 0, 0);
  const right = projector.project(widthMm, 0, 0);
  const backLeft = projector.project(0, 0, -WARDROBE_DEPTH_MM);
  const backRight = projector.project(widthMm, 0, -WARDROBE_DEPTH_MM);
  const drop = Math.max(
    3,
    Math.hypot(left[0] - backLeft[0], left[1] - backLeft[1]) * 0.10,
  );

  ctx.save();
  ctx.filter = `blur(${drop * 0.6}px)`;
  ctx.beginPath();
  ctx.moveTo(backLeft[0], backLeft[1]);
  ctx.lineTo(backRight[0], backRight[1]);
  ctx.lineTo(right[0], right[1] + drop);
  ctx.lineTo(left[0], left[1] + drop);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fill();
  ctx.restore();
}

/** Muted, and none of them saturated. These sit inside somebody's actual
 * bedroom photograph, so a strong colour would be the loudest thing in the
 * frame and would date the render besides. Charcoals, oatmeals and greys are
 * what the supplied photographs are staged with. */
/** Brushed metal, for handles, hanger hooks and rails. One colour for all
 * three because they are the same finish on a real unit. */
const HANDLE: [number, number, number] = [172, 176, 181];

const GARMENT_TONES: [number, number, number][] = [
  [74, 74, 78],
  [206, 198, 186],
  [120, 118, 116],
  [238, 236, 232],
  [92, 96, 104],
  [168, 158, 144],
];

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

// --- Warping a cut-out onto a quad ----------------------------------------
//
// Canvas 2D has only affine transforms, and an affine map keeps parallel lines
// parallel â€” which is the one thing that must not happen when a surface is
// receding. So a quad is chopped into a grid and each cell drawn with its own
// affine approximation: over a cell a few pixels across the perspective is very
// nearly linear, and the error falls off as the square of the cell size.
//
// Each cell goes down as two triangles, because three points are exactly what
// an affine transform is determined by.

interface SkinVertex {
  p: [number, number];
  uv: [number, number];
}

/** One affine-mapped triangle of the source image. */
function skinTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  v0: SkinVertex,
  v1: SkinVertex,
  v2: SkinVertex,
) {
  const [sx0, sy0] = v0.uv;
  const [sx1, sy1] = v1.uv;
  const [sx2, sy2] = v2.uv;
  const denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
  if (Math.abs(denom) < 1e-9) return;

  // Half a pixel of bleed outward, or the anti-aliased edges of two adjacent
  // cells leave a hairline between them and the surface reads as tiled.
  const cx = (v0.p[0] + v1.p[0] + v2.p[0]) / 3;
  const cy = (v0.p[1] + v1.p[1] + v2.p[1]) / 3;
  const grow = (p: [number, number]): [number, number] => {
    const dx = p[0] - cx;
    const dy = p[1] - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [p[0] + (dx / len) * 0.6, p[1] + (dy / len) * 0.6];
  };
  const [x0, y0] = grow(v0.p);
  const [x1, y1] = grow(v1.p);
  const [x2, y2] = grow(v2.p);

  const m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
  const m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
  const m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
  const m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
  const dx =
    (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
  const dy =
    (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();
  ctx.transform(m11, m12, m21, m22, dx, dy);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

// --- Walk-in: a view through the opening -----------------------------------

function drawWalkIn(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imgW: number,
  imgH: number,
  corners: Point[],
) {
  const xs = corners.map(c => c[0]);
  const ys = corners.map(c => c[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const w = Math.max(...xs) - x;
  const h = Math.max(...ys) - y;
  if (w <= 0 || h <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // COVER, NOT STRETCH. A cabinet takes some distortion and still reads as a
  // cabinet; a room does not â€” the moment its verticals lean it stops looking
  // like somewhere you could walk into, which is all this view has to do.
  const scale = Math.max(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  // Pinned to the bottom: the robe's floor has to meet the bottom of the
  // opening or the visitor is looking into a room that floats.
  ctx.drawImage(image, x + (w - drawW) / 2, y + h - drawH, drawW, drawH);

  // The opening's reveal â€” the band of shade that tells the eye it is looking
  // THROUGH something rather than AT a picture hung on the wall.
  const reveal = Math.max(3, Math.min(w, h) * 0.02);
  const side = (fromX: number, toX: number, rx: number, rw: number) => {
    const g = ctx.createLinearGradient(fromX, 0, toX, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, y, rw, h);
  };
  side(x, x + reveal, x, reveal);
  side(x + w, x + w - reveal, x + w - reveal, reveal);

  const top = ctx.createLinearGradient(0, y, 0, y + reveal * 1.4);
  top.addColorStop(0, 'rgba(0,0,0,0.46)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(x, y, w, reveal * 1.4);

  ctx.restore();
}



