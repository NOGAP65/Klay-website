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

  /** GOLD TEXT ON LIGHT GROUNDS. The brand gold is a FILL colour and fails as
   * text on every light ground the site uses — measured 2.11 on parchment,
   * 2.37 on warm white, 2.47 on cream, against a 4.5 requirement. The retired
   * `goldDeep` (#A87F2F) failed too, at 2.92 / 3.28 / 3.42.
   *
   * Derived by holding the gold hue and walking lightness down until parchment
   * — the darkest of the three light grounds, so the binding one — cleared 4.5.
   * At L 0.12 this measures 5.05 on parchment, 5.67 on warm white and 5.93 on
   * cream. All three verified before commit.
   *
   * Chroma was the tuning axis, not just lightness: several candidates cleared
   * the ratio at this luminance and read olive, because dropping lightness on a
   * yellow pulls red and green together. This one keeps a 101-wide channel
   * spread and a 33-point red-over-green lead, which is what keeps it gold.
   *
   * THE DIVISION OF LABOUR IS HARD. `gold` is fills, rules, borders, and text
   * on DARK grounds only (5.53 on charcoal, 6.69 on ink — both pass). `goldText`
   * is every gold word on a light ground. Neither substitutes for the other. */
  goldText: '#7B5A16',

  /** KEPT, and the work order's premise that it is unused does not hold: it is
   * the bottom stop of the raised-button gradient in KlayConfigurator and has
   * five live consumers there (lines 50, 52, 201, 216, 217). Retiring it would
   * have meant restyling that button, which is outside this pass.
   *
   * It is a FILL, and only a fill. As text it measures 2.92 on parchment, 3.28
   * on warm white and 3.42 on cream — it fails all three, which is why gold
   * text on light grounds is `goldText` above and never this. */
  goldDeep: '#A87F2F',

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
  /** DECORATIVE HAIRLINES ONLY — a rule between two rows of a list, not the
   * boundary of a control. WCAG 1.4.11's 3:1 applies to the edges that identify
   * a UI component; it does not apply to a divider, and ruling every divider on
   * the page dark enough to clear 3:1 would make the layout read as a table. */
  lineFaint: 'rgba(28,24,16,0.08)',
  /** UI COMPONENT BOUNDARIES — the edge of a pill, a swatch, an outline button.
   * Was 0.15, which measured 1.36 against warm white and failed 1.4.11 badly.
   * 0.5 measures 3.29 on warm white, 3.20 on parchment, 3.33 on cream. */
  line: 'rgba(28,24,16,0.5)',
  lineStrong: 'rgba(28,24,16,0.2)',
  /** A FILL, not a border — an inactive pagination dot, a track behind a
   * progress bar. It exists because the hero rail's dots were painted with
   * `line`, a border token, and raising `line` to clear 1.4.11's 3:1 would have
   * darkened them from a quiet marker into something that competes with the
   * active one. A dot is not a UI boundary and 3:1 does not apply to it, so this
   * keeps the original 0.15 weight and says what it is for. */
  fillFaint: 'rgba(28,24,16,0.15)',
  /** Supporting text on a light ground. Was 0.6, which measured 4.47 / 4.29 /
   * 4.53 and failed on all three grounds; 0.7 measures 6.20 / 5.86 / 6.33. */
  inkSoft: 'rgba(28,24,16,0.7)',
  /** NOT FOR TEXT. At 0.4 this measured 2.50 on cream and 2.44 on parchment,
   * and it was carrying the Testimonials figcaption and the configurator field
   * labels — both failed. Anything that reads as words uses `inkSoft`; this
   * stays only for non-text marks where 3:1 is the bar. */
  inkFaint: 'rgba(28,24,16,0.4)',

  // --- on charcoal surfaces (the visualiser canvas box) ---
  onDark: WARM_WHITE,
  /** Supporting copy on a dark ground. 0.6, not the old 0.5 — supporting text
   * has to stay clearly subordinate to the headline without dropping to the
   * edge of legibility. Pairs with inkSoft, its 0.6 counterpart on light. */
  onDarkMuted: 'rgba(245,242,237,0.6)',
  onDarkLine: 'rgba(245,242,237,0.08)', // decorative hairlines and dividers
  /** Visible borders on dark — outline buttons, the cart. Was 0.28, measured
   * 2.36 on charcoal; 0.45 measures 3.88. */
  onDarkEdge: 'rgba(245,242,237,0.45)',
  scrim: 'rgba(28,24,16,0.8)',
  scrimSoft: 'rgba(28,24,16,0.45)',
  /** Gold borders on dark. Was 0.4, measured 2.04 on charcoal; 0.65 measures
   * 3.19. */
  goldLine: 'rgba(200,151,58,0.65)',

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

// ---------------------------------------------------------------------------
// THE SPACING SCALE. Fibonacci-derived, converging on φ, all integers.
//
//   4 · 8 · 12 · 20 · 32 · 52 · 84 · 136
//
// Step ratios: 1.5 · 1.67 · 1.6 · 1.625 · 1.615 · 1.619 — the last is φ to
// three places. Eight values, and there are no others: the page carried 41
// distinct rendered spacings before this, which is why nothing on it read as
// deliberately grouped.
//
// THE GAP HIERARCHY IS THE POINT, not the ladder itself. Space BETWEEN groups
// must be at least 2.5× space WITHIN a group; within-group `md` against
// between-group `xl` gives 2.6×. That ratio is what makes grouping legible
// without drawing a single border, and it is the thing to check at every
// boundary rather than the individual numbers.
//
// If a layout needs a value that is not here, the layout is wrong. Report it
// rather than adding a ninth.
// ---------------------------------------------------------------------------

export const space = {
  /** Hairline offsets, icon-to-label. */
  xxs: 4,
  /** Tight pairs — a label and the number under it. */
  xs: 8,
  /** Within a line of controls. */
  sm: 12,
  /** WITHIN a group. The default gap between related elements. */
  md: 20,
  /** A group's internal block rhythm. */
  lg: 32,
  /** BETWEEN groups. 2.6× `md`, which is the hierarchy rule. */
  xl: 52,
  /** Standard section vertical padding. */
  xxl: 84,
  /** The two focal sections only — the visualiser and the closing CTA. Air is
   * how they are marked as more important than their neighbours. */
  xxxl: 136,
} as const;

// ---------------------------------------------------------------------------
// THE TYPE SCALE. Nine roles, one size each. The same role is never two sizes.
//
// Before this the page rendered 21 distinct font sizes, including three sizes
// for the section-headline role and six for the uppercase label. The sizes were
// never the problem on their own — the problem is that a reader cannot learn a
// hierarchy that changes definition between sections.
// ---------------------------------------------------------------------------

export const type = {
  /** 116 — the quote mark in Testimonials. Ornament, not text. */
  ornament: {
    fontFamily: tokens.display,
    fontSize: 116,
    fontWeight: 400,
    lineHeight: 0.62,
    margin: 0,
  } as Style,

  /** 76 — the page-opening promise. LOCKED: the hero's proportions are out of
   * scope for this pass. Declared here so the literal lives in one place rather
   * than inline in Hero.tsx, which is the only change made to it. */
  hero: {
    fontFamily: tokens.display,
    fontSize: 'clamp(38px, 5.4vw, 76px)',
    fontWeight: 300,
    lineHeight: 0.95,
    margin: 0,
  } as Style,

  /** 64 — EVERY section headline on the site, at one size.
   *
   * TRACKING IS NOT OPTIONAL HERE. Cormorant Light at 64 with normal tracking
   * is loose and reads as weak no matter how large it is set; −0.02em is what
   * converts scale into mass. And one line-height, not 1.02 here and 1.05
   * there: that difference is invisible in isolation and is exactly why no two
   * headlines on the page sat the same distance from their subline.
   *
   * The hero at 76 and this at 64 are never in the same viewport — they are
   * 588px apart — so they do not compete and the hero stays locked. */
  section: {
    fontFamily: tokens.display,
    fontSize: 'clamp(38px, 5vw, 64px)',
    fontWeight: 300,
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
    margin: 0,
  } as Style,

  /** 26 — card and step headings, subordinate to a section headline. */
  card: {
    fontFamily: tokens.display,
    fontSize: 26,
    fontWeight: 300,
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    margin: 0,
  } as Style,

  /** 32 — a price or a step number. Cormorant, because a numeral set in the
   * display face is the one place figures get to feel considered. */
  numeric: {
    fontFamily: tokens.display,
    fontSize: 32,
    fontWeight: 300,
    lineHeight: 1.1,
    margin: 0,
  } as Style,

  /** 17 — the hero lead, and nothing else. The one body size above 15. */
  lead: {
    fontFamily: tokens.body,
    fontSize: 17,
    fontWeight: 300,
    lineHeight: 1.7,
    margin: 0,
  } as Style,

  /** 15 — all body copy. Was six sizes between 12 and 17. */
  body: {
    fontFamily: tokens.body,
    fontSize: 15,
    fontWeight: 300,
    lineHeight: 1.75,
    margin: 0,
  } as Style,

  /** 12 — buttons and UI labels. */
  label: {
    fontFamily: tokens.body,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    margin: 0,
  } as Style,

  /** 10 — eyebrows and micro labels. Was five sizes (8.5–11) across six
   * letter-spacings; `eyebrow` below already held the correct definition and
   * nothing consumed it. */
  micro: {
    fontFamily: tokens.body,
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    margin: 0,
  } as Style,
};

/** Gold, 10px, 0.3em — the one eyebrow. At most one per section: it exists to
 * name the section before the headline lands, and a second one competes with
 * the first instead of reinforcing it. Legible on light and dark alike, so
 * there is no on-dark variant. */
export const eyebrow: Style = {
  ...type.micro,
  // goldText, not gold: every eyebrow on the site sits on a light ground, and
  // the brand gold measures 2.11–2.47 there. The three eyebrows on charcoal
  // override this back to `tokens.gold`, which passes at 5.53.
  color: tokens.goldText,
};

/** Cormorant, 300 weight. One per section — the emotional hook. Sizes are
 * clamped rather than flat so a headline can't overflow a narrow viewport,
 * with the ceiling set by role. */
/** The three headline roles, kept as aliases of `type` so the many existing
 * `...headline.section` spreads keep working and now resolve to the single
 * definition above. There is no second system here — these ARE those. */
export const headline = {
  hero: type.hero,
  section: type.section,
  card: type.card,
};

/** Supporting copy — Inter, always muted, never competing with the headline.
 * Both variants sit at 0.6: mid-band of the 0.55–0.65 the brand allows. */
export const supporting = {
  onLight: { ...type.body, color: tokens.inkSoft } as Style,
  onDark: { ...type.body, color: tokens.onDarkMuted } as Style,
};

/** Section rhythm. Both vertical values are scale steps: `xxl` (84) is the
 * standard section, `xxxl` (136) is reserved for the two focal sections. 80px
 * inline matches the hero's own inset so every section's copy starts on the
 * same vertical line. */
export const layout = {
  /** Content never runs edge to edge. */
  containerMax: 1200,
  /** Wider cap for image grids, where the photographs are the content and a
   * 1200px cap would shrink them below the point of being persuasive. */
  gridMax: 1440,
  /** The standard section. Mobile compresses the vertical — 84px of dead space
   * on a phone reads as a loading error rather than as luxury — but both values
   * stay on the scale. */
  sectionPad: (isMobile: boolean) =>
    isMobile ? `${space.xl}px ${space.md}px` : `${space.xxl}px 80px`,
  /** The two focal sections: the visualiser and the closing CTA. */
  sectionPadFocal: (isMobile: boolean) =>
    isMobile ? `${space.xxl}px ${space.md}px` : `${space.xxxl}px 80px`,
  /** Every full-bleed section's content inset. Mobile was 24, which is not on
   * the scale; 20 is. */
  inlinePad: (isMobile: boolean) => (isMobile ? space.md : 80),
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
