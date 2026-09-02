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
import { BOARD_MM } from './wardrobeGeometry';
import { CONTENT_ASSETS, type ContentKind } from './wardrobeContents';

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

/** The average colour of an object's own opaque pixels, for the faces of it the
 * camera never photographed. Only opaque ones count: a cut-out is mostly
 * transparent, and averaging the empty margin in drags everything toward black. */
function averageTone(img: CanvasImageSource): THREE.Color {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new THREE.Color(0x9a938c);
  ctx.drawImage(img, 0, 0, 32, 32);
  const px = ctx.getImageData(0, 0, 32, 32).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 160) continue;
    r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
  }
  if (!n) return new THREE.Color(0x9a938c);
  return new THREE.Color(
    `rgb(${Math.round(r / n * 0.82)},${Math.round(g / n * 0.82)},${Math.round(b / n * 0.82)})`,
  );
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

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a8, 0.26));
  const key = new THREE.DirectionalLight(0xffffff, 0.78);
  key.position.set(centre.x + 1.1, centre.y + 1.5, centre.z + 2.6);
  key.target.position.copy(centre);
  scene.add(key);
  scene.add(key.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.16);
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
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;
  disposables.push(env.texture, pmrem);

  // --- the carcass ---------------------------------------------------------
  const { boxes, compartments } = buildCarcass(model.id, widthMm, true);
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

  const boardMat = new THREE.MeshStandardMaterial({
    map: flat ?? boardTex ?? null,
    color: flat || boardTex ? 0xffffff : base,
    roughness: boardTex ? 0.78 : 0.82,
    metalness: 0.0,
    envMapIntensity: 0.22,
  });
  disposables.push(boardMat);

  // The artwork's OWN white where there is artwork, so the faces the projection
  // cannot serve agree with the ones it can.
  const flatSource = flat?.image as HTMLCanvasElement | undefined;
  const sampled = flatSource ? sampleBoardColour(flatSource) : null;
  const plainBase = sampled
    ? new THREE.Color(`rgb(${Math.round(sampled[0])},${Math.round(sampled[1])},${Math.round(sampled[2])})`)
    : base;
  const plainBoardMat = new THREE.MeshStandardMaterial({
    map: boardTex ?? null,
    color: boardTex ? 0xffffff : plainBase.clone().multiplyScalar(0.97),
    roughness: boardTex ? 0.78 : 0.86,
    metalness: 0.0,
    envMapIntensity: 0.22,
  });
  disposables.push(plainBoardMat);

  // Brushed, not polished: a wardrobe handle is satin nickel or brushed
  // aluminium, so roughness is well up and the reflection is a sheen.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc6cace,
    roughness: 0.42,
    metalness: 0.9,
    envMapIntensity: 1.15,
  });
  disposables.push(metalMat);

  const buildBoxMesh = (
    box: (typeof boxes)[number],
    material: THREE.Material,
    projected: boolean,
    plain?: THREE.Material,
    timber = false,
  ) => {
    const geo = new THREE.BoxGeometry(box.w * MM, box.h * MM, box.d * MM);
    geo.translate((box.x + box.w / 2) * MM, (box.y + box.h / 2) * MM, (box.z + box.d / 2) * MM);

    if (projected) {
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const [u, v] = uvFor(pos.getX(i) / MM, pos.getY(i) / MM);
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
    }

    // Timber tiles in the face's own coordinates, at real size — otherwise a
    // shared texture stretches to fit whatever the face happens to be, and the
    // grain on a 3000mm rail matches the grain on an 18mm shelf edge.
    if (timber) {
      const uv = geo.attributes.uv;
      const T = FINISH_TILE_MM;
      const up = box.h >= box.w;
      const faces: [number, number][] = [
        [box.d, box.h], [box.d, box.h],
        [box.w, box.d], [box.w, box.d],
        [box.w, box.h], [box.w, box.h],
      ];
      for (let f = 0; f < 6; f++) {
        const [fw, fh] = faces[f];
        const su = Math.max(0.08, fw / (up ? T.w : T.h));
        const sv = Math.max(0.08, fh / (up ? T.h : T.w));
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
        !!boardTex,
      ),
    );
  }

  // --- what stands inside --------------------------------------------------
  const kinds = Object.keys(CONTENT_ASSETS) as ContentKind[];
  const loaded = new Map<ContentKind, { tex: THREE.Texture; ratio: number; tone: THREE.Color }>();
  await Promise.all(
    kinds.map(async k => {
      const t = await load(`/images/Textures/wardrobes/contents/${CONTENT_ASSETS[k].file}`);
      const img = t?.image as { width?: number; height?: number } | undefined;
      if (!t || !img?.width || !img.height) return;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      disposables.push(t);
      loaded.set(k, { tex: t, ratio: img.height / img.width, tone: averageTone(img as CanvasImageSource) });
    }),
  );

  /** 'bay' is shading-only in the room renderer and carries no contents: the
   * clothes come from the RAIL compartment sitting inside it, so filling it too
   * would hang a second set in the same opening. */
  const forRole = (role: string, i: number): ContentKind | null =>
    role === 'bay' ? null
    : role === 'hang-long' ? 'hanging-long'
    : role === 'hang-short' ? 'hanging-short'
    : role === 'floor' ? 'shoes'
    : i % 3 === 1 ? 'box' : 'stack';

  compartments.forEach((c, i) => {
    const kind = forRole(c.role, i);
    if (!kind) return;
    const item = loaded.get(kind);
    if (!item) return;
    const asset = CONTENT_ASSETS[kind];
    const openingW = c.x1 - c.x0;
    if (openingW <= 0) return;

    const z = -WARDROBE_DEPTH_MM * asset.depth;

    const place = (x0: number, w: number, yTop: number, hangs: boolean) => {
      const h = w * item.ratio;
      // CUT OUT, NOT BLENDED — and the difference is a depth buffer.
      //
      // `transparent: true` puts a mesh in the blended pass, which does not
      // WRITE depth. So a rail of coats never occluded anything: each garment
      // blended over whatever was behind it, and where its own alpha was zero
      // the room showed straight through the cabinet. In an alcove photograph
      // that is the picture's own doors appearing between the jackets.
      //
      // alphaTest alone does the job. A pixel is either the garment or it is
      // not — which is what a cut-out is — so the mesh can stay opaque, write
      // depth like everything else, and take its place in the ordering.
      const front = new THREE.MeshStandardMaterial({
        map: item.tex,
        alphaTest: 0.5,
        roughness: 0.92,
        side: THREE.DoubleSide,
      });
      disposables.push(front);

      let mesh: THREE.Mesh;
      if (hangs) {
        // Clothes on a rail stay flat, and that is not a shortcut: a garment on
        // a hanger really is a thin thing seen face on, and the cut-out already
        // carries its folds.
        const geo = new THREE.PlaneGeometry(w * MM, h * MM);
        disposables.push(geo);
        mesh = new THREE.Mesh(geo, front);
      } else {
        // Anything standing on a shelf is a solid object and has to be built as
        // one, or it vanishes to a line the moment the view moves off centre.
        const d = Math.min(asset.depthMm ?? w * 0.62, WARDROBE_DEPTH_MM - BOARD_MM * 2);
        const geo = new THREE.BoxGeometry(w * MM, h * MM, d * MM);
        disposables.push(geo);
        const side = new THREE.MeshStandardMaterial({ color: item.tone, roughness: 0.95 });
        disposables.push(side);
        mesh = new THREE.Mesh(geo, [side, side, side, side, front, side]);
      }

      // A thing that hangs is placed by its TOP at the rail; a thing that
      // stands is placed by its BOTTOM, clear of the shelf board it rests on.
      const baseY = hangs ? yTop : yTop + BOARD_MM;
      mesh.position.set((x0 + w / 2) * MM, (hangs ? baseY - h / 2 : baseY + h / 2) * MM, z * MM);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
    };

    if (asset.repeats) {
      // Real-sized garments, a whole number of them, centred on the rail.
      const n = Math.max(1, Math.floor(openingW / asset.widthMm));
      const w = asset.widthMm;
      const pad = (openingW - n * w) / 2;
      for (let k = 0; k < n; k++) place(c.x0 + pad + k * w, w, c.y0, true);
      return;
    }
    const openingH = Math.max(0, c.y1 - c.y0 - BOARD_MM * 2);
    let w = Math.min(asset.widthMm, openingW * 0.86);
    if (openingH > 0 && w * item.ratio > openingH) w = openingH / item.ratio;
    place(c.x0 + (openingW - w) / 2, w, c.y0, false);
  });

  // A ROOM COMPOSITE NEEDS SOMETHING FOR THE CABINET TO SIT ON, or the shadow
  // it casts falls into empty space and is never seen. An invisible plane at
  // the wall receives the shadow and nothing else, so the darkening lands on
  // the photograph without a grey rectangle landing with it.
  // THE WALL IS THE BACK OF THE WARDROBE, so in the room view it has to take
  // the shadow the cabinet casts onto it. With no back panel there is nothing
  // else to catch it, and a wardrobe throwing no shade on the wall behind it
  // is the thing that reads as pasted on.
  //
  // A ShadowMaterial is invisible except where it is shadowed, so this darkens
  // the photograph without laying a grey rectangle over it.
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
