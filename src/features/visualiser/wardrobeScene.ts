// ---------------------------------------------------------------------------
// ONE CABINET, TWO CAMERAS.
//
// This is the wardrobe as a three.js scene, and it exists because the two views
// had drifted into being two different renderers of the same product. The
// turntable was built in three.js — real shadows, a real environment for the
// metal to reflect, physically-based board — and the room view was a painter's
// algorithm in Canvas 2D that approximated all three by hand. It was a good
// approximation and it was never going to catch up: a painter's sort cannot
// cast a shadow, and a flat fill cannot reflect anything.
//
// So the scene is built once, here, and the two views differ only in where the
// camera stands. The turntable orbits it; the room view solves a camera from
// the traced quad and composites the result onto the photograph. Everything
// that made the turntable look right now happens in the room too, for free, and
// a change to the cabinet cannot make one view disagree with the other.
// ---------------------------------------------------------------------------

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import { buildCarcass } from './Canvas2DWardrobeRenderer';
import {
  FINISH_TEXTURE, FINISH_TILE_MM,
  wardrobeColour, wardrobeColourHex, wardrobeModelById, DEFAULT_WIDTH_MM,
  wardrobeHeight, wardrobeDepth,
} from './wardrobes';
import { cutoutFor } from './wardrobeCutouts';
import { buildSliceMap, sliceMapper } from './wardrobeSlices';
import { sampleBoardColour } from './wardrobeComposite';
import { makeWhiteBoardMaps, WHITE_TILE_MM } from './whiteBoardTexture';
import { DEFAULT_HANDLE_FINISH, handleFinish, hardwareSpec } from './wardrobeHardware';
import { DEFAULT_WALL_COLOUR } from './wallColours';

/** Millimetres to metres, so the scene is in real units and a shadow camera
 * sized in metres means something. */
export const MM = 0.001;

/** How thick the wall the robe is built into is, millimetres.
 *
 * 90 is a 70mm stud with 10mm lining either side, which is the ordinary
 * internal wall these are fitted to. It matters because it IS the reveal: this
 * number is the depth of the return you see around the opening, and it is the
 * whole of what makes the render read as a hole in a wall rather than a white
 * frame laid on one. Below about 50 it stops reading; much above 120 and the
 * opening starts to look like a serving hatch. */
const WALL_THICKNESS_MM = 90;

/** HOW TALL THE OPENING IS, which is not how tall the wardrobe is.
 *
 * The recess was being cut to exactly 2016 — the height of the unit — so the
 * robe filled its hole to the millimetre and the head of the opening sat on top
 * of the shelf like a lid. Nothing in a house is built that way. A robe goes
 * into a reveal that runs to the ceiling, and what you actually see above it is
 * a band of empty recess: the bulkhead, or the wall carrying on up.
 *
 * 2700 is the ordinary Australian ceiling, and it is the top of the range a
 * normal house is built to — 2400 is the older standard and 2550 to 2700 is
 * what is put in now. It leaves about 680mm of open reveal over a 2016 unit,
 * which is the gap the supplier's own photographs show.
 *
 * It is deliberately NOT a configurable: the visualiser's whole scale anchor is
 * the 2016 unit height, and a ceiling the customer can drag would be a second
 * dimension to get wrong for no gain. This is the room the render is set in. */
export const OPENING_HEIGHT_MM = 2700;

export interface WardrobeSceneOpts {
  renderer: THREE.WebGLRenderer;
  modelId: string;
  colourName: string;
  /** The cabinet's own width. Height and depth are fixed for the range. */
  widthMm: number;
  /** Accepted and unused: the scene is identical either way now that the
   * room-only shadow catcher is gone. Kept so the two call sites read the same
   * and the distinction is easy to reintroduce if a wall shadow is ever done
   * properly — as its own render pass, not a transparent plane in this one. */
  forRoom?: boolean;
  /** The finish's name, matching HANDLE_FINISHES. Every piece of visible
   * metalwork in the cabinet takes it — the pulls and the hanging rails. */
  handleFinish?: string;
  /** Built into an opening, or standing against a flat wall. Changes the
   * joinery (see sidePanelsFor) and the room it is drawn in. */
  recessed?: boolean;
  /** The room's wall colour, hex. Paints the surround and, shaded down, the
   * back of the recess — see wallColours. */
  wallColour?: string;
}

export interface WardrobeScene {
  scene: THREE.Scene;
  root: THREE.Group;
  /** Centre of the cabinet, metres — what a turntable orbits. */
  centre: THREE.Vector3;
  /** REPAINT WITHOUT REBUILDING.
   *
   * Wall colour and handle finish change a material and nothing else — no
   * geometry, no textures, no environment. Rebuilding the whole scene for them
   * meant tearing down the renderer, remaking every box, regenerating the board
   * maps and re-baking the PMREM to end up with the same cabinet in a different
   * paint, which is why dragging the colour picker was unusable.
   *
   * Width, model and fitting still rebuild, because those really are different
   * geometry. */
  setWallColour(hex: string): void;
  setHandleFinish(name: string): void;
  dispose(): void;
}

/** THE CUT-OUT, MADE OPAQUE AGAINST BOARD.
 *
 * The cut-out has a real alpha channel, which is right for pasting into a room
 * and wrong as a texture: projected onto solid geometry every transparent pixel
 * — the whole open front — lands on the back panel and renders BLACK. Those
 * pixels are the back panel showing through, and the back panel is board, so
 * compositing over the finish brings them back as the surface they were always
 * showing. */
function flattenOntoBoard(tex: THREE.Texture, board: THREE.Color): THREE.Texture | null {
  const img = tex.image as HTMLImageElement | undefined;
  if (!img?.width || !img.height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const c = board.clone().convertLinearToSRGB();
  ctx.fillStyle = `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const out = new THREE.CanvasTexture(canvas);
  out.flipY = true;
  return out;
}

export async function buildWardrobeScene(opts: WardrobeSceneOpts): Promise<WardrobeScene> {
  const { renderer, modelId, colourName, widthMm } = opts;
  const handleFinishName = opts.handleFinish ?? DEFAULT_HANDLE_FINISH;
  const recessed = opts.recessed ?? true;
  const wallHex = opts.wallColour ?? DEFAULT_WALL_COLOUR;

  const model = wardrobeModelById(modelId);
  // THE MODEL'S OWN BOX. The linen shelving is 1650 x 447 against the robes'
  // 2016 x 500, so every height and depth below is asked of the model rather
  // than read off the range constant — see wardrobeHeight.
  const H = wardrobeHeight(model);
  const D = wardrobeDepth(model);
  // The width the artwork was SHOT at, which is not widths[0] any more now that
  // every layout offers the whole range starting at 1500. The slice boundaries
  // are measured off the artwork in any case; this is the fallback for the one
  // asset the detector cannot read.
  const refWidthMm = DEFAULT_WIDTH_MM;
  // The artwork this SKU wears, which is not keyed by its own id any more:
  // the products are filed under their codes and the renders under the names
  // the stickers arrived with. See WardrobeModel.artworkId.
  const cut = model.artworkId ? cutoutFor(model.artworkId) : undefined;
  const mapU = cut ? sliceMapper(buildSliceMap(model.id, refWidthMm, cut), widthMm) : null;
  const isWhite = wardrobeColour(colourName).slug === 'white';

  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);

  const disposables: { dispose(): void }[] = [];

  // --- lighting ------------------------------------------------------------
  // GENTLE, because in the room view the photograph brought its own light with
  // it and a second strong one from a different direction is what makes a
  // composite read as pasted on. This is enough to separate the faces and cast
  // the shadows that say the box has an inside.
  // AIMED AT THE CABINET, NOT AT THE ORIGIN — and this was quietly wrong.
  //
  // The model has its origin at the opening's bottom-left corner, so a cabinet
  // sits from x = 0 to its own width and y = 0 to 2016. A light placed at a
  // fixed point and left with three's default target of (0,0,0) is therefore
  // aimed at the bottom-left CORNER of the wardrobe rather than at the wardrobe
  // — lighting it from an odd angle, and worse, centring the shadow camera's
  // orthographic box on the corner so half of it fell outside and cast nothing.
  // The interior came out evenly lit and flat.
  const centre = new THREE.Vector3(
    (widthMm / 2) * MM,
    (H / 2) * MM,
    (-D / 2) * MM,
  );

  // AND NOW THE ONLY THING LIGHTING THE BOARD, which is why these numbers look
  // nothing like the ones they replace.
  //
  // They used to sit at 0.26 / 0.78 / 0.16 and were near enough decorative: the
  // environment was supplying almost all the irradiance, so the lamps shaped
  // very little and turning them down did nothing at all. With the environment
  // off the board they have to carry it, and in three's units a directional
  // light of intensity 1 lands a Lambertian white at about 0.28 linear — so
  // this is a key of about two and a half, not of one.
  //
  // Chosen by sweeping against the render rather than by eye. At these values
  // the board measures mean 184, brightest 244, nothing clipped, with a spread
  // of 48 counts — which is the light falling off across a panel and the
  // texture underneath it, both of which a clipped surface had thrown away.
  //
  // The composite adds a little on top as well — relightRender's `lighter` pass
  // puts about nine counts back on every channel — so the render lands below
  // the top with that still to come.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a8, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(centre.x + 1.1, centre.y + 1.5, centre.z + 2.6);
  key.target.position.copy(centre);
  scene.add(key);
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.56);
  fill.position.set(centre.x - 1.8, centre.y + 0.5, centre.z + 1.6);
  fill.target.position.copy(centre);
  scene.add(fill);
  scene.add(fill.target);

  // REAL SHADOWS, which is what an open carcass has been missing. A wardrobe
  // with no doors is a grid of boxes you look straight into, and almost
  // everything saying one shelf is in front of another is the shade it casts.
  // Soft, because the light in a bedroom is.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  // SOFT, and this is the "extra bar under the rail".
  //
  // A hanging rail stands 210mm off the back wall, so it casts a shadow there —
  // correct, and at radius 3 the edge was as hard as the rail itself. Two thin
  // parallel bars, one bright and one dark, with nothing hanging between them
  // to break them up: Forma 1 is nothing but rails and it read as having twice
  // as many as it has. Verified by dumping the box list — four rail segments at
  // exactly two heights, so the geometry was never doubled.
  //
  // 9 is also what the shadow should be. The light in a bedroom is a window and
  // a ceiling fitting, both large sources, and a 16mm rod two hundred
  // millimetres off a wall casts nothing like a sharp line under either.
  key.shadow.radius = 9;
  key.shadow.bias = -0.0006;
  const sc = key.shadow.camera;
  sc.near = 0.1;
  sc.far = 14;
  // Sized to the cabinet now that it is centred on it, so the whole 2048 map
  // is spent on the wardrobe rather than mostly on empty room.
  // Sized to the OPENING now that there is one — the shadow camera has to
  // cover the reveal and the empty recess above the unit, not just the unit.
  const half = Math.max(widthMm, OPENING_HEIGHT_MM) * MM * 0.72;
  sc.left = -half; sc.right = half;
  sc.top = half; sc.bottom = -half;
  sc.updateProjectionMatrix();

  // AN ENVIRONMENT, so the metal has something to be metal about. A
  // physically-based metal renders what it REFLECTS, and with nothing to
  // reflect it reflects nothing — which is black, and which is why the handles
  // were dark bars no colour change could fix.
  //
  // GIVEN TO THE METAL, NOT TO THE SCENE, and this is what was blowing the
  // white board out.
  //
  // `scene.environment` is not only a reflection. It is diffuse irradiance for
  // every material in the scene, and RoomEnvironment is a box of emissive
  // planes with intensities in the tens — it is built to be a studio softbox,
  // not a bedroom. Measured with the lamps switched off it was rendering the
  // board at a mean of 240 with 47% of its pixels at 255; measured with the
  // environment switched off instead, the lamps produced a mean of 83 and
  // clipped nothing. The environment was supplying essentially all the light,
  // which is also why three passes of winding the lamps down did nothing, and
  // why cutting envMapIntensity did not save it either: a fifth of far too much
  // is still far too much.
  //
  // So it goes on the one material that needs it. The board is lit by the lamps
  // alone, where the intensities mean what they look like they mean and a
  // shadow is something this code can reason about.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  disposables.push(env.texture, pmrem);

  // --- the carcass ---------------------------------------------------------
  const { boxes } = buildCarcass(model.id, widthMm, hardwareSpec(handleFinishName), recessed);
  const base = new THREE.Color(wardrobeColourHex(colourName));

  /** Model millimetres to sticker UV — piecewise across the width, so a fixed
   * module samples its own pixels at every cabinet width. */
  const uvFor = (x: number, y: number): [number, number] => {
    if (!cut) return [0, 0];
    const u = mapU ? mapU(x) : cut.x0 + (x / widthMm) * (cut.x1 - cut.x0);
    const v = (1 - cut.y1) + (y / H) * (cut.y1 - cut.y0);
    return [u, v];
  };

  const loader = new THREE.TextureLoader();
  const load = (url: string) =>
    new Promise<THREE.Texture | null>(resolve => {
      loader.load(url, t => resolve(t), undefined, () => resolve(null));
    });

  // ONLY THE FINISH THAT WAS PHOTOGRAPHED. All ten renders are Matt Wardrobe
  // White, so projecting one under a walnut swatch would be the configurator
  // lying about the product.
  const sticker = cut && isWhite ? await load(`/images/visualiser/textures/wardrobes/${cut.file}`) : null;
  const flat = sticker ? flattenOntoBoard(sticker, base) : null;
  if (flat) {
    flat.colorSpace = THREE.SRGBColorSpace;
    flat.wrapS = THREE.ClampToEdgeWrapping;
    flat.wrapT = THREE.ClampToEdgeWrapping;
    flat.anisotropy = renderer.capabilities.getMaxAnisotropy();
    disposables.push(flat);
  }
  if (sticker) disposables.push(sticker);

  const finishUrl = FINISH_TEXTURE[wardrobeColour(colourName).slug];
  const boardTex = finishUrl ? await load(finishUrl) : null;
  if (boardTex) {
    boardTex.colorSpace = THREE.SRGBColorSpace;
    // Mirrored rather than repeated: hides the seam without a seamless texture,
    // and book-matching is what veneer does anyway.
    boardTex.wrapS = THREE.MirroredRepeatWrapping;
    boardTex.wrapT = THREE.MirroredRepeatWrapping;
    boardTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    disposables.push(boardTex);
  }

  // THE WHITE BOARD HAS A SURFACE NOW.
  //
  // The three timbers get the supplier's decor sheet; white got a flat fill,
  // and a flat fill is what "too white" actually means. A single value across
  // every panel has nothing for the light to break on, so the board reads as
  // moulded plastic — and the render was pushing a third of those pixels to
  // 255 besides, where even a texture would have had nowhere to show.
  //
  // See whiteBoardTexture: a normal map for the pressed orange peel, a
  // roughness map for the way a real sheet scatters unevenly, and a very faint
  // albedo mottle. The colour is still the measured #F1EFEB — this varies it,
  // it does not replace it.
  // NOT DISPOSED WITH THE SCENE. These are cached and shared across every
  // scene built at this colour, so disposing them here would pull the textures
  // out from under the next one — see the note on mapCache.
  const whiteMaps = isWhite ? makeWhiteBoardMaps(base) : null;
  if (whiteMaps) {
    // ANISOTROPY, because these maps are minified hard. A 180mm tile on a
    // 507mm drawer front is nearly three repeats inside 150 screen pixels, and
    // the shelves and returns are seen at a glancing angle where the default
    // trilinear filter takes a single mip level for the whole face and turns a
    // fine texture into shimmer. This is the filter built for that case.
    const aniso = renderer.capabilities.getMaxAnisotropy();
    whiteMaps.map.anisotropy = aniso;
    whiteMaps.roughnessMap.anisotropy = aniso;
    whiteMaps.normalMap.anisotropy = aniso;
  }

  /** Every board material gets the same surface treatment, so a shelf and a
   * carcass side are the same sheet of board and not two different products. */
  const boardSurface = (over: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({
      metalness: 0.0,
      // No envMap: board takes the lamps only. See the note on the environment.
      ...(whiteMaps
        ? {
            roughnessMap: whiteMaps.roughnessMap,
            normalMap: whiteMaps.normalMap,
            // The roughness map is the multiplier, so this is the ceiling
            // rather than the value — 1.0 lets the map speak for itself.
            roughness: 1.0,
            // Down with STRENGTH, for the same reason — see the note there.
            // The peel is meant to break the sheen, not to be seen.
            normalScale: new THREE.Vector2(0.35, 0.35),
          }
        : null),
      ...over,
    });

  const boardMat = boardSurface({
    map: flat ?? boardTex ?? whiteMaps?.map ?? null,
    color: flat || boardTex ? 0xffffff : whiteMaps ? 0xffffff : base,
    roughness: whiteMaps ? 1.0 : boardTex ? 0.78 : 0.82,
  });
  disposables.push(boardMat);

  // The artwork's OWN white where there is artwork, so the faces the projection
  // cannot serve agree with the ones it can.
  const flatSource = flat?.image as HTMLCanvasElement | undefined;
  const sampled = flatSource ? sampleBoardColour(flatSource) : null;
  const plainBase = sampled
    ? new THREE.Color(`rgb(${Math.round(sampled[0])},${Math.round(sampled[1])},${Math.round(sampled[2])})`)
    : base;
  const plainBoardMat = boardSurface({
    map: boardTex ?? whiteMaps?.map ?? null,
    color: boardTex
      ? 0xffffff
      // With the albedo map carrying the colour, the 3% knock-down that
      // separated a plain face from a skinned one becomes a tint on white,
      // which is worse than the flatness it was fixing. It rides on the map's
      // own multiplier instead.
      : whiteMaps
        ? new THREE.Color(0xffffff).multiplyScalar(0.985)
        : plainBase.clone().multiplyScalar(0.97),
    roughness: whiteMaps ? 1.0 : boardTex ? 0.78 : 0.86,
  });
  disposables.push(plainBoardMat);

  // THE CHOSEN FINISH, and every one of its four numbers matters.
  //
  // It used to be one hard-coded brushed nickel. With six finishes on offer the
  // colour alone will not carry them: matte black and matte white are
  // POWDER-COATED, which is a dielectric, and rendering a dielectric as metal
  // is what makes a black handle come out as a hole in the cabinet — a metal
  // reflects its environment and a dark metal reflects a dark environment, so
  // there is nothing left to see. metalness and roughness travel with the
  // colour for exactly that reason. See wardrobeHardware.
  const hw = handleFinish(handleFinishName);
  const metalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(hw.hex),
    roughness: hw.roughness,
    metalness: hw.metalness,
    // ITS OWN, rather than the scene's — the reflection the handles need
    // without the flood of diffuse light that came with it.
    envMap: env.texture,
    // The painted finishes want much less of it: at 1.15 a matte white handle
    // collects the environment like chrome and disappears into a white board.
    envMapIntensity: hw.metalness > 0.5 ? 1.15 : 0.35,
  });
  disposables.push(metalMat);

  /** How much real board one tile of the board texture covers.
   *
   * Two very different numbers, because they are two very different things:
   * oak figure is measured in tens of centimetres and pressed peel in tenths of
   * a millimetre. Null when the board has no tiling texture at all. */
  const tileMm = boardTex ? FINISH_TILE_MM : whiteMaps ? WHITE_TILE_MM : null;

  const buildBoxMesh = (
    box: (typeof boxes)[number],
    material: THREE.Material,
    projected: boolean,
    plain?: THREE.Material,
  ) => {
    const geo = new THREE.BoxGeometry(box.w * MM, box.h * MM, box.d * MM);
    geo.translate((box.x + box.w / 2) * MM, (box.y + box.h / 2) * MM, (box.z + box.d / 2) * MM);

    // Slots run +X, −X, +Y, −Y, +Z, −Z, four vertices each.
    const FRONT = 4;

    if (projected) {
      // ONLY THE FACES THAT USE IT. The projection is the sticker's own frame,
      // and it belongs to ±Z, which are the faces looking at the room and the
      // only ones a flat elevation can serve. It used to be written over all
      // six, which was harmless while the other four had no map — and stops
      // being harmless the moment white gets one, because those UVs run 0..1
      // across the whole cabinet and would stretch a 180mm tile over two
      // metres of board.
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      for (let i = FRONT * 4; i < pos.count; i++) {
        const [u, v] = uvFor(pos.getX(i) / MM, pos.getY(i) / MM);
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
    }

    // The board tiles in the face's own coordinates, at real size — otherwise a
    // shared texture stretches to fit whatever the face happens to be, and the
    // grain on a 3000mm rail matches the grain on an 18mm shelf edge.
    if (tileMm) {
      const uv = geo.attributes.uv;
      const up = box.h >= box.w;
      const faces: [number, number][] = [
        [box.d, box.h], [box.d, box.h],
        [box.w, box.d], [box.w, box.d],
        [box.w, box.h], [box.w, box.h],
      ];
      // The faces the projection has already claimed keep their own UVs.
      const last = projected ? FRONT : 6;
      for (let f = 0; f < last; f++) {
        const [fw, fh] = faces[f];
        const su = Math.max(0.08, fw / (up ? tileMm.w : tileMm.h));
        const sv = Math.max(0.08, fh / (up ? tileMm.h : tileMm.w));
        for (let v = 0; v < 4; v++) {
          const i = f * 4 + v;
          uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
        }
      }
      uv.needsUpdate = true;
    }

    geo.computeVertexNormals();
    // Slots run +X, −X, +Y, −Y, +Z, −Z. Only ±Z face the room and can carry an
    // undistorted piece of the projection; the others would smear a single row
    // or column across themselves.
    const mesh = new THREE.Mesh(
      geo,
      projected && plain ? [plain, plain, plain, plain, material, material] : material,
    );
    // THE METALWORK CASTS NOTHING, and this is the "extra bar under the rail".
    //
    // A hanging rail stands 210mm off the back wall, so a shadow map draws its
    // shadow there as a hard dark line — a second thin bar parallel to the
    // bright one, with nothing hanging between them to break the pair up. On
    // Forma 1, which is nothing but rails, it read as twice as many rails as
    // the product has. Verified by dumping the box list: four rail segments at
    // exactly two heights, so the geometry was never doubled.
    //
    // Softening the map helped and did not fix it, because the fault is not the
    // edge — it is that a shadow map is binary. A 16mm rod occludes the key
    // completely along its line, where in a real room the window and the
    // ceiling fitting are both large sources and light wraps round it almost
    // entirely. Not casting is closer to true than casting a full shadow, and
    // it costs nothing: a rod's shadow is not what sells this render, and the
    // BOARD still casts, which is where the depth actually comes from.
    mesh.castShadow = !box.metal;
    mesh.receiveShadow = true;
    disposables.push(geo);
    return mesh;
  };

  for (const box of boxes) {
    if (box.colour) {
      // THE BOX SAYS WHETHER IT IS METALWORK, and it is asked rather than
      // guessed. This used to sniff the colour — bright and near-neutral meant
      // a rail or a handle, anything else meant a garment block — which worked
      // only while every piece of hardware was the same brushed nickel. With
      // six finishes on offer it fails on three of them: matte black is 43,43,45
      // and gunmetal is 92,95,99, so both would have been read as garments and
      // dropped, and choosing them would have deleted the handles rather than
      // recoloured them. The garment blocks are gone anyway; `metal` is what
      // the flag was always for.
      if (!box.metal) continue;
      root.add(buildBoxMesh(box, metalMat, false));
      continue;
    }
    root.add(
      buildBoxMesh(
        box,
        (box.back || box.plain) ? plainBoardMat : boardMat,
        !box.back && !box.plain && !!sticker,
        plainBoardMat,
      ),
    );
  }

  // NOTHING IS STOOD IN IT. The contents are off in both views — see the
  // note in Canvas2DWardrobeRenderer. The carcass shows its own board, which
  // is what has to be right before anything is put on a shelf.

  // --- THE WALL IT IS BUILT INTO ---------------------------------------------
  //
  // A BUILT-IN ROBE IS A HOLE IN A WALL, and until this the 3D view was showing
  // it as furniture: a carcass floating on a flat field, edges bare to the air
  // on every side. That is not the product. Every photograph of it in the
  // supplier's own deck is the same picture — a white wall with a rectangular
  // opening cut into it, a reveal deep enough to see the wall's thickness, and
  // the internals set back inside.
  //
  // WHAT ACTUALLY MAKES IT READ AS BUILT IN is the reveal, not the wall. A flat
  // white plane with a hole in it is still a picture of a hole; what says
  // "there is a room behind this" is the RETURN — the 90mm of wall you see
  // going away from you around the opening's four edges, catching the light on
  // one side and shadowed on the other. It is also what gives the turntable
  // something to move against: rotate a floating box and only the box turns,
  // rotate a box in an opening and the reveal opens and closes.
  //
  // Four boxes, not a plane with a hole cut in it. A box has the thickness
  // built into it, so the return comes free and casts and receives shadow like
  // anything else; punching a hole would mean a shape geometry, a triangulated
  // face, and no reveal at all without building these four anyway.
  // THE PAINTED SURFACES, HOISTED. Both live out here rather than inside
  // buildSurround because setWallColour has to reach them: a repaint must not
  // depend on whether the wall happened to be built, and a closure over a
  // conditionally-called function is not something a setter can hold.
  //
  // The customer's own wall. Plasterboard rather than board — flatter than the
  // cabinet, so the joinery still reads as a different material inside its own
  // opening whatever colour the wall is painted.
  const surroundMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wallHex),
    roughness: 0.94,
    metalness: 0.0,
  });
  disposables.push(surroundMat);

  // THE SAME PAINT, SHADED — a recess is the same wall seen with less light on
  // it, not a different colour. Multiplied rather than mixed toward grey, so a
  // deep green recess stays green instead of drifting to sludge.
  const backMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wallHex).multiplyScalar(0.88),
    roughness: 0.96,
    metalness: 0.0,
  });
  disposables.push(backMat);

  // ONLY WHERE THERE IS NOT ALREADY A WALL. The room composite is drawn onto a
  // photograph that has the customer's own wall in it, and the recess shade is
  // painted into the traced opening — putting a modelled wall in front of that
  // would be a second wall over the first. This is for the turntable, which has
  // nothing behind it at all.
  if (!opts.forRoom) buildSurround();

  function buildSurround() {

  const wall = (x: number, y: number, w: number, h: number) => {
    const geo = new THREE.BoxGeometry(w * MM, h * MM, WALL_THICKNESS_MM * MM);
    geo.translate(
      (x + w / 2) * MM,
      (y + h / 2) * MM,
      // Front face of the cabinet is z = 0, so the wall stands in front of it
      // and the opening looks through to the carcass.
      (WALL_THICKNESS_MM / 2) * MM,
    );
    const mesh = new THREE.Mesh(geo, surroundMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    disposables.push(geo);
    root.add(mesh);
  };

  // How far the wall runs past the opening. Generous, because the turntable
  // swings 40° either side and the eye finds the end of a wall immediately —
  // at anything tighter the surround reads as a frame leaning on the cabinet
  // rather than as the room's own wall.
  // HOW FAR THE WALL RUNS PAST THE OPENING, and it has to run off the frame.
  //
  // 900 was sized for a camera framed on the cabinet. Now that the camera backs
  // off to take in a 2700 opening, the wall's own left and right edges came
  // into shot — a floating slab with the robe in it, which is a worse object
  // than the floating cabinet it replaced. A wall the eye can see the end of is
  // not a wall.
  //
  // The frame is about 2.6 opening-heights wide at this distance, so this is
  // sized off the height rather than the cabinet: whatever the layout's width,
  // the surround reaches past the edge of the picture.
  const outX = Math.max(OPENING_HEIGHT_MM * 1.1, widthMm * 1.4);
  // THE OPENING ONLY EXISTS IN A RECESS. Off one, the unit stands against a
  // flat wall — so the room keeps its back wall and its floor and loses the
  // returns and the head, which are the opening. Drawing a reveal round a
  // free-standing cabinet would be showing a hole that is not there.
  // Above the head — enough that the ceiling line is off the top of the frame
  // rather than drawn across it. Declared out here because the back wall is
  // sized to it too, and the back wall exists either way.
  const outTop = 700;
  if (recessed) {
    // The reveal runs to the ceiling and the unit stands inside it, so the
    // returns are the full opening height rather than the cabinet's — see
    // OPENING_HEIGHT_MM for why those are different numbers.
    wall(-outX, 0, outX, OPENING_HEIGHT_MM);                       // left return
    wall(widthMm, 0, outX, OPENING_HEIGHT_MM);                     // right return
    wall(-outX, OPENING_HEIGHT_MM, widthMm + 2 * outX, outTop);    // head
  }
  // No sill: the opening runs to the floor, which is what a robe does.

  // THE BACK OF THE RECESS, and it is the room's wall rather than the product's.
  //
  // This is not the back panel that was taken out. That was a board belonging to
  // the cabinet, and the whole point of removing it is that a built-in robe does
  // not have one — the customer's wall closes every compartment. Which means
  // there IS a surface back there, and with nothing modelled the turntable was
  // showing the carcass against empty space: white shelves on a white field,
  // nothing behind the rails, and no way to tell a recess from a cut-out.
  //
  // Set a hair behind the carcass so no shelf ever z-fights with it, and darker
  // than the wall face, because the back of a 500mm recess lit only from the
  // room in front of it IS darker. That falloff is most of what says depth.
  const backGeo = new THREE.PlaneGeometry(
    (widthMm + 2 * outX) * MM,
    (OPENING_HEIGHT_MM + outTop) * MM,
  );
  backGeo.translate(
    (widthMm / 2) * MM,
    ((OPENING_HEIGHT_MM + outTop) / 2) * MM,
    (-D - 6) * MM,
  );
  const back = new THREE.Mesh(backGeo, backMat);
  back.receiveShadow = true;
  disposables.push(backGeo);
  root.add(back);

  // AND A FLOOR, for the same reason. The run is wall-hung, so there is open
  // floor under it in every one of the supplied renders — without one the
  // cabinet ends in mid-air and the drawer tower has nothing to stand on.
  //
  // Deep enough to run off the bottom of the frame. At 1400 it stopped a third
  // of the way down the picture and the render showed a strip of floor floating
  // on the background — the same fault the wall's own edges had, and a floor
  // with a visible far edge is not a floor either. The camera stands about four
  // metres back, so this runs past it.
  const floorD = D + 7000;
  const floorGeo = new THREE.PlaneGeometry((widthMm + 2 * outX) * MM, floorD * MM);
  floorGeo.rotateX(-Math.PI / 2);
  floorGeo.translate((widthMm / 2) * MM, 0, (-D + floorD / 2) * MM);
  // THE FLOOR IS NOT PAINTED. It keeps its own neutral whatever the walls are
  // — repainting it with the wall colour would say the customer's floor is the
  // same as their wall, which is true in no house.
  const floorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xd8d4cd),
    roughness: 0.96,
    metalness: 0.0,
  });
  disposables.push(floorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.receiveShadow = true;
  disposables.push(floorGeo);
  root.add(floor);
  }

  // NO BACK PANEL AND NO STAND-IN FOR ONE. The product is built in: the
  // customer's own wall is the back of every compartment, and seeing it through
  // the carcass is correct rather than a fault to be papered over.
  //
  // A plain wall was briefly added here to hide the doors in the supplied
  // alcove photographs. That was the wrong fix twice over — it put back the
  // surface the product does not have, and it was treating a symptom whose real
  // cause was the garments being blended instead of cut out, which is fixed
  // where the contents are built.
  // THE SHADOW CATCHER IS THE BUG YOU KEEP SEEING, and it is worth naming
  // precisely because it looked like three different faults.
  //
  // A ShadowMaterial is meant to be invisible except where a shadow lands on
  // it. It is not: it is a TRANSPARENT material, so every pixel of it writes
  // partial alpha, shadowed or not. Reading the render's own buffer, a 14-metre
  // plane behind the cabinet put 88,000 pixels at roughly 25-40% opacity across
  // the whole frame — and once composited, the photograph came through all of
  // them. On an alcove photograph that is the old wardrobe's doors appearing
  // through the boards, between the coats and along the top rail.
  //
  // It was never the garments, and it was never a missing back panel. Both of
  // those "fixes" were chasing this.
  //
  // Sized to the cabinet and pushed behind it, so what it can affect is the
  // wall immediately around the unit rather than the entire picture.
  // NO SHADOW CATCHER, and this is the fault that looked like three different
  // ones.
  //
  // A ShadowMaterial plane behind the cabinet was meant to let the wardrobe
  // cast onto the customer's wall. It is transparent EVERYWHERE it exists —
  // shadowed or not — so every pixel it covered was written at partial alpha.
  // Measured off the render's own buffer: 93,153 partial pixels with it in,
  // 5,092 with it out. Composited over a photograph, the picture came through
  // all of them, which is exactly what was showing as the room's own wardrobe
  // doors through the boards, between the coats and along the top rail.
  //
  // alphaTest does not help — ShadowMaterial ignores it. The right fix is to
  // stop asking one render to carry both the cabinet and a wall-shadow, and
  // that shadow is a smaller loss than it sounds: the cabinet is built INTO the
  // wall, so there is barely any gap for it to fall across. The contact shade
  // where it meets the floor is the part that matters, and that is geometry the
  // carcass already casts on itself.

  return {
    setWallColour(hex: string) {
      surroundMat.color.set(hex);
      // The recess is the same paint with less light on it — see the note where
      // backMat is built.
      backMat.color.set(hex).multiplyScalar(0.88);
    },
    setHandleFinish(name: string) {
      const f = handleFinish(name);
      metalMat.color.set(f.hex);
      metalMat.roughness = f.roughness;
      metalMat.metalness = f.metalness;
      metalMat.envMapIntensity = f.metalness > 0.5 ? 1.15 : 0.35;
    },
    scene,
    root,
    centre,
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
