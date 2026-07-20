import { RevealWords } from './RevealWords';
import { tokens } from '../theme';
import { splitWords } from '../utils/splitWords';

export function FinalScene() {
  return (
    <section
      id="final"
      style={{
        position: 'relative',
        background: tokens.dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '80px 0',
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
            fontWeight: 300,
            fontSize: 'clamp(44px, 6.5vw, 96px)',
            lineHeight: 1.05,
            color: tokens.warmWhite,
            justifyContent: 'center',
          }}
        />
        <p style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 18, color: tokens.textMuted, margin: '26px auto 40px', maxWidth: 520 }}>
          Design your blinds in minutes. We measure. We install. You live in it.
        </p>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#collection"
            style={{
              textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '17px 36px',
              background: tokens.gold, color: tokens.dark, transition: 'background 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = tokens.goldLight)}
            onMouseLeave={(e) => (e.currentTarget.style.background = tokens.gold)}
          >
            Design Yours
          </a>
          <a
            href="tel:1300005529"
            style={{
              textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '17px 36px',
              background: 'transparent', color: tokens.warmWhite, border: '1px solid rgba(248,246,242,0.3)',
              transition: 'border-color 0.3s ease, color 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = tokens.gold; e.currentTarget.style.color = tokens.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(248,246,242,0.3)'; e.currentTarget.style.color = tokens.warmWhite; }}
          >
            Call 1300 00 KLAY
          </a>
        </div>
      </div>
    </section>
  );
}
