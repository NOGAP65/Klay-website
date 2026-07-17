import { create } from 'zustand';

interface KlayState {
  scrollY: number;
  cursorX: number;
  cursorY: number;
  cursorHover: boolean;
  blindHeight: number;
  setScrollY: (y: number) => void;
  setCursor: (x: number, y: number) => void;
  setCursorHover: (hover: boolean) => void;
  setBlindHeight: (h: number) => void;
}

export const useKlayStore = create<KlayState>((set) => ({
  scrollY: 0,
  cursorX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  cursorY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  cursorHover: false,
  blindHeight: 0,
  setScrollY: (y) => set({ scrollY: y }),
  setCursor: (x, y) => set({ cursorX: x, cursorY: y }),
  setCursorHover: (hover) => set({ cursorHover: hover }),
  setBlindHeight: (h) => set({ blindHeight: h }),
}));
