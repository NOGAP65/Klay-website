// ---------------------------------------------------------------------------
// 13. The gold steps bar — the four steps in one line, at the foot of the page.
//
// It bookends the trust ticker at the top: same gold ground, same ink text, same
// thin single line. The top bar says what Klay guarantees before you have read
// anything; this one says how it works after you have read everything, and the
// two golds close the page around the whole of it.
//
// NOT A SECOND HOW-IT-WORKS SECTION. That section is four photographs and four
// sentences and it earns its height; this is a strip you take in without reading,
// for the visitor who has scrolled past that section and arrived at the last CTA
// still holding the question "so what actually happens after I click?". The
// labels come from the same array the section uses — see STEPS — so the two can
// never end up describing different processes.
//
// ON THE TEXT COLOUR. Ink, not black. Ink on gold measures 6.8:1, and the brand
// has no black in it at all — the "black text on gold" this bar was asked for is
// the primary-CTA pairing the whole site already uses, which is gold ground with
// ink on top.
// ---------------------------------------------------------------------------

import { tokens } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { STEPS } from './HowItWorksSteps';

export function StepsBar() {
  const isMobile = useIsMobile();

  return (
    <section
      aria-label="How Klay works"
      style={{
        background: tokens.gold,
        // Thin. It is a rule across the page that happens to carry four words,
        // not a section — at any real padding it stops being a bar and starts
        // competing with the closing CTA immediately above it.
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
    </section>
  );
}
