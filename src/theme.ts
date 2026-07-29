// ---------------------------------------------------------------------------
// The Klay palette.
//
// These four are the brand. They are the only place these values are written
// down — nothing in the app should hardcode them, and every other colour here
// is either derived from them or a deliberately spaced neutral.
//
// Previously the tokens had drifted off the brand (ink was #1E1A16, warm white
// #F8F6F2, charcoal #2C2318), so components bypassed them and hardcoded the
// real values instead. That left several near-identical off-whites and darks
// sitting next to each other, which reads as muddy rather than deliberate.
// ---------------------------------------------------------------------------

const GOLD = '#C8973A';
const CHARCOAL = '#2C2824';
const WARM_WHITE = '#F5F2ED';
const INK = '#1C1810';

export const tokens = {
  // --- brand ---
  gold: GOLD,
  charcoal: CHARCOAL,
  warmWhite: WARM_WHITE,
  ink: INK,

  /** Text on a gold button, and the one dark card background. Was #141414 —
   * a near-black that broke the no-pure-black rule; it is ink now. */
  dark: INK,
  textDark: INK,

  goldLight: '#D9AE60',
  goldDeep: '#A87F2F', // bottom stop of the raised-button gradient

  // --- warm neutrals, spaced a real step apart rather than near-identical ---
  parchment: '#F2EDE4', // section bands, one step below warmWhite
  cream: '#FAF7F2',     // cards sitting on parchment
  textMid: '#6B6157',
  textMuted: '#8A8580',

  // --- ink at opacity: rules and secondary text on light surfaces ---
  lineFaint: 'rgba(28,24,16,0.08)',
  line: 'rgba(28,24,16,0.15)',
  lineStrong: 'rgba(28,24,16,0.2)',
  inkSoft: 'rgba(28,24,16,0.6)',
  inkFaint: 'rgba(28,24,16,0.4)',

  // --- on charcoal surfaces (the visualiser canvas box) ---
  onDark: WARM_WHITE,
  onDarkMuted: 'rgba(245,242,237,0.5)',
  onDarkLine: 'rgba(245,242,237,0.08)',
  scrim: 'rgba(28,24,16,0.8)',
  scrimSoft: 'rgba(28,24,16,0.45)',
  goldLine: 'rgba(200,151,58,0.4)',

  /** Corner-pin trace colour. Off-brand on purpose: it has to match TEAL in
   * CornerPinOverlay.tsx so the renderer's reference dots land on the same
   * colour as the overlay's pins, and that file is protected IP. Declared
   * here only so the literal isn't duplicated across files. */
  traceTeal: '#4ABFB5',

  display: "'Cormorant Garamond', serif",
  body: "'Inter', sans-serif",
} as const;

export type CursorVariant = 'dark' | 'light';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
