// ---------------------------------------------------------------------------
// THE WARDROBE RENDERER.
//
// BUILT-INS ARE MODELLED, NOT PHOTOGRAPHED. The carcass is built in
// millimetres — 2016 high, 447 deep, the layout's own width — and projected
// onto the wall the customer traced. Trace a square-on wall and it comes out
// square on; trace a wall running away to one side and the side return
// foreshortens, the shelf fronts converge and the rails run to the same
// vanishing point as the room, because the geometry is doing it rather than an
// image being stretched into place.
//
// Same idea as the blind and the curtain — solve in the product's own space,
// put it back on the traced quad — with the one difference that a wardrobe has
// depth, so a flat homography is not enough on its own. See projectorFromQuad.
//
// WHY NOT THE SUPPLIED PHOTOGRAPHS. Each carries one viewpoint, and the ten did
// not agree: some front on, some three-quarter, some looking into a corner. A
// photograph cannot be turned to face a different way afterwards, because the
// faces the camera never saw are not in the file. Modelling removes the
// question — there is no baked viewpoint left to disagree with the room. It
// also ends the keying, since there is no background to cut away.
//
// DRAWN IN 2D, and deliberately. The carcass is a few dozen boxes, which is a
// few hundred flat quads — far below the point where a GPU earns its
// complication, and this way the projection can be the exact one the wall needs
// rather than whatever a perspective camera can be talked into. Faces are
// sorted back to front and filled, which is all the depth ordering a convex
// open box requires.
//
// WALK-INS ARE STILL ARTWORK. 7.0L, 9.0L and 12.0U are rooms rather than
// objects — those renders look INTO the robe at two or three walls receding
// away. Modelling one would mean modelling a room; the honest placement is a
// view through the trace.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { wardrobeArtwork, wardrobeModelById, wardrobeColourHex, wardrobeColour, wardrobeCutoutFor, FINISH_TEXTURE, FINISH_TILE_MM, WARDROBE_HEIGHT_MM, WARDROBE_DEPTH_MM } from './wardrobes';
import { loadAllContents, type ContentKind, type LoadedContent } from './wardrobeContents';
import { projectorFromQuad, columnsFor, tracedWidthMm, BOARD_MM, RAIL_DROP_MM, type Projector } from './wardrobeGeometry';
import { buildSliceMap, sliceMapper, type SliceMap } from './wardrobeSlices';
import { profilePhoto, relightCutout, applyGrain, makeGrainTile, isWoodFinish, sampleBoardColour } from './wardrobeComposite';
import type { Point } from './homography';

export interface WardrobeRendererProps {
  photoUrl: string;
  /** The traced quad in photo pixels, TL TR BR BL. */
  corners: [number, number][];
  modelId: string;
  colourName: string;
  /** Which width in the layout's range to draw. Defaults to the first, which is
   * the width the render was made at. */
  widthMm?: number;
}

export default function Canvas2DWardrobeRenderer({
  photoUrl,
  corners,
  modelId,
  colourName,
  widthMm,
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

      // ONE PATH NOW, AND IT HAS DEPTH.
      //
      // There used to be two: a flat warp of the whole cut-out onto the traced
      // quad, and a modelled carcass for everything the warp could not handle.
      // The warp had the photograph and no depth; the model had depth and flat
      // fills, and the renderer picked between them on the trace's skew.
      //
      // That choice is gone, because it was a false one. The cabinet is always
      // modelled — so the side returns foreshorten, the shelves converge, and a
      // cabinet deeper than its recess stands proud of the wall — and the
      // photograph is projected face by face onto that geometry, so the surface
      // is still the real product. Where the render exists it is used; where it
      // does not, the same geometry draws in board.
      const cut = await wardrobeCutoutFor(model, colourName);
      if (cancelled) return;

      // THE REFERENCE WIDTH IS THE FIRST IN THE LAYOUT'S LIST — the width the
      // photograph was actually taken at, and therefore the one the artwork's
      // own proportions describe. Every other width is reached by slicing.
      const refWidthMm = model.widths[0];

      // THE WIDTH IS THE PRODUCT'S, NOT THE TRACE'S — and this is the whole
      // proportion rule.
      //
      // Height is the one fixed parameter: every unit is 2016, so the traced
      // box's height IS 2016mm and that alone fixes the scale. The cabinet's
      // width is then a property of the layout the customer chose — a 2.9 is a
      // small unit, a 4.9 is not — and it lands as a ratio against that height.
      // A 1800 wide unit is 1800/2016 of the traced height across, whatever
      // shape the box was drawn.
      //
      // SO THE TRACE ONLY SAYS WHERE, and the cabinet is free to be narrower
      // than the box or to overrun it. That is not an error to be corrected: a
      // 2.9 in a wide alcove leaves a gap and a 4.9 in a narrow one does not
      // fit, and showing that is the question the visualiser exists to answer.
      // Taking the width from the trace instead made every layout fill whatever
      // was drawn, which quietly answered "yes it fits" every time.
      const drawWidthMm = widthMm ?? refWidthMm;

      const skin: WardrobeSkin | null = cut
        ? {
            image: cut.image,
            x0: cut.carcass.x0, y0: cut.carcass.y0, x1: cut.carcass.x1, y1: cut.carcass.y1,
            // Sliced rather than stretched, so the fixed modules keep their
            // real width at every cabinet width. See wardrobeSlices.
            slices: buildSliceMap(model.id, refWidthMm, cut.carcass),
          }
        : null;

      // The contents, if they have been supplied yet. Absent, the carcass draws
      // its own modelled blocks instead — see buildCarcass.
      const contents = await loadAllContents();
      // The supplier board for a timber finish, awaited so it is actually there
      // when the carcass is drawn rather than one frame too late.
      const finishImg = await loadFinishTexture(wardrobeColour(colourName).slug);
      if (cancelled) return;
      drawBuiltIn(
        ctx, corners, model.id, drawWidthMm, colourName,
        canvas.width, canvas.height, contents, skin, finishImg,
      );
    };

    render().catch(() => {
      /* photo or artwork failed — leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, modelId, colourName, widthMm, JSON.stringify(corners)]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}

/** The supplied render, plus where the carcass sits inside it — everything the
 * projection needs to wrap the photograph onto modelled board. */
export interface WardrobeSkin {
  /** The supplied render, or the relit copy of it — a canvas once the room's
   * own light has been carried into it, which is why this is not narrowed to
   * an HTMLImageElement. */
  image: CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number };
  /** The carcass box within the file, 0..1, from the cut-out manifest. */
  x0: number; y0: number; x1: number; y1: number;
  /** How the artwork divides into fixed modules and flexible hanging space. */
  slices: SliceMap;
}

/** Composites the cut-out over solid board, so nothing behind it shows through.
 *
 * Cached on the source canvas, because this runs per draw and the relight
 * already cost a full-image pass. */
function flattenSkin(src: HTMLCanvasElement, boardHex: string): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  if (!ctx) return src;
  ctx.fillStyle = boardHex;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, 0, 0);
  return out;
}

/** PROJECTS THE PHOTOGRAPH ONTO ONE MODELLED FACE.
 *
 * The same idea the 3D view uses, done in Canvas 2D: the render is very nearly
 * orthographic and dead front-on, so a point at (x, y) on the cabinet is at
 * (x, y) in the picture. A face's own model corners therefore map straight into
 * the carcass box the manifest records, whichever way that face points.
 *
 * WHICH IS WHY THE ROOM VIEW NO LONGER HAS TO CHOOSE between real depth and a
 * real surface. It used to: the flat warp had the photograph and no depth, the
 * modelled carcass had depth and flat fills. Wrapping the one onto the other
 * gives both, and the side returns — which the camera never saw — take the
 * front face's pixels stretched along the depth axis, exactly as they do when
 * the 3D view is turned.
 *
 * `widthMm` is the cabinet's own width, and `xOffset` where it starts within
 * the traced wall, because the model has already been moved to sit there.
 */
function drawFaceSkin(
  ctx: CanvasRenderingContext2D,
  skin: WardrobeSkin,
  model: [number, number, number][],
  projector: Projector,
  widthMm: number,
  xOffset: number,
  mapU: (xMm: number) => number,
) {
  const iw = skin.image.naturalWidth ?? skin.image.width ?? 0;
  const ih = skin.image.naturalHeight ?? skin.image.height ?? 0;
  if (!iw || !ih || widthMm <= 0) return;

  // PIECEWISE ACROSS THE WIDTH, uniform up the height.
  //
  // The horizontal mapping used to be one linear remap over the whole cabinet,
  // which is the naive stretch: a 507mm tower in an 1800 cabinet sampled
  // 507/1800 of the picture when the tower actually occupies 507/2400 of it, so
  // the drawers were drawn wider than they are. The mapper walks the slice map
  // instead, so a fixed module samples exactly its own pixels whatever cabinet
  // it is in.
  //
  // Height needs none of this — every unit in the range is 2016, so there is
  // nothing to absorb and a straight remap is right.
  const uv = (x: number, y: number): [number, number] => [
    mapU(x - xOffset) * iw,
    (skin.y0 + (1 - y / WARDROBE_HEIGHT_MM) * (skin.y1 - skin.y0)) * ih,
  ];

  const [c0, c1, c2, c3] = model;
  const N = 4;
  const at = (s: number, t: number): [number, number, number] =>
    [0, 1, 2].map(
      k => (1 - s) * (1 - t) * c0[k] + s * (1 - t) * c1[k] + s * t * c2[k] + (1 - s) * t * c3[k],
    ) as [number, number, number];

  const P: [number, number][][] = [];
  const UV: [number, number][][] = [];
  for (let j = 0; j <= N; j++) {
    const rp: [number, number][] = [];
    const ru: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const [X, Y, Z] = at(i / N, j / N);
      rp.push(projector.project(X, Y, Z));
      ru.push(uv(X, Y));
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
      skinTriangle(ctx, skin.image, v00, v10, v11);
      skinTriangle(ctx, skin.image, v00, v11, v01);
    }
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
  /** Overrides the board colour outright — the hanging rails. */
  colour?: [number, number, number];
  /** Brushed metal: shaded along its length rather than filled flat, because a
   * flat grey rectangle reads as painted plastic. */
  metal?: boolean;
  /** STRUCTURAL BOARD — a divider, a shelf, the back panel. Never skinned.
   *
   * The projection maps a point's own (x, y) into the photograph, which is
   * right for the outer frame because the frame is where the photograph's frame
   * is. It is wrong for everything INSIDE, because the modelled interior and
   * the photographed interior are not the same interior: the model puts a
   * divider where the layout says, the photograph has one where the cabinet
   * that was shot had one, and the hanging bays between them stretch. So a
   * modelled divider samples whatever the stretched picture happens to put at
   * its x — which is garments, drawn across the divider.
   *
   * And the cost of not skinning it is nothing, because the board is board: on
   * the white finish it is white either way, and what makes the interior look
   * real is the contents, which are their own cut-outs standing in front of it.
   */
  plain?: boolean;
  /** THE BACK PANEL, and it is called out because it is the one face the
   * photograph must NOT be projected onto.
   *
   * Everything hanging in the cabinet — the rail, the hangers, the coats — is
   * in front of this panel, so a projection along the view axis lands all of it
   * here. Skin the back panel and the picture's own rail and clothes get
   * painted flat onto it, behind the modelled rail and the upright content
   * planes: two rails, two sets of coats, one of each in the wrong place. That
   * is the exact failure the old renderer hit when it mapped the whole
   * elevation onto the frame.
   *
   * Left as plain board, it becomes what it should be — the surface BEHIND the
   * clothes — and the contents stand in front of it at their own depth. */
  back?: boolean;
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
const INTERIOR_FALLOFF = 0.23;

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
  skin: WardrobeSkin | null,
  finishImg: HTMLImageElement | null,
) {
  // Null when this layout cannot be built at this width — the fixed modules
  // alone would not fit. The carcass still draws in board rather than the page
  // showing nothing; see MIN_FLEX_MM.
  const mapU = skin ? sliceMapper(skin.slices, widthMm) : null;
  // THE TRACE IS THE WALL, NOT THE WARDROBE.
  //
  // It used to be solved as the wardrobe: the model rectangle handed to the
  // homography was the product's own width by its own height, so the cabinet
  // was stretched to fill whatever box was dragged. Trace a tall narrow slot
  // and a 3000-wide wardrobe squeezed into it; trace a wide one and the same
  // wardrobe sprawled. The product changed shape to suit the drawing, which is
  // exactly backwards — a wardrobe has a size, and the question is whether it
  // fits.
  //
  // Now the traced box is read as a piece of WALL. Its height is 2016mm because
  // that is what the range is, and that fixes millimetres-per-pixel; its own
  // width-to-height ratio then says how wide a piece of wall it is. The cabinet
  // is drawn inside that at its true size, so a 3000 in a 2400 opening
  // visibly does not fit — which is the answer the customer actually needs.
  const wallWidthMm = tracedWidthMm(corners, WARDROBE_HEIGHT_MM);
  const projector = projectorFromQuad(corners, wallWidthMm, WARDROBE_HEIGHT_MM, imageW, imageH);
  if (!projector) return;


  // MEASURED BEFORE ANYTHING IS DRAWN, or the wardrobe gets sampled as though
  // it were the wall it is standing on.
  const profile = profilePhoto(ctx, corners, imageW, imageH);

  // The render is studio-lit and the room is not, so the photograph's own
  // illuminant is carried into the artwork before a pixel of it is projected.
  // Doing it once here rather than per face is what keeps it affordable: the
  // carcass is a few hundred faces and this is a full-image pass.
  //
  // AND THEN MADE OPAQUE, which is not optional. The cut-out has a real alpha
  // channel — the whole open front of the cabinet is transparent, because on
  // the real product you are looking through it. Projected onto a solid face
  // that transparency lets the ROOM through, and the wardrobe came out a ghost
  // with the window visible behind its own back panel. Those pixels are the
  // back panel showing through the opening, and the back panel is board, so
  // they are composited over the finish and come back as the surface they were
  // always showing. Same fix, same reason, as the 3D view's flattenOntoBoard.
  const litSkin: WardrobeSkin | null = skin
    ? { ...skin, image: flattenSkin(relightCutout(skin.image, profile), wardrobeColourHex(colourName)) }
    : null;

  // Taken from the artwork where there is any, so the faces the projection
  // cannot reach are painted the same white as the ones it can. Painting them
  // from the swatch hex instead left the shelf interiors and the back panel
  // reading grey against a photographic white front.
  const base =
    (litSkin ? sampleBoardColour(litSkin.image) : null) ??
    hexToRgb(wardrobeColourHex(colourName));
  const { boxes, compartments } = buildCarcass(layoutId, widthMm, contents.size > 0);

  // Centred in the traced wall. Left-aligning would be arbitrary, and centring
  // is what someone standing in the room would do with a cabinet narrower than
  // the alcove they are putting it in.
  const xOffset = (wallWidthMm - widthMm) / 2;

  // DEPTH IS NOT A VARIABLE. Every unit is 500 deep and built into its opening,
  // so the cabinet's front sits on the traced plane and the rest recedes behind
  // it — which is exactly where buildCarcass already puts it. There was briefly
  // a control for the opening's depth, on the reasoning that a shallower alcove
  // would push the cabinet out into the room; the premise was wrong, and a
  // slider whose answer is always 500 is a question not worth asking.
  for (const box of boxes) box.x += xOffset;
  for (const c of compartments) {
    c.x0 += xOffset;
    c.x1 += xOffset;
  }

  // Built once per draw and reused across every face, because a fresh tile per
  // face would put a visible seam at each joint.
  // THE SUPPLIER'S OWN BOARD where it has loaded, invented grain until it does.
  // A photograph of Antico Oak carries its knots and splits; a procedural tile
  // carries a plausible rhythm and no knots, which is the difference between
  // timber and wallpaper.
  const wood = isWoodFinish(wardrobeColour(colourName).slug);
  const grain = wood && !finishImg ? grainTile() : null;

  // Every face of every box, sorted back to front. A painter's sort is enough
  // here: the carcass is a set of boxes that do not interpenetrate, so no two
  // faces can need splitting.
  type Face = {
    pts: [number, number][];
    depth: number;
    /** Tone at the face's nearest and furthest corner, and where those land on
     * screen — enough to shade the face across itself rather than flat. */
    near: [number, number];
    far: [number, number];
    toneNear: number;
    toneFar: number;
    rgb: [number, number, number];
    /** The face's own corners in model millimetres, for projecting the skin. */
    model: [number, number, number][];
    /** True where this face is carcass board rather than a garment block, a
     * rail or a handle — the only surfaces timber grain belongs on. */
    board: boolean;
    /** Whether the grain runs up the face or across it. An upright panel is
     * cut with the grain running its length and a shelf across its width, and
     * getting that wrong is more obvious than having no grain at all. */
    grainUpright: boolean;
    /** True on every face made of board — the ones a timber finish covers. Wider
     * than oard, which is only the faces the PHOTOGRAPH can be projected
     * onto: a wood texture tiles in the face own coordinates, so it goes on the
     * side returns and shelf tops too. */
    timber: boolean;
    /** True on the handles, rails and hanger hooks — the brushed metal, which
     * is shaded along its length rather than filled flat. */
    metal: boolean;
    /** True for the faces pointing at the room — the only ones an elevation
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
      // A face spanning the full 447mm — a side panel, a shelf — runs from full
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

      // EASED WHERE THERE IS A PHOTOGRAPH, but not flattened.
      //
      // These values were set for a carcass drawn entirely in flat fills, and
      // beside a projected photograph they were too strong — the unskinned
      // faces read as grey panels let into a white cabinet. The first fix took
      // them almost to flat, at 0.34, and that traded one fault for a worse
      // one: with every face the same brightness nothing said the back panel
      // was 500mm behind the drawer fronts, so the cabinet lost its depth
      // entirely and the fronts looked translucent.
      //
      // The grey panels were never really the tone's fault anyway — they were
      // the swatch hex disagreeing with the photograph's white, which
      // sampleBoardColour now settles. So the shading can do its job again.
      const toneStrength = litSkin ? 0.62 : 1;
      const flat = (1 - (1 - FACE_TONE[name]) * toneStrength) * (box.tone ?? 1);
      const shade = (z: number) =>
        // DEPTH IS NOT EASED WITH THE REST. How far back a surface is, is the
        // one cue that has to survive: it is what says the hanging bay's board
        // is half a metre behind the drawer fronts standing at the opening.
        // Easing this along with the face tones is what made the fronts look
        // see-through.
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
        // plane of the frame — flat, in front of the geometry, which is what it
        // looked like. The board is board, so the finish swap works on it, and
        // the photograph supplies only what is standing INSIDE. See the content
        // quads below.
        skinnable: false,
        // A box with its own colour is a rail, a handle or a garment; only the
        // ones taking the finish are board. The back panel is board but is
        // deliberately never skinned — see Box.back.
        // ONLY A FACE THAT SPANS BOTH X AND Y can take the projection. The
        // mapping reads a point's own (x, y), so a face at one constant Y — a
        // shelf top, the carcass top — samples a single row of pixels and
        // smears it along the depth, and a face at constant X samples a single
        // column. Board is the same colour without the streak.
        board:
          !box.colour &&
          !box.back &&
          !box.plain &&
          name !== 'top' && name !== 'bottom' && name !== 'left' && name !== 'right',
        grainUpright: box.h >= box.w,
        timber: !box.colour,
        metal: !!box.metal,
      });
    }
  }

  // Larger depth is further away, so those go down first.
  faces.sort((a, b) => b.depth - a.depth);

  ctx.save();
  // NOT CLIPPED TO THE TRACE. The cabinet is built into its opening, so its
  // front lands on the traced plane and everything else recedes behind it —
  // but a wall photographed at an angle shows its side return, and that return
  // projects OUTSIDE the traced quad by design. Clipping to the quad cut it
  // off, which is what made an angled cabinet look posted through a letterbox.
  //
  // The geometry is what keeps it honest instead: nothing is drawn that the
  // model does not put there.

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

    // METAL IS NOT A FLAT FILL, and the handles and rails were being drawn as
    // one — a grey rectangle, which reads as painted plastic.
    //
    // What makes brushed aluminium look like metal is that it is ANISOTROPIC:
    // it gathers light into a band along its length and falls away sharply
    // either side, so a round bar has a bright line up its middle and dark
    // edges. That gradient across the short axis is most of the effect, and it
    // costs one extra gradient.
    //
    // A photograph of a handle would not do this job: it would have to stretch
    // to whatever length the drawer is, which is the same fault the board
    // slicing exists to avoid, and it would carry its own lighting into a
    // cabinet lit from somewhere else.
    if (face.metal) {
      const [p0, p1, p2, p3] = face.pts;
      // Across the shorter pair of edges — the way the highlight runs.
      const d01 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const d12 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const a = d01 < d12
        ? [(p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2]
        : [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      const b = d01 < d12
        ? [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]
        : [(p3[0] + p2[0]) / 2, (p3[1] + p2[1]) / 2];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 1) {
        const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        g.addColorStop(0, toRgb(face.rgb, face.toneNear * 0.62));
        g.addColorStop(0.34, toRgb(face.rgb, face.toneNear * 1.18));
        g.addColorStop(0.52, toRgb(face.rgb, face.toneNear * 1.32));
        g.addColorStop(0.72, toRgb(face.rgb, face.toneNear * 0.94));
        g.addColorStop(1, toRgb(face.rgb, face.toneNear * 0.58));
        paint = g;
      }
    }
    // Board underneath, always — it fills the alpha the render has where the
    // opening used to be, and it is the whole surface on the three timber
    // finishes that were never photographed.
    ctx.fillStyle = paint;
    ctx.fill();

    // THE PHOTOGRAPH ON TOP, where there is one.
    //
    // An earlier version banned this outright, and the comment it left behind
    // said projecting an elevation "puts the picture's own shelves and clothes
    // on the plane of the frame, flat and in front of the geometry". That was
    // true of the thing it was describing — the whole sticker stretched across
    // the traced quad as ONE plane.
    //
    // It is not true of this. The projection is per FACE, onto geometry that
    // already has the right depth, so the photographed shelf lands on the
    // modelled shelf and the side return gets the pixels running off its own
    // edge. Nothing is flattened, because nothing is being drawn on a single
    // plane any more.
    if (litSkin && mapU && face.board) {
      ctx.save();
      ctx.clip();
      drawFaceSkin(ctx, litSkin, face.model, projector, widthMm, xOffset, mapU);
      ctx.restore();
    }
    // A hairline over the fill closes the seams that anti-aliasing opens
    // between two quads meeting edge to edge.
    ctx.strokeStyle = nearFill;
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // THE FIGURE, on timber finishes only. Multiplied over board that has
    // already been shaded, so it darkens the grain without disturbing the
    // modelled lighting — and clipped to the face that was just filled, so it
    // follows that face's own perspective rather than lying flat across the
    // picture.
    // ON EVERY BOARD FACE, not only the room-facing ones. The photographic skin
    // has to skip the side returns and the shelf tops because the projection
    // smears there; a board texture does not, because it is tiled onto the face
    // in the face's own coordinates rather than sampled through a fixed axis.
    // A shelf whose front edge is timber and whose top is flat brown is the
    // giveaway, so the wood goes on all of it.
    if ((finishImg || grain) && face.timber) {
      ctx.save();
      ctx.clip();
      if (finishImg) {
        // Drawn as colour, not multiplied: the photograph IS the board, so it
        // replaces the fill rather than shading it. The fill underneath still
        // matters — it shows through wherever the tile does not quite reach.
        ctx.globalAlpha = 1;
        drawBoardOnFace(ctx, finishImg, face.model, face.grainUpright, projector, face.toneNear);
      } else {
        ctx.globalCompositeOperation = 'multiply';
        drawGrainOnFace(ctx, grain!, face.model, face.grainUpright, projector);
      }
      ctx.restore();
    }
  }

  // AMBIENT OCCLUSION IN THE OPENINGS, before anything is stood in them.
  //
  // The 3D view gets this from a real shadow map. Canvas 2D has no such thing,
  // and without it an open carcass is evenly lit board with nothing saying one
  // shelf is in front of another — the interior reads as a diagram of a
  // wardrobe rather than the inside of one.
  //
  // What it approximates is the light a compartment does NOT receive: the shelf
  // above throws the deepest shade, so each opening is darkest under its own
  // lid and lightens toward the front lip.
  drawCompartmentShade(ctx, projector, compartments);

  // WHAT IS STANDING IN THE WARDROBE, drawn after the carcass so it sits inside
  // the openings the carcass has already framed.
  if (contents.size) {
    drawContents(ctx, projector, compartments, contents);
  }

  // Balances the save() that set the opening's clip. It was missing, which left
  // a clip and a saved state on the context after every draw.
  ctx.restore();

  drawContactShadow(ctx, projector, widthMm, xOffset);

  // GRAIN LAST, and only over what was drawn.
  //
  // The render arrived noiseless and the photograph did not, so the cabinet is
  // the one region of the frame with no sensor noise in it — a hole in the
  // picture that the eye finds before it finds anything about the perspective.
  // Bounded to the carcass's own projected extent rather than the whole canvas,
  // because grain over the photograph would be grain on top of its own.
  const gx: number[] = [];
  const gy: number[] = [];
  for (const face of faces) for (const p of face.pts) { gx.push(p[0]); gy.push(p[1]); }
  if (gx.length) {
    const pad = 4;
    applyGrain(
      ctx,
      {
        x: Math.min(...gx) - pad,
        y: Math.min(...gy) - pad,
        w: Math.max(...gx) - Math.min(...gx) + pad * 2,
        h: Math.max(...gy) - Math.min(...gy) + pad * 2,
      },
      profile.grain,
    );
  }
}

/** The carcass as a list of boxes, in millimetres, with the opening's
 * bottom-left at the origin: X right along the wall, Y up, Z out of the wall
 * toward the room.
 *
 * OPEN-FRONTED, which is what the Forma range is — every supplied photograph
 * shows shelves and hanging with no doors on. That is also what makes the
 * modelling worth doing: with an open front you see straight into the carcass,
 * so the side returns, the shelf edges and the back panel are all on show, and
 * those receding surfaces are what tell the eye how deep it is. */
/** A compartment's opening, in model millimetres — the rectangle you would
 * reach through. What goes IN it comes from the photograph. */
export interface Compartment {
  x0: number; y0: number; x1: number; y1: number;
  /** What belongs in it. The layout knows this — a bay under a rail takes
   * hanging clothes, a shelf opening takes a stack or a box — so the renderer
   * does not have to guess from the geometry. */
  role: 'shelf' | 'hang-long' | 'hang-short' | 'floor' | 'bay';
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
  // cupboard, and at the same tone as the front frame the box has no inside —
  // which is what made the first render read as a white slab on the wall. It is
  // the largest surface in the opening, though, so it sets the colour of the
  // whole thing: too dark and a white wardrobe reads grey, which is what 0.66
  // did.
  boxes.push({ x: 0, y: 0, z: 0, w: widthMm, h: H, d: BOARD_MM, tone: 0.95, back: true });
  boxes.push({ x: 0, y: 0, z: 0, w: BOARD_MM, h: H, d: D });
  boxes.push({ x: widthMm - BOARD_MM, y: 0, z: 0, w: BOARD_MM, h: H, d: D });
  boxes.push({ x: 0, y: H - BOARD_MM, z: 0, w: widthMm, h: BOARD_MM, d: D });
  boxes.push({ x: 0, y: 0, z: 0, w: widthMm, h: BOARD_MM, d: D });

  // The usable width is columnsFor's business now that columns are resolved in
  // millimetres rather than as fractions of it.
  const innerH = H - 2 * BOARD_MM;
  const y0 = BOARD_MM;
  let x = BOARD_MM;

  const shelf = (cx: number, cw: number, y: number) =>
    boxes.push({ x: cx, y, z: BOARD_MM, w: cw, h: BOARD_MM, d: D - BOARD_MM, plain: true });

  const rail = (cx: number, cw: number, y: number) =>
    boxes.push({
      x: cx, y, z: D * 0.42,
      w: cw, h: 26, d: 26,
      colour: [185, 188, 192],
      metal: true,
    });

  /** WHAT HANGS ON THE RAIL, and it is there for a reason rather than for
   * decoration. An empty modelled carcass is a set of white boxes inside a
   * white box: truthful, and almost impossible to read, because every surface
   * takes nearly the same tone and the depth cues cancel out. Something dark
   * hanging in the opening is what gives the eye a back to the box and a scale
   * for the shelf above it — which is exactly why every supplied photograph is
   * staged with clothes in it.
   *
   * Deliberately coarse: blocks of muted colour at the pitch of hanging
   * garments, not modelled clothing. At the size this renders, a block reads as
   * a row of coats and anything more detailed reads as noise. */
  const garments = (cx: number, cw: number, railY: number, dropMm: number) => {
    // WITH A SKIN THERE ARE ALREADY CLOTHES ON THIS RAIL — the real ones, in
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
      // Lengths vary a little, the way a rail of real clothes does — a dead
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
        metal: true,
      });
    }
  };

  // Resolved in millimetres, not as fractions of the cabinet: a drawer tower is
  // 507 wide in every layout in the range, and only the bays either side of it
  // take up the slack. See MODULE_WIDTH_MM.
  const columns = columnsFor(layoutId, widthMm);
  columns.forEach((column, i) => {
    const cw = column.widthMm;
    if (i < columns.length - 1) {
      boxes.push({ x: x + cw, y: y0, z: 0, w: BOARD_MM, h: innerH, d: D, plain: true });
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
      // THE OPEN BAY ITSELF, recorded so it can be shaded. A hanging
      // compartment is filed at its RAIL with no height, because that is all
      // the contents need — but it leaves the biggest opening in the cabinet
      // with nothing describing it, so the ambient pass skipped it and the bay
      // came out as flat lit board.
      compartments.push({ x0: x, x1: x + cw, y0, y1: railY, role: 'bay' });
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
      // one. A hanging compartment is recorded at its RAIL — the clothes hang
      // from it, so its own height is the asset's business, not the opening's.
      compartments.push({ x0: x, x1: x + cw, y0: mid - RAIL_DROP_MM, y1: mid - RAIL_DROP_MM, role: 'hang-short' });
      compartments.push({ x0: x, x1: x + cw, y0: upper - RAIL_DROP_MM, y1: upper - RAIL_DROP_MM, role: 'hang-short' });
      // The two open bays under those rails — see the note on 'bay' above.
      compartments.push({ x0: x, x1: x + cw, y0, y1: mid - RAIL_DROP_MM, role: 'bay' });
      compartments.push({ x0: x, x1: x + cw, y0: mid + BOARD_MM, y1: upper - RAIL_DROP_MM, role: 'bay' });
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
        // that says "this opens" — which is most of what a drawer has to say.
        // Standing proud of the front by its own depth, so it catches the light
        // on top and casts a line underneath.
        const hw = Math.min(cw * 0.42, 320);
        boxes.push({
          x: x + (cw - hw) / 2, y: fy + (dh - 8) * 0.72, z: D,
          w: hw, h: 22, d: 26,
          colour: HANDLE,
          metal: true,
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
  // the back then the whole carcass projects FORWARD out of the outline — the
  // front face, the one thing that has to land on the trace, ends up outside it
  // and clipped away. Which is what happened: the hanging section lost its
  // right-hand end to the clip and read as half empty.
  //
  // Shifting the model back by its own depth puts the opening on z = 0 and the
  // back panel at z = -D, so the front lands exactly on the traced quad and
  // everything else recedes behind it — which is also just what looking into an
  // open wardrobe is.
  for (const box of boxes) box.z -= WARDROBE_DEPTH_MM;

  return { boxes, compartments };
}

/** Places every content cut-out into the compartment it belongs to.
 *
 * HOW EACH ONE IS ANCHORED. A thing that hangs is placed by its TOP edge, at
 * the rail, because that is the only edge whose position is known — how far it
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
  const forRole = (role: Compartment['role'], index: number): ContentKind | null => {
    // 'bay' exists only so the open hanging space can be shaded. Its clothes
    // are placed from the RAIL compartment that sits inside it, so putting
    // anything here would hang a second set in the same opening.
    if (role === 'bay') return null;
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
    const kind = forRole(c.role, i);
    if (!kind) return;
    const item = contents.get(kind);
    if (!item) return;

    const z = -WARDROBE_DEPTH_MM * item.asset.depth;
    const openingW = c.x1 - c.x0;
    if (openingW <= 0) return;

    if (item.asset.repeats) {
      // THE GARMENTS KEEP THEIR REAL SIZE; THE COUNT CHANGES.
      //
      // This used to divide the bay into n equal parts and stretch a run of
      // clothes to fill each, so a narrow bay got the same number of garments
      // drawn narrower and a wide one the same number drawn wider. The clothes
      // resized instead of thinning out — which is not what happens when you
      // put a smaller wardrobe in a room. A coat is a coat.
      //
      // So the run is a whole number of real-sized garments, centred, with the
      // remainder left as air at the ends of the rail.
      const n = Math.max(1, Math.floor(openingW / item.asset.widthMm));
      const w = item.asset.widthMm;
      const runW = n * w;
      const pad = (openingW - runW) / 2;
      const h = item.heightMm;
      for (let k = 0; k < n; k++) {
        const x0 = c.x0 + pad + k * w;
        placed.push({
          item, x0, x1: x0 + w, y0: c.y0 - h, y1: c.y0, z,
          depth: projector.depth(x0, c.y0, z),
        });
      }
      return;
    }

    // Stands on the surface below it, centred, and never wider than the opening
    // — a 320mm box in a 240mm shelf has to come down to fit.
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

/** THE BOARD PHOTOGRAPH for a timber finish.
 *
 * AWAITED, not polled. The first version returned null while the image
 * decoded and cached it in onload, on the assumption that the next draw would
 * pick it up — but there is no next draw. The effect runs once per state
 * change, so the cabinet was rendered with the procedural fallback and then
 * left there, and the supplier's board never appeared at all.
 *
 * Resolves null on a missing file, so a finish with no texture yet still draws
 * as coloured board rather than failing the render. */
const finishCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadFinishTexture(slug: string): Promise<HTMLImageElement | null> {
  const hit = finishCache.get(slug);
  if (hit) return hit;
  const src = FINISH_TEXTURE[slug];
  if (!src) return Promise.resolve(null);
  const job = new Promise<HTMLImageElement | null>(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  finishCache.set(slug, job);
  return job;
}

let grainCache: HTMLCanvasElement | null = null;
const grainTile = () => (grainCache ??= makeGrainTile(7));

/** Lays the supplier's board photograph over one face of the carcass.
 *
 * TILED AT REAL SIZE, in millimetres, so the grain is the size grain is. The
 * texture covers a known piece of board (FINISH_TILE_MM), so a 2016mm panel
 * gets a bit over one repeat up its height whatever cabinet it is in, and a
 * 3000mm one gets three across rather than one stretched.
 *
 * SHADED BY THE FACE'S OWN TONE, because the photograph is of a board lying
 * flat under even light and the face it lands on may be a side return in shade.
 * Without this every surface of the cabinet comes out the same brightness and
 * the box loses its corners.
 */
function drawBoardOnFace(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  model: [number, number, number][],
  upright: boolean,
  projector: Projector,
  tone: number,
) {
  const [c0, c1, c2, c3] = model;
  const span = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const wMm = Math.max(1, span(c0, c1));
  const hMm = Math.max(1, span(c1, c2));

  // Grain runs the length of a panel: up an upright, along a shelf. The tile is
  // cut with its grain vertical, so a shelf takes it turned a quarter.
  const tileW = upright ? FINISH_TILE_MM.w : FINISH_TILE_MM.h;
  const tileH = upright ? FINISH_TILE_MM.h : FINISH_TILE_MM.w;
  const repU = Math.max(1, Math.min(10, Math.round(wMm / tileW)));
  const repV = Math.max(1, Math.min(10, Math.round(hMm / tileH)));

  const at = (s: number, u: number): [number, number, number] =>
    [0, 1, 2].map(
      k => (1 - s) * (1 - u) * c0[k] + s * (1 - u) * c1[k] + s * u * c2[k] + (1 - s) * u * c3[k],
    ) as [number, number, number];

  const N = 3;
  for (let tv = 0; tv < repV; tv++) {
    for (let tu = 0; tu < repU; tu++) {
      const P: [number, number][][] = [];
      const UV: [number, number][][] = [];
      for (let j = 0; j <= N; j++) {
        const rp: [number, number][] = [];
        const ru: [number, number][] = [];
        for (let i = 0; i <= N; i++) {
          const [X, Y, Z] = at((tu + i / N) / repU, (tv + j / N) / repV);
          rp.push(projector.project(X, Y, Z));
          // MIRRORED on alternate tiles, which is how a seam is avoided without
          // a seamless texture — and how real veneer is book-matched anyway, so
          // the symmetry reads as joinery rather than as a repeat.
          const fu = tu % 2 ? 1 - i / N : i / N;
          const fv = tv % 2 ? 1 - j / N : j / N;
          ru.push(
            upright
              ? [fu * img.naturalWidth, fv * img.naturalHeight]
              : [fv * img.naturalWidth, fu * img.naturalHeight],
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
          skinTriangle(ctx, img, v00, v10, v11);
          skinTriangle(ctx, img, v00, v11, v01);
        }
    }
  }

  // The face's own shade, laid over the board it was just given. The clip path
  // is still current, so this fills exactly the face and nothing else.
  if (tone < 0.995) {
    ctx.fillStyle = `rgba(0,0,0,${((1 - tone) * 0.9).toFixed(3)})`;
    ctx.fill();
  }
}

/** Lays the grain tile over one face of the carcass.
 *
 * Mapped through the face's own model corners rather than drawn in screen
 * space, so on an angled wall the figure foreshortens with the panel it is on.
 * The tile is repeated at a fixed size in MILLIMETRES — grain does not scale
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

/** THE SHADE INSIDE EACH OPENING.
 *
 * Drawn on the BACK PANEL rather than across the opening's mouth, because that
 * is the surface the missing light would have fallen on — shading the mouth
 * would darken the clothes hanging in front of it too, which is the opposite of
 * what an occluded background does.
 *
 * Strongest under the shelf above and fading down, with a lighter wash up from
 * the base. Kept well short of black: a bedroom cupboard with the doors off is
 * dim inside, not a cave, and the whole point is to seat the contents rather
 * than to be seen as an effect.
 */
function drawCompartmentShade(
  ctx: CanvasRenderingContext2D,
  projector: Projector,
  compartments: Compartment[],
) {
  const zBack = -WARDROBE_DEPTH_MM + BOARD_MM;
  for (const c of compartments) {
    // A hanging compartment is recorded at its rail, with no height of its own,
    // so there is no opening to shade — the garments are the occluder there.
    const h = c.y1 - c.y0;
    if (h <= 1 || c.x1 - c.x0 <= 1) continue;

    const tl = projector.project(c.x0, c.y1, zBack);
    const tr = projector.project(c.x1, c.y1, zBack);
    const br = projector.project(c.x1, c.y0, zBack);
    const bl = projector.project(c.x0, c.y0, zBack);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.closePath();
    ctx.clip();

    const topMid: [number, number] = [(tl[0] + tr[0]) / 2, (tl[1] + tr[1]) / 2];
    const botMid: [number, number] = [(bl[0] + br[0]) / 2, (bl[1] + br[1]) / 2];
    const g = ctx.createLinearGradient(topMid[0], topMid[1], botMid[0], botMid[1]);
    g.addColorStop(0, 'rgba(0,0,0,0.30)');
    g.addColorStop(0.45, 'rgba(0,0,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
}

/** The darkening where the carcass meets the floor. Without it the unit reads
 * as hovering however well it is placed — the eye takes the shade at an
 * object's base as the proof that it is standing on something. Drawn along the
 * projected front-bottom edge, so it follows the wall's own perspective rather
 * than sitting level across the picture. */
function drawContactShadow(
  ctx: CanvasRenderingContext2D,
  projector: Projector,
  widthMm: number,
  xOffset: number,
) {
  // Along the cabinet's own base, wherever it was placed in the traced wall —
  // not along the wall's full width, which is what put a shadow under thin air
  // either side of a cabinet narrower than its opening.
  const x0 = xOffset;
  const x1 = xOffset + widthMm;
  const left = projector.project(x0, 0, 0);
  const right = projector.project(x1, 0, 0);
  const backLeft = projector.project(x0, 0, -WARDROBE_DEPTH_MM);
  const backRight = projector.project(x1, 0, -WARDROBE_DEPTH_MM);
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
// parallel — which is the one thing that must not happen when a surface is
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
  // cabinet; a room does not — the moment its verticals lean it stops looking
  // like somewhere you could walk into, which is all this view has to do.
  const scale = Math.max(w / imgW, h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  // Pinned to the bottom: the robe's floor has to meet the bottom of the
  // opening or the visitor is looking into a room that floats.
  ctx.drawImage(image, x + (w - drawW) / 2, y + h - drawH, drawW, drawH);

  // The opening's reveal — the band of shade that tells the eye it is looking
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



