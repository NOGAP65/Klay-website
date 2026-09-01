// ---------------------------------------------------------------------------
// 4. The steps marquee — the whole process moving continuously, under the hero.
//
// IT REPLACES A SECTION. The homepage used to carry a full How It Works block —
// 635px of four photographs and four sentences — and this bar does that job in
// 54px. That trade is right for one reason: the four steps are reassurance, not
// persuasion. Nobody buys because the process has four steps rather than three;
// they buy once they know somebody competent turns up. A visitor reads a bar like
// this without stopping, and a visitor who wants more than a bar wants the whole
// story, which is a page rather than a section.
//
// UNDER THE HERO, because that is where the question is asked. "Made to measure
// and installed" raises "installed by whom, and what do I have to do?" — and
// answering it before the range means the customer reaches the products already
// knowing how buying works, instead of meeting an explanation halfway through
// shopping.
//
// CHARCOAL, NOT GOLD. It was gold to match the trust ticker at the top of the
// page, and with only the hero between them the two golds read as one thing
// stated twice rather than as a pair — the gold stopped meaning anything because
// it was the only thing either bar was saying. Inverted, the ticker keeps gold to
// itself and this bar takes the other half of the same pairing: charcoal ground,
// gold text, which is the site's dark-CTA rule and measures 5.6:1.
//
// Charcoal rather than black, because Klay has no black in it — #000000 and
// #1A1A1A are both banned outright, and ink is spoken for as the visualiser's
// one deep ground further down the page.
//
// The whole bar is a link to /how-it-works — the detail did not disappear with
// the section, it moved to the page that was always about it, photographs and
// all. See data/steps.ts.
//
// ---------------------------------------------------------------------------
// WHY IT MOVES NOW, having been a centred static row.
//
// Measured in the running page at 1440: the four steps occupied 425px and the
// other 1,015 were empty charcoal. A centred row cannot fix that — the wider the
// viewport, the more dead ground it grows on both sides, and the strip reads as a
// caption somebody forgot to widen rather than as a band of the page. A marquee
// has no such failure mode. Its content is cut by both edges by definition, so
// the bar is full at every width there is, and 1440 is not a special case of it.
//
// It is also the move the brands Klay is measured against actually make. Monday
// Haircare runs seven credentials as a 34px black strip, uppercase micro-caps,
// wide tracking, no dividers, looping forever; Kookaï and Allbirds run 26 and
// 32px announcement bars. Not one of the three has a how-it-works section at all,
// because nothing about buying shampoo needs explaining — Klay's process does,
// and the marquee is how that brand family would say it.
//
// ARROWS, NOT DOTS, and this is the whole difference from the trust ticker. That
// strip is a LIST of six credentials in any order and separates them with `·`.
// This one is a SEQUENCE of four steps in the only order they happen, and an
// arrow between them says so at a glance without a word being spent on it.
//
// IT IS NOT DIFFERENTIATED FROM THE TICKER BY SPEED, which was the first
// instinct and the wrong one. Both strips are briefly on screen together — the
// hero is cut so this bar shows under it — and two marquees at one pace would
// read as one mechanism running twice. But the arrows, the inverted colourway
// and the pause-on-hover already say they are different things, so the speed is
// free to be set on its own merits. See DURATION_S.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { tokens, prefersReducedMotion, space, type as typeScale, useHover } from '@/ds';
import { STEPS } from '@/features/marketing';

/** One full pass of the four steps — and it is set from a measured width, not a
 * guessed one.
 *
 * The four steps with their promises measure 1,277px in the running page (the
 * rendered track is 2,555, being two copies of that). This was first written as
 * 64s on an estimate of ~2,400px per run, which would have run the strip at
 * 20px/s — a step taking sixteen seconds to cross, and over a minute before a
 * reader had seen all four. Nobody stays above the fold for a minute.
 *
 * The constraint that actually sets this: the bar is half-cut by the fold, so it
 * is on screen from load, and a visitor gives the top of a page something like
 * ten or fifteen seconds. The whole sequence has to pass inside that. 1,277px
 * over 24s is 53px/s, which does it — and is comfortably readable rather than
 * frantic at 10 and 12px.
 *
 * It ends up about a quarter faster than the ticker's 42px/s. That is fine, and
 * it is not what tells the two strips apart; see the header note.
 *
 * Note this only binds below about 1,300px of viewport. Wider than that, one run
 * is narrower than the screen and the reader has the entire sequence in front of
 * them at every instant regardless of pace — the speed is doing its work on
 * phones, which is where a 1,277px run is genuinely hiding three of four steps. */
const DURATION_S = 24;

/** THE BAR'S OWN RENDERED HEIGHT, exported so the hero can position the fold
 * against it rather than carrying a literal.
 *
 * Derived, not measured: the row's vertical padding (`space.item` top and bottom)
 * plus the label's own line box. The label is `type.label` — 12px at
 * line-height 1.6 — which lays out at 19.2, and the numeral beside it is set to
 * line-height 1 so it cannot be the taller of the two.
 *
 * It exists because the hero used to subtract a hardcoded 54 for this bar. That
 * number was already wrong before this pass (the bar measured 53.59) and the v2
 * padding change moved it again. A literal here goes stale silently — the hero
 * simply lands the fold in the wrong place and nobody notices.
 *
 * The hero now subtracts HALF of it rather than all of it, so the bar is cut by
 * the fold instead of sitting squarely above it. Same reason the constant has to
 * be derived: half of a stale number is still stale.
 *
 * Unchanged by the marquee rewrite, which is the point of the rewrite: the strip
 * gained the full width and the four promises without gaining a pixel of height. */
export const STEPS_BAR_HEIGHT = space.item * 2 + Math.round(12 * 1.6);

/** One pass of the four steps. Rendered twice inside the track — the animation
 * travels exactly -50%, so the wrap lands on an identical frame and the seam
 * cannot be seen. The second copy is aria-hidden so a screen reader is not read
 * the same four steps twice. */
function Run() {
  return (
    <>
      {STEPS.map((step, i) => (
        <span
          key={step.label}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: space.tight,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              ...typeScale.label,
              fontFamily: tokens.display,
              letterSpacing: 'normal',
              lineHeight: 1,
              // FULL GOLD. It was gold at 0.5, which measured 2.45 on charcoal
              // — the numeral was decoration the eye could not resolve rather
              // than the ordering mark it is there to be. At full strength it
              // measures 5.53. It still reads as subordinate to the label
              // because it is set in the display face at label size, which is
              // a quieter difference than opacity and a legible one.
              color: tokens.onDark,
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span style={{ ...typeScale.label, color: tokens.onDark }}>{step.label}</span>
          {/* THE PROMISE, in micro rather than label and sentence case rather
              than caps — but at FULL GOLD, not dimmed.
              It has to sit beside the label without competing with it: the label
              is the ordering mark you scan, this is the reason to keep reading,
              and caps at the same size would have made every step two headlines.
              Size and case do that on their own.
              Opacity was the obvious third separation and it is the wrong one,
              for exactly the reason the numeral above is no longer dimmed. Gold
              at 0.72 measures 3.59:1 on charcoal, and 10px at weight 500 is not
              large-scale text under 1.4.3 — large-scale starts at 18px, or 14px
              bold — so the floor here is 4.5 and nothing short of full gold
              clears it (0.85 only reaches 4.41). Full gold measures 5.53. */}
          <span
            style={{
              ...typeScale.micro,
              textTransform: 'none',
              letterSpacing: '0.06em',
              color: tokens.onDark,
              paddingLeft: space.tight,
            }}
          >
            {step.promise}
          </span>
          {/* AN ARROW, not the ticker's dot — these four are a sequence, and the
              arrow carries the ordering the dot throws away. Drawn on light edge
              rather than gold so it separates the steps without becoming a fifth
              gold thing per step to look at.
              After the last step as well as between them, because the strip
              loops: step 04 is followed by step 01, and a missing arrow at the
              seam is the one frame that would give the wrap away. */}
          <span
            aria-hidden="true"
            style={{ color: tokens.onDarkEdge, padding: `0 ${space.group}px`, fontSize: 12 }}
          >
            →
          </span>
        </span>
      ))}
    </>
  );
}

export function StepsBar() {
  const { hover, bind } = useHover();
  // Read once, on mount. A strip that slides sideways forever is precisely what
  // this preference exists to stop — index.html also kills every animation
  // under the same query, so this is belt and braces for the DOM it renders.
  const [reduceMotion] = useState(prefersReducedMotion);

  return (
    <Link
      {...bind}
      to="/how-it-works"
      aria-label="How Klay works — see the full process"
      style={{
        display: 'block',
        textDecoration: 'none',
        // Deepens to ink on hover, so the bar answers the pointer and reads as
        // the link it is. Same move the dark CTA makes everywhere else.
        background: hover ? tokens.ink : tokens.charcoal,
        transition: 'background 0.25s ease',
        // Hidden while it animates, scrollable when it does not — under reduced
        // motion the reader needs some way to reach the steps that sit off the
        // right edge. klay-hscroll hides the scrollbar itself.
        overflowX: reduceMotion ? 'auto' : 'hidden',
        // No horizontal padding, unlike the static row this replaces. A marquee
        // is meant to be cut by both edges; inset by space.item it would instead
        // appear and disappear a gutter early, which reads as a clipping bug
        // rather than as a strip running past the viewport.
        padding: `${space.item}px 0`,
      }}
      className={reduceMotion ? 'klay-hscroll' : undefined}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          width: 'max-content',
          // Its own compositor layer, so the transform never repaints the bar.
          // See TrustTicker: the rAF version of this pattern cost 296 style
          // recalculations a second while idle. A keyframed transform costs none.
          willChange: 'transform',
          animation: reduceMotion ? undefined : `klay-marquee ${DURATION_S}s linear infinite`,
          // Pauses under the pointer, which the trust ticker deliberately does
          // not do. The difference is that this strip is a link: a reader who
          // has brought the cursor here is deciding whether to click, and a
          // target that keeps moving under the pointer is one they have to
          // chase. The ticker is not clickable and stopping it reads as broken.
          animationPlayState: hover ? 'paused' : 'running',
          paddingLeft: space.group,
        }}
      >
        <Run />
        {/* The second copy exists only so the -50% wrap lands on an identical
            frame. Under reduced motion nothing wraps — the track is a plain
            horizontal scroller — and the copy would just mean a reader who
            scrolls it reaches step 04 and then finds all four again. */}
        {!reduceMotion && (
          <div aria-hidden="true" style={{ display: 'flex', alignItems: 'baseline' }}>
            <Run />
          </div>
        )}
      </div>
    </Link>
  );
}
