// ---------------------------------------------------------------------------
// 1. Trust ticker — six credentials, moving continuously, before anything else.
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
// warranty, coverage, and the two things Klay does not have. That is the question
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

import { useState } from 'react';
import { tokens, prefersReducedMotion, space, type as typeScale } from '../../theme';

/** How long one full pass of the list takes.
 *
 * It was a pixels-per-second speed, which a rAF loop can honour directly and a
 * CSS animation cannot — a keyframed transform is given a duration, and the
 * distance is however wide the content turns out to be. Six credentials at this
 * type size run roughly 1,700px, so 40s is about 42px/s: the same pace the loop
 * ran at, expressed the way CSS needs it.
 *
 * The trade is that the pace now drifts slightly with the length of the list
 * rather than being exact. For a credential bar that is not a real cost, and it
 * buys back 296 style recalculations a second. */
const DURATION_S = 40;

export const BAR_HEIGHT = 38;

const CREDENTIALS = [
  'Free In-Home Measure Included',
  'Professional Installation Included',
  'Custom Made in Melbourne',
  '2-Year Warranty',
  'Victoria-Wide Coverage',
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
            // Ink on gold — 6.8:1, and the same pairing every primary CTA on the
            // site uses. The brand has no black in it, so the "black text" this
            // bar reads as is ink.
            color: tokens.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {credential}
          {/* Ink at 0.70, so the eye parses the strip as a list of six rather
              than as one long sentence. It was 0.42, which measured 2.16 on gold
              and failed 1.4.11's 3:1; 0.70 measures 3.88. Inside the span rather
              than between spans so the spacing can never collapse to a bare dot
              at a wrap point. */}
          <span aria-hidden="true" style={{ color: 'rgba(28,24,16,0.70)', padding: `0 ${space.md}px` }}>
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
  const [reduceMotion] = useState(prefersReducedMotion);

  return (
    <div
      // Not aria-live. The old bar rotated its content in place and needed to
      // announce the change; this one renders all six at once in the DOM, so it
      // is read as an ordinary list and a live region would interrupt.
      style={{
        height: BAR_HEIGHT,
        // GOLD. It was moved to charcoal on the gold-budget argument — a
        // full-bleed 38px gold bar paints 4.2% of a 900px viewport before the
        // customer has been given anything, and gold's perceived value falls
        // with the area it covers. Overruled: the gold bar reads better, and it
        // is the first thing on the page.
        //
        // The contrast half of that change is kept rather than reverted with it.
        // The separator below is ink at 0.70 rather than the 0.42 it was, which
        // measured 2.16 on gold and failed; 0.70 measures 3.88.
        background: tokens.gold,
        display: 'flex',
        alignItems: 'center',
        // Hidden while it animates, scrollable when it does not — under reduced
        // motion the reader needs some way to reach the credentials that sit off
        // the right edge. klay-hscroll hides the scrollbar itself.
        overflowX: reduceMotion ? 'auto' : 'hidden',
      }}
      className={reduceMotion ? 'klay-hscroll' : undefined}
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
          animation: reduceMotion ? undefined : `klay-marquee ${DURATION_S}s linear infinite`,
          paddingLeft: space.md,
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
