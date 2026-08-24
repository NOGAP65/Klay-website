import { create } from 'zustand';
import { CURTAIN_COLOURS, HARDWARE_HEX, RYNAMIC_COLOURS } from '../data/products';
import { pricePerBlind, type BlindType } from '../lib/pricing';

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
export type ProductCategory = 'blind' | 'curtain';
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

/** What one window costs, on whichever axis its category prices on. Every price
 * the visualiser shows — the panel's box, the job total, each cart line — comes
 * through here, so the button and the box above it cannot quote two numbers. */
export function priceWindow(w: WindowConfig, category: ProductCategory): number {
  if (category === 'curtain') {
    return CURTAIN_BASE_PRICES[w.curtainSize] + (w.curtainOperation === 'motorised' ? CURTAIN_MOTOR_ADDON : 0);
  }
  return pricePerBlind(w);
}

/** Writes a change onto the flat fields AND into the active window, which is
 * what keeps the two in step. Every per-window setter goes through it: one that
 * wrote only the flat field would appear to work and then lose the choice the
 * moment another window was selected. */
const writeThrough =
  (patch: Partial<WindowConfig>) =>
  (s: { windows: WindowConfig[]; activeWindow: number }) => ({
    ...patch,
    windows: s.windows.map((w, i) => (i === s.activeWindow ? { ...w, ...patch } : w)),
  });

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

  // The job. windows[activeWindow] is mirrored by the flat fields above.
  windows: WindowConfig[];
  activeWindow: number;

  // Curtain-specific
  curtainType: CurtainType;
  curtainOperation: CurtainOperation;
  curtainMount: CurtainMount;
  curtainSize: CurtainSize;
  curtainOpenness: number;

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
  /** Grows or shrinks the job. Clamped to 1..MAX_WINDOWS. */
  setWindowCount: (n: number) => void;
  /** Selects the window the panel edits and the canvas renders. */
  setActiveWindow: (index: number) => void;
  /** Copies the window on screen over every other window in the job. */
  applyActiveToAll: () => void;
  setCurtainType: (type: CurtainType) => void;
  setCurtainOperation: (op: CurtainOperation) => void;
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
  windows: [{ ...DEFAULT_WINDOW }],
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
  setCurtainMount: (mount) => set(writeThrough({ curtainMount: mount })),
  setCurtainSize: (size) => set(writeThrough({ curtainSize: size })),

  setWindowCount: (n) => set(s => {
    const count = Math.max(1, Math.min(MAX_WINDOWS, Math.floor(n) || 1));
    if (count === s.windows.length) return {};
    const windows = count > s.windows.length
      // Growing clones the LAST window rather than the factory default: adding a
      // window to a job means "another one like that", and starting it on White
      // Blockout would silently undo the choices just made.
      ? [
          ...s.windows,
          ...Array.from({ length: count - s.windows.length }, () => ({ ...s.windows[s.windows.length - 1] })),
        ]
      : s.windows.slice(0, count);
    // Shrinking can strand the active index past the end, which would leave the
    // panel editing a window nothing prices and the canvas rendering it.
    const activeWindow = Math.min(s.activeWindow, windows.length - 1);
    return { windows, activeWindow, ...windows[activeWindow] };
  }),

  setActiveWindow: (index) => set(s => {
    const activeWindow = Math.max(0, Math.min(s.windows.length - 1, Math.floor(index) || 0));
    // The spread is what makes the switch visible: the flat fields become this
    // window's configuration, so the canvas and every field follow it.
    return { activeWindow, ...s.windows[activeWindow] };
  }),

  applyActiveToAll: () => set(s => ({
    windows: s.windows.map(() => ({ ...s.windows[s.activeWindow] })),
  })),
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
