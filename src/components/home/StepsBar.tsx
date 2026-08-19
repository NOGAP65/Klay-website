// ---------------------------------------------------------------------------
// 4. The gold steps bar — the whole process in one line, directly under the hero.
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
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, space, type as typeScale } from '../../theme';
import { useMediaQuery } from '../../hooks/useIsMobile';
import { STEPS } from '../../data/steps';
import { useHover } from './primitives';

/** WHERE THE ROW COLLAPSES TO A SCROLLER — and it is 860, not the site's 768.
 *
 * This is the other half of the §7 overflow fix. The bar collapsed at 768 while
 * the nav collapses at 860, so between those two thresholds the bar was still in
 * its desktop branch, centring four steps that no longer fit. `body { overflow-x:
 * hidden }` then hid the fourth step's right edge instead of letting the row
 * scroll, so the step was silently clipped rather than reachable.
 *

 * 1000, NOT the 860 the work order projected. With the per-step padding down to
 * 20 the row was predicted to need 824; measured in the running page it needs
 * 889 of content and only clears its container from about 1000 up (984 in 984 at
 * 1024, against 889 in 860 at 900). The projection assumed narrower labels than
 * "Choose", "Measure", "Manufacture", "Install" actually set to.
 *
 * So this sits above the nav's 860 rather than matching it. That is fine — the
 * two do not have to collapse together, they have to each collapse before their
 * own contents stop fitting. */
const STEPS_COLLAPSE = '(max-width: 1000px)';

export function StepsBar() {
  // Named `isMobile` still, because every branch below asks the same question:
  // is this row a centred bar or a sideways scroller. See STEPS_COLLAPSE.
  const isMobile = useMediaQuery(STEPS_COLLAPSE);
  const { hover, bind } = useHover();

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
        // Thin. It is a rule across the page that happens to carry four words,
        // not a section — at any real padding it stops being a bar and starts
        // being the section it was brought in to replace.
        padding: isMobile ? 0 : `0 ${space.md}px`,
      }}
    >
      <div
        className={isMobile ? 'klay-hscroll' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          // Spread on desktop. Below the collapse threshold four steps cannot
          // share one line at any legible size, so the row scrolls sideways
          // rather than wrapping into a block — wrapped, this stops being a bar,
          // which is the one thing it is.
          justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? space.md : 0,
          overflowX: isMobile ? 'auto' : 'visible',
          padding: isMobile ? `${space.md}px ${space.md}px` : `${space.md}px 0`,
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: space.xs,
              flexShrink: 0,
              // A divider between steps rather than after the last one, drawn in
              // ink at low opacity so it separates without becoming a fifth thing
              // to look at. Off entirely on mobile, where the row scrolls and a
              // rule would be cut mid-stroke at the edge of the viewport.
              //
              // 20, down from 30, and this is half of the §7 overflow fix: four
              // steps at 30 put the fourth step's right edge at 904 against an
              // 860 viewport, where `body { overflow-x: hidden }` silently
              // clipped it rather than letting it scroll. Reclaiming 80px across
              // the row brings that to 824. The other half is the collapse
              // threshold below.
              padding: isMobile ? 0 : `0 ${space.md}px`,
              borderLeft:
                !isMobile && i > 0 ? `1px solid ${tokens.onDarkEdge}` : undefined,
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
                color: tokens.gold,
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              style={{
                ...typeScale.label,
                color: tokens.gold,
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </Link>
  );
}
