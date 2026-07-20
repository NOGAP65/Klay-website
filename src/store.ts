import { create } from 'zustand';

interface KlayState {
  scrollY: number;
  blindHeight: number;
  setScrollY: (y: number) => void;
  setBlindHeight: (h: number) => void;
}

export const useKlayStore = create<KlayState>((set) => ({
  scrollY: 0,
  blindHeight: 0,
  setScrollY: (y) => set({ scrollY: y }),
  setBlindHeight: (h) => set({ blindHeight: h }),
}));
