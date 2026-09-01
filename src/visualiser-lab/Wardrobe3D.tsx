// ---------------------------------------------------------------------------
// THE STICKER, IN THREE DIMENSIONS.
//
// The supplied render is a photograph of a real Forma: correct melamine, real
// shelf edges, real drawer fronts, real brushed handles. Nothing modelled
// competes with it on surface. But it is one flat viewpoint, so it cannot be
// turned -- and a wardrobe that cannot be turned is a picture of a wardrobe.
//
// The modelled carcass is the opposite: real depth, turnable to any angle, and
// made of flat fills that read as a cardboard box.
//
// SO USE EACH FOR WHAT IT IS. The geometry comes from the dimensions -- 2016
// high, 447 deep, the layout's own width, the same buildCarcass the 2D renderer
// uses -- and the photograph is PROJECTED ONTO IT along the axis the camera
// stood on. Every panel then carries the pixels that actually belong to it, and
// because those pixels are stuck to geometry rather than to the screen, the
// whole thing turns.
//
// PROJECTION MAPPING, and the reason it works here is that the render is very
// nearly orthographic and dead front-on. A point at (x, y) on the front of the
// cabinet is at (x, y) in the picture, so the mapping is a straight linear
// remap of model millimetres into the carcass box the cut-out manifest already
// records. No fitting, no guessing.
//
// WHAT IT CANNOT DO, stated plainly: the camera never saw the side returns, so
// the pixels wrapped onto them are the front face's own, stretched along the
// depth axis. On a 447mm return viewed within about forty degrees that reads as
// a plausible edge; past that it smears, which is why the orbit is clamped
// rather than free. Turning further would need a render taken from there.
//
// THE CONTENTS ARE NOT PROJECTED. Clothes hang in space, a long way in front of
// the back panel, so projecting them onto board paints them flat on the wrong
// surface -- the exact failure the 2D path hit and abandoned. They are placed
// as their own upright planes at their own depth, cut from the same stickers,
// so they stand INSIDE the box and part from the board as the view turns.
// That parallax is most of what makes it read as real rather than as a photo.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { buildCarcass } from './Canvas2DWardrobeRenderer';
import { WARDROBE_DEPTH_MM, WARDROBE_HEIGHT_MM, wardrobeColour, wardrobeColourHex, wardrobeModelById } from './wardrobes';
import { cutoutFor } from './wardrobeCutouts';
import { buildSliceMap, sliceMapper } from './wardrobeSlices';
import { sampleBoardColour } from './wardrobeComposite';
import { BOARD_MM } from './wardrobeGeometry';
import { CONTENT_ASSETS, type ContentKind } from './wardrobeContents';

export interface Wardrobe3DProps {
  modelId: string;
  colourName: string;
  /** Which width in the layout's range. Defaults to the render's own. */
  selectedWidthMm?: number;
  /** Filled behind the cabinet. The room photo goes here later; for now it is
   * the panel's own ground, so the unit is not floating on black. */
  background?: string;
}

/** How far the view may be turned off dead-ahead.
 *
 * The projected pixels on a side return are the front face stretched, and that
 * illusion has a working range rather than a hard edge. Measured the same way
 * as the 2D path's own limit: convincing to about thirty degrees, arguable to
 * forty, gone past that. Clamped at forty so the control cannot be dragged into
 * the region where the product misrepresents itself. */
const MAX_YAW = THREE.MathUtils.degToRad(40);

const MM = 0.001; // millimetres to metres, so the scene is in real units

/** THE CUT-OUT, MADE OPAQUE AGAINST BOARD.
 *
 * The cut-out has a real alpha channel, which is exactly right for pasting it
 * into a room and exactly wrong for using it as a texture. Projected onto solid
 * geometry, every transparent pixel -- the whole open front of the cabinet,
 * where the checkerboard used to be -- lands on the back panel and renders
 * BLACK. The first pass did that and the wardrobe came out full of holes.
 *
 * The fix follows from what those pixels actually are: on the real product you
 * are looking THROUGH the opening at the back panel, and the back panel is
 * board. So the cut-out is composited over the finish's own colour, and the
 * holes come back as the surface they were always showing.
 *
 * The board tone is lifted a little because a back panel sits in its own shade
 * in the photograph, and matching the front edge's brightness would make the
 * inside of the box read as lit from nowhere.
 */
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
 * camera never photographed.
 *
 * Only the opaque ones count: a cut-out is mostly transparent, and averaging
 * the empty margin in would drag every object toward black. Darkened a little
 * because a side turned away from the room is not as lit as the face that was
 * photographed square on. */
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
  return new THREE.Color(`rgb(${Math.round(r / n * 0.82)},${Math.round(g / n * 0.82)},${Math.round(b / n * 0.82)})`);
}

export default function Wardrobe3D({
  modelId,
  colourName,
  selectedWidthMm,
  background = '#EFEDE8',
}: Wardrobe3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const model = wardrobeModelById(modelId);
    // The width the render was made at, and the width being drawn — the same
    // thing until the customer picks another size, and the whole reason the
    // artwork has to be sliced rather than stretched.
    const refWidthMm = model.widths[0];
    const widthMm = selectedWidthMm ?? refWidthMm;
    const cut = cutoutFor(model.id);
    const mapU = cut
      ? sliceMapper(buildSliceMap(model.id, refWidthMm, cut), widthMm)
      : null;
    const isWhite = wardrobeColour(colourName).slug === 'white';

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // The stickers are already tone-mapped photographs. Running them through a
    // filmic curve a second time washes the whites out and greys the board.
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);

    // --- lighting ----------------------------------------------------------
    // DELIBERATELY GENTLE, because the photograph brought its own light with
    // it. Strong lamps here fight the shading already baked into the pixels and
    // the board starts to look plastic. This is only enough to separate the
    // faces that the photograph cannot distinguish -- the side returns and the
    // shelf edges it never saw.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a8, 2.05));
    const key = new THREE.DirectionalLight(0xffffff, 0.55);
    key.position.set(1.4, 2.2, 2.6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.18);
    fill.position.set(-2.0, 0.7, 1.4);
    scene.add(fill);

    const root = new THREE.Group();
    scene.add(root);

    let disposed = false;
    const disposables: { dispose(): void }[] = [];

    // --- the carcass -------------------------------------------------------
    const { boxes, compartments } = buildCarcass(model.id, widthMm, true);
    const base = new THREE.Color(wardrobeColourHex(colourName));

    /** MODEL MILLIMETRES TO STICKER UV.
     *
     * The manifest records where the carcass sits inside the cut-out, as
     * fractions of the file. Model x runs 0..widthMm across that box and model
     * y runs 0..HEIGHT up it, so the remap is linear in both.
     *
     * V IS FLIPPED because the manifest measures down from the top of the image
     * while three's textures run up from the bottom. Getting this backwards
     * renders the wardrobe upside down, which is at least obvious. */
    // PIECEWISE ACROSS THE WIDTH — the same N-slice mapping the room view uses,
    // and for the same reason: a 507mm module must sample its own 507mm of the
    // photograph in every cabinet the range is built in, or the drawers come
    // out wider in a 3000 than in an 1800. Uniform up the height, because
    // height does not vary.
    const uvFor = (x: number, y: number): [number, number] => {
      if (!cut) return [0, 0];
      const u = mapU ? mapU(x) : cut.x0 + (x / widthMm) * (cut.x1 - cut.x0);
      const v = (1 - cut.y1) + (y / WARDROBE_HEIGHT_MM) * (cut.y1 - cut.y0);
      return [u, v];
    };

    const buildBoxMesh = (
      box: (typeof boxes)[number],
      material: THREE.Material,
      projected: boolean,
      plain?: THREE.Material,
    ) => {
      const geo = new THREE.BoxGeometry(box.w * MM, box.h * MM, box.d * MM);
      // BoxGeometry is centred on the origin; the model has its origin at the
      // opening's bottom-left, so each box is pushed out to where it belongs.
      geo.translate((box.x + box.w / 2) * MM, (box.y + box.h / 2) * MM, (box.z + box.d / 2) * MM);

      if (projected) {
        // PLANAR PROJECTION along Z: a vertex takes the pixel that sits at its
        // own (x, y), whichever face it happens to be on. That is what wraps
        // the photograph's shelf edges and drawer fronts onto the modelled
        // ones, and what stretches the front face's pixels down the side
        // returns the camera never saw.
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const [u, v] = uvFor(pos.getX(i) / MM, pos.getY(i) / MM);
          uv.setXY(i, u, v);
        }
        uv.needsUpdate = true;
      }

      geo.computeVertexNormals();
      // Slots run +X, −X, +Y, −Y, +Z, −Z. Only ±Z face the room and can carry
      // an undistorted piece of the projection; the other four would smear a
      // single row or column of pixels across themselves.
      const mesh = new THREE.Mesh(
        geo,
        projected && plain ? [plain, plain, plain, plain, material, material] : material,
      );
      disposables.push(geo);
      return mesh;
    };

    const finish = () => {
      if (disposed) return;

      // --- resize ----------------------------------------------------------
      const resize = () => {
        const w = host.clientWidth || 800;
        const h = host.clientHeight || 600;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      // --- framing ---------------------------------------------------------
      // Centred on the cabinet and backed off far enough that the whole of it
      // sits in frame with a little air, whatever width the layout is.
      const centre = new THREE.Vector3(
        (widthMm / 2) * MM,
        (WARDROBE_HEIGHT_MM / 2) * MM,
        (-WARDROBE_DEPTH_MM / 2) * MM,
      );
      const span = Math.max(widthMm, WARDROBE_HEIGHT_MM) * MM;
      const dist = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.32;

      camera.position.set(centre.x, centre.y + span * 0.04, centre.z + dist);
      camera.lookAt(centre);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(centre);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      // NO PANNING AND NO ZOOM-TO-NOTHING. This is a product viewer, not a
      // scene editor: the one useful gesture is turning the cabinet, and a
      // dragged-off-centre wardrobe is just a lost customer.
      controls.enablePan = false;
      controls.minDistance = dist * 0.62;
      controls.maxDistance = dist * 1.5;
      controls.minAzimuthAngle = -MAX_YAW;
      controls.maxAzimuthAngle = MAX_YAW;
      // Kept near eye level. Looking down into the top of a wardrobe shows the
      // one surface the photograph has nothing to say about.
      controls.minPolarAngle = THREE.MathUtils.degToRad(62);
      controls.maxPolarAngle = THREE.MathUtils.degToRad(99);
      controls.rotateSpeed = 0.55;
      controls.update();

      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        controls.update();
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
      };
    };

    let cleanup = () => {};

    // --- textures ----------------------------------------------------------
    const loader = new THREE.TextureLoader();
    const load = (url: string) =>
      new Promise<THREE.Texture | null>(resolve => {
        loader.load(url, t => resolve(t), undefined, () => resolve(null));
      });

    const run = async () => {
      // ONLY THE FINISH THAT WAS PHOTOGRAPHED. All ten renders are Matt
      // Wardrobe White, so projecting one while Notaio Walnut is selected would
      // show white board under a walnut swatch -- the configurator lying about
      // the product, which is worse than plain geometry. The other three take
      // the modelled board in their own colour until their renders exist.
      const stickerUrl =
        cut && isWhite ? `/images/Textures/wardrobes/${cut.file}` : null;
      const sticker = stickerUrl ? await load(stickerUrl) : null;
      if (disposed) return;

      const flat = sticker ? flattenOntoBoard(sticker, base) : null;
      if (flat) {
        flat.colorSpace = THREE.SRGBColorSpace;
        // Clamped, not wrapped: a vertex projecting a hair outside the carcass
        // box would otherwise pull in a pixel from the far side of the picture.
        flat.wrapS = THREE.ClampToEdgeWrapping;
        flat.wrapT = THREE.ClampToEdgeWrapping;
        flat.anisotropy = renderer.capabilities.getMaxAnisotropy();
        disposables.push(flat);
      }
      if (sticker) disposables.push(sticker);

      // The board. Where the sticker exists this is the photograph; where it
      // does not — the three timber finishes, which were never rendered — it
      // falls back to flat board in the right colour, and says so by simply
      // being plainer.
      const boardMat = new THREE.MeshStandardMaterial({
        map: flat ?? null,
        color: flat ? 0xffffff : base,
        roughness: 0.82,
        metalness: 0.0,
      });
      disposables.push(boardMat);

      // Board with no photograph on it, for the back panel. Slightly down in
      // value because nothing lights the inside of a cupboard, and at the same
      // tone as the front edge the box reads as having no inside at all.
      // Painted the artwork's OWN white where there is artwork, so the faces
      // the projection cannot serve agree with the ones it can. From the swatch
      // hex instead, the shelf interiors and back panel read grey against a
      // photographic white front — two cabinets in one.
      // The flattened texture's own canvas — a CanvasTexture wraps the canvas
      // it was built from, which is what the sampler needs to read pixels.
      const flatSource = flat?.image as HTMLCanvasElement | undefined;
      const sampled = flatSource ? sampleBoardColour(flatSource) : null;
      const plainBase = sampled
        ? new THREE.Color(`rgb(${Math.round(sampled[0])},${Math.round(sampled[1])},${Math.round(sampled[2])})`)
        : base;
      const plainBoardMat = new THREE.MeshStandardMaterial({
        color: plainBase.clone().multiplyScalar(0.97),
        roughness: 0.86,
        metalness: 0.0,
      });
      disposables.push(plainBoardMat);

      const metalMat = new THREE.MeshStandardMaterial({
        color: 0xb4b8bd,
        roughness: 0.36,
        metalness: 0.85,
      });
      disposables.push(metalMat);

      for (const box of boxes) {
        // A box carrying its own colour is a rail, a handle or a modelled
        // garment. Rails and handles are real metal; the modelled garments are
        // dropped entirely, because the photographic contents below replace
        // them and drawing both puts flat bars over real clothes.
        if (box.colour) {
          const isMetal = box.colour[0] > 150 && Math.abs(box.colour[0] - box.colour[2]) < 24;
          if (!isMetal) continue;
          root.add(buildBoxMesh(box, metalMat, false));
          continue;
        }
        // THE BACK PANEL TAKES PLAIN BOARD, never the photograph. Everything
        // hanging in the cabinet is in front of it, so a projection along the
        // camera axis lands the picture's own rail and coats flat on it —
        // behind the modelled rail and the upright content planes, giving two
        // of each. Left plain, it is what it should be: the surface behind the
        // clothes.
        // ONLY THE FACES POINTING AT THE ROOM CARRY THE PHOTOGRAPH.
        //
        // The projection runs along Z, so a face whose own Z is constant — the
        // front, the back — gets a proper two-dimensional piece of the picture.
        // Every other face does not: a shelf's top surface has one Y across the
        // whole of it, so it samples a single ROW of pixels and smears it
        // front to back, and a side panel samples a single column. On an 18mm
        // board edge that passes for an edge; on the carcass top and the shelf
        // surfaces it is a visible streak, which is what was showing in the 3D
        // view.
        //
        // Those faces take plain board instead. It is the same colour the
        // photograph would have given them, without the smear.
        root.add(
          buildBoxMesh(box, box.back ? plainBoardMat : boardMat, !box.back && !!sticker, plainBoardMat),
        );
      }

      // --- what stands inside ----------------------------------------------
      // Upright planes at their own depth, so they part from the back panel as
      // the view turns. That parallax is the difference between a photograph
      // and a room.
      const kinds = Object.keys(CONTENT_ASSETS) as ContentKind[];
      const loaded = new Map<ContentKind, { tex: THREE.Texture; ratio: number; tone: THREE.Color }>();
      await Promise.all(
        kinds.map(async k => {
          const t = await load(`/images/Textures/wardrobes/contents/${CONTENT_ASSETS[k].file}`);
          // Texture.image is typed as unknown here; for a TextureLoader it is
          // always the decoded bitmap, and its aspect is what sets the height
          // of the plane from the asset's declared width.
          const img = t?.image as { width?: number; height?: number } | undefined;
          if (!t || !img?.width || !img.height) return;
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = renderer.capabilities.getMaxAnisotropy();
          disposables.push(t);
          loaded.set(k, {
            tex: t,
            ratio: img.height / img.width,
            tone: averageTone(img as CanvasImageSource),
          });
        }),
      );
      if (disposed) return;

      const forRole = (role: string, i: number): ContentKind =>
        role === 'hang-long' ? 'hanging-long'
        : role === 'hang-short' ? 'hanging-short'
        : role === 'floor' ? 'shoes'
        : i % 3 === 1 ? 'box' : 'stack';

      compartments.forEach((c, i) => {
        const item = loaded.get(forRole(c.role, i));
        if (!item) return;
        const asset = CONTENT_ASSETS[forRole(c.role, i)];
        const openingW = c.x1 - c.x0;
        if (openingW <= 0) return;

        // Model Z runs negative into the wall and buildCarcass has already
        // shifted the opening to z = 0, so a content at depth d sits at -d.
        const z = -WARDROBE_DEPTH_MM * asset.depth;

        const place = (x0: number, w: number, yTop: number, hangs: boolean) => {
          const h = w * item.ratio;
          const front = new THREE.MeshStandardMaterial({
            map: item.tex,
            transparent: true,
            // Cuts the fringe that bilinear filtering leaves around an alpha
            // edge, without the sorting cost of full transparency everywhere.
            alphaTest: 0.42,
            roughness: 0.92,
            side: THREE.DoubleSide,
          });
          disposables.push(front);

          let mesh: THREE.Mesh;
          if (hangs) {
            // CLOTHES ON A RAIL STAY FLAT, and that is not a shortcut. A shirt
            // hanging on a hanger really is a thin thing seen face on, and the
            // cut-out already carries its folds and shadows — giving it a
            // modelled thickness would add a hard edge the garment does not
            // have.
            const geo = new THREE.PlaneGeometry(w * MM, h * MM);
            disposables.push(geo);
            mesh = new THREE.Mesh(geo, front);
          } else {
            // ANYTHING STANDING ON A SHELF IS A SOLID OBJECT, and has to be
            // built as one. A folded stack, a storage box and a pair of shoes
            // are all things with a front, a top and two sides, and as an
            // upright plane every one of them turned into a paper cut-out the
            // moment the view moved off dead-ahead — the object vanished to a
            // line at ninety degrees.
            //
            // So they get real depth: a box carrying the photograph on its
            // front and the object's own averaged colour on the faces the
            // camera never saw. It occludes what is behind it, it casts into
            // the compartment, and it holds up when the wardrobe is turned.
            const d = Math.min(asset.depthMm ?? w * 0.62, WARDROBE_DEPTH_MM - BOARD_MM * 2);
            const geo = new THREE.BoxGeometry(w * MM, h * MM, d * MM);
            disposables.push(geo);
            const side = new THREE.MeshStandardMaterial({
              color: item.tone,
              roughness: 0.95,
            });
            disposables.push(side);
            // BoxGeometry's material slots run +X, −X, +Y, −Y, +Z, −Z, so the
            // photograph belongs on slot 4 — the face pointing at the room.
            mesh = new THREE.Mesh(geo, [side, side, side, side, front, side]);
          }

          // A thing that hangs is positioned by its TOP, at the rail; a thing
          // that stands is positioned by its BOTTOM, on the surface under it.
          // Getting this backwards is what makes contents float.
          //
          // And a standing object sits ON the shelf board, not in it: the
          // compartment's y0 is the opening's floor, so the board's own 18mm
          // has to be cleared or the stack is sunk into the shelf it is
          // supposed to be resting on.
          const baseY = hangs ? yTop : yTop + BOARD_MM;
          mesh.position.set(
            (x0 + w / 2) * MM,
            (hangs ? baseY - h / 2 : baseY + h / 2) * MM,
            z * MM,
          );
          root.add(mesh);
        };

        if (asset.repeats) {
          // Real-sized garments, a whole number of them, centred on the rail —
          // the count changes with the bay, not the size of a coat. See the
          // room renderer's drawContents for why.
          const n = Math.max(1, Math.floor(openingW / asset.widthMm));
          const w = asset.widthMm;
          const pad = (openingW - n * w) / 2;
          for (let k = 0; k < n; k++) place(c.x0 + pad + k * w, w, c.y0, true);
          return;
        }
        // Never wider than its opening, and never taller than it either — a
        // stack that overruns its compartment is standing through the shelf
        // above it.
        const openingH = Math.max(0, c.y1 - c.y0 - BOARD_MM * 2);
        let w = Math.min(asset.widthMm, openingW * 0.86);
        if (openingH > 0 && w * item.ratio > openingH) w = openingH / item.ratio;
        place(c.x0 + (openingW - w) / 2, w, c.y0, false);
      });

      finish();
    };

    run().catch(() => {
      // A missing texture should still leave a turnable cabinet rather than a
      // blank panel, so the scene is finished either way.
      finish();
    });

    return () => {
      disposed = true;
      cleanup();
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [modelId, colourName, selectedWidthMm, background]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />;
}

