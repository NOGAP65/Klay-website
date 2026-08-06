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
  blindType: 'blockout',
  fabricColour: 'White',
  hardwareColour: 'white',
  windowSize: 'medium',
  operation: 'manual',
  lockedRange: null,
  defaultWindowActive: true,
  curtainType: 'sheer',
  curtainOperation: 'manual',
  curtainMount: 'ceiling',
  curtainSize: 'medium',
  curtainOpenness: 0,
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

  getCurtainPrice: () => {
    const state = get();
    const base = CURTAIN_BASE_PRICES[state.curtainSize];
    const motorAdd = state.curtainOperation === 'motorised' ? 200 : 0;
    return base + motorAdd;
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
  setProductCategory: (cat) => set(s => {
    const palette = coloursFor(cat);
    return {
      productCategory: cat,
      fabricColour: palette.some(c => c.name === s.fabricColour)
        ? s.fabricColour
        : palette[0].name,
    };
  }),
  setBlindType: (type) => set({ blindType: type }),
  setFabricColour: (colour) => set({ fabricColour: colour }),
  setHardwareColour: (colour) => set({ hardwareColour: colour }),
  setWindowSize: (size) => set({ windowSize: size }),
  setOperation: (op) => set({ operation: op }),
  setLockedRange: (range) => set({ lockedRange: range }),
  setDefaultWindowActive: (active) => set({ defaultWindowActive: active }),
  setCurtainType: (type) => set({ curtainType: type }),
  setCurtainOperation: (op) => set({ curtainOperation: op }),
  setCurtainMount: (mount) => set({ curtainMount: mount }),
  setCurtainSize: (size) => set({ curtainSize: size }),
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
