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
  /** Trust/social-proof bands — one deliberate step below warmWhite. Set by
   * brand direction to #EAE5DC; an earlier pass had narrowed it to #F2EDE4,
   * which sat too close to warmWhite for the two tones to separate without a
   * dark band between them. This is the single source of truth — nothing
   * should hardcode either value. */
  parchment: '#EAE5DC',
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
  /** Supporting copy on a dark ground. 0.6, not the old 0.5 — supporting text
   * has to stay clearly subordinate to the headline without dropping to the
   * edge of legibility. Pairs with inkSoft, its 0.6 counterpart on light. */
  onDarkMuted: 'rgba(245,242,237,0.6)',
  onDarkLine: 'rgba(245,242,237,0.08)', // hairlines and dividers
  onDarkEdge: 'rgba(245,242,237,0.28)', // visible borders, e.g. outline buttons
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

// ---------------------------------------------------------------------------
// Type scale and layout rhythm.
//
// Inline styles are the house rule, which means nothing structural stops the
// same semantic role being written five different ways across five files —
// and it had. Before this pass the site carried four separate section-headline
// systems (flat 52, and three different clamps), six muted-text opacities, and
// eyebrow labels at 10/11/12px with four letter-spacings.
//
// These are plain style objects, spread at the point of use. No CSS file, no
// class names — just one place each role is written down.
// ---------------------------------------------------------------------------

type Style = Record<string, string | number>;

/** Gold, 10px, 0.3em — the one eyebrow. At most one per section: it exists to
 * name the section before the headline lands, and a second one competes with
 * the first instead of reinforcing it. Legible on light and dark alike, so
 * there is no on-dark variant. */
export const eyebrow: Style = {
  fontFamily: tokens.body,
  fontSize: 10,
  fontWeight: 500,
  color: tokens.gold,
  textTransform: 'uppercase',
  letterSpacing: '0.3em',
  margin: 0,
};

/** Cormorant, 300 weight. One per section — the emotional hook. Sizes are
 * clamped rather than flat so a headline can't overflow a narrow viewport,
 * with the ceiling set by role. */
export const headline = {
  /** 80–100px at full width. Page-opening promise. */
  hero: {
    fontFamily: tokens.display,
    fontSize: 'clamp(46px, 8vw, 100px)',
    fontWeight: 300,
    lineHeight: 0.95,
    margin: 0,
  } as Style,
  /** 52–64px. Every section headline on the site. */
  section: {
    fontFamily: tokens.display,
    fontSize: 'clamp(38px, 5vw, 64px)',
    fontWeight: 300,
    lineHeight: 1.02,
    margin: 0,
  } as Style,
  /** 32–38px. Card and step headings, subordinate to a section headline. */
  card: {
    fontFamily: tokens.display,
    fontSize: 'clamp(28px, 3.2vw, 36px)',
    fontWeight: 300,
    lineHeight: 1.05,
    margin: 0,
  } as Style,
};

/** Supporting copy — Inter, always muted, never competing with the headline.
 * Both variants sit at 0.6: mid-band of the 0.55–0.65 the brand allows. */
export const supporting = {
  onLight: {
    fontFamily: tokens.body,
    fontSize: 15,
    lineHeight: 1.75,
    color: tokens.inkSoft,
    margin: 0,
  } as Style,
  onDark: {
    fontFamily: tokens.body,
    fontSize: 15,
    lineHeight: 1.75,
    color: tokens.onDarkMuted,
    margin: 0,
  } as Style,
};

/** Section rhythm. 120px vertical on desktop clears the 100px floor with room
 * to spare; 80px inline matches the hero's own inset so every section's copy
 * starts on the same vertical line. Mobile compresses both — 120px of dead
 * space on a phone reads as a loading error, not as luxury. */
export const layout = {
  /** Content never runs edge to edge. */
  containerMax: 1200,
  /** Wider cap for image grids, where the photographs are the content and a
   * 1200px cap would shrink them below the point of being persuasive. */
  gridMax: 1440,
  sectionPad: (isMobile: boolean) => (isMobile ? '80px 24px' : '120px 80px'),
  inlinePad: (isMobile: boolean) => (isMobile ? 24 : 80),
};

/** One container, centred. */
export const container = (max: number = layout.containerMax): Style => ({
  maxWidth: max,
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
});

// ---------------------------------------------------------------------------
// Interaction timings — one duration per class of feedback, so hovers across
// the site feel like one system rather than fourteen independent guesses.
// ---------------------------------------------------------------------------

export const motion = {
  /** Cards: lift and scale. Slow enough to read as weight. */
  card: 'transform 0.4s ease, box-shadow 0.4s ease',
  /** Buttons: fast, so the click feels acknowledged immediately. */
  button: 'background 0.2s ease, opacity 0.2s ease, border-color 0.2s ease, color 0.2s ease',
  /** Links: colour only. */
  link: 'color 0.2s ease, border-color 0.2s ease',
};

/** Warm shadows. Pure-black shadows grey a warm palette; these are mixed from
 * ink so a lifted card still reads as sitting on a warm ground. */
export const shadow = {
  rest: '0 8px 20px rgba(28,24,16,0.10)',
  lift: '0 22px 44px rgba(28,24,16,0.22)',
  restOnDark: '0 6px 16px rgba(28,24,16,0.35)',
  liftOnDark: '0 20px 40px rgba(28,24,16,0.55)',
};

export type CursorVariant = 'dark' | 'light';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
