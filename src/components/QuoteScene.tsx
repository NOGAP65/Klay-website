import { RevealWords } from './RevealWords';
import { tokens, prefersReducedMotion } from '../theme';

export function QuoteScene() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: tokens.dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
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
          opacity: 0.12,
          animation: prefersReducedMotion() ? 'none' : 'klay-starburst 60s linear infinite',
          pointerEvents: 'none',
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

      <div style={{ position: 'relative', maxWidth: 1000, padding: '0 5vw', textAlign: 'center' }}>
        <RevealWords
          as="h2"
          words={[
            { text: 'The' },
            { text: 'light' },
            { text: 'in' },
            { text: 'a' },
            { text: 'room' },
            { text: "isn't" },
            { text: 'what' },
            { text: 'you' },
            { text: 'let' },
            { text: 'in' },
            { text: '—' },
            { text: "it's" },
            { text: 'what' },
            { text: 'you' },
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
      </div>
    </section>
  );
}
