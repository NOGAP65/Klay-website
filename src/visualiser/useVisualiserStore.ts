import { create } from 'zustand';
import { SKU_CATALOGUE, MOTORISED_ADDON } from '../data/products';

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
  selectedRange: string;        // 'blockout' | 'sunscreen' | 'dual'
  selectedSku: string;          // e.g. 'dusk-white'
  selectedHardware: string;     // 'White' | 'Black' | 'Chrome'
  windowSize: 'small' | 'medium' | 'large';
  controlType: 'manual' | 'motorised';
  lockedRange: string | null;   // if set from product page, range switcher is hidden

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
  getFabricColor: () => string;
  isConfigComplete: () => boolean;

  // Actions
  setRange: (range: string) => void;
  setSku: (sku: string) => void;
  setHardware: (hardware: string) => void;
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

const RANGE_TYPE_MAP: Record<string, string> = {
  blockout: 'BLOCKOUT ROLLER',
  sunscreen: 'SUNSCREEN ROLLER',
  dual: 'DUAL ROLLER',
};

export const useVisualiserStore = create<VisualiserStore>((set, get) => ({
  selectedRange: 'blockout',
  selectedSku: 'dusk-white',
  selectedHardware: 'White',
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
    const sku = SKU_CATALOGUE.find(s => s.slug === state.selectedSku);
    if (!sku) return 0;
    const base = sku.price[state.windowSize];
    return base + (state.controlType === 'motorised' ? MOTORISED_ADDON : 0);
  },

  getCurrentSku: () => {
    const state = get();
    return SKU_CATALOGUE.find(s => s.slug === state.selectedSku);
  },

  getFabricColor: () => {
    const state = get();
    const hardwareToColor: Record<string, string> = {
      'White': '#F0EDE8',
      'Black': '#2A2A2A',
      'Chrome': '#D4D0CA',
    };
    return hardwareToColor[state.selectedHardware] ?? '#F0EDE8';
  },

  isConfigComplete: () => {
    const state = get();
    return state.tracedAreas.some(a => a.confirmed) && state.photoUrl !== null;
  },

  setRange: (range) => {
    const firstSku = SKU_CATALOGUE.find(s => s.type === RANGE_TYPE_MAP[range]);
    set({ selectedRange: range, selectedSku: firstSku?.slug ?? '' });
  },
  setSku: (sku) => set({ selectedSku: sku }),
  setHardware: (hardware) => {
    const state = get();
    const sku = SKU_CATALOGUE.find(s => s.type === RANGE_TYPE_MAP[state.selectedRange] && s.hardware === hardware);
    set({ selectedHardware: hardware, selectedSku: sku?.slug ?? state.selectedSku });
  },
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
