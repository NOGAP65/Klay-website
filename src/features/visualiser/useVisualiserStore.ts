import { create } from 'zustand';
import { CURTAIN_COLOURS, HARDWARE_HEX, RYNAMIC_COLOURS } from '../../data/products';
import { pricePerBlind, type BlindType } from '../../lib/pricing';
import { DEFAULT_WIDTH_MM, wardrobeModelById, WARDROBE_MODELS, type WardrobeKind } from './wardrobes';
import { DEFAULT_WALL_COLOUR } from './wallColours';
import { DEFAULT_HANDLE_FINISH } from './wardrobeHardware';

type Point = [number, number];

interface TracedArea {
  id: string;
  corners: Point[];
  blindType: string;
  fabricColor: string;
  hardwareColor: string;
  controlType: 'manual' | 'motorised';
  showChain: boolean;
  confirmed: boolean;
}

// BlindType is defined by lib/pricing (money and product identity are the same
// vocabulary) and re-exported here so the many components importing it from the
// store keep working.
export type { BlindType };
export type HardwareColour = 'white' | 'black' | 'chrome';
export type ProductCategory = 'blind' | 'curtain' | 'wardrobe' | 'shelving';

/** Wardrobes and shelving are one renderer, one control panel and one store
 * shape — they differ in which SKUs they offer and how tall those are. Every
 * branch that used to test for 'wardrobe' asks this instead, so adding the
 * shelving tab did not mean finding and widening a dozen equality checks. */
export const isJoinery = (c: ProductCategory) => c === 'wardrobe' || c === 'shelving';
export type CurtainType = 'blockout' | 'sheer';
export type CurtainOperation = 'manual' | 'motorised';
export type CurtainMount = 'ceiling' | 'window';
export type CurtainSize = 'small' | 'medium' | 'large' | 'xl';

// The heading used to be a choice of four (box, pencil, pinch, S-fold). The
// range is wave fold only, so there is nothing to choose and no `curtainFold`
// state: Canvas2DCurtainRenderer draws wave folds and knows no other kind.

/** The colour card for a product category. Blinds and curtains are different
 * cloth from different mills and do not share a range — see products.ts. Every
 * colour lookup goes through here so the two can never be crossed. */
export const coloursFor = (category: ProductCategory) =>
  category === 'curtain' ? CURTAIN_COLOURS : RYNAMIC_COLOURS;
// ^ 'wardrobe' falls to RYNAMIC_COLOURS deliberately. It never reads this card —
// wardrobe finishes live in wardrobes.ts under their own state — and returning
// the blind card means switching to wardrobes reconciles fabricColour against
// the palette it already held, so crossing to wardrobes and back cannot quietly
// reset the blind the customer configured.

const CURTAIN_BASE_PRICES: Record<CurtainSize, number> = {
  small: 320,
  medium: 420,
  large: 560,
  xl: 720,
};

const CURTAIN_MOTOR_ADDON = 200;

/** UI cap on the size of a job. `MAX_QUANTITY` in lib/pricing is the money
 * model's clamp and is higher (40); this is the smaller number the stepper
 * offers, because twelve is already the edge of what a 30%-wide panel can show
 * as a row of windows you pick from. */
export const MAX_WINDOWS = 12;

// ---------------------------------------------------------------------------
// ONE JOB, MANY WINDOWS.
//
// A job is `windows`: one WindowConfig per window, each independently
// configurable, plus `activeWindow` saying which one the panel and the canvas
// are showing.
//
// THE FLAT FIELDS ARE windows[activeWindow]. blindType, fabricColour and the
// rest still sit at the top level of the store and are kept in step by every
// setter below; selecting another window copies its stored config back over
// them. That mirroring is the whole design — Canvas2DBlindRenderer, the curtain
// renderer, KlayConfigurator and the three other embeds of VisualiserControls
// all read the flat fields, and not one of them has to learn that a job can
// hold more than one window.
//
// `productCategory` is deliberately NOT per-window. Blinds and curtains leave
// the site down different paths — curtains are enquiry-only everywhere, see
// CURTAIN_ENQUIRY in VisualiserShowcase — so a job mixing them could not be
// priced or bought as one thing.
//
// WINDOW 1 LEADS; THE REST FOLLOW UNTIL TOUCHED.
//
// Cloning the last window when the job grew was not enough, because it only
// looked at the moment of growing. Set the count to three FIRST — which is the
// natural order, it is the first question the panel asks — and windows 2 and 3
// were stamped out of the factory default and then stranded there: every choice
// made afterwards went to window 1 alone, so a job configured in Charcoal
// sunscreen quietly carried two White blockout blinds to the cart.
//
// So following is continuous, not a one-off copy. A window is either FOLLOWING
// window 1 — it takes every change made to window 1, whenever it is made — or
// CUSTOMISED, meaning the customer changed that window itself and it now keeps
// its own configuration. `customised` on each window is which of the two it is,
// and it flips the moment a change lands on that window and actually differs
// from what was there.
// ---------------------------------------------------------------------------

/** Everything one window can differ from another in. */
export interface WindowConfig {
  blindType: BlindType;
  fabricColour: string;
  hardwareColour: HardwareColour;
  windowSize: 'small' | 'medium' | 'large';
  operation: 'manual' | 'motorised';
  curtainType: CurtainType;
  curtainOperation: CurtainOperation;
  curtainMount: CurtainMount;
  curtainSize: CurtainSize;
}

const DEFAULT_WINDOW: WindowConfig = {
  blindType: 'blockout',
  fabricColour: 'White',
  hardwareColour: 'white',
  windowSize: 'medium',
  operation: 'manual',
  curtainType: 'sheer',
  curtainOperation: 'manual',
  curtainMount: 'ceiling',
  curtainSize: 'medium',
};

const WINDOW_FIELDS = Object.keys(DEFAULT_WINDOW) as (keyof WindowConfig)[];

/** A window as the job holds it: its configuration, plus whether it is still
 * following window 1. */
export interface JobWindow extends WindowConfig {
  /** True once a change has landed on this window itself. Window 1's own flag is
   * never read — it is the one that leads. */
  customised: boolean;
}

/** The configuration half of a job window, which is what the flat store fields
 * mirror. Spelled out field by field rather than destructured, so that adding a
 * field to WindowConfig fails to compile here instead of silently going
 * unmirrored — and so `customised` cannot ride along into the flat state, where
 * it would become a top-level store field that means nothing. */
const configOf = (w: JobWindow): WindowConfig => ({
  blindType: w.blindType,
  fabricColour: w.fabricColour,
  hardwareColour: w.hardwareColour,
  windowSize: w.windowSize,
  operation: w.operation,
  curtainType: w.curtainType,
  curtainOperation: w.curtainOperation,
  curtainMount: w.curtainMount,
  curtainSize: w.curtainSize,
});

/** A fresh window that follows window 1. */
const following = (config: WindowConfig): JobWindow => ({ ...config, customised: false });

/** What one window costs, on whichever axis its category prices on. Every price
 * the visualiser shows — the panel's box, the job total, each cart line — comes
 * through here, so the button and the box above it cannot quote two numbers. */
export function priceWindow(w: WindowConfig, category: ProductCategory): number {
  if (category === 'curtain') {
    return CURTAIN_BASE_PRICES[w.curtainSize] + (w.curtainOperation === 'motorised' ? CURTAIN_MOTOR_ADDON : 0);
  }
  return pricePerBlind(w);
}

/** Writes a change onto the flat fields AND into the windows it belongs to.
 *
 * Every per-window setter goes through here — one that wrote only the flat field
 * would appear to work and then lose the choice the moment another window was
 * selected. Three things happen, and the order of the checks matters:
 *
 *  1. A change that changes nothing is dropped. Clicking Blockout on a window
 *     already set to Blockout must not mark it customised: "customised" has to
 *     mean deliberately different, or merely clicking through the options to see
 *     what they are would cut a window loose from window 1.
 *  2. Editing WINDOW 1 carries every following window with it. This is the fix
 *     for windows stranded on defaults: window 1 leads continuously, not only at
 *     the moment the job grew.
 *  3. Editing any OTHER window writes to that window alone and marks it
 *     customised, so it keeps its own configuration from then on.
 */
const writeThrough =
  (patch: Partial<WindowConfig>) =>
  (s: { windows: JobWindow[]; activeWindow: number }) => {
    const active = s.windows[s.activeWindow];
    const keys = Object.keys(patch) as (keyof WindowConfig)[];
    if (keys.every(k => active[k] === patch[k])) return {};

    const editingLead = s.activeWindow === 0;
    return {
      ...patch,
      windows: s.windows.map((w, i) => {
        if (i === s.activeWindow) return { ...w, ...patch, customised: w.customised || !editingLead };
        if (editingLead && !w.customised) return { ...w, ...patch };
        return w;
      }),
    };
  };

interface VisualiserStore {
  // Product selection
  productCategory: ProductCategory;
  blindType: BlindType;
  fabricColour: string;         // Rynamic colour name, e.g. 'White'
  hardwareColour: HardwareColour;
  windowSize: 'small' | 'medium' | 'large';
  operation: 'manual' | 'motorised';
  lockedRange: string | null;   // if set from product page, blind type picker is hidden and locked
  defaultWindowActive: boolean; // true until the user uploads/selects their own photo — locks the trace to the preset default-window pins

  // The job. windows[activeWindow]'s configuration is mirrored by the flat
  // fields above; window 1 leads the ones still following it.
  windows: JobWindow[];
  activeWindow: number;

  // Curtain-specific
  curtainType: CurtainType;
  curtainOperation: CurtainOperation;
  curtainMount: CurtainMount;
  curtainSize: CurtainSize;
  curtainOpenness: number;
  /** Built-in or walk-in. Chosen before the layout, because the two are
   * different products drawn from different viewpoints and placed by different
   * rules — see Canvas2DWardrobeRenderer. */
  wardrobeKind: WardrobeKind;
  /** Which Forma layout is shown. Always one belonging to wardrobeKind. */
  wardrobeModel: string;
  /** Finish name, resolved against WARDROBE_COLOURS in wardrobes.ts. Separate
   * from fabricColour on purpose: a joinery finish and a blind fabric are
   * different cards, and sharing one field made switching category rewrite the
   * other product's choice. */
  wardrobeColour: string;

  /** BUILT INTO AN OPENING, OR STANDING AGAINST A WALL.
   *
   * VISUALISER ONLY, and deliberately not a field on the range card. It is not
   * a variant of the product — the same SKU goes in either way — it is a fact
   * about the customer's room, and the only thing it settles is whether the run
   * needs end panels. That is a question for someone looking at a picture of
   * their own wall, not for someone picking a model off a card.
   *
   * Recessed is the default because it is what the range is designed for and
   * what every photograph in the supplier's deck shows. */
  wardrobeRecessed: boolean;

  /** THE CUSTOMER'S OWN WALL COLOUR, as a hex.
   *
   * VISUALISER ONLY, like wardrobeRecessed and for the same reason: it is a
   * fact about their room rather than anything about the product, and it never
   * reaches a quote. What it buys is the only comparison that matters — a white
   * robe against an off-white wall and the same robe against a deep green one
   * are two different pictures, and it is the second that decides the sale.
   *
   * Held as a hex rather than a name because the picker can return any colour;
   * the name is looked up for display. See wallColours. */
  wardrobeWallColour: string;

  /** The finish's NAME, matching HANDLE_FINISHES — the same convention
   * wardrobeColour uses, so what is stored is what gets written on the quote
   * rather than a hex nobody can read back. */
  wardrobeHandleFinish: string;

  // Visual state
  photoUrl: string | null;
  rollPosition: number;         // 0 = open, 1 = closed
  tracedAreas: TracedArea[];
  activeAreaId: string | null;
  compareMode: boolean;
  compareDivider: number;

  // Computed
  getCurrentPrice: () => number;
  getCurtainPrice: () => number;
  /** Every window in the job, each on its own configuration. This is the figure
   * a buy button should carry — `getCurrentPrice() * n` is only right while the
   * windows all match, which they no longer have to. */
  getJobTotal: () => number;
  /** True when every window is configured identically — what decides whether
   * offering "match all windows to this one" would do anything. */
  windowsMatch: () => boolean;
  getFabricColor: () => string;
  getHardwareColor: () => string;
  isConfigComplete: () => boolean;

  // Actions
  setProductCategory: (cat: ProductCategory) => void;
  setBlindType: (type: BlindType) => void;
  setFabricColour: (colour: string) => void;
  setHardwareColour: (colour: HardwareColour) => void;
  setWindowSize: (size: 'small' | 'medium' | 'large') => void;
  setOperation: (op: 'manual' | 'motorised') => void;
  setLockedRange: (range: string | null) => void;
  setDefaultWindowActive: (active: boolean) => void;
  /** Grows or shrinks the job. Clamped to 1..MAX_WINDOWS. New windows follow
   * window 1. */
  setWindowCount: (n: number) => void;
  /** Selects the window the panel edits and the canvas renders. */
  setActiveWindow: (index: number) => void;
  /** Copies the window on screen over every other window, and puts them all
   * back to following window 1. */
  applyActiveToAll: () => void;
  setCurtainType: (type: CurtainType) => void;
  setCurtainOperation: (op: CurtainOperation) => void;
  /** WHICH WIDTH THE CHOSEN LAYOUT IS BUILT IN, millimetres.
   *
   * A property of the product, not of the room. Height is the only fixed
   * parameter — 2016 on every unit — so the trace supplies the scale and the
   * position, and this width lands as a ratio against that height. Most layouts
   * are made in one width and never ask; those made in several offer the
   * choice. */
  wardrobeWidthMm: number;
  setWardrobeWidthMm: (mm: number) => void;
  setWardrobeKind: (kind: WardrobeKind) => void;
  setWardrobeModel: (id: string) => void;
  setWardrobeColour: (name: string) => void;
  setWardrobeRecessed: (on: boolean) => void;
  setWardrobeWallColour: (hex: string) => void;
  setWardrobeHandleFinish: (name: string) => void;
  setCurtainMount: (mount: CurtainMount) => void;
  setCurtainSize: (size: CurtainSize) => void;
  setCurtainOpenness: (openness: number) => void;
  setPhotoUrl: (url: string | null) => void;
  setRollPosition: (pos: number) => void;
  addTracedArea: (area: TracedArea) => void;
  updateTracedArea: (id: string, update: Partial<TracedArea>) => void;
  removeTracedArea: (id: string) => void;
  clearTracedAreas: () => void;
  setActiveArea: (id: string | null) => void;
  setCompareMode: (mode: boolean) => void;
  setCompareDivider: (divider: number) => void;
}

export const useVisualiserStore = create<VisualiserStore>((set, get) => ({
  productCategory: 'blind',
  // The flat configuration fields, spread from the same literal that seeds the
  // job's first window — writing the defaults twice is how the two drift.
  ...DEFAULT_WINDOW,
  lockedRange: null,
  defaultWindowActive: true,
  curtainOpenness: 0,
  wardrobeKind: 'built-in',
  wardrobeModel: 'SRSTDH02',
  wardrobeColour: 'Matt Wardrobe White',
  wardrobeRecessed: true,
  wardrobeWallColour: DEFAULT_WALL_COLOUR,
  wardrobeHandleFinish: DEFAULT_HANDLE_FINISH,
  // 3.0's first width, matching wardrobeModel above.
  wardrobeWidthMm: DEFAULT_WIDTH_MM,
  windows: [following(DEFAULT_WINDOW)],
  activeWindow: 0,
  photoUrl: null,
  rollPosition: 0.5,
  tracedAreas: [],
  activeAreaId: null,
  compareMode: false,
  compareDivider: 0.5,

  // Per blind, excluding installation — the sidebar labels it as such. The
  // whole-job total (install included) is priceOrder() in lib/pricing.
  getCurrentPrice: () => {
    const state = get();
    return pricePerBlind(state);
  },

  getCurtainPrice: () => priceWindow(get(), 'curtain'),

  getJobTotal: () => {
    const state = get();
    return state.windows.reduce((total, w) => total + priceWindow(w, state.productCategory), 0);
  },

  windowsMatch: () => {
    const [first, ...rest] = get().windows;
    return rest.every(w => WINDOW_FIELDS.every(k => w[k] === first[k]));
  },

  getFabricColor: () => {
    const state = get();
    const palette = coloursFor(state.productCategory);
    // Falls back to the first colour on the card rather than an invented hex, so
    // an unrecognised name still renders as a real catalogue fabric and the
    // White swatch's value stays defined in exactly one place.
    return palette.find(c => c.name === state.fabricColour)?.hex ?? palette[0].hex;
  },

  getHardwareColor: () => HARDWARE_HEX[get().hardwareColour],

  isConfigComplete: () => {
    const state = get();
    return state.tracedAreas.some(a => a.confirmed) && state.photoUrl !== null;
  },

  // Switching category has to reconcile the selected colour, because the two
  // cards are different ranges. A name carried across that the new card does not
  // list would leave no swatch highlighted while getFabricColor quietly fell back
  // to the first entry — the render and the controls disagreeing about what is
  // selected. A name the new card DOES list is kept, so moving between blinds and
  // curtains on White or Black (or Sand, or Dune) stays where the customer left
  // it, even though the hex behind it differs.
  // Reconciles EVERY window, not just the flat fields. Each window carries a
  // colour name from the card that was showing when it was chosen, so a job of
  // four windows crossing to curtains has four names to check — leaving the
  // stored ones behind would mean selecting window 3 after the switch put a
  // blind colour back into a curtain configuration.
  setProductCategory: (cat) => set(s => {
    // THE TAB IS THE FAMILY. Shelving and wardrobes share wardrobeKind, so
    // switching tab has to move it — otherwise the shelving tab opened on a
    // built-in robe and the Model row offered Forma 1, 2, 3. Carrying the model
    // with it, for the same reason setWardrobeKind does: a robe id is not a
    // shelving id and leaving the old one selected shows the wrong product.
    if (isJoinery(cat)) {
      const kind = cat === 'shelving' ? 'shelving' : 'built-in';
      if (s.wardrobeKind !== kind) {
        const first = WARDROBE_MODELS.filter(m => m.kind === kind)[0];
        if (first) {
          return {
            productCategory: cat,
            wardrobeKind: kind,
            wardrobeModel: first.id,
            wardrobeWidthMm: first.widths[0],
          };
        }
      }
      return { productCategory: cat };
    }
    const palette = coloursFor(cat);
    const reconcile = (name: string) => (palette.some(c => c.name === name) ? name : palette[0].name);
    return {
      productCategory: cat,
      fabricColour: reconcile(s.fabricColour),
      windows: s.windows.map(w => ({ ...w, fabricColour: reconcile(w.fabricColour) })),
    };
  }),
  setBlindType: (type) => set(writeThrough({ blindType: type })),
  setFabricColour: (colour) => set(writeThrough({ fabricColour: colour })),
  setHardwareColour: (colour) => set(writeThrough({ hardwareColour: colour })),
  setWindowSize: (size) => set(writeThrough({ windowSize: size })),
  setOperation: (op) => set(writeThrough({ operation: op })),
  setLockedRange: (range) => set({ lockedRange: range }),
  setDefaultWindowActive: (active) => set({ defaultWindowActive: active }),
  setCurtainType: (type) => set(writeThrough({ curtainType: type })),
  setCurtainOperation: (op) => set(writeThrough({ curtainOperation: op })),
  // Flat set, not writeThrough: writeThrough mirrors a field onto every window
  // in the job, and a wardrobe is not per-window — it is one piece of joinery
  // for the room, the way productCategory itself is.
  // Switching kind carries the layout with it, because a built-in id is not a
  // walk-in id and leaving the old one selected would show a straight run under
  // a heading that says walk-in. First of the new kind, every time.
  setWardrobeKind: (kind) =>
    set({
      wardrobeKind: kind,
      wardrobeModel: kind === 'walk-in' ? '7.0L' : 'SRSTDH02',
    }),
  // The width follows the layout, because the ranges differ — 2.9 is built at
  // one width, 4.0 at three. Carrying a width across a layout change would
  // leave the configurator holding a size that layout is not made in.
  // THE WIDTH IS KEPT WHERE THE NEW SKU IS BUILT IN IT, and snapped to its
  // nearest where it is not.
  //
  // The ranges differ — SRDH is made from 1200 and stops at 2400, the tower
  // products run 1500 to 2700 — so a carried width can be one the new layout is
  // not made in. Resetting outright throws away a choice the customer made;
  // carrying it blindly leaves the configurator holding a size that cannot be
  // ordered. Snapping keeps the intent and stays buildable.
  setWardrobeModel: (id) =>
    set(state => {
      const widths = wardrobeModelById(id).widths;
      if (widths.includes(state.wardrobeWidthMm)) return { wardrobeModel: id };
      const nearest = widths.reduce((best, w) =>
        Math.abs(w - state.wardrobeWidthMm) < Math.abs(best - state.wardrobeWidthMm) ? w : best,
      widths[0]);
      return { wardrobeModel: id, wardrobeWidthMm: nearest };
    }),
  setWardrobeColour: (name) => set({ wardrobeColour: name }),
  setWardrobeRecessed: (on) => set({ wardrobeRecessed: on }),
  setWardrobeWallColour: (hex) => set({ wardrobeWallColour: hex }),
  // Flat sets, like the rest of the wardrobe fields: a wardrobe is one piece of
  // joinery for the room rather than something each window carries, so these do
  // not writeThrough. See the note on setWardrobeKind.
  setWardrobeHandleFinish: (name) => set({ wardrobeHandleFinish: name }),
  setWardrobeWidthMm: (mm) => set({ wardrobeWidthMm: mm }),
  setCurtainMount: (mount) => set(writeThrough({ curtainMount: mount })),
  setCurtainSize: (size) => set(writeThrough({ curtainSize: size })),

  setWindowCount: (n) => set(s => {
    const count = Math.max(1, Math.min(MAX_WINDOWS, Math.floor(n) || 1));
    if (count === s.windows.length) return {};
    const windows = count > s.windows.length
      // New windows are born FOLLOWING WINDOW 1, on window 1's configuration —
      // not the last window's, and emphatically not the factory default. They
      // then keep taking window 1's changes, which is what stops a job sized
      // before it is configured from carrying White blockout blinds nobody
      // chose. See the note at the top of the file.
      ? [
          ...s.windows,
          ...Array.from({ length: count - s.windows.length }, () => following(configOf(s.windows[0]))),
        ]
      : s.windows.slice(0, count);
    // Shrinking can strand the active index past the end, which would leave the
    // panel editing a window nothing prices and the canvas rendering it.
    const activeWindow = Math.min(s.activeWindow, windows.length - 1);
    return { windows, activeWindow, ...configOf(windows[activeWindow]) };
  }),

  setActiveWindow: (index) => set(s => {
    const activeWindow = Math.max(0, Math.min(s.windows.length - 1, Math.floor(index) || 0));
    // The spread is what makes the switch visible: the flat fields become this
    // window's configuration, so the canvas and every field follow it.
    return { activeWindow, ...configOf(s.windows[activeWindow]) };
  }),

  // Every window takes the active one's configuration and goes back to
  // following window 1 — which, since they now all match, is where window 1's
  // configuration leads anyway. This is the way back from a per-window job to a
  // uniform one.
  applyActiveToAll: () => set(s => {
    const config = configOf(s.windows[s.activeWindow]);
    return { windows: s.windows.map(() => following(config)), ...config };
  }),
  setCurtainOpenness: (openness) => set({ curtainOpenness: openness }),
  setPhotoUrl: (url) => set({ photoUrl: url }),
  setRollPosition: (pos) => set({ rollPosition: pos }),
  addTracedArea: (area) => set(s => ({ tracedAreas: [...s.tracedAreas, area] })),
  updateTracedArea: (id, update) => set(s => ({ tracedAreas: s.tracedAreas.map(a => a.id === id ? { ...a, ...update } : a) })),
  removeTracedArea: (id) => set(s => ({ tracedAreas: s.tracedAreas.filter(a => a.id !== id) })),
  clearTracedAreas: () => set({ tracedAreas: [], activeAreaId: null }),
  setActiveArea: (id) => set({ activeAreaId: id }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  setCompareDivider: (divider) => set({ compareDivider: divider }),
}));
