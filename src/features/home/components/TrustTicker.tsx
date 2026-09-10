// ---------------------------------------------------------------------------
// 1. Trust ticker — five credentials, moving continuously, before anything else.
//
// This replaces the announcement bar, which rotated three marketing lines with a
// crossfade. The difference is not cosmetic. A rotator shows ONE claim at a time
// and hides the other two behind a four-second wait, so a visitor who scrolls
// within four seconds — most of them — sees exactly one credential and never
// learns the rest exist. A ticker shows the list AS a list: the movement is what
// says "there are more of these", and the whole set is legible in one pass
// without the visitor waiting for anything.
//
// It is also a different claim. The bar sold offers ("see it in your home before
// you buy"); this sells legitimacy — measure, installation, where it is made,
// how far Klay travels, and the two things it does not have. That is the question
// being asked in the first second on the page, and it is asked before the brand
// name has even been read.
//
// HOW IT MOVES. The same delta-driven transform as the reviews marquee: the
// offset lives in a ref, is advanced by the frame delta so the speed is identical
// on a 60Hz and a 144Hz screen, and wraps at exactly half the track — the list is
// rendered twice, so the seam always lands on an identical frame and cannot be
// seen. It does not pause on hover. A credential bar is not something you stop to
// interact with, and a strip that halts under the pointer reads as broken.
// ---------------------------------------------------------------------------


import { tokens, space, type as typeScale, usePrefersReducedMotion } from '@/ds';

/** How long one full pass of the list takes.
 *
 * It was a pixels-per-second speed, which a rAF loop can honour directly and a
 * CSS animation cannot — a keyframed transform is given a duration, and the
 * distance is however wide the content turns out to be. So the duration has to
 * be set from the run's measured width, and it drifts whenever the list changes
 * length. The note that used to sit here said so and left it at that.
 *
 * IT DRIFTED. Six credentials measured roughly 1,700px, and 40s was about
 * 42px/s. Dropping the warranty took the run to 1,465px measured in the running
 * page, which at 40s is 36.6px/s — the same strip reading a sixth slower for no
 * reason anybody chose. 35s puts it back at 41.9.
 *
 * A credential bar can carry a little drift; it should not carry a whole
 * revision of its pace as a side effect of an edit to its copy. If the list
 * changes again, measure the track and divide by 42. */
const DURATION_S = 35;

export const BAR_HEIGHT = 38;

/** FIVE NOW, AND THE COVERAGE IS THE COUNTRY.
 *
 * The warranty is gone. "2-Year Warranty" is a term of sale rather than a
 * reason to trust anyone — it is the sort of line every competitor's badge soup
 * carries, which is exactly the register this strip is built to stay out of, and
 * on a bar that a visitor reads in one pass it was spending a sixth of the list
 * on the least persuasive thing Klay could say.
 *
 * And "Victoria-Wide Coverage" is now "Australia-Wide Coverage", which is a
 * change of fact and not of wording. The two could not both stand: a strip
 * claiming Victoria and Australia in one loop contradicts itself, so this is a
 * replacement rather than an addition.
 *
 * AND THE REST OF THE SITE FOLLOWED. This line was changed first and left the
 * footer, the contact page, the shop banner, the pricing note, the About page,
 * the service-area FAQ, the meta description and the confirmation email all
 * still saying Victoria — nine places making one claim, of which only
 * `site.coverage` was a constant and the other eight were prose. They are all
 * Australia now; see the note on site.coverage for the list. */
const CREDENTIALS = [
  'Free In-Home Measure Included',
  'Professional Installation Included',
  'Custom Made in Melbourne',
  'Australia-Wide Coverage',
  'No Sales Reps. No Showrooms.',
];

/** One pass of the list. Rendered twice inside the track — the second copy is
 * what the wrap at half-width lands on, and it is aria-hidden so a screen reader
 * is not read the same six credentials twice. */
function Run() {
  return (
    <>
      {CREDENTIALS.map(credential => (
        <span
          key={credential}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            ...typeScale.micro,
            // Paper on ink — 15.87:1, the strip having inverted with the palette.
            // It was ink on gold at 6.8:1; when the gold fill became `fillStrong`
            // this was ink on ink, and the contrast audit found it at 1:1 across
            // all thirteen spans. The bar was rendering as a solid black band.
            color: tokens.onFillStrong,
            whiteSpace: 'nowrap',
          }}
        >
          {credential}
          {/* The separator inverts with the text. Paper at 0.55 over ink measures
              7.2:1 — well past the 3:1 this needs — and keeps the eye parsing the
              strip as a list of six rather than as one long sentence. It was ink
              at 0.70 on gold. Inside the span rather than between spans so the
              spacing can never collapse to a bare dot at a wrap point. */}
          <span aria-hidden="true" style={{ color: 'rgba(248,248,248,0.55)', padding: `0 ${space.item}px` }}>
            ·
          </span>
        </span>
      ))}
    </>
  );
}

export function TrustTicker() {
  // Read once, on mount. A strip that slides sideways forever is precisely what
  // this preference exists to stop — index.html also kills every animation
  // under the same query, so this is belt and braces for the DOM it renders.
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <div
      // Not aria-live. The old bar rotated its content in place and needed to
      // announce the change; this one renders all six at once in the DOM, so it
      // is read as an ordinary list and a live region would interrupt.
      style={{
        height: BAR_HEIGHT,
        // INK, and this is now the closest thing on the site to the reference.
        // It was a full-bleed gold bar, and the argument recorded here was about
        // how much gold a 38px strip should be allowed to spend before the
        // customer has been given anything. That argument is retired with the
        // colour: a black strip of uppercase micro-caps looping across the top of
        // the page is exactly Monday Haircare's, which was measured at 34px with
        // seven claims and no dividers.
        background: tokens.fillStrong,
        display: 'flex',
        alignItems: 'center',
        // Hidden while it animates, scrollable when it does not — under reduced
        // motion the reader needs some way to reach the credentials that sit off
        // the right edge. klay-hscroll hides the scrollbar itself.
        overflowX: shouldReduceMotion ? 'auto' : 'hidden',
      }}
      className={shouldReduceMotion ? 'klay-hscroll' : undefined}
    >
      {/* A CSS ANIMATION, NOT A rAF LOOP.
          It used to advance `style.transform` from JavaScript on every frame,
          which invalidates style for this subtree on every frame — forever, on
          every page, whether the bar is on screen or not. Measured with the
          testimonials marquee doing the same thing: 592 style recalculations in
          two IDLE seconds, about 296 a second, and 35% of a throttled CPU. That
          is the glitchiness; it was starving every other animation on the page.
          A keyframed transform runs on the compositor instead — zero style
          recalc, zero layout, zero main-thread work per frame.
          `klay-marquee` was already declared in index.html and unused, doing
          precisely this. The JS was duplicating CSS that existed.
          The list is rendered twice and the animation travels exactly -50%, so
          the wrap always lands on an identical frame and cannot be seen. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          // Its own compositor layer, so the transform never repaints the bar.
          willChange: 'transform',
          animation: shouldReduceMotion ? undefined : `klay-marquee ${DURATION_S}s linear infinite`,
          paddingLeft: space.item,
        }}
      >
        <Run />
        <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
          <Run />
        </div>
      </div>
    </div>
  );
}
