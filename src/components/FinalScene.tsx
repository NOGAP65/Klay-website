import { useState } from 'react';
import { RevealWords } from './RevealWords';
import { tokens, headline, motion, supporting } from '../theme';
import { splitWords } from '../utils/splitWords';

export function FinalScene() {
  const [primaryHover, setPrimaryHover] = useState(false);
  const [secondaryHover, setSecondaryHover] = useState(false);

  return (
    <section
      id="final"
      style={{
        position: 'relative',
        // Charcoal — the conviction close, and the same ground the Footer
        // below now uses, so the page ends on one continuous dark block that
        // bookends the charcoal hero at the top. Previously ink, which made
        // this and the footer two subtly different darks stacked together.
        background: tokens.charcoal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '140px 0',
      }}
    >
      {/* Slow gold radial glow rising from bottom — dawn light under a door */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'radial-gradient(ellipse at 50% 120%, rgba(200,151,58,0.2) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '0 5vw', textAlign: 'center' }}>
        <RevealWords
          as="h2"
          words={[
            ...splitWords('Ready to let the'),
            { text: 'light', italic: true, color: tokens.gold },
            { text: 'in?', italic: true, color: tokens.gold },
          ]}
          style={{
            ...headline.section,
            lineHeight: 1.05,
            color: tokens.warmWhite,
            justifyContent: 'center',
          }}
        />
        <p style={{ ...supporting.onDark, fontSize: 18, fontWeight: 300, margin: '28px auto 44px', maxWidth: 520 }}>
          Design your blinds in minutes. We measure. We install. You live in it.
        </p>
        {/* Two CTAs by design: the gold button is the primary path and carries
            all the visual weight, but a made-to-measure trade purchase has a
            real cohort who will only ever convert by phone. The ghost button
            keeps that path open without competing for the eye. */}
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* The copy above promises designing your blinds — that happens in
              the visualiser, so this points there rather than at the range. */}
          <a
            href="#visualiser"
            onMouseEnter={() => setPrimaryHover(true)}
            onMouseLeave={() => setPrimaryHover(false)}
            style={{
              textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '18px 40px',
              borderRadius: 2, background: primaryHover ? tokens.goldLight : tokens.gold,
              color: tokens.ink,
              transition: motion.button,
            }}
          >
            Design Yours
          </a>
          <a
            href="tel:1300005529"
            onMouseEnter={() => setSecondaryHover(true)}
            onMouseLeave={() => setSecondaryHover(false)}
            style={{
              textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '18px 40px',
              borderRadius: 2, background: 'transparent',
              color: secondaryHover ? tokens.gold : tokens.warmWhite,
              border: `1px solid ${secondaryHover ? tokens.gold : tokens.onDarkEdge}`,
              transition: motion.button,
            }}
          >
            Call 1300 00 KLAY
          </a>
        </div>
      </div>
    </section>
  );
}
