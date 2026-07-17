import { RevealWords } from './RevealWords';
import { useReveal } from '../hooks/useReveal';
import { tokens } from '../theme';

export function CurtainsScene() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.2);

  return (
    <section
      id="curtains"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(90deg, #1e1a0f 0%, #1e1a0f 48%, #f2ede4 52%, #f2ede4 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Left half: dark curtain room */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '70%', height: '78%', display: 'flex' }}>
          {/* Left curtain panel */}
          <div
            style={{
              flex: 1,
              background: 'repeating-linear-gradient(90deg, rgba(233,224,205,0.88) 0px, rgba(233,224,205,0.88) 4px, rgba(190,178,150,0.72) 4px, rgba(190,178,150,0.72) 8px)',
              boxShadow: 'inset -10px 0 30px rgba(0,0,0,0.25)',
              transform: visible ? 'translateX(-12%)' : 'translateX(0)',
              transition: 'transform 1.6s cubic-bezier(0.22,1,0.36,1) 0.3s',
            }}
          />
          {/* Right curtain panel */}
          <div
            style={{
              flex: 1,
              background: 'repeating-linear-gradient(90deg, rgba(233,224,205,0.88) 0px, rgba(233,224,205,0.88) 4px, rgba(190,178,150,0.72) 4px, rgba(190,178,150,0.72) 8px)',
              boxShadow: 'inset 10px 0 30px rgba(0,0,0,0.25)',
              transform: visible ? 'translateX(12%)' : 'translateX(0)',
              transition: 'transform 1.6s cubic-bezier(0.22,1,0.36,1) 0.3s',
            }}
          />
          {/* Gold light slit through parted center */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 4,
              height: '84%',
              background: 'linear-gradient(180deg, rgba(217,174,96,0.7), rgba(200,151,58,0.4))',
              boxShadow: '0 0 40px rgba(200,151,58,0.5)',
              opacity: visible ? 1 : 0,
              transition: 'opacity 1s ease 1s',
            }}
          />
        </div>
      </div>

      {/* Right half: parchment text */}
      <div ref={ref} style={{ position: 'absolute', top: '50%', right: '5vw', transform: 'translateY(-50%)', width: '40%', maxWidth: 480 }}>
        <RevealWords
          as="h2"
          words={[
            { text: 'Curtains' },
            { text: 'that' },
            { text: 'do' },
            { text: 'more', italic: true, color: tokens.gold },
            { text: 'than' },
            { text: 'block' },
            { text: 'light.' },
          ]}
          style={{ fontWeight: 300, fontSize: 'clamp(36px, 4.4vw, 64px)', color: tokens.ink, lineHeight: 1.08, marginBottom: 26 }}
        />
        <p style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 17, lineHeight: 1.7, color: tokens.textMid, marginBottom: 36 }}>
          Sheer, blockout or layered — Klay curtains are weighted, lined and finished
          by hand so they fall with intention. The fabric you choose shapes the room
          long after the sun has moved.
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 36 }}>
          <span style={{ fontFamily: tokens.display, fontWeight: 400, fontSize: 64, color: tokens.gold, lineHeight: 1 }}>
            360
          </span>
          <span style={{ fontFamily: tokens.body, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.textMid }}>
            from · sheer curtains
          </span>
        </div>
        <a
          href="#collection"
          style={{
            textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.ink,
            borderBottom: `1px solid ${tokens.gold}`, paddingBottom: 4, transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = tokens.gold)}
          onMouseLeave={(e) => (e.currentTarget.style.color = tokens.ink)}
        >
          Explore curtains
        </a>
      </div>
    </section>
  );
}
