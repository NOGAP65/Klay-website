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
// STATIC AGAIN, AND THREE STEPS — asked for, and the reversal is worth its own
// note because the argument this bar was built on is directly below.
//
// It moved because of a measurement: at 1440 the four steps occupied 425px and
// the other 1,015 were empty charcoal, and a CENTRED row cannot fix that — the
// wider the viewport, the more dead ground it grows on both sides. That was
// true, and it is answered here without motion. The three steps are DISTRIBUTED
// across the band rather than huddled in the middle of it, so the bar is full at
// every width for the same reason the marquee was: nothing is centred, the
// content reaches both edges of the container. What the marquee bought at the
// cost of a permanently moving strip, `space-between` buys for nothing.
//
// And a moving strip has a cost the note below never priced. This bar is a LINK,
// and it was a link whose target slid out from under the pointer — hence the
// pause-on-hover that had to be bolted to it. A reader deciding whether to press
// something should not have to chase it. Static, that whole problem is gone
// along with the marquee keyframes, the doubled track, the compositor layer and
// the separate reduced-motion path.
//
// THREE, NOT FOUR, and the labels changed with the count: Buy, Professional
// measure, Professional install. That is the process from the customer's side —
// what they do, then the two things Klay turns up and does. The four-step story
// (Design, Measure, Make, Install) is the marketing one and still lives on
// /how-it-works, which this bar still links to; see the note on BAR_STEPS for
// why this file no longer reads STEPS.
//
// ARROWS, NOT DOTS, and this is the whole difference from the trust ticker. That
// strip is a LIST of credentials in any order and separates them with `·`. This
// one is a SEQUENCE in the only order it happens, and an arrow between them says
// so at a glance without a word being spent on it. There is no arrow after the
// last step now — it only existed because the strip looped, and step 03 is
// followed by nothing.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';

import { tokens, space, layout, type as typeScale, useHover } from '@/ds';
import { useIsMobile } from '@/shared';

/** THE THREE STEPS THIS BAR SAYS, and it no longer reads STEPS from marketing.
 *
 * That constant is the four-step story — Design, Measure, Make, Install, each
 * with an actor, a body, a promise and a photograph — and it belongs to
 * /how-it-works, which renders all of it. This bar wants three labels and
 * nothing else, so borrowing that array meant taking a `label` out of four
 * objects and dropping the rest, and it meant that changing what the bar says
 * would change what the page says.
 *
 * Three plain strings, held here, is the honest shape of what this component
 * needs. The page keeps its four steps; the bar keeps its three. */
const BAR_STEPS = ['Buy', 'Professional measure', 'Professional install'];

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
 * Unchanged by the marquee rewrite, and unchanged again by going static: the
 * padding and the label's type are what set it, and neither moved. The hero's
 * fold lands where it always did. That is worth stating rather than assuming —
 * a bar that changed height here would silently misplace the fold on the
 * homepage, which is the failure this constant exists to prevent. */
export const STEPS_BAR_HEIGHT = space.item * 2 + Math.round(12 * 1.6);

/** ONE STEP: its ordinal, its label, and the arrow that leads to the next.
 *
 * The arrow belongs to the step BEFORE the gap rather than being a child of the
 * row, because that is what lets the row distribute: five flex children — step,
 * arrow, step, arrow, step — would space the arrows as though they were steps
 * and leave them floating in the middle of nothing. Attached, each step is one
 * indivisible object and the three of them share the band between them. */
function Step({ label, index, isLast }: { label: string; index: number; isLast: boolean }) {
  return (
    <span
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
          // FULL GOLD. It was gold at 0.5, which measured 2.45 on charcoal —
          // the numeral was decoration the eye could not resolve rather than
          // the ordering mark it is there to be. At full strength it measures
          // 5.53. It still reads as subordinate to the label because it is set
          // in the display face at label size, which is a quieter difference
          // than opacity and a legible one.
          color: tokens.onDark,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <span style={{ ...typeScale.label, color: tokens.onDark }}>{label}</span>
      {/* NOT AFTER THE LAST ONE. The old strip drew an arrow after every step
          including the fourth, because it looped and step 04 was followed by
          step 01 — a missing arrow at the seam was the one frame that would
          have given the wrap away. Nothing follows step 03 now, and an arrow
          pointing off the end of a finished sequence promises a fourth step
          that does not exist. */}
      {!isLast && (
        <span
          aria-hidden="true"
          style={{ color: tokens.onDarkEdge, paddingLeft: space.group, fontSize: 12 }}
        >
          →
        </span>
      )}
    </span>
  );
}

export function StepsBar() {
  const { isHovered, bind } = useHover();
  const isMobile = useIsMobile();

  return (
    <Link
      {...bind}
      to={routes.howItWorks}
      aria-label="How Klay works — see the full process"
      style={{
        display: 'block',
        textDecoration: 'none',
        // Deepens to ink on hover, so the bar answers the pointer and reads as
        // the link it is. Same move the dark CTA makes everywhere else.
        background: isHovered ? tokens.ink : tokens.charcoal,
        transition: 'background 0.25s ease',
        padding: `${space.item}px 0`,
      }}
    >
      {/* THE BAND'S OWN CONTAINER, and the padding is back on it.
          The marquee deliberately had none — a strip meant to be cut by both
          edges would otherwise appear and disappear a gutter early, which reads
          as a clipping bug. A static row has the opposite need: the first
          ordinal and the last label are meant to sit ON the page's margins,
          lining up with the heading of the section below rather than running
          into the viewport edge.
          SPACE-BETWEEN IS WHAT REPLACES THE MOTION. Centred, three steps would
          be a 500px huddle in the middle of a 1440px band with the same dead
          charcoal either side that sent this bar to a marquee in the first
          place. Distributed, the row reaches both margins at every width, which
          is the property the marquee was bought for. */}
      <div
        className="klay-hscroll"
        style={{
          maxWidth: layout.gridMax,
          margin: '0 auto',
          padding: `0 ${layout.inlinePad(isMobile)}px`,
          display: 'flex',
          alignItems: 'baseline',
          // Distributed on a desktop, packed on a phone. Below the breakpoint
          // the three steps are wider than the screen — "Professional install"
          // alone is most of a phone — so spacing them apart would only push
          // the third further out of reach. Packed and swipeable, the reader
          // gets step 01 in place and the rest a thumb away.
          justifyContent: isMobile ? 'flex-start' : 'space-between',
          gap: isMobile ? space.group : 0,
          // ONE LINE, ALWAYS. Wrapping is the one thing this row must not do:
          // STEPS_BAR_HEIGHT is derived from a single label's line box and the
          // hero positions its fold against it, so a second line would silently
          // land the fold in the wrong place. It scrolls instead, with the
          // scrollbar hidden by klay-hscroll.
          overflowX: 'auto',
        }}
      >
        {BAR_STEPS.map((label, index) => (
          <Step
            key={label}
            label={label}
            index={index}
            isLast={index === BAR_STEPS.length - 1}
          />
        ))}
      </div>
    </Link>
  );
}
