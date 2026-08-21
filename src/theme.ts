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
   * stays fully solid.
   *
   * STILL USED, but no longer by the CTAs — see `accent`. What keeps a black
   * fill is everything that is not an action: the trust ticker's whole ground,
   * the rules in RecommendationBanner and the booking pages, the filter
   * checkboxes, and every selected pill and tab. */
  fillStrongHover: '#3D3D3D',

  // ---------------------------------------------------------------------
  // BRONZE — the logo's own colour, and the only chroma in the interface. It is
  // spent on actions and nothing else.
  //
  // The palette was taken fully neutral first, deliberately, and this is added
  // back on top of it rather than mixed into it. Five bronze values: the fill,
  // its hover, the label on it, the edge that makes it findable, and one pale
  // ground. Everything else on the site stays grey.
  //
  // IT IS SAMPLED FROM THE ARTWORK, not chosen to go with it. #A08058 is the
  // leg of the k in public/images/logo_full.png, measured off the PNG. The mark
  // was already the only chroma in the product; the interface now uses that same
  // value rather than a colour picked to sit near it. Two attempts preceded this
  // and both were approximations of it — a royal blue at hue 226°, opposite the
  // mark, and a clay at hue 16°, adjacent to it. This is hue 33°, which is the
  // mark, exactly.
  //
  // ---------------------------------------------------------------------
  // A WHITE LABEL IS WHAT SETS THIS VALUE, and it is why the fill is NOT the
  // logo's #A08058 exactly.
  //
  // The mark's own bronze is a mid-tone and cannot carry white: #FFFFFF on it
  // measures 3.67 against a 4.5 requirement. It carried an INK label at 4.59 for
  // exactly that reason. The brief is a white label, and there is no way to have
  // both that and the mark's literal value — any colour light enough to read as
  // gold or bronze is too light for white type. That is the same wall the retired
  // brand gold hit (#C8973A, white on it 2.49, which is why it always carried
  // ink).
  //
  // So the fill walks down the mark's own hue until white clears. #8A6C46 is hue
  // 34° against the mark's 33° — the same bronze, two stops deeper — and white on
  // it measures 4.87, with real headroom rather than a hair. The lightest value
  // that clears at all is #8E7049 at 4.60, and sitting that close to the floor
  // for the label on every CTA on the site is not worth the 0.3 of extra
  // lightness.
  //
  // IT STILL CANNOT BE TEXT: 4.58 / 4.87 / 4.16 as text on paper, card and band,
  // so it fails on band. A deeper sibling near #725838 (6.24 / 6.63 / 5.66) is
  // what a bronze word would need, and nothing on the site needs one.
  /** THE ACTION COLOUR — the mark's bronze, two stops deeper so a white label
   * clears. CTA fills only; see above on why it is not a text colour. */
  accent: '#8A6C46',
  /** Hover on a bronze CTA, and it DEEPENS now. With an ink label the only safe
   * direction was up; with a white one it is down, and down is what a coloured
   * button is expected to do anyway. 1.22:1 against `accent`, and the white label
   * improves to 5.95. */
  accentHover: '#7A5F3C',
  /** Label on `accent` or `accentHover` — 4.87 and 5.95. Pure white, as asked,
   * and note the palette bans #000000 but has never banned #FFFFFF: `card` is
   * already that value. */
  onAccent: '#FFFFFF',
  /** FOCUS RINGS, and no longer button edges.
   *
   * It was introduced to rescue the button boundary: the old lighter fill
   * measured 3.45 against paper and its hover LIGHTENED to 2.84, so the block
   * needed an edge that did not depend on the fill. Deepening the fill for the
   * white label solved that on its own — 4.58 at rest and 5.60 on hover, both
   * comfortably past 3:1 — and the fifteen inset rings that existed for it are
   * gone with the reason for them.
   *
   * Kept because a focus ring is the one border on the site that has to be
   * unmistakable, and 6.24 / 6.63 / 5.66 is the right weight for it. */
  accentEdge: '#725838',
  /** THE PALE SHADE: a tinted ground for a focused field or a highlighted row.
   * Ink on it measures 14.73, and it sits 1.08:1 off paper — the same separation
   * `band` has from paper, so it reads as a deliberate tone rather than a
   * rendering artefact. */
  accentWash: '#F5EFE4',

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

// ---------------------------------------------------------------------------
// CORNER RADIUS. Three values, and there are no others.
//
// The site rendered TWENTY-ONE distinct radii: 2 (thirty-six times), 6
// (twenty-three), 4, 8, 12, 14, 16, 20, 999, '2px', '3px', '50%', and one-offs
// including '15% 15% 45% 45%' and '0 0 30% 30%'. Nothing on the page read as
// belonging to the same system because nothing shared an edge treatment.
//
// SOFT, NOT PILL. The brief is rounded edges and explicitly not a lozenge, so
// the ceiling here is 12 and `999`/`50%` are off the scale for anything
// rectangular. A circle is still correct for things that ARE circles — the cart
// badge, a pagination dot — and those keep '50%' locally rather than pretending
// to be on this ladder.
// ---------------------------------------------------------------------------
export const radius = {
  /** Swatches, chips, checkboxes, badges — anything under about 40px. A 6px
   * radius on a 20px swatch eats a quarter of its edge. */
  sm: 3,
  /** BUTTONS, inputs, pills, tabs. Was 2, which at this scale is a bevel rather
   * than a curve and read as square. */
  md: 6,
  /** CARDS, panels, images, modals. All four corners: top-only was the other
   * option and it looks deliberate only while a card's image is flush to its top
   * edge, which is not true of the range cards or the configurator panel. One
   * value that always works beats two that need a rule. */
  lg: 10,
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
