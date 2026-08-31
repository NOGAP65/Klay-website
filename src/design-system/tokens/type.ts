// ---------------------------------------------------------------------------
// THE TYPE SCALE, AND THE ROLES BUILT ON IT
//
// Extracted verbatim from src/theme.ts in Phase 2.2a of the architecture
// migration. Content is byte-identical to what it replaced — this was a move,
// not a rewrite, and the reasoning in the comments below is the original's.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE TYPE SCALE. Eight steps, closed. ADR-017.
//
//   10 · 12 · 14 · 16 · 20 · 26 · 34 · 56
//
// Ratios 1.2 · 1.17 · 1.14 · 1.25 · 1.3 · 1.31 · 1.65.
//
// THE ROLE NAMES BELOW WERE NEVER THE PROBLEM. micro, label, body, lead, card,
// numeric, section, hero and ornament are already roles, which is what §9 asks
// for. Only the sizes behind them changed: lead 17 → 16, body 15 → 14,
// numeric 32 → 34.
//
// ---------------------------------------------------------------------------
// THE CANDIDATE THAT SCORED BETTER AND WAS REJECTED.
//
// 11 · 13 · 15 · 20 · 26 · 34 · 56 matched current usage better — 51.5% of
// occurrences unchanged against this scale's 45.5%. Its first three steps are
// the three most-used font sizes in the codebase, which is exactly why it was
// refused: a scale built on current usage is the current inconsistency written
// down and blessed. Three steps one pixel apart cannot express a hierarchy — a
// reader cannot tell 13 from 14, so the distinction does nothing except make
// the scale unfalsifiable, since any value can be called "close to a step".
//
//   A SCALE CONSTRAINS, IT DOES NOT ACCOMMODATE.
//
// The six points of exact match this costs are almost entirely 11 → 10 (28
// occurrences) and 13 → 12 (24) — 1px moves on small UI labels, which is the
// cheapest kind of change available.
//
// TWO SIZES SIT OUTSIDE THE SCALE and should stay there: ornament (116) and
// the two clamped headline roles. A clamp is a range, not a step.
// ---------------------------------------------------------------------------

import { tokens } from './colour';

import type { Style } from './style';

// ---------------------------------------------------------------------------
// THE TYPE SCALE. Nine roles, one size each. The same role is never two sizes.
//
// Before this the page rendered 21 distinct font sizes, including three sizes
// for the section-headline role and six for the uppercase label. The sizes were
// never the problem on their own — the problem is that a reader cannot learn a
// hierarchy that changes definition between sections.
// ---------------------------------------------------------------------------

export const type = {
  /** 116 — the quote mark in Testimonials. OUTSIDE THE SCALE, deliberately:
   *  it is ornament, not body hierarchy, and forcing it onto a text scale would
   *  flatten it to 56. ADR-017. */
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
    // Clamped, so it is not a scale step and does not need to be one — the
    // ceiling is the hero's own proportion. LOCKED; see the note above.
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
    // Clamped like the hero. Its floor of 38 sits between scale steps by
    // design: a clamp is a range, not a step.
    fontSize: 'clamp(38px, 5vw, 64px)',
    fontWeight: 300,
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
    margin: 0,
  } as Style,

  /** 26 — card and step headings, subordinate to a section headline. */
  card: {
    fontFamily: tokens.display,
    fontSize: 26, // scale step
    fontWeight: 300,
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    margin: 0,
  } as Style,

  /** 32 — a price or a step number. Cormorant, because a numeral set in the
   * display face is the one place figures get to feel considered. */
  numeric: {
    fontFamily: tokens.display,
    fontSize: 34, // scale step — was 32, the scale's nearest is 34
    fontWeight: 300,
    lineHeight: 1.1,
    margin: 0,
  } as Style,

  /** 17 — the hero lead, and nothing else. The one body size above 15. */
  lead: {
    fontFamily: tokens.body,
    fontSize: 16, // scale step — was 17
    fontWeight: 300,
    lineHeight: 1.7,
    margin: 0,
  } as Style,

  /** 15 — all body copy. Was six sizes between 12 and 17. */
  body: {
    fontFamily: tokens.body,
    fontSize: 14, // scale step — was 15
    fontWeight: 300,
    lineHeight: 1.75,
    margin: 0,
  } as Style,

  /** 12 — buttons and UI labels. */
  label: {
    fontFamily: tokens.body,
    fontSize: 12, // scale step
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
    fontSize: 10, // scale step
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
