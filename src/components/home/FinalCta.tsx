// ---------------------------------------------------------------------------
// 11. Closing CTA — charcoal, centred, one button.
//
// One action, and it points back up the page to the visualiser rather than off
// to another route: the tool that converts is already loaded and configured,
// and sending someone to a fresh page to start again is how you lose them at
// the last section.
// ---------------------------------------------------------------------------

import { tokens, headline, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaButton, scrollToId } from './primitives';

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
          <CtaButton onClick={scrollToId('visualiser')}>Start Designing</CtaButton>
        </div>
      </div>
    </section>
  );
}
