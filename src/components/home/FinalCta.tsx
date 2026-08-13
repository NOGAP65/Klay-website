// ---------------------------------------------------------------------------
// 13. Closing CTA — charcoal, centred, one button.
//
// It sends the reader back up to the visualiser, the same place the hero's
// Design Yours goes. Someone who has read the whole page has already been given
// the range, the process and the proof; what is left is the tool, and it is on
// this page rather than behind another navigation.
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
        <h2 style={{ ...headline.section, color: tokens.gold }}>Ready to complete your home?</h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 16,
            lineHeight: 1.7,
            color: tokens.warmWhite,
            margin: 0,
            marginTop: 22,
          }}
        >
          Design online. We measure, manufacture and install. Every time.
        </p>
        <div style={{ marginTop: isMobile ? 40 : 52 }}>
          <CtaButton onClick={scrollToId('visualiser')}>Start Designing</CtaButton>
        </div>
        {/* The two objections that stop a last-section click, in one line and
            deliberately quiet — it reassures without becoming a second CTA. */}
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            color: tokens.onDarkMuted,
            margin: 0,
            marginTop: 22,
          }}
        >
          Free measure &amp; installation included. No obligation.
        </p>
      </div>
    </section>
  );
}
