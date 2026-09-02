// ---------------------------------------------------------------------------
// WARDROBE HARDWARE — the handle, and what it is made of.
//
// Two separate questions, and they are separate because they fail differently.
// The TYPE changes the geometry — a bar is a line across the drawer front and a
// knob is a point on it, which is a different silhouette for the whole bank.
// The FINISH changes only the material, and it is the same three whichever
// shape carries them.
//
// TWO PROFILES AND THREE FINISHES, WHICH IS THE RANGE. It was five and six,
// taken from what a joiner could quote and from every finish printed in the
// Stegbar Signature deck. That was reading a catalogue as an order form: most
// of them are not what this business sells, and a picker offering choices
// nobody can order is worse than a short one — each is a render to get right, a
// line on a quote to honour, and something to explain on the phone.
//
// The finish codes are the supplier's own and are kept verbatim, because they
// are what goes on the order. Silver, black and brass are the three the range
// is sold in.
//
// This file is the one place to correct any of it, and correcting it changes
// the visualiser, the card configurator and the quote together.
// ---------------------------------------------------------------------------

/** How the handle is drawn. The id is what the store holds and what reaches a
 * quote, so it is a stable slug rather than the label. */
export type HandleTypeId = 'bar' | 'knob';

export interface HandleType {
  id: HandleTypeId;
  label: string;
  /** One line under the name in the picker — what the customer is choosing
   * between, since a profile name on its own is a shape nobody can picture. */
  note: string;
}

/** THE TWO PROFILES THE RANGE IS ACTUALLY FITTED WITH.
 *
 * This was five — bar, D-pull, edge pull, knob and handleless — which was the
 * list of families a joiner COULD quote rather than the list this business
 * sells. Three of them were speculative, and a picker offering choices nobody
 * can order is worse than a short one: every extra profile is a render to get
 * right, a line on a quote to honour and a thing to explain on the phone.
 *
 * Two is also enough to be a real choice. A bar and a knob are the two ends of
 * how a drawer front reads — a horizontal line across it, or a single point on
 * it — and everything else is a variation between them. */
export const HANDLE_TYPES: HandleType[] = [
  { id: 'bar', label: 'Bar', note: 'Round rail across the front' },
  { id: 'knob', label: 'Knob', note: 'One, centred' },
];

export interface HandleFinish {
  /** The supplier's own code. Carried rather than derived so it can go on a
   * quote exactly as the deck prints it. */
  code: string;
  name: string;
  /** Base colour. For a metal this is the reflectance tint rather than a paint
   * colour — silver is not "grey", it is a mirror with a neutral cast, and the
   * environment supplies most of what you actually see. */
  hex: string;
  /** How much of a mirror it is. Black is not metal at all — it is powder
   * coated, which is a dielectric — and rendering it as metal is what makes a
   * black handle read as a hole punched in the cabinet. */
  metalness: number;
  /** Brushed rather than polished: a wardrobe handle is satin-finished, so the
   * reflection is a sheen and not an image. */
  roughness: number;
}

/** THE THREE THE RANGE IS SOLD IN, with the supplier's codes kept.
 *
 * The deck lists six hardware finishes and all six were offered here, which was
 * reading a catalogue page as a wardrobe order form. Silver, black and brass
 * are what the business actually sells against, so gunmetal, matte white and
 * the second silver are gone — brushed nickel and bright silver were two names
 * for the customer's one answer, and having both on screen asked a question
 * with no meaningful difference behind it.
 *
 * The codes stay because they are what goes on the order. */
export const HANDLE_FINISHES: HandleFinish[] = [
  { code: 'F16', name: 'Silver', hex: '#d3d7db', metalness: 0.93, roughness: 0.28 },
  { code: 'F11', name: 'Black', hex: '#2b2b2d', metalness: 0.05, roughness: 0.72 },
  { code: 'F12', name: 'Brass', hex: '#c2a161', metalness: 0.88, roughness: 0.40 },
];

export const DEFAULT_HANDLE: HandleTypeId = 'bar';
export const DEFAULT_HANDLE_FINISH = 'Silver';

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
