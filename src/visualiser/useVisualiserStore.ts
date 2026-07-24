import { create } from 'zustand';
import { SKU_CATALOGUE, MOTORISED_ADDON, RYNAMIC_COLOURS } from '../data/products';

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

interface VisualiserStore {
  // Product selection
  sku: string;                  // e.g. 'dusk-white'
  fabricColour: string;         // Rynamic colour name, e.g. 'White'
  isDual: boolean;              // true for Duo White/Black/Chrome — read by Canvas2DBlindRenderer via blindType
  windowSize: 'small' | 'medium' | 'large';
  controlType: 'manual' | 'motorised';
  lockedRange: string | null;   // if set from product page, picker is filtered to this range

  // Visual state
  photoUrl: string | null;
  rollPosition: number;         // 0 = open, 1 = closed
  tracedAreas: TracedArea[];
  activeAreaId: string | null;
  compareMode: boolean;
  compareDivider: number;

  // Computed
  getCurrentPrice: () => number;
  getCurrentSku: () => typeof SKU_CATALOGUE[0] | undefined;
  getRange: () => string;
  getHardware: () => string;
  getFabricColor: () => string;
  isConfigComplete: () => boolean;

  // Actions
  setSku: (sku: string) => void;
  setFabricColour: (colour: string) => void;
  setWindowSize: (size: 'small' | 'medium' | 'large') => void;
  setControlType: (type: 'manual' | 'motorised') => void;
  setLockedRange: (range: string | null) => void;
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

export const RANGE_TYPE_MAP: Record<string, string> = {
  blockout: 'BLOCKOUT ROLLER',
  sunscreen: 'SUNSCREEN ROLLER',
  dual: 'DUAL ROLLER',
};

const rangeSlugForType = (type: string | undefined): string =>
  Object.keys(RANGE_TYPE_MAP).find(slug => RANGE_TYPE_MAP[slug] === type) ?? 'blockout';

export const useVisualiserStore = create<VisualiserStore>((set, get) => ({
  sku: 'dusk-white',
  fabricColour: 'White',
  isDual: false,
  windowSize: 'medium',
  controlType: 'manual',
  lockedRange: null,
  photoUrl: null,
  rollPosition: 0.5,
  tracedAreas: [],
  activeAreaId: null,
  compareMode: false,
  compareDivider: 0.5,

  getCurrentPrice: () => {
    const state = get();
    const sku = SKU_CATALOGUE.find(s => s.slug === state.sku);
    if (!sku) return 0;
    const base = sku.price[state.windowSize];
    return base + (state.controlType === 'motorised' ? MOTORISED_ADDON : 0);
  },

  getCurrentSku: () => {
    const state = get();
    return SKU_CATALOGUE.find(s => s.slug === state.sku);
  },

  getRange: () => rangeSlugForType(get().getCurrentSku()?.type),

  getHardware: () => get().getCurrentSku()?.hardware ?? 'White',

  getFabricColor: () => {
    const state = get();
    return RYNAMIC_COLOURS.find(c => c.name === state.fabricColour)?.hex ?? '#FFFFFF';
  },

  isConfigComplete: () => {
    const state = get();
    return state.tracedAreas.some(a => a.confirmed) && state.photoUrl !== null;
  },

  setSku: (sku) => {
    const found = SKU_CATALOGUE.find(s => s.slug === sku);
    set({ sku, isDual: found?.type === 'DUAL ROLLER' });
  },
  setFabricColour: (colour) => set({ fabricColour: colour }),
  setWindowSize: (size) => set({ windowSize: size }),
  setControlType: (type) => set({ controlType: type }),
  setLockedRange: (range) => set({ lockedRange: range }),
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
