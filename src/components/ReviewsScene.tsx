import { useState } from 'react';
import { RevealWords } from './RevealWords';
import { tokens, prefersReducedMotion } from '../theme';

const testimonials = [
  { quote: 'The measure was effortless and the shutters transformed our living room. Faultless from start to finish.', name: 'Amara Whitfield', suburb: 'Brighton, VIC' },
  { quote: 'Same technician measured and installed. That continuity made all the difference — everything just fit.', name: 'Daniel Pace', suburb: 'Ivanhoe, VIC' },
  { quote: 'Our sheer curtains hang beautifully. The light in the mornings is exactly what we hoped for.', name: 'Priya Nadar', suburb: 'Kew, VIC' },
  { quote: 'Blockout rollers in the nursery are pitch perfect. Ordered on a Monday, installed within the week.', name: 'Tom Redmond', suburb: 'Essendon, VIC' },
  { quote: 'Genuinely the best trades experience we have had. Precise, tidy and quietly professional.', name: 'Sofia Marchetti', suburb: 'Camberwell, VIC' },
];

function Card({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div
      style={{
        flex: '0 0 auto',
        width: 380,
        background: tokens.cream,
        border: '1px solid rgba(30,26,22,0.12)',
        padding: '34px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ color: tokens.gold, fontSize: 15, letterSpacing: '0.2em' }}>★★★★★</div>
      <p style={{ fontFamily: tokens.display, fontStyle: 'italic', fontWeight: 400, fontSize: 23, lineHeight: 1.4, color: tokens.ink }}>
        “{t.quote}”
      </p>
      <div style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: tokens.textMid, marginTop: 'auto' }}>
        {t.name} · {t.suburb}
      </div>
    </div>
  );
}

export function ReviewsScene() {
  const [paused, setPaused] = useState(false);
  const loop = [...testimonials, ...testimonials];

  return (
    <section
      id="reviews"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: tokens.parchment,
        padding: '14vh 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ padding: '0 5vw', marginBottom: 52 }}>
        <span style={{ color: tokens.gold, fontFamily: tokens.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
          Loved across Victoria
        </span>
        <RevealWords
          as="h2"
          words={[{ text: 'Homes' }, { text: 'that' }, { text: 'chose', italic: true, color: tokens.gold }, { text: 'Klay', italic: true, color: tokens.gold }]}
          style={{ fontWeight: 300, fontSize: 'clamp(36px, 4.4vw, 64px)', color: tokens.ink, marginTop: 14 }}
        />
      </div>

      <div style={{ overflow: 'hidden' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          style={{
            display: 'flex',
            gap: 24,
            padding: '0 5vw',
            width: 'max-content',
            animation: prefersReducedMotion() ? 'none' : 'klay-testimonials 42s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {loop.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
