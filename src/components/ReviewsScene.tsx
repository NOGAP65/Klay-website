import { useState } from 'react';
import { RevealWords } from './RevealWords';
import { tokens, prefersReducedMotion, eyebrow, headline, motion, shadow } from '../theme';
import { splitWords } from '../utils/splitWords';
import { BlindReveal } from './BlindReveal';

const testimonials = [
  { quote: 'The measure was effortless and the shutters transformed our living room. Faultless from start to finish.', name: 'Amara Whitfield', suburb: 'Brighton, VIC' },
  { quote: 'Same technician measured and installed. That continuity made all the difference — everything just fit.', name: 'Daniel Pace', suburb: 'Ivanhoe, VIC' },
  { quote: 'Our sheer curtains hang beautifully. The light in the mornings is exactly what we hoped for.', name: 'Priya Nadar', suburb: 'Kew, VIC' },
  { quote: 'Blockout rollers in the nursery are pitch perfect. Ordered on a Monday, installed within the week.', name: 'Tom Redmond', suburb: 'Essendon, VIC' },
  { quote: 'Genuinely the best trades experience we have had. Precise, tidy and quietly professional.', name: 'Sofia Marchetti', suburb: 'Camberwell, VIC' },
];

function Card({ t }: { t: (typeof testimonials)[number] }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: '0 0 auto',
        width: 380,
        // Cream, and now on parchment rather than warm white — a full step of
        // separation, so each testimonial reads as its own card instead of a
        // bordered region of the section behind it.
        background: tokens.cream,
        border: `1px solid ${hover ? tokens.goldLine : tokens.lineFaint}`,
        borderRadius: 2,
        padding: '34px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        // The rail already pauses on hover; lifting the card under the cursor
        // is what makes that pause legible as "this one is yours to read"
        // rather than as the animation having stalled.
        transform: hover ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hover ? shadow.rest : 'none',
        transition: motion.card,
      }}
    >
      <div style={{ color: tokens.gold, fontSize: 15, letterSpacing: '0.2em' }}>★★★★★</div>
      <p style={{ fontFamily: tokens.display, fontStyle: 'italic', fontWeight: 400, fontSize: 23, lineHeight: 1.4, color: tokens.textMid }}>
        “{t.quote}”
      </p>
      <div style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: tokens.inkFaint, marginTop: 'auto' }}>
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
        // Parchment — trust is warm, not cold. Testimonials on the same warm
        // white as the collection above made the two sections bleed into one
        // long light stretch; the step down separates them, and it pairs this
        // with SocialSection as one tonal family of proof.
        background: tokens.parchment,
        // Vertical only — the card rail deliberately runs to both edges so it
        // reads as continuing past the viewport, which is what sells it as a
        // scroll rather than a row of five.
        padding: '120px 0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <BlindReveal>
      <div style={{ padding: '0 80px', marginBottom: 64 }}>
        <span style={eyebrow}>Loved across Victoria</span>
        <RevealWords
          as="h2"
          words={[
            ...splitWords('Homes that'),
            { text: 'chose', italic: true, color: tokens.gold },
            { text: 'Klay', italic: true, color: tokens.gold },
          ]}
          style={{ ...headline.section, color: tokens.ink, marginTop: 16 }}
        />
      </div>

      <div style={{ overflow: 'hidden' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          style={{
            display: 'flex',
            gap: 24,
            // Matches the headline's own 80px inset, so the first card starts
            // on the same vertical line the section's type does.
            padding: '0 80px',
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
      </BlindReveal>
    </section>
  );
}
