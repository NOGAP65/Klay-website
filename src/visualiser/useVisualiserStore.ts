import { create } from 'zustand';
import { MOTORISED_ADDON, RYNAMIC_COLOURS } from '../data/products';

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

export type BlindType = 'blockout' | 'sunscreen' | 'lightfilter' | 'dual';
export type HardwareColour = 'white' | 'black' | 'chrome';

const HARDWARE_HEX: Record<HardwareColour, string> = {
  white: '#E8E4DE',
  black: '#2C2824',
  chrome: '#B0AEA8',
};

// Base price by blind type and window size — Light Filter has no catalogue
// pricing yet, so it's set to match Sunscreen until a real price is supplied.
const BASE_PRICE: Record<BlindType, { small: number; medium: number; large: number }> = {
  blockout: { small: 220, medium: 260, large: 330 },
  sunscreen: { small: 220, medium: 260, large: 330 },
  lightfilter: { small: 220, medium: 260, large: 330 },
  dual: { small: 320, medium: 380, large: 480 },
};

interface VisualiserStore {
  // Product selection
  blindType: BlindType;
  fabricColour: string;         // Rynamic colour name, e.g. 'White'
  hardwareColour: HardwareColour;
  windowSize: 'small' | 'medium' | 'large';
  operation: 'manual' | 'motorised';
  lockedRange: string | null;   // if set from product page, blind type picker is hidden and locked
  defaultWindowActive: boolean; // true until the user uploads/selects their own photo — locks the trace to the preset default-window pins

  // Visual state
  photoUrl: string | null;
  rollPosition: number;         // 0 = open, 1 = closed
  tracedAreas: TracedArea[];
  activeAreaId: string | null;
  compareMode: boolean;
  compareDivider: number;

  // Computed
  getCurrentPrice: () => number;
  getFabricColor: () => string;
  getHardwareColor: () => string;
  isConfigComplete: () => boolean;

  // Actions
  setBlindType: (type: BlindType) => void;
  setFabricColour: (colour: string) => void;
  setHardwareColour: (colour: HardwareColour) => void;
  setWindowSize: (size: 'small' | 'medium' | 'large') => void;
  setOperation: (op: 'manual' | 'motorised') => void;
  setLockedRange: (range: string | null) => void;
  setDefaultWindowActive: (active: boolean) => void;
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
  blindType: 'blockout',
  fabricColour: 'White',
  hardwareColour: 'white',
  windowSize: 'medium',
  operation: 'manual',
  lockedRange: null,
  defaultWindowActive: true,
  photoUrl: null,
  rollPosition: 0.5,
  tracedAreas: [],
  activeAreaId: null,
  compareMode: false,
  compareDivider: 0.5,

  getCurrentPrice: () => {
    const state = get();
    const base = BASE_PRICE[state.blindType][state.windowSize];
    return base + (state.operation === 'motorised' ? MOTORISED_ADDON : 0);
  },

  getFabricColor: () => {
    const state = get();
    return RYNAMIC_COLOURS.find(c => c.name === state.fabricColour)?.hex ?? '#FFFFFF';
  },

  getHardwareColor: () => HARDWARE_HEX[get().hardwareColour],

  isConfigComplete: () => {
    const state = get();
    return state.tracedAreas.some(a => a.confirmed) && state.photoUrl !== null;
  },

  setBlindType: (type) => set({ blindType: type }),
  setFabricColour: (colour) => set({ fabricColour: colour }),
  setHardwareColour: (colour) => set({ hardwareColour: colour }),
  setWindowSize: (size) => set({ windowSize: size }),
  setOperation: (op) => set({ operation: op }),
  setLockedRange: (range) => set({ lockedRange: range }),
  setDefaultWindowActive: (active) => set({ defaultWindowActive: active }),
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
