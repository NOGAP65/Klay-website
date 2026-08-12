// ---------------------------------------------------------------------------
// 8. Trust bar — four claims on charcoal.
//
// No icons, no cards. The tiles are separated by a single hairline between
// them, which is enough structure for four short lines and leaves the band
// reading as one continuous rule across the page.
// ---------------------------------------------------------------------------

import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';

const CLAIMS = [
  { label: 'Australian Made', note: 'Manufactured here, not imported' },
  { label: 'In-Home Measure Included', note: 'A technician, at no extra cost' },
  { label: '2-Year Warranty', note: 'On fabric, hardware and motors' },
  { label: 'Victoria-Wide Coverage', note: 'Metro Melbourne and regional' },
];

export function TrustBar() {
  const isMobile = useIsMobile();

  return (
    <section style={{ background: tokens.charcoal, padding: isMobile ? '56px 24px' : '72px 80px' }}>
      <div
        style={{
          maxWidth: layout.containerMax,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: isMobile ? '32px 20px' : 0,
        }}
      >
        {CLAIMS.map((claim, i) => (
          <div
            key={claim.label}
            style={{
              textAlign: 'center',
              padding: isMobile ? 0 : '0 28px',
              // Divider on the left of every tile but the first, so there is no
              // trailing rule hanging off the end of the row. Suppressed on
              // mobile, where the four wrap to a 2x2 and a left border would
              // land in the middle of the block.
              borderLeft: !isMobile && i > 0 ? `1px solid ${tokens.onDarkLine}` : undefined,
            }}
          >
            <div
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: tokens.warmWhite,
                lineHeight: 1.5,
              }}
            >
              {claim.label}
            </div>
            <div
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: tokens.onDarkMuted,
                marginTop: 9,
                lineHeight: 1.6,
              }}
            >
              {claim.note}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
