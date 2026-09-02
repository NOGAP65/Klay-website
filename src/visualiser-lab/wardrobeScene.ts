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
  WARDROBE_DEPTH_MM, WARDROBE_HEIGHT_MM, FINISH_TEXTURE, FINISH_TILE_MM,
  wardrobeColour, wardrobeColourHex, wardrobeModelById, DEFAULT_WIDTH_MM,
} from './wardrobes';
import { cutoutFor } from './wardrobeCutouts';
import { buildSliceMap, sliceMapper } from './wardrobeSlices';
import { sampleBoardColour } from './wardrobeComposite';
import { makeWhiteBoardMaps, WHITE_TILE_MM } from './whiteBoardTexture';

/** Millimetres to metres, so the scene is in real units and a shadow camera
 * sized in metres means something. */
export const MM = 0.001;

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
}

export interface WardrobeScene {
  scene: THREE.Scene;
  root: THREE.Group;
  /** Centre of the cabinet, metres — what a turntable orbits. */
  centre: THREE.Vector3;
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

  const model = wardrobeModelById(modelId);
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
    (WARDROBE_HEIGHT_MM / 2) * MM,
    (-WARDROBE_DEPTH_MM / 2) * MM,
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
  key.shadow.radius = 3;
  key.shadow.bias = -0.0006;
  const sc = key.shadow.camera;
  sc.near = 0.1;
  sc.far = 14;
  // Sized to the cabinet now that it is centred on it, so the whole 2048 map
  // is spent on the wardrobe rather than mostly on empty room.
  const half = Math.max(widthMm, WARDROBE_HEIGHT_MM) * MM * 0.72;
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
  const { boxes } = buildCarcass(model.id, widthMm);
  const base = new THREE.Color(wardrobeColourHex(colourName));

  /** Model millimetres to sticker UV — piecewise across the width, so a fixed
   * module samples its own pixels at every cabinet width. */
  const uvFor = (x: number, y: number): [number, number] => {
    if (!cut) return [0, 0];
    const u = mapU ? mapU(x) : cut.x0 + (x / widthMm) * (cut.x1 - cut.x0);
    const v = (1 - cut.y1) + (y / WARDROBE_HEIGHT_MM) * (cut.y1 - cut.y0);
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
  const sticker = cut && isWhite ? await load(`/images/Textures/wardrobes/${cut.file}`) : null;
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
  const whiteMaps = isWhite ? makeWhiteBoardMaps(base) : null;
  if (whiteMaps) disposables.push(whiteMaps);

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
            normalScale: new THREE.Vector2(0.85, 0.85),
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

  // Brushed, not polished: a wardrobe handle is satin nickel or brushed
  // aluminium, so roughness is well up and the reflection is a sheen.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc6cace,
    roughness: 0.42,
    metalness: 0.9,
    // ITS OWN, rather than the scene's — the reflection the handles need
    // without the flood of diffuse light that came with it.
    envMap: env.texture,
    envMapIntensity: 1.15,
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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    disposables.push(geo);
    return mesh;
  };

  for (const box of boxes) {
    if (box.colour) {
      // Rails and handles are real metal; the modelled garment blocks are
      // dropped, because the photographic contents replace them.
      const isMetal = box.colour[0] > 150 && Math.abs(box.colour[0] - box.colour[2]) < 24;
      if (!isMetal) continue;
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
    scene,
    root,
    centre,
    dispose() {
      for (const d of disposables) d.dispose();
    },
  };
}
