// ---------------------------------------------------------------------------
// 11. Closing CTA — charcoal, centred, one button.
//
// The same Buy Now as the hero, in the same words and to the same place. This
// is the last thing on the page before the footer, and someone who has read all
// of it should not have to work out that "Start Designing" was the same offer
// the hero made.
// ---------------------------------------------------------------------------

import { tokens, headline, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { BUY_NOW_LABEL, BUY_NOW_TO, CtaLink } from './primitives';

export function FinalCta() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: tokens.charcoal,
        padding: isMobile ? '96px 24px' : '150px 80px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <h2 style={{ ...headline.section, color: tokens.gold }}>
          Ready to transform your windows?
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            lineHeight: 1.7,
            color: tokens.onDarkMuted,
            margin: 0,
            marginTop: 22,
          }}
        >
          Design online. We handle everything else.
        </p>
        <div style={{ marginTop: isMobile ? 40 : 52 }}>
          <CtaLink to={BUY_NOW_TO}>{BUY_NOW_LABEL}</CtaLink>
        </div>
      </div>
    </section>
  );
}
