// ---------------------------------------------------------------------------
// WARDROBE HARDWARE — the handle, and what it is made of.
//
// ONE QUESTION: WHAT FINISH. There is no profile picker any more.
//
// It was five shapes, then two, and now none — each cut for the same reason.
// The pull on the drawer tower is the pull; the range does not offer a choice
// of it, and asking which shape it was meant inventing a decision to collect,
// a render to keep right and a line on a quote to honour. What is real is the
// finish, and it is the same finish on every piece of visible metalwork in the
// cabinet: the drawer pulls and the hanging rails are bought together.
//
// THREE FINISHES, WHICH IS THE RANGE. It was every finish printed in the
// Stegbar Signature deck, which was reading a catalogue page as an order form.
// Silver, black and brass are what the business sells against; the codes are
// the supplier's own and are kept verbatim because they are what goes on the
// order.
//
// This file is the one place to correct any of it, and correcting it changes
// the visualiser, the card configurator and the quote together.
// ---------------------------------------------------------------------------

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

export const DEFAULT_HANDLE_FINISH = 'Silver';

export const handleFinish = (name: string): HandleFinish =>
  HANDLE_FINISHES.find(f => f.name === name) ?? HANDLE_FINISHES[0];

/** What the carcass builder needs to draw the metalwork: the colour to fill it
 * with in the flat-shaded 2D path. The 3D scene reads the finish itself so it
 * can use metalness and roughness too. */
export interface HardwareSpec {
  /** 0-255, for Canvas 2D. */
  rgb: [number, number, number];
}

export function hardwareSpec(finishName: string): HardwareSpec {
  const n = handleFinish(finishName).hex.replace('#', '');
  return {
    rgb: [
      parseInt(n.slice(0, 2), 16),
      parseInt(n.slice(2, 4), 16),
      parseInt(n.slice(4, 6), 16),
    ],
  };
}
