// ---------------------------------------------------------------------------
// THE WARDROBE IN THE ROOM, RENDERED THE SAME WAY THE TURNTABLE IS.
//
// The turntable looked right and the room view did not, and the reason was not
// tuning: they were two different renderers. The turntable is three.js — real
// shadow maps, an environment for the metal to reflect, physically-based board
// — and the room view was a painter's algorithm in Canvas 2D approximating all
// three by hand. Every fault reported against the room view came out of that
// gap: shadows that painted over the boards in front of them, metal drawn as
// grey rectangles, faces with no way to occlude one another.
//
// So the room view is the same scene now, built by wardrobeScene, and the only
// thing that differs is where the camera stands. It is solved from the traced
// quad — see cameraFromQuad — rendered on a transparent background, and
// composited onto the photograph.
//
// WHAT THE RIGID CAMERA COSTS, and it is worth stating because it is a real
// change. The old homography could scale its two axes differently, so the
// cabinet always landed exactly on the four traced corners however out of
// proportion the drawing was. A GPU has one projection matrix and cannot do
// that, so the cabinet lands where its own proportions put it. That is the rule
// the rest of the visualiser already follows: the trace says where, the product
// says how big, and whether it fits is the answer rather than the input.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { wardrobeArtwork, wardrobeModelById, WARDROBE_HEIGHT_MM, DEFAULT_WIDTH_MM } from './wardrobes';
import { cameraFromQuad, tracedWidthMm } from './wardrobeGeometry';
import { buildWardrobeScene, MM } from './wardrobeScene';
import { profilePhoto, applyGrain } from './wardrobeComposite';
import { drawWalkIn } from './Canvas2DWardrobeRenderer';

export interface WardrobeRoomRendererProps {
  photoUrl: string;
  /** The traced quad in photo pixels, TL TR BR BL. */
  corners: [number, number][];
  modelId: string;
  colourName: string;
  /** Which width in the layout's range. */
  widthMm?: number;
  /** The metalwork's finish — see wardrobeHardware. */
  handleFinish?: string;
  /** Built into an opening, or standing against a wall. */
  recessed?: boolean;
  /** The room's wall colour, hex. */
  wallColour?: string;
}

/** How large the offscreen render may get.
 *
 * A phone photograph can be twelve megapixels, and rendering the cabinet at
 * that size costs a great deal for detail nobody sees — the wardrobe occupies a
 * fraction of the frame and the result is drawn back at the photo's scale
 * anyway. Capped on the long side and scaled up on composite. */
const MAX_RENDER_PX = 1600;

/** How much of the room's illuminant to carry into the render.
 *
 * A third, where a supplied photograph takes the full correction. The stickers
 * were shot in a studio under someone else's lights, so all of that difference
 * is error to be removed; a render is lit by lamps this code chose in a scene
 * it built, and is already near neutral. At full strength the white cabinet
 * came out cream. */
const RELIGHT_STRENGTH = 0.34;

/** Where the cabinet actually landed, from the render's own alpha.
 *
 * Needed so the grain pass covers the cabinet and nothing else. Over the whole
 * frame it would be grain on top of the photograph's own, which doubles it and
 * leaves the picture looking washed and soft.
 *
 * Scanned coarsely — this is a bounding box, and a stride of four pixels finds
 * the same box for a sixteenth of the work. */
function opaqueBounds(
  source: HTMLCanvasElement,
  rw: number,
  rh: number,
  sx: number,
  sy: number,
): { x: number; y: number; w: number; h: number } | null {
  const c = document.createElement('canvas');
  c.width = rw;
  c.height = rh;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0);
  const px = ctx.getImageData(0, 0, rw, rh).data;

  let x0 = rw, y0 = rh, x1 = -1, y1 = -1;
  for (let y = 0; y < rh; y += 4) {
    for (let x = 0; x < rw; x += 4) {
      if (px[(y * rw + x) * 4 + 3] < 24) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < x0) return null;

  // Back to photo pixels, with a margin for the stride and the softening blur.
  const pad = 6;
  return {
    x: x0 * sx - pad,
    y: y0 * sy - pad,
    w: (x1 - x0 + 1) * sx + pad * 2,
    h: (y1 - y0 + 1) * sy + pad * 2,
  };
}

/** Carries the room's own light into the render WITHOUT touching its alpha.
 *
 * The previous version read the WebGL canvas with getImageData, scaled the
 * colour and wrote it back. That corrupts transparency: a WebGL canvas stores
 * PREMULTIPLIED alpha, and the read/write pair un-premultiplies and
 * re-premultiplies around an operation that changes the colour — so every
 * partly-transparent edge pixel came back resolving to a different opacity than
 * it went in with. The cabinet ended up letting the photograph through its own
 * boards, which showed as the room's old wardrobe doors between the coats.
 *
 * Doing it with composite operations instead never reads a pixel. `multiply`
 * tints toward the wall's colour and `lighter` adds the exposure back, both
 * clipped to the render's own shape by a final `destination-in` — so the alpha
 * that leaves is exactly the alpha the GPU wrote.
 */
function relightRender(
  source: HTMLCanvasElement,
  profile: ReturnType<typeof profilePhoto>,
  strength: number,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d');
  if (!ctx) return source;

  ctx.drawImage(source, 0, 0);

  // The wall's cast, normalised so this carries colour and not brightness.
  const wl = Math.max(1, profile.wallLuma);
  const cast = profile.wall.map(c => c / wl);
  const mix = (v: number) => Math.round(255 * (1 - strength * (1 - Math.min(1, v))));

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgb(${mix(cast[0])},${mix(cast[1])},${mix(cast[2])})`;
  ctx.fillRect(0, 0, out.width, out.height);

  // Multiply only ever darkens, so a little of the wall's own light goes back
  // on top — otherwise a cabinet in a bright room comes out dull.
  const lift = Math.round(255 * strength * 0.10);
  if (lift > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgb(${lift},${lift},${lift})`;
    ctx.fillRect(0, 0, out.width, out.height);
  }

  // Both fills covered the whole canvas; this trims them back to the cabinet.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(source, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  return out;
}

/** How dark the back of the recess goes, at the head and at the floor.
 *
 * Set by eye against the supplied alcoves rather than derived: a real figure
 * would need the room's illuminant and the opening's own aspect, and the number
 * that matters here is only "far enough back that the shelves read in front of
 * it". Deep enough to kill the door mouldings, light enough that a customer's
 * own wall keeps its colour and its skirting. */
const RECESS_TOP = 0.58;
const RECESS_BOTTOM = 0.86;

/** The traced opening, darkened as the hole it is.
 *
 * Drawn as a gradient down the quad's own left edge rather than down the
 * screen, so a photograph taken at an angle — or with the camera rolled —
 * shades along the wall instead of across it. */
function shadeRecess(ctx: CanvasRenderingContext2D, corners: [number, number][]) {
  const [tl, tr, br, bl] = corners;
  const topMid = [(tl[0] + tr[0]) / 2, (tl[1] + tr[1]) / 2] as const;
  const botMid = [(bl[0] + br[0]) / 2, (bl[1] + br[1]) / 2] as const;

  const g = ctx.createLinearGradient(topMid[0], topMid[1], botMid[0], botMid[1]);
  const grey = (v: number) => {
    const c = Math.round(255 * v);
    return `rgb(${c},${c},${c})`;
  };
  g.addColorStop(0, grey(RECESS_TOP));
  // Most of the fall-off is in the top third: the head of the opening is what
  // shades it, so the light comes back quickly once you are below the shelf
  // line and then stays fairly even down to the floor.
  g.addColorStop(0.34, grey(RECESS_TOP + (RECESS_BOTTOM - RECESS_TOP) * 0.72));
  g.addColorStop(1, grey(RECESS_BOTTOM));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.closePath();
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

export default function WardrobeRoomRenderer({
  photoUrl,
  corners,
  modelId,
  colourName,
  widthMm,
  handleFinish,
  recessed,
  wallColour,
}: WardrobeRoomRendererProps) {
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

      const PW = photo.naturalWidth;
      const PH = photo.naturalHeight;
      canvas.width = PW;
      canvas.height = PH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(photo, 0, 0);

      const model = wardrobeModelById(modelId);

      // Walk-ins are rooms rather than objects — those renders look INTO the
      // robe at two or three walls receding away. Modelling one would mean
      // modelling a room; the honest placement is a view through the trace.
      if (model.kind === 'walk-in') {
        const art = await wardrobeArtwork(model, colourName, 'interior');
        if (cancelled) return;
        drawWalkIn(ctx, art.image, art.width, art.height, corners);
        return;
      }

      // MEASURED BEFORE ANYTHING IS DRAWN OVER IT, or the wardrobe gets sampled
      // as though it were the wall it is standing on.
      const profile = profilePhoto(ctx, corners, PW, PH);

      // BUILT AT THE PRODUCT'S OWN WIDTH, AND ALLOWED TO NOT FIT.
      //
      // The trace does not size the cabinet. It fixes the SCALE and the plane:
      // the quad is an opening `tracedWidthMm` across and 2016 high, which is
      // what turns the photograph into millimetres. The cabinet is then built
      // at the width the customer picked and put into that space at true size.
      //
      // So when the two agree the cabinet fills the opening exactly, and when
      // they do not it overhangs — and THAT IS THE ANSWER, not a fault. A 2400
      // unit picked against a 1500 opening runs 900mm past the architrave, on
      // screen, at the scale of the customer's own room. It is the one thing
      // the visualiser can say that a dimension table cannot: this model will
      // not fit your place. Building to the trace instead made every width
      // land flush and threw that away, which is the whole reason a customer
      // clicks through the widths at all.
      //
      // Left-aligned, because the model's origin is the opening's bottom-left
      // and a built-in starts from one wall — so the overhang collects at the
      // right-hand end where the trace's own edge is there to measure it
      // against, rather than being split invisibly across both sides.
      //
      // What this DOES require is that the trace be honest about the opening,
      // since tracedWidthMm reads it as 2016 high — see ALCOVE_BOXES, where
      // getting that wrong by 10% had every width overhanging.
      const drawWidthMm = widthMm ?? DEFAULT_WIDTH_MM;
      const cam = cameraFromQuad(
        corners,
        tracedWidthMm(corners, WARDROBE_HEIGHT_MM),
        WARDROBE_HEIGHT_MM,
        PW,
        PH,
      );
      if (!cam) return;

      // --- render the cabinet on nothing ------------------------------------
      const scale = Math.min(1, MAX_RENDER_PX / Math.max(PW, PH));
      const RW = Math.max(2, Math.round(PW * scale));
      const RH = Math.max(2, Math.round(PH * scale));

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(RW, RH, false);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      // The stickers and decor sheets are tone-mapped photographs already, and
      // the room they are going into is one too. A filmic curve greys both.
      renderer.toneMapping = THREE.NoToneMapping;

      const done = () => {
        renderer.dispose();
        renderer.forceContextLoss();
      };

      const built = await buildWardrobeScene({
        renderer,
        modelId: model.id,
        colourName,
        widthMm: drawWidthMm,
        forRoom: true,
        handleFinish,
        recessed,
        wallColour,
      });
      if (cancelled) {
        built.dispose();
        done();
        return;
      }

      const camera = new THREE.PerspectiveCamera(cam.fovDeg, PW / PH, 0.05, 200);
      camera.position.set(cam.position[0] * MM, cam.position[1] * MM, cam.position[2] * MM);
      // The basis is set directly rather than through lookAt, because lookAt
      // has to invent a roll from a world up-vector and the trace has already
      // said what the roll is: a photograph taken with the camera tilted has a
      // horizon that is not level, and the cabinet has to tilt with it.
      camera.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(
          new THREE.Vector3(...cam.right),
          new THREE.Vector3(...cam.up),
          new THREE.Vector3(...cam.back),
        ),
      );
      camera.updateMatrixWorld(true);

      renderer.render(built.scene, camera);

      // --- composite --------------------------------------------------------
      // RELIT TO THE ROOM BEFORE IT IS LAID DOWN. The render is lit by its own
      // lamps and the room by whatever is in it, and colour is the loudest tell
      // there is — ahead of perspective, ahead of scale. Damped hard, because a
      // render starts far closer to right than a studio photograph does.
      const relit = relightRender(renderer.domElement, profile, RELIGHT_STRENGTH);

      // THE OPENING IS A HOLE, and until this it was a wall.
      //
      // The carcass has no back — the customer's own wall is the back of every
      // compartment, which is the product — so whatever the photograph has in
      // the traced quad shows straight through the empty bays. On a bare recess
      // that is exactly right and is the point. On a photograph of an opening
      // that still has its old doors in it, the doors came through at full
      // brightness: knobs, panel mouldings and the meeting stile all legible
      // between the shelves, and the render read as a cage drawn over a
      // cupboard rather than a cupboard set into one.
      //
      // Nothing is painted in and no back panel comes back. What goes down is
      // the SHADE a 500mm recess has: a hole that deep, lit only by the room in
      // front of it, is darkest under its own head and lifts toward the floor
      // where the light reaches. Multiplied through the quad, so it darkens
      // what is there rather than covering it — the wall, or the doors, or
      // whatever else, still reads, at the brightness a recess would give it.
      shadeRecess(ctx, corners);

      ctx.save();
      // A little softer, to sit in the same focal plane. A hand-held room photo
      // is never critically sharp, and a render at full acuity on top of one
      // reads as a different exposure rather than a different object.
      if (profile.softness > 0.12) ctx.filter = `blur(${profile.softness.toFixed(2)}px)`;
      ctx.drawImage(relit, 0, 0, PW, PH);
      ctx.restore();

      // GRAIN ONLY WHERE THE CABINET IS. The render arrived noiseless and the
      // photograph did not, so the wardrobe is the one region of the frame with
      // no sensor noise in it — a hole the eye finds before it finds anything
      // about the perspective.
      const bounds = opaqueBounds(renderer.domElement, RW, RH, PW / RW, PH / RH);
      if (bounds) applyGrain(ctx, bounds, profile.grain);

      built.dispose();
      done();
    };

    render().catch(() => {
      /* photo or artwork failed — leave the previous frame in place */
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUrl, modelId, colourName, widthMm, handleFinish, recessed, wallColour, JSON.stringify(corners)]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />;
}
