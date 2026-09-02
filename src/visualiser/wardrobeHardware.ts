// ---------------------------------------------------------------------------
// WARDROBE HARDWARE — the handle, and what it is made of.
//
// Two separate questions, and they are separate because they fail differently.
// The TYPE changes the geometry: a bar pull, a knob and a routed finger groove
// are three different shapes on the drawer front, and swapping between them
// changes the silhouette of the whole bank. The FINISH changes only the
// material, and it is the same six finishes whichever shape carries them.
//
// WHERE THE FINISHES COME FROM, and this half is not invented: they are the
// supplier's own hardware finish range, read off the Stegbar Signature Range
// deck with their codes intact — F11 through F16. The deck lists them on the
// shower-screen page under "Hardware Options", and the range is described as
// colour-matched across the products, so these are the finishes the business
// already sells rather than a palette chosen here.
//
// WHERE THE TYPES COME FROM, and this half NEEDS CONFIRMING. The deck says
// nothing about wardrobe handle profiles — its wardrobe pages cover internals,
// sliding doors and walk-ins, and none of them name a pull. So the five below
// are the families a joiner ordinarily quotes, in the trade's own words. They
// are the right shape and the wrong thing to leave unchecked; this file is the
// one place to correct them, and correcting them changes the visualiser, the
// card configurator and the quote together.
// ---------------------------------------------------------------------------

/** How the handle is drawn. The id is what the store holds and what reaches a
 * quote, so it is a stable slug rather than the label. */
export type HandleTypeId = 'bar' | 'd-pull' | 'edge' | 'knob' | 'none';

export interface HandleType {
  id: HandleTypeId;
  label: string;
  /** One line under the name in the picker — what the customer is choosing
   * between, since "D-pull" and "Bar" mean nothing to most people. */
  note: string;
}

/** THE PROFILES, widest-selling first.
 *
 * `none` is last and is a real product rather than an opt-out: a handleless
 * robe has a finger groove routed into the top edge of the front, which is how
 * a great many contemporary wardrobes are made. It is listed as a choice
 * because leaving it off would make "no handle" look like a missing selection.
 */
export const HANDLE_TYPES: HandleType[] = [
  { id: 'bar', label: 'Bar', note: 'Round rail, stands off the front' },
  { id: 'd-pull', label: 'D-pull', note: 'Short squared bow' },
  { id: 'edge', label: 'Edge pull', note: 'Slim lip along the top' },
  { id: 'knob', label: 'Knob', note: 'A pair, centred' },
  { id: 'none', label: 'Handleless', note: 'Routed finger groove' },
];

export interface HandleFinish {
  /** The supplier's own code. Carried rather than derived so it can go on a
   * quote exactly as the deck prints it. */
  code: string;
  name: string;
  /** Base colour. For a metal this is the reflectance tint rather than a paint
   * colour — a brushed nickel is not "grey", it is a mirror with a warm-neutral
   * cast, and the environment supplies most of what you actually see. */
  hex: string;
  /** How much of a mirror it is. The two painted finishes are not metal at all
   * — matte black and matte white are powder-coated, which is a dielectric —
   * and rendering them as metal is what makes a black handle read as a hole. */
  metalness: number;
  /** Brushed rather than polished on most of them: a wardrobe handle is
   * satin-finished, so the reflection is a sheen and not an image. */
  roughness: number;
}

/** THE SUPPLIER'S SIX, in the deck's own order and with its own codes. */
export const HANDLE_FINISHES: HandleFinish[] = [
  { code: 'F15', name: 'Brushed Nickel', hex: '#c6cace', metalness: 0.90, roughness: 0.42 },
  { code: 'F11', name: 'Matte Black', hex: '#2b2b2d', metalness: 0.05, roughness: 0.72 },
  { code: 'F12', name: 'Brushed Gold', hex: '#c2a161', metalness: 0.88, roughness: 0.40 },
  { code: 'F14', name: 'Gunmetal', hex: '#5c5f63', metalness: 0.86, roughness: 0.46 },
  { code: 'F16', name: 'Bright Silver', hex: '#d8dce0', metalness: 0.95, roughness: 0.16 },
  { code: 'F13', name: 'Matte White', hex: '#eeece8', metalness: 0.04, roughness: 0.70 },
];

export const DEFAULT_HANDLE: HandleTypeId = 'bar';
export const DEFAULT_HANDLE_FINISH = 'Brushed Nickel';

export const handleType = (id: string): HandleType =>
  HANDLE_TYPES.find(h => h.id === id) ?? HANDLE_TYPES[0];

export const handleFinish = (name: string): HandleFinish =>
  HANDLE_FINISHES.find(f => f.name === name) ?? HANDLE_FINISHES[0];

/** What the carcass builder needs to draw a pull: the shape, and the colour to
 * fill it with in the flat-shaded 2D path. The 3D scene reads the finish itself
 * so it can use metalness and roughness too. */
export interface HardwareSpec {
  type: HandleTypeId;
  /** 0-255, for Canvas 2D. */
  rgb: [number, number, number];
}

export function hardwareSpec(typeId: string, finishName: string): HardwareSpec {
  const f = handleFinish(finishName);
  const n = f.hex.replace('#', '');
  return {
    type: handleType(typeId).id,
    rgb: [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ],
  };
}
