// ---------------------------------------------------------------------------
// MAKING A CLEAN RENDER BELONG TO A PHONE PHOTOGRAPH.
//
// This is the half of the problem the geometry was never going to solve. The
// projection can put the cabinet on exactly the right four corners and the
// result still reads as a sticker, because the two images were made under
// different conditions and the eye reads the DIFFERENCE long before it reads
// the perspective:
//
//   THE RENDER IS LIT BY A STUDIO and the room is lit by whatever is in it. A
//   white cabinet dropped into a room under warm evening light stays studio
//   neutral, and next to a wall that has gone amber it reads as cut out and
//   pasted -- which it is. Colour is the single loudest tell, ahead of
//   perspective, ahead of scale.
//
//   THE RENDER IS NOISELESS and the photograph is not. Every phone photo has
//   sensor grain, heaviest in the shadows, and a region with none is a hole in
//   the picture. This is why compositing work always ends with grain.
//
//   THE RENDER IS PERFECTLY SHARP and the photograph is not, quite. A wall
//   photographed by hand at 1/30s is a little soft, and an object sitting on it
//   at full acuity looks like it is in a different focal plane -- because it is.
//
//   NOTHING IS DARKER WHERE THE TWO MEET. Real objects occlude the light
//   bouncing around a room, so there is always shade in the crevice where an
//   object meets a wall and a floor. Its absence is what makes a composite
//   hover even when it is placed correctly.
//
// So: measure the photograph, then bring the render to it. Everything here is
// DAMPED rather than exact -- correcting all the way to the wall's own colour
// would make a white wardrobe the same colour as the wall, which is a different
// wrong answer. A white cabinet in a warm room really is warmer than it was in
// the studio, but it is still the lightest, most neutral thing in the frame.
// ---------------------------------------------------------------------------

import type { Point } from './homography';

/** What the photograph is like, measured once per render. */
export interface PhotoProfile {
  /** Median wall colour around the traced opening. */
  wall: [number, number, number];
  /** Its luma, 0..255. */
  wallLuma: number;
  /** Sensor grain, as a standard deviation in levels. */
  grain: number;
  /** How soft the photograph is, as a blur radius in pixels to match it. */
  softness: number;
}

const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  return s[s.length >> 1];
};

/** READS THE ROOM AROUND THE TRACE, not the whole photograph.
 *
 * The wall the wardrobe is going on is the surface it has to agree with, and it
 * can be lit quite differently from the rest of the room -- a window on one side
 * puts a gradient across it that a whole-frame average would flatten away.
 *
 * MEDIAN RATHER THAN MEAN, because the ring around a traced opening is exactly
 * where a customer's furniture, skirting, curtain and light switch are. A mean
 * is dragged by all of them; a median ignores anything that is not most of the
 * ring, which is what "the wall" means.
 */
export function profilePhoto(
  ctx: CanvasRenderingContext2D,
  corners: Point[],
  imageW: number,
  imageH: number,
): PhotoProfile {
  const xs = corners.map(c => c[0]);
  const ys = corners.map(c => c[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const w = x1 - x0;
  const h = y1 - y0;

  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const lumas: number[] = [];

  // A band outside each edge of the trace. Kept clear of the opening itself so
  // nothing already in the room's alcove is mistaken for the wall.
  const bands: [number, number, number, number][] = [
    [x0, y0 - h * 0.22, w, h * 0.18],           // above
    [x0 - w * 0.20, y0, w * 0.16, h],           // left
    [x1 + w * 0.04, y0, w * 0.16, h],           // right
  ];

  for (const [bx, by, bw, bh] of bands) {
    const sx = Math.max(0, Math.round(bx));
    const sy = Math.max(0, Math.round(by));
    const sw = Math.min(imageW - sx, Math.round(bw));
    const sh = Math.min(imageH - sy, Math.round(bh));
    if (sw < 4 || sh < 4) continue;
    const img = ctx.getImageData(sx, sy, sw, sh).data;
    // Every few pixels is plenty for a median and keeps this off the main
    // thread's budget on a 12-megapixel photo.
    for (let i = 0; i < img.length; i += 4 * 7) {
      rs.push(img[i]);
      gs.push(img[i + 1]);
      bs.push(img[i + 2]);
      lumas.push(luma(img[i], img[i + 1], img[i + 2]));
    }
  }

  const wall: [number, number, number] = rs.length
    ? [median(rs), median(gs), median(bs)]
    : [205, 203, 199];

  // --- grain and softness, from a flat patch of that wall ------------------
  // Both are measured on the wall rather than the whole frame on purpose: they
  // have to be read off a surface with no detail of its own, or the room's own
  // texture is counted as noise and the wardrobe gets peppered with it.
  let grain = 0;
  let softness = 0;

  const px = Math.max(0, Math.round(x0));
  const py = Math.max(0, Math.round(y0 - h * 0.20));
  const pw = Math.min(imageW - px, Math.round(w * 0.5));
  const ph = Math.min(imageH - py, Math.round(h * 0.16));

  if (pw > 12 && ph > 12) {
    const img = ctx.getImageData(px, py, pw, ph).data;
    const lum = new Float64Array(pw * ph);
    for (let i = 0; i < pw * ph; i++) lum[i] = luma(img[i * 4], img[i * 4 + 1], img[i * 4 + 2]);

    // Grain is what is left after a 3x3 mean -- the part of the signal with no
    // structure. Taking the MEDIAN of those residuals rather than their mean
    // keeps a picture hook or a scuff from being read as heavy noise.
    const residuals: number[] = [];
    const gradients: number[] = [];
    for (let y = 1; y < ph - 1; y++)
      for (let x = 1; x < pw - 1; x++) {
        const i = y * pw + x;
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) sum += lum[i + dy * pw + dx];
        residuals.push(Math.abs(lum[i] - sum / 9));
        gradients.push(Math.abs(lum[i + 1] - lum[i - 1]) + Math.abs(lum[i + pw] - lum[i - pw]));
      }

    // 1.4826 * MAD is the usual robust stand-in for a standard deviation.
    grain = median(residuals) * 1.4826;

    // SOFTNESS IS INFERRED FROM WHAT THE GRAIN IS DOING, which is the one cue a
    // featureless wall still carries. Grain is per-pixel by nature, so a lens
    // or a shake that blurs the picture blurs the grain with it and neighbouring
    // pixels stop being independent. When the local gradient is small compared
    // with the noise, the image has been smeared; when it is large, it is crisp.
    const g = median(gradients);
    const ratio = grain > 0.01 ? g / grain : 4;
    softness = Math.max(0, Math.min(1.6, 1.5 - ratio * 0.45));
  }

  return {
    wall,
    wallLuma: luma(wall[0], wall[1], wall[2]),
    grain: Math.max(0, Math.min(9, grain)),
    softness,
  };
}

/** How much of the wall's cast to carry into the product. Two thirds: enough
 * that the cabinet is plainly in the same room, short of the point where it
 * stops being the white object it is. */
const CAST_STRENGTH = 0.66;
/** And rather less of the room's exposure, because a render that is dimmed to
 * a dark room's average stops looking like painted board and starts looking
 * like a grey box. */
const EXPOSURE_STRENGTH = 0.42;

/** Repaints a cut-out under the room's own light.
 *
 * WHAT IS BEING MATCHED IS THE ILLUMINANT, not the colour. The cut-out's own
 * board is measured, the wall is measured, and the ratio between them is the
 * difference between the two lights. Applying that ratio moves everything in
 * the picture -- the white board, the shirts, the leather -- by the same amount,
 * which is what actually happens when you carry an object into another room.
 *
 * FINDING THE BOARD IS THE TRICK, and it is the one place the sticker's own
 * staging helps: the carcass is the brightest large neutral thing in the file,
 * and unlike the runtime keyer this only has to find its AVERAGE, not its
 * outline. Being a few per cent off on which pixels counted as board changes
 * the correction by nothing that can be seen.
 *
 * Returns a canvas rather than touching the source, so the original stays
 * cached and a finish or photo change re-derives cleanly.
 */
export function relightCutout(
  image: HTMLImageElement,
  profile: PhotoProfile,
): HTMLCanvasElement {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);

  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;

  // The board's own colour, as the render was lit.
  let br = 0, bg = 0, bb = 0, n = 0;
  for (let i = 0; i < px.length; i += 4 * 5) {
    if (px[i + 3] < 200) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (Math.max(r, g, b) < 165) continue;
    if (Math.max(r, g, b) - Math.min(r, g, b) > 34) continue;
    br += r; bg += g; bb += b; n++;
  }
  if (!n) return canvas;
  br /= n; bg /= n; bb /= n;

  const boardLuma = luma(br, bg, bb);
  const wallL = Math.max(1, profile.wallLuma);

  // CHROMATIC part: the ratio of the two illuminants, with brightness divided
  // out so this carries only the cast and not the exposure.
  const wl = Math.max(1, profile.wallLuma);
  const wallChroma = [profile.wall[0] / wl, profile.wall[1] / wl, profile.wall[2] / wl];
  const boardChroma = [br / boardLuma, bg / boardLuma, bb / boardLuma];

  const gain = [0, 1, 2].map(c => {
    const ratio = wallChroma[c] / Math.max(0.001, boardChroma[c]);
    return 1 + (ratio - 1) * CAST_STRENGTH;
  });

  // EXPOSURE part. A white board photographs a little darker than the wall
  // behind it in the same light -- it is matt, and it is turned away from the
  // window more often than not -- so the target is just under the wall's own
  // level rather than equal to it.
  const exposure = 1 + ((wallL * 0.98) / Math.max(1, boardLuma) - 1) * EXPOSURE_STRENGTH;

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    for (let c = 0; c < 3; c++) {
      const v = px[i + c] * gain[c] * exposure;
      px[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** THE SHADE WHERE THE CABINET MEETS THE ROOM.
 *
 * Drawn BEFORE the wardrobe and along the traced quad's own edges, so it
 * follows the wall's perspective instead of sitting level across the picture.
 *
 * Two parts, because they come from different things. The CONTACT shadow is the
 * hard, narrow darkening right at the floor line, where almost no light reaches
 * -- it is what says the object is resting on something. The AMBIENT one is the
 * broad, soft falloff up the wall behind and beside the unit, the light the
 * cabinet is stopping from bouncing around. Only the contact one is nearly
 * opaque; a heavy ambient shadow reads as a spotlit showroom.
 */
export function drawSeatingShadow(ctx: CanvasRenderingContext2D, corners: Point[]) {
  const [tl, tr, br, bl] = corners;
  const width = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
  const height = (Math.hypot(bl[0] - tl[0], bl[1] - tl[1]) + Math.hypot(br[0] - tr[0], br[1] - tr[1])) / 2;
  if (!(width > 0) || !(height > 0)) return;

  ctx.save();

  // Ambient: a soft dark halo behind the whole unit, strongest at the base.
  const spread = Math.max(4, height * 0.055);
  ctx.filter = `blur(${spread}px)`;
  ctx.globalAlpha = 0.30;
  ctx.beginPath();
  ctx.moveTo(tl[0] - spread * 0.4, tl[1] - spread * 0.2);
  ctx.lineTo(tr[0] + spread * 0.4, tr[1] - spread * 0.2);
  ctx.lineTo(br[0] + spread * 0.5, br[1] + spread * 0.7);
  ctx.lineTo(bl[0] - spread * 0.5, bl[1] + spread * 0.7);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();

  // Contact: tight to the floor line and much darker.
  const tight = Math.max(2, height * 0.012);
  ctx.filter = `blur(${tight}px)`;
  ctx.globalAlpha = 0.52;
  ctx.beginPath();
  ctx.moveTo(bl[0] - tight, bl[1] - tight);
  ctx.lineTo(br[0] + tight, br[1] - tight);
  ctx.lineTo(br[0] + tight * 1.6, br[1] + tight * 3.2);
  ctx.lineTo(bl[0] - tight * 1.6, bl[1] + tight * 3.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** WOODGRAIN, for the three finishes with no photograph.
 *
 * The supplied renders are all Matt Wardrobe White, so Natural Oak, Antico Oak
 * and Notaio Walnut have no artwork and fall to the modelled carcass. Modelled
 * board filled with one flat colour is what made the wardrobe read as a block
 * -- and it is a specifically WOOD failure, because the thing that says a panel
 * is timber and not painted MDF is the figure in it. A flat brown rectangle
 * reads as cardboard no matter how well the brown is chosen.
 *
 * WHY THIS IS DRAWN RATHER THAN RECOLOURED FROM THE WHITE RENDER. Tinting the
 * photograph needs the board separated from the staging, and a cream shirt
 * against a white panel is the case that defeats every colour test -- the same
 * wall the old runtime keyer hit. And separation would not be enough on its
 * own: there is no figure in a white melamine render to modulate into walnut,
 * so no tint can invent one. Drawing the grain sidesteps both, because on the
 * modelled path the renderer already knows exactly which surfaces are board and
 * which way each one runs.
 *
 * A CHEAP APPROXIMATION, DELIBERATELY. Real grain is a slice through growth
 * rings, so the convincing part is not the pattern but its ANISOTROPY: fine
 * lines that run one way and vary slowly across the other. At the size a
 * wardrobe renders on a phone that is the whole of what is visible, and
 * anything more elaborate is noise nobody can resolve.
 *
 * Returned as a tile to be multiplied over board that has already been shaded,
 * so it darkens the figure without touching the modelled lighting.
 */
export function makeGrainTile(seed = 1): HTMLCanvasElement {
  const W = 256;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  // A deterministic generator, so a redraw of the same wardrobe produces the
  // same board rather than shimmering on every state change.
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const img = ctx.getImageData(0, 0, W, H);
  const px = img.data;

  // Growth rings: a few slowly wandering low-frequency bands across the tile,
  // plus a fine high-frequency line pattern along it. Both run the same way, so
  // the tile has a clear direction -- which is the property that matters.
  // WHOLE NUMBERS OF CYCLES ACROSS THE TILE, so the pattern is periodic and the
  // tile meets itself on all four edges. A fractional frequency leaves a step
  // at the join, and once a panel is several tiles wide those steps line up
  // into visible vertical banding â€” which is what the first version did, and it
  // read as a rendering fault rather than as timber.
  const waves = Array.from({ length: 5 }, () => ({
    ring: 1 + Math.floor(rnd() * 4),
    drift: 1 + Math.floor(rnd() * 3),
    phase: rnd() * Math.PI * 2,
    amp: 0.35 + rnd() * 0.65,
  }));

  for (let y = 0; y < H; y++) {
    // The rings drift along the length, which is what stops the tile reading as
    // a set of parallel stripes.
    let drift = 0;
    for (const wv of waves) drift += Math.sin((y / H) * Math.PI * 2 * wv.drift + wv.phase) * wv.amp;
    for (let x = 0; x < W; x++) {
      const u = x / W + drift * 0.055;
      let v = 0;
      // COARSE RINGS, and the first attempt got this wrong twice over. Fine
      // striations at (3 + freq*5) cycles were averaged away the moment the
      // tile was scaled down to a panel a few hundred pixels wide, and a range
      // of five per cent was invisible even before that. On screen the board
      // came out as flat brown, which is the exact failure the grain was added
      // to fix. Wide rings survive the downscale; the amplitude has to be
      // something the eye can actually find.
      for (const wv of waves) v += Math.sin(u * Math.PI * 2 * wv.ring + wv.phase) * wv.amp;
      v /= waves.length;
      // A touch of per-pixel break-up, or the lines are too regular to be wood.
      const fleck = (rnd() - 0.5) * 0.10;
      const level = 255 * (1 - Math.max(0, 0.10 + v * 0.11 + fleck * 0.6));
      const i = (y * W + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = Math.max(0, Math.min(255, level));
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Whether a finish is timber and therefore wants grain. White melamine has
 * none, and putting figure on it would be a different kind of wrong. */
export const isWoodFinish = (slug: string) => slug !== 'white';

/** GRAIN, over the region the wardrobe was drawn into.
 *
 * LAST, and only where the product went. Grain over the whole frame would be
 * grain on top of the photograph's own, which doubles it; the render is the
 * only part of the picture that has none.
 *
 * Monochrome rather than per-channel. Real sensor noise is correlated across
 * channels after demosaicing, and independent RGB noise reads as coloured
 * speckle -- the look of a bad film-grain filter rather than of a photograph.
 */
export function applyGrain(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; w: number; h: number },
  sigma: number,
) {
  if (sigma < 0.35) return;
  const x = Math.max(0, Math.floor(region.x));
  const y = Math.max(0, Math.floor(region.y));
  const w = Math.min(ctx.canvas.width - x, Math.ceil(region.w));
  const h = Math.min(ctx.canvas.height - y, Math.ceil(region.h));
  if (w < 1 || h < 1) return;

  const img = ctx.getImageData(x, y, w, h);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    // Box-Muller would be more correct; the average of three uniforms is close
    // enough to Gaussian at this amplitude and a good deal cheaper over a few
    // million pixels.
    const nse = ((Math.random() + Math.random() + Math.random()) / 1.5 - 1) * sigma * 1.9;
    // Heavier in the shadows, as a sensor's is: the shot noise is constant but
    // the signal it sits on is not.
    const shade = 1.35 - (px[i] + px[i + 1] + px[i + 2]) / 765 * 0.7;
    const d = nse * shade;
    px[i] = Math.max(0, Math.min(255, px[i] + d));
    px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + d));
    px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + d));
  }
  ctx.putImageData(img, x, y);
}

