import { RevealWords } from './RevealWords';
import { tokens, prefersReducedMotion } from '../theme';
import { splitWords } from '../utils/splitWords';

export function QuoteScene() {
  return (
    <section
      style={{
        position: 'relative',
        background: "url('/images/room-5.png') center/cover no-repeat",
        padding: '140px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Dark overlay above the room photo */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,5,0.88)' }} />

      {/* Slow radial pulse from center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '70vw',
          height: '70vw',
          maxWidth: 900,
          maxHeight: 900,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,151,58,0.12) 0%, transparent 65%)',
          animation: prefersReducedMotion() ? 'none' : 'klay-pulse 6s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Rotating starburst SVG */}
      <svg
        width="500"
        height="500"
        viewBox="0 0 500 500"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.15,
          animation: prefersReducedMotion() ? 'none' : 'klay-starburst 60s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <g stroke={tokens.gold} strokeWidth="1" fill="none">
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={250}
                y1={250}
                x2={250 + Math.cos(angle) * 240}
                y2={250 + Math.sin(angle) * 240}
              />
            );
          })}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx={250} cy={250} r={30 + i * 30} opacity={0.5 - i * 0.05} />
          ))}
        </g>
      </svg>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, padding: '0 5vw', textAlign: 'center' }}>
        <div style={{ width: '40px', height: '1px', background: '#C8973A', margin: '0 auto 32px' }} />
        <RevealWords
          as="h2"
          words={[
            ...splitWords("The light in a room isn't what you let in — it's what you"),
            { text: 'choose', italic: true, color: tokens.gold },
            { text: 'to', italic: true, color: tokens.gold },
            { text: 'keep.', italic: true, color: tokens.gold },
          ]}
          style={{
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(34px, 4.6vw, 72px)',
            lineHeight: 1.18,
            color: tokens.warmWhite,
            justifyContent: 'center',
          }}
        />
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: '#C8973A', textTransform: 'uppercase', letterSpacing: '0.3em', marginTop: 32, textAlign: 'center' }}>
          — The Klay philosophy
        </div>
      </div>
    </section>
  );
}
