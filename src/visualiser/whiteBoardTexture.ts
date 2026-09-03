// ---------------------------------------------------------------------------
// MATT WHITE MELAMINE, GENERATED.
//
// The three timber finishes get the supplier's own decor sheet photographed —
// see FINISH_TEXTURE — and white got nothing, on the reasoning that Matt
// Wardrobe White is a plain surface and a plain surface needs no photograph.
// That reasoning is wrong, and it is wrong in the specific way that makes
// renders look like renders: a plain surface is not a UNIFORM one.
//
// What a real matt white board does, that a flat fill does not:
//
//   IT IS NOT SMOOTH. Melamine is pressed against a textured plate, so the
//   surface carries a fine orange peel a few tenths of a millimetre across.
//   You cannot see it as texture at arm's length. You see it as the reason the
//   sheen breaks up instead of sliding evenly across the panel, and that is
//   most of what says "board" rather than "white rectangle".
//
//   IT SCATTERS UNEVENLY. Roughness varies slightly over the surface, so one
//   patch catches the window and the next does not. On a white board this
//   matters far more than colour variation, because a white board genuinely
//   has almost no colour variation — the albedo really is uniform. What is not
//   uniform is how it scatters, and a constant roughness is what makes white
//   read as moulded plastic.
//
// So this generates three maps off one noise field: a normal map for the peel,
// a roughness map for the scatter, and a very low-contrast albedo map for the
// slow mottle a large sheet has. The albedo is deliberately the weakest of the
// three — turn it up and the board reads as dirty rather than as board.
//
// GENERATED RATHER THAN PHOTOGRAPHED because a photograph of white board is
// mostly a photograph of the lighting it was shot under, and that lighting
// would then be baked into every render under every other lighting. The peel
// is a physical property and is the same on every sheet; the way it catches
// this room's window is the renderer's business.
// ---------------------------------------------------------------------------

import * as THREE from 'three';

/** How much real board one tile of these maps covers, millimetres.
 *
 * SMALL, and much smaller than the timber tile. FINISH_TILE_MM is 900x1800
 * because that is the crop of a decor sheet and oak figure is a thing you
 * measure in tens of centimetres. Orange peel is a thing you measure in tenths
 * of a millimetre, so at 900mm across a 512px tile each pixel would be 1.8mm
 * and the finest detail the map could hold would be five millimetres wide —
 * which is not orange peel, it is a stucco wall. At 180mm a pixel is a third of
 * a millimetre and the peel comes out the size peel actually is. */
export const WHITE_TILE_MM = { w: 180, h: 180 };

const SIZE = 512;

/** How many times the broad maps repeat within one peel tile.
 *
 * A fraction, so they stretch rather than repeat: at 1/3 the sheen patches
 * cover 540mm of board where the peel covers 180mm. That is the difference
 * between a variation you can still see across a bedroom and one that averages
 * to a flat fill by the time a 507mm panel is ninety pixels wide. */
const BROAD_REPEAT = 1 / 3;

/** Deterministic, so the board is the same board on every render.
 *
 * An xorshift rather than Math.random: the maps are built fresh each time the
 * scene is, and a wardrobe whose grain reshuffles when you change its width
 * would be the most obvious tell in the picture. */
function makeRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Tileable value noise. The lattice wraps, so the map repeats across a run of
 * shelves without a seam at every joint. */
function lattice(g: number, rnd: () => number): Float32Array {
  const a = new Float32Array(g * g);
  for (let i = 0; i < a.length; i++) a[i] = rnd();
  return a;
}

const fade = (t: number) => t * t * (3 - 2 * t);

function noiseAt(a: Float32Array, g: number, x: number, y: number): number {
  const fx = x * g, fy = y * g;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fade(fx - x0), ty = fade(fy - y0);
  const at = (xx: number, yy: number) => a[(((yy % g) + g) % g) * g + (((xx % g) + g) % g)];
  const v0 = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
  const v1 = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
  return v0 * (1 - ty) + v1 * ty;
}

/** Several octaves of it, normalised to 0..1. */
function fbm(grids: { g: number; w: number }[], rnd: () => number) {
  const layers = grids.map(({ g, w }) => ({ a: lattice(g, rnd), g, w }));
  const total = grids.reduce((s, l) => s + l.w, 0);
  return (x: number, y: number) => {
    let v = 0;
    for (const l of layers) v += noiseAt(l.a, l.g, x, y) * l.w;
    return v / total;
  };
}

export interface WhiteBoardMaps {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  dispose(): void;
}

/** The three maps, built off one noise field.
 *
 * `base` is the finish's own measured colour — this varies it, it does not
 * replace it, so Matt Wardrobe White stays the white on the quote. */
/** THE MAPS ARE THE EXPENSIVE PART OF BUILDING A SCENE, so they are built
 * once per colour and kept.
 *
 * Three 512x512 maps, each pixel several octaves of value noise: 786,432 pixels
 * with a dozen lattice reads apiece, plus a second full pass for the normals.
 * That is most of the cost of buildWardrobeScene, and it was being paid again
 * on every rebuild — every width, every model, every handle finish — to produce
 * byte-for-byte the same three canvases, because the generator is deterministic
 * and takes one argument.
 *
 * Keyed on that argument. Never evicted: there are four board colours in the
 * range and only white has maps at all, so the cache holds exactly one entry.
 *
 * WHICH IS WHY THESE ARE NEVER DISPOSED. A cached texture outlives the scene
 * that first asked for it, so the scene must not dispose it — see the note
 * where WhiteBoardMaps.dispose is called. */
const mapCache = new Map<string, WhiteBoardMaps | null>();

export function makeWhiteBoardMaps(base: THREE.Color): WhiteBoardMaps | null {
  const key = base.getHexString();
  const hit = mapCache.get(key);
  if (hit !== undefined) return hit;
  const made = buildWhiteBoardMaps(base);
  mapCache.set(key, made);
  return made;
}

function buildWhiteBoardMaps(base: THREE.Color): WhiteBoardMaps | null {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = SIZE;
    c.height = SIZE;
    return c;
  };
  const albedo = mk(), rough = mk(), norm = mk();
  const ac = albedo.getContext('2d');
  const rc = rough.getContext('2d');
  const nc = norm.getContext('2d');
  if (!ac || !rc || !nc) return null;

  const rnd = makeRng(0x5f3a91c7);

  // THE PEEL. Almost all of it at the finest scale the tile can carry — 256
  // cells over 180mm is a cell about 0.7mm across, which is the size of the
  // dimple pattern on a pressed board. The coarser octaves under it stop the
  // result reading as uniform sandpaper.
  const peel = fbm([{ g: 256, w: 1.0 }, { g: 128, w: 0.42 }, { g: 64, w: 0.16 }], rnd);
  // THE SCATTER, at a much larger scale: patches of a few centimetres that take
  // the light slightly differently. This is the map doing the most work.
  const scatter = fbm([{ g: 12, w: 1.0 }, { g: 28, w: 0.5 }, { g: 6, w: 0.6 }], rnd);
  // THE MOTTLE, larger still and barely there.
  const mottle = fbm([{ g: 5, w: 1.0 }, { g: 11, w: 0.45 }], rnd);

  const H = new Float32Array(SIZE * SIZE);
  const aImg = ac.createImageData(SIZE, SIZE);
  const rImg = rc.createImageData(SIZE, SIZE);
  const nImg = nc.createImageData(SIZE, SIZE);

  // sRGB, because the albedo map is a colour and three reads it as one.
  const b = base.clone().convertLinearToSRGB();
  const br = b.r * 255, bg = b.g * 255, bb = b.b * 255;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE, v = y / SIZE;
      const i = y * SIZE + x;
      const p = peel(u, v);
      H[i] = p;

      // ALBEDO: ±1.2% of luminance, and no more. A white board's colour really
      // is uniform; pushing this is how a clean finish starts to look grubby.
      // A whisper of the peel goes in too, so the two maps agree about where
      // the high spots are.
      const k = 1 + (mottle(u, v) - 0.5) * 0.024 + (p - 0.5) * 0.010;
      const j = i * 4;
      aImg.data[j] = Math.max(0, Math.min(255, br * k));
      aImg.data[j + 1] = Math.max(0, Math.min(255, bg * k));
      aImg.data[j + 2] = Math.max(0, Math.min(255, bb * k));
      aImg.data[j + 3] = 255;

      // ROUGHNESS: matt board sits high — around 0.80 — and wanders about it.
      // The peel contributes a little because the tops of the dimples are
      // burnished slightly smoother than the hollows.
      const rr = 0.80 + (scatter(u, v) - 0.5) * 0.15 - (p - 0.5) * 0.05;
      const rv = Math.max(0, Math.min(255, Math.round(rr * 255)));
      rImg.data[j] = rv;
      rImg.data[j + 1] = rv;
      rImg.data[j + 2] = rv;
      rImg.data[j + 3] = 255;
    }
  }

  // NORMALS from the height field, by central difference. Wrapped, so the map
  // tiles as cleanly as the noise under it does.
  //
  // THE STRENGTH IS THE ONE NUMBER TO GET RIGHT, and 2.6 was wrong by an order
  // of magnitude. Real orange peel is a few microns deep over about half a
  // millimetre: you never see it as relief, you see it as the reason the sheen
  // breaks up. At 2.6 the drawer fronts — the only large board panels facing
  // the camera — came out as rendered stucco, a wall of plaster where a
  // pressed white front should be.
  //
  // It is worse than a wrong-looking surface, because the tile is 180mm and a
  // 507mm front is about 150 pixels on screen: nearly three tiles of 512 texels
  // minified into that, which aliases, and a strong normal map is exactly what
  // turns aliasing into crawling noise. Shallow enough and the mip chain has
  // almost nothing left to alias.
  const STRENGTH = 0.30;
  const at = (x: number, y: number) => H[(((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * STRENGTH;
      const dy = (at(x, y + 1) - at(x, y - 1)) * STRENGTH;
      const len = Math.hypot(dx, dy, 1);
      const j = (y * SIZE + x) * 4;
      nImg.data[j] = Math.round((-dx / len * 0.5 + 0.5) * 255);
      nImg.data[j + 1] = Math.round((-dy / len * 0.5 + 0.5) * 255);
      nImg.data[j + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      nImg.data[j + 3] = 255;
    }
  }

  ac.putImageData(aImg, 0, 0);
  rc.putImageData(rImg, 0, 0);
  nc.putImageData(nImg, 0, 0);

  const tex = (canvas: HTMLCanvasElement, colour: boolean, repeat: number) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    // Only the albedo is a colour. Roughness and normals are data, and reading
    // them through the sRGB curve bends both.
    t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    // TWO SCALES OUT OF ONE TILE, because the peel and the sheen are not the
    // same size of thing and one tile cannot be both.
    //
    // The geometry's UVs are laid out for WHITE_TILE_MM, which is set small
    // enough to hold orange peel. That is right for the turntable and useless
    // in the room: a 507mm panel there is about ninety pixels wide, so a tile
    // of 512 texels averages away to a flat fill and the board is back where it
    // started. The peel keeps the fine tile; the sheen and the mottle get their
    // own repeat, which stretches them to patches of half a metre or so — a
    // scale that survives being seen from across a bedroom.
    t.repeat.set(repeat, repeat);
    return t;
  };

  const map = tex(albedo, true, BROAD_REPEAT);
  const roughnessMap = tex(rough, false, BROAD_REPEAT);
  const normalMap = tex(norm, false, 1);

  return {
    map,
    roughnessMap,
    normalMap,
    dispose() {
      map.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
    },
  };
}
