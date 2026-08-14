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
// It also bookends the trust ticker: same gold, same ink, same thin line, with
// the hero framed between them. The ticker says what is guaranteed; this says
// what happens.
//
// The whole bar is a link to /how-it-works — the detail did not disappear with
// the section, it moved to the page that was always about it, photographs and
// all. See data/steps.ts.
//
// ON THE TEXT COLOUR. Ink, not black. Ink on gold measures 6.8:1, and the brand
// has no black in it at all — the "black text on gold" this bar was asked for is
// the primary-CTA pairing the whole site already uses, which is gold ground with
// ink on top.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { STEPS } from '../../data/steps';
import { useHover } from './primitives';

export function StepsBar() {
  const isMobile = useIsMobile();
  const { hover, bind } = useHover();

  return (
    <Link
      {...bind}
      to="/how-it-works"
      aria-label="How Klay works — see the full process"
      style={{
        display: 'block',
        textDecoration: 'none',
        // Lifts a step on hover, so the bar answers the pointer and reads as the
        // link it is. Nothing else changes — a colour shift on a gold ground this
        // saturated has nowhere to go that isn't worse.
        background: hover ? tokens.goldLight : tokens.gold,
        transition: 'background 0.25s ease',
        // Thin. It is a rule across the page that happens to carry four words,
        // not a section — at any real padding it stops being a bar and starts
        // being the section it was brought in to replace.
        padding: isMobile ? '0 0' : '0 24px',
      }}
    >
      <div
        className={isMobile ? 'klay-hscroll' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          // Spread on desktop. On a phone four steps cannot share one line at any
          // legible size, so the row scrolls sideways rather than wrapping into a
          // block — wrapped, this stops being a bar, which is the one thing it is.
          justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 26 : 0,
          overflowX: isMobile ? 'auto' : 'visible',
          padding: isMobile ? '16px 24px' : '18px 0',
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 9,
              flexShrink: 0,
              // A divider between steps rather than after the last one, drawn in
              // ink at low opacity so it separates without becoming a fifth thing
              // to look at. Off entirely on mobile, where the row scrolls and a
              // rule would be cut mid-stroke at the edge of the viewport.
              padding: isMobile ? 0 : '0 30px',
              borderLeft:
                !isMobile && i > 0 ? '1px solid rgba(28,24,16,0.22)' : undefined,
            }}
          >
            <span
              style={{
                fontFamily: tokens.display,
                fontSize: 15,
                fontWeight: 400,
                lineHeight: 1,
                // Down at 0.5 so the numeral marks the order without competing
                // with the words — it is a bullet here, not a decorative numeral
                // the way it is in the section itself.
                color: 'rgba(28,24,16,0.5)',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span
              style={{
                fontFamily: tokens.body,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: tokens.ink,
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
