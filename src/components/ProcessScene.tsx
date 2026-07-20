import { RevealWords } from './RevealWords';
import { useReveal } from '../hooks/useReveal';
import { tokens } from '../theme';
import { splitWords } from '../utils/splitWords';
import { BlindReveal } from './BlindReveal';

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
  const wrap: React.CSSProperties = { height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' };
  const gold = '#C8973A';

  if (type === 'blind') {
    // Design — screen/monitor
    return (
      <div style={wrap}>
        <div>
          <div style={{ width: '28px', height: '20px', border: `2px solid ${gold}`, borderRadius: '2px' }} />
          <div style={{ width: '10px', height: '4px', background: gold, margin: '2px auto 0' }} />
          <div style={{ width: '16px', height: '2px', background: gold, margin: '0 auto' }} />
        </div>
      </div>
    );
  }
  if (type === 'ruler') {
    // Measure — ruler
    return (
      <div style={wrap}>
        <div style={{ width: '36px', height: '14px', border: `2px solid ${gold}`, borderRadius: '2px', position: 'relative' }}>
          {['5px', '12px', '19px', '26px'].map((left) => (
            <div key={left} style={{ width: '1px', height: '6px', background: gold, position: 'absolute', top: '2px', left }} />
          ))}
        </div>
      </div>
    );
  }
  if (type === 'scissors') {
    // Make — scissors
    return (
      <div style={wrap}>
        <div style={{ position: 'relative', width: '26px', height: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', border: `2px solid ${gold}`, borderRadius: '50%' }} />
            <div style={{ width: '10px', height: '10px', border: `2px solid ${gold}`, borderRadius: '50%' }} />
          </div>
          <div style={{ position: 'absolute', top: '8px', left: '11px', width: '2px', height: '16px', background: gold, transform: 'rotate(20deg)', transformOrigin: 'top center' }} />
          <div style={{ position: 'absolute', top: '8px', left: '13px', width: '2px', height: '16px', background: gold, transform: 'rotate(-20deg)', transformOrigin: 'top center' }} />
        </div>
      </div>
    );
  }
  // hand — install checkmark
  return (
    <div style={wrap}>
      <div style={{ width: '32px', height: '32px', border: `2px solid ${gold}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '16px', height: '16px', transform: 'rotate(-45deg)' }}>
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: '8px', height: '2px', background: gold }} />
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: '2px', height: '16px', background: gold }} />
        </div>
      </div>
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
        background: tokens.parchment,
        padding: '80px 0',
        overflow: 'hidden',
      }}
    >
      <BlindReveal>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <RevealWords
            as="h2"
            words={[
              ...splitWords('Four steps.'),
              { text: 'One', italic: true, color: '#D9AE60' },
              { text: 'team.', italic: true, color: '#D9AE60' },
            ]}
            style={{ fontWeight: 300, fontSize: 'clamp(52px, 6vw, 88px)', lineHeight: 0.92, color: tokens.ink, justifyContent: 'center' }}
          />
          <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(30,26,22,0.55)', lineHeight: 1.75, maxWidth: 520, margin: '16px auto 0' }}>
            From your first click to your last fitting — one Klay team handles everything.
          </p>
        </div>

        <div ref={ref} style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 44, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(200,151,58,0.4), transparent)' }} />

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
                <div style={{ fontFamily: tokens.display, fontSize: 72, fontWeight: 300, lineHeight: 1, color: tokens.gold, letterSpacing: '0.1em', marginBottom: 8 }}>
                  {s.n}
                </div>
                <h3 style={{ fontFamily: tokens.display, fontSize: 28, fontWeight: 400, color: '#1E1A16', marginTop: 12 }}>
                  {s.title}
                </h3>
                <p style={{ fontFamily: tokens.body, fontSize: 14, color: 'rgba(30,26,22,0.6)', lineHeight: 1.8, maxWidth: 240, margin: '8px auto 0' }}>
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
              <div style={{ width: '24px', height: '1px', background: '#C8973A', marginBottom: '12px' }} />
              <h4 style={{ fontFamily: tokens.display, fontSize: 22, fontWeight: 500, color: '#1E1A16', margin: 0 }}>
                {g.title}
              </h4>
              <p style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(30,26,22,0.55)', lineHeight: 1.7, marginTop: 6 }}>
                {g.body}
              </p>
            </div>
          ))}
        </div>
      </div>
      </BlindReveal>
    </section>
  );
}
