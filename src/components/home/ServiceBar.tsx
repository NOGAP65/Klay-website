// ---------------------------------------------------------------------------
// Gold service bar — sits directly under the hero.
//
// The hero makes a claim about how a home should feel; this answers "and what do
// I actually get?" before the visitor has scrolled anywhere. It is the first
// thing after the brand statement for that reason.
//
// Gold ground with charcoal text, which is one of the two fills the palette
// allows. It is also the only full-bleed gold band on the page — that is what
// makes it read as a guarantee strip rather than as another section, and why
// nothing else on the page should take this treatment.
// ---------------------------------------------------------------------------

import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';

const PROMISES = [
  'Free in-home measure',
  'Australian made to measure',
  'Professional installation',
  '2-year warranty',
];

export function ServiceBar() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: tokens.gold,
        padding: isMobile ? '22px 24px' : '26px 80px',
      }}
    >
      <div
        style={{
          maxWidth: layout.containerMax,
          margin: '0 auto',
          display: 'grid',
          // Two-up on a phone rather than four cramped columns or a stack four
          // rows deep — the claims are short enough to pair.
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '14px 12px' : 0,
        }}
      >
        {PROMISES.map((promise, i) => (
          <div
            key={promise}
            style={{
              textAlign: 'center',
              padding: isMobile ? 0 : '0 20px',
              // Divider to the left of every item but the first, so no rule
              // hangs off the end of the row. Ink at low alpha rather than a
              // lighter gold — on a gold ground the separator has to go darker
              // to be seen at all.
              borderLeft: !isMobile && i > 0 ? '1px solid rgba(28,24,16,0.22)' : undefined,
              fontFamily: tokens.body,
              fontSize: isMobile ? 10.5 : 11.5,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: tokens.ink,
              lineHeight: 1.5,
            }}
          >
            {promise}
          </div>
        ))}
      </div>
    </section>
  );
}
