export const tokens = {
  dark: '#141414',
  ink: '#1E1A16',
  dusk: '#2C2318',
  parchment: '#F2EDE4',
  cream: '#FAF7F2',
  stone: '#E8E0D4',
  gold: '#C8973A',
  goldLight: '#D9AE60',
  goldDim: '#8A6A2A',
  textDark: '#1E1A16',
  textMid: '#6B6157',
  textMuted: '#8A8580',
  warmWhite: '#F8F6F2',
  display: "'Cormorant Garamond', serif",
  body: "'Inter', sans-serif",
} as const;

export type CursorVariant = 'dark' | 'light';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
