import { RevealWords } from './RevealWords';
import { useReveal } from '../hooks/useReveal';
import { tokens } from '../theme';

const steps = [
  { n: '01', title: 'Design', body: 'Sketch your rooms and shortlist fabrics in minutes with our visualiser.', icon: 'blind' },
  { n: '02', title: 'Measure', body: 'A Klay technician measures every window on-site, free across Victoria.', icon: 'ruler' },
  { n: '03', title: 'Make', body: 'Your coverings are cut and finished to the millimetre in our workshop.', icon: 'scissors' },
  { n: '04', title: 'Install', body: 'The same technician returns to fit and photograph every finished window.', icon: 'hand' },
];

const guarantees = [
  { title: '5-Year Warranty', body: 'Every product and installation is covered for five full years.' },
  { title: 'Free Measure', body: 'A complimentary in-home measure anywhere across Victoria.' },
  { title: 'Same Technician', body: 'The person who measures your windows is the one who fits them.' },
  { title: 'Photo Guarantee', body: 'We photograph every finished window so the result is documented.' },
];

function StepIcon({ type }: { type: string }) {
  const box: React.CSSProperties = { width: 44, height: 44, position: 'relative', margin: '0 auto 18px' };
  const gold = tokens.gold;

  if (type === 'blind') {
    return (
      <div style={box}>
        <div style={{ position: 'absolute', top: 0, left: 6, right: 6, height: 4, background: gold }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: 8 + i * 6, left: 6, right: 6, height: 1, background: gold, opacity: 0.5 }} />
        ))}
      </div>
    );
  }
  if (type === 'ruler') {
    return (
      <div style={box}>
        <div style={{ position: 'absolute', bottom: 6, left: 4, width: 36, height: 8, border: `1px solid ${gold}`, borderTop: 'none' }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', bottom: 6, left: 6 + i * 7, width: 1, height: 4, background: gold }} />
        ))}
      </div>
    );
  }
  if (type === 'scissors') {
    return (
      <div style={box}>
        <div style={{ position: 'absolute', top: 10, left: 8, width: 28, height: 1, background: gold, transform: 'rotate(15deg)' }} />
        <div style={{ position: 'absolute', top: 16, left: 8, width: 28, height: 1, background: gold, transform: 'rotate(-15deg)' }} />
        <div style={{ position: 'absolute', top: 4, left: 4, width: 10, height: 10, borderRadius: '50%', border: `1px solid ${gold}` }} />
        <div style={{ position: 'absolute', top: 22, left: 4, width: 10, height: 10, borderRadius: '50%', border: `1px solid ${gold}` }} />
      </div>
    );
  }
  // hand
  return (
    <div style={box}>
      <div style={{ position: 'absolute', bottom: 4, left: 12, width: 20, height: 16, border: `1px solid ${gold}`, borderTop: 'none', borderRadius: '0 0 6px 6px' }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', bottom: 18, left: 12 + i * 5, width: 3, height: 14, background: gold, borderRadius: 2 }} />
      ))}
      <div style={{ position: 'absolute', bottom: 28, left: 14, width: 12, height: 6, background: gold, borderRadius: '50% 50% 0 0' }} />
    </div>
  );
}

export function ProcessScene() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.2);

  return (
    <section
      id="process"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: tokens.parchment,
        padding: '14vh 5vw',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <RevealWords
          as="h2"
          words={[{ text: 'Four' }, { text: 'steps.' }, { text: 'One', italic: true, color: tokens.gold }, { text: 'team.', italic: true, color: tokens.gold }]}
          style={{ fontWeight: 300, fontSize: 'clamp(38px, 4.4vw, 66px)', color: tokens.ink, marginBottom: 64 }}
        />

        <div ref={ref} style={{ position: 'relative' }}>
          {/* SVG connecting line with stroke-dashoffset draw animation */}
          <svg
            style={{ position: 'absolute', top: 44, left: '10%', right: '10%', width: '80%', height: 2, pointerEvents: 'none' }}
            viewBox="0 0 1000 2"
            preserveAspectRatio="none"
          >
            <line
              x1="0" y1="1" x2="1000" y2="1"
              stroke={tokens.gold} strokeWidth="1"
              strokeDasharray="1000"
              strokeDashoffset={visible ? 0 : 1000}
              style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) 0.2s' }}
            />
          </svg>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 40, position: 'relative' }}>
            {steps.map((s, i) => (
              <div
                key={s.n}
                style={{
                  textAlign: 'center',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.7s ease ${i * 0.15 + 0.3}s, transform 0.7s ease ${i * 0.15 + 0.3}s`,
                }}
              >
                <StepIcon type={s.icon} />
                <div style={{ fontFamily: tokens.display, fontSize: 13, color: tokens.gold, letterSpacing: '0.1em', marginBottom: 8 }}>
                  {s.n}
                </div>
                <h3 style={{ fontFamily: tokens.display, fontWeight: 400, fontSize: 26, marginBottom: 12 }}>
                  {s.title}
                </h3>
                <p style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 15, lineHeight: 1.6, color: tokens.textMid, maxWidth: 240, margin: '0 auto' }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantees consolidated as small items below steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36, marginTop: 80, paddingTop: 48, borderTop: '1px solid rgba(30,26,22,0.1)' }}>
          {guarantees.map((g, i) => (
            <div
              key={g.title}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${i * 0.1 + 0.5}s, transform 0.6s ease ${i * 0.1 + 0.5}s`,
              }}
            >
              <h4 style={{ fontFamily: tokens.display, fontWeight: 400, fontSize: 20, marginBottom: 8, color: tokens.ink }}>
                {g.title}
              </h4>
              <p style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 14, lineHeight: 1.6, color: tokens.textMid }}>
                {g.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
