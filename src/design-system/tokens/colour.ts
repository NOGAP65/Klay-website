// ---------------------------------------------------------------------------
// COLOUR TOKENS
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // DEPRECATED ALIASES. Kept alive for the frozen visualiser only.
  //
  // The mechanical pass the note below anticipated happened in Phase 2.2c:
  // `warmWhite` → `paper` (65 sites), `parchment` → `band` (11),
  // `cream` → `card` (7). All three old names described a VALUE, and two of
  // them described it wrongly — there is nothing warm about #F8F8F8 and
  // `parchment` was #EAE5DC when it earned the name. The new names describe a
  // ROLE, which is SPECIFICATION.md §9.
  //
  // CALL SITES REMAIN inside src/visualiser/: `warmWhite` and `cream`. These
  // three exports exist for them and nothing else.
  //
  // It said TEN, across src/visualiser/ and src/visualiser-lab/, "which are
  // frozen and must not be edited". Neither clause is true after 3 September
  // 2026: E-08 retired and the lab was deleted, so roughly half those call sites
  // went with it and the rest are editable. Re-count before relying on a number
  // here — this comment is now about which exports exist and why, not how many
  // callers they have.
  //
  // DELETE THEM AT P4-7, with the shim, once the visualiser unfreezes. The
  // condition is `grep -rn "tokens\.\(warmWhite\|parchment\|cream\)" src/`
  // returning nothing.
  //
  // Do not use them in new code.
  // -------------------------------------------------------------------------
  /** @deprecated Use `tokens.paper`. */
  warmWhite: PAPER,
  /** @deprecated Use `tokens.band`. */
  parchment: BAND,
  /** @deprecated Use `tokens.card`. */
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
  // leg of the k in public/images/brand/logo_full.png, measured off the PNG. The mark
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

/** Declared here because it is a light/dark distinction. Zero consumers as
 *  of the Phase 0 audit; kept because deleting is a separate pass. */
export type CursorVariant = 'dark' | 'light';
