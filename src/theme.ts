// ---------------------------------------------------------------------------
// The Klay palette. FIVE NEUTRALS ON ONE AXIS, AND NO CHROMA AT ALL.
//
// These are the only place these values are written down — nothing in the app
// should hardcode them, and every other colour here is derived from them.
//
// ---------------------------------------------------------------------------
// WHY THERE IS NO GOLD ANY MORE.
//
// The site was built on #C8973A and it is gone: gold, goldLight, goldDeep,
// goldText and goldLine are all retired, along with every warm neutral that
// carried a brown cast. This is not a tint adjustment, it is the removal of an
// axis — the palette now varies in lightness only.
//
// The reference set is Monday Haircare, Kookaï, Allbirds, Thuma and Koala, and
// what they actually do was measured off the running pages rather than
// eyeballed. `spread` below is max channel minus min channel, which is the
// number that says how far a colour sits from true grey:
//
//   Thuma     ground #FFFFFF spread  0   text #282829 spread 1
//   Kookaï    ground #F8F8F8 spread  0   text #1D1D1D / #8C8C8C spread 0
//   Allbirds  ground #ECE9E2 spread 10   text #000000 / #212121 / #575757  0
//   Monday    ground #F1EEE9 spread  8   text #000000 / #333333 / #7A7A7A  0
//   Koala     ground #F5F6F3 spread  3   text #121212 / #525252            0
//
// THE RULE THAT FALLS OUT: whatever warmth these brands keep lives in the light
// ground and nowhere else, and every dark and every text colour is dead neutral.
// Klay was the exact inverse — warm all the way down. The retired ink was
// #1C1810 (spread 12), textMid #6B6157 (spread 20), parchment #EAE5DC (spread
// 14), charcoal #2C2824 (spread 8). Those read brown beside a neutral grey,
// which is why the site did not feel like its references even before the gold
// was accounted for.
//
// #F8F8F8 IS NOT AN ARBITRARY OFF-WHITE. It is Kookaï's ground, and it is also
// the field the new logo was exported on — so the mark sits on the page ground
// without a seam.
//
// #303030 IS THE LOGO'S OWN VALUE, sampled from the artwork. The dark bands are
// literally the colour of the mark, which is why the nav reads as one object
// with the logo in it rather than as a logo placed on a bar.
//
// ---------------------------------------------------------------------------
// WHAT REPLACED THE GOLD ACCENT: NOTHING. That is the point.
//
// Gold did two unrelated jobs — it was a FILL under primary buttons (41 sites)
// and an ACCENT TEXT colour on dark grounds (106 sites). The fill becomes `ink`,
// which is the ordinary black button every one of the reference sites uses. The
// accent has no colour replacement, because a neutral palette has no second hue
// to promote something with.
//
// So the accent role moves into TYPE: caps, letter-spacing, size and weight,
// which `type.micro` and `eyebrow` were already doing the work of. Monday's
// marquee is white caps on black with no accent colour anywhere on the page;
// that is the same trade. An accent that survives as a grey is not an accent, it
// is a contrast bug waiting to be filed.
//
// THE ONE PIECE OF CHROMA IN THE WHOLE PRODUCT is the tan leg of the k inside
// the logo artwork — #A08058, and it is deliberately NOT a token. It measures
// 3.45:1 on paper and 3.60:1 on #303030, so it could never carry text even if
// someone wanted it to, and there is no legitimate use for it outside the PNG.
// Declaring it here would only invite it back onto the page.
// ---------------------------------------------------------------------------

/** Page ground. Kookaï's, and the logo's own export field. */
const PAPER = '#F8F8F8';
/** Cards sitting on PAPER. Only 1.06:1 apart, which is deliberate — the
 * reference sites all separate surfaces by a hair and let shadow and gap do the
 * rest, rather than by a step you could name. */
const CARD = '#FFFFFF';
/** Trust and social bands — one step under PAPER, 1.10:1. */
const BAND = '#EDEDED';
/** Dark grounds: the nav, the steps marquee, the visualiser box. Sampled from
 * the logo artwork, so it is the mark's own value. */
const DARK = '#303030';
/** Primary text, and the deepest ground. Kookaï's text black. 15.87:1 on paper.
 * Deeper than DARK on purpose: DARK is a surface, this is ink. */
const INK = '#1D1D1D';

export const tokens = {
  // --- the five ---
  paper: PAPER,
  card: CARD,
  band: BAND,
  charcoal: DARK,
  ink: INK,

  /** PAPER under its old name. Every consumer still writes `warmWhite`, and
   * there is nothing warm about it any more — renaming 100-odd call sites is a
   * separate mechanical pass from changing what the colour is. */
  warmWhite: PAPER,
  /** BAND and CARD under their old names, same reasoning. `parchment` was
   * #EAE5DC (spread 14) and `cream` #FAF7F2 (spread 8); both are neutral now. */
  parchment: BAND,
  cream: CARD,

  /** The one dark card background, and text on a light-on-dark button. */
  dark: INK,
  textDark: INK,

  // --- what the gold fill became ---
  /** THE PRIMARY BUTTON. Gold was the fill under every primary CTA; this is the
   * ordinary black button that Monday, Kookaï, Allbirds and Thuma all use. Pairs
   * with `onFillStrong` for its label — 15.87:1. */
  fillStrong: INK,
  /** Label on `fillStrong`. */
  onFillStrong: PAPER,
  /** HOVER ON THE BLACK BUTTON, and it goes LIGHTER, which is the opposite of
   * what the gold button did (gold lifted to `goldLight` #D9AE60).
   *
   * There is nowhere below #1D1D1D to go — #000000 is banned outright and the
   * two are barely a step apart anyway — so the only available direction is up.
   * #3D3D3D reads as a lift rather than a fade because the label on it stays
   * `onFillStrong` at 10.23:1, so the button gets visibly lighter while its text
   * stays fully solid. */
  fillStrongHover: '#3D3D3D',

  // --- the grey ramp for text on light grounds ---
  // Every value re-measured against all three light grounds (paper #F8F8F8,
  // card #FFFFFF, band #EDEDED). BAND IS ALWAYS THE BINDING ONE, being the
  // darkest, and the old palette's failures were all cases where a value was
  // checked against the lightest ground only.
  /** Secondary headings and strong supporting copy. 8.34 / 8.86 / 7.57. */
  textMid: '#4A4A4A',
  /** Supporting text — the deepest grey that still clears 4.5 on ALL THREE
   * grounds (6.30 / 6.69 / 5.71). #6E6E6E was the obvious next step down and it
   * fails: 4.80 on paper but 4.36 on band. */
  textMuted: '#5C5C5C',
  /** NOT FOR BODY TEXT — 4.34 / 4.61 / 3.94, so it fails 4.5 on paper and on
   * band. Large text and UI marks only, where 3:1 is the bar. */
  textFaint: '#757575',

  // --- ink at opacity: rules and secondary text on light surfaces ---
  /** DECORATIVE HAIRLINES ONLY — a rule between two rows of a list, not the
   * boundary of a control. WCAG 1.4.11's 3:1 applies to the edges that identify
   * a UI component; it does not apply to a divider, and ruling every divider on
   * the page dark enough to clear 3:1 would make the layout read as a table. */
  lineFaint: 'rgba(29,29,29,0.08)',
  /** UI COMPONENT BOUNDARIES — the edge of a pill, a swatch, an outline button.
   * 0.5 against the new grounds measures 3.44 on paper, 3.65 on card, 3.13 on
   * band — all clear 1.4.11. */
  line: 'rgba(29,29,29,0.5)',
  lineStrong: 'rgba(29,29,29,0.2)',
  /** A FILL, not a border — an inactive pagination dot, a track behind a
   * progress bar. It exists because the hero rail's dots were painted with
   * `line`, a border token, and raising `line` to clear 1.4.11's 3:1 would have
   * darkened them from a quiet marker into something that competes with the
   * active one. A dot is not a UI boundary and 3:1 does not apply to it, so this
   * keeps the original 0.15 weight and says what it is for. */
  fillFaint: 'rgba(29,29,29,0.15)',
  /** Supporting text on a light ground, as ink at opacity rather than a flat
   * grey. Kept at 0.7 — the ratio it was tuned to is unchanged by the ground
   * moving from warm to neutral, because 0.7 of near-black over a near-white is
   * governed by the alpha, not the hue. */
  inkSoft: 'rgba(29,29,29,0.7)',
  /** NOT FOR TEXT. Non-text marks only, where 3:1 is the bar. Anything that
   * reads as words uses `inkSoft` or `textMuted`. */
  inkFaint: 'rgba(29,29,29,0.4)',

  // --- on dark surfaces (the nav, the steps marquee, the visualiser box) ---
  /** Primary text on #303030 — 12.43:1. This is also what every `color: gold`
   * on a dark ground became: the accent collapses into the primary, and the
   * distinction it used to carry moves into caps and letter-spacing. */
  onDark: PAPER,
  /** Supporting copy on a dark ground. 0.6 of paper over #303030 measures
   * 6.09:1, so it stays clearly subordinate without dropping to the edge of
   * legibility. Pairs with inkSoft, its counterpart on light. */
  onDarkMuted: 'rgba(248,248,248,0.6)',
  onDarkLine: 'rgba(248,248,248,0.08)', // decorative hairlines and dividers
  /** Visible borders on dark — outline buttons, the cart, the marquee's arrows.
   * 0.45 measures 3.87 on #303030. */
  onDarkEdge: 'rgba(248,248,248,0.45)',
  scrim: 'rgba(29,29,29,0.8)',
  scrimSoft: 'rgba(29,29,29,0.45)',

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

/** 10px, 0.3em — the one eyebrow. At most one per section: it exists to name the
 * section before the headline lands, and a second one competes with the first
 * instead of reinforcing it.
 *
 * IT IS NOW GREY, AND THAT IS THE WHOLE ACCENT ARGUMENT IN ONE TOKEN. It was
 * `goldText` (#7B5A16), and the eyebrow was the single most common place the gold
 * accent appeared on a light ground. There is no gold to fall back to, and the
 * neutral palette offers no second hue to promote it with — so what marks an
 * eyebrow as an eyebrow is now entirely what `type.micro` already did: 10px,
 * caps, 0.3em of tracking. Those three do the job on their own; the colour was
 * never carrying it.
 *
 * `textMuted`, NOT `textFaint`. This was written as textFaint on the argument
 * that an eyebrow is a label rather than body copy and so sits at 3:1 — that is
 * wrong, and the audit caught it. 1.4.3's large-text exemption is about SIZE, not
 * about whether the author considers the string a label: it starts at 18.66px
 * bold or 24px regular, and an eyebrow is 10px. So the floor is 4.5 and textFaint
 * measured 4.34 on paper and 3.94 on band — two failures on three grounds.
 *
 * textMuted clears it everywhere (6.30 / 6.69 / 5.71) and the eyebrow stays
 * subordinate on tracking and size alone, which was always what distinguished
 * it. On dark grounds the charcoal eyebrows override to `tokens.onDarkMuted`. */
export const eyebrow: Style = {
  ...type.micro,
  color: tokens.textMuted,
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
  rest: '0 8px 20px rgba(29,29,29,0.10)',
  lift: '0 22px 44px rgba(29,29,29,0.22)',
  restOnDark: '0 6px 16px rgba(29,29,29,0.35)',
  liftOnDark: '0 20px 40px rgba(29,29,29,0.55)',
};

export type CursorVariant = 'dark' | 'light';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
