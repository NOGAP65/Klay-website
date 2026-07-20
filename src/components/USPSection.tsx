import { tokens } from '../theme';
import { useReveal } from '../hooks/useReveal';

const steps = [
  {
    n: '01',
    title: 'Design online',
    body: 'Use our visualiser to see your exact blind in your room before ordering.',
  },
  {
    n: '02',
    title: 'We measure',
    body: 'A Klay technician visits within 7–10 days. Precise measurements, zero charge.',
  },
  {
    n: '03',
    title: 'Made precisely',
    body: 'Cut and finished to the millimetre. Quality checked before it leaves the workshop.',
  },
  {
    n: '04',
    title: 'Installed perfectly',
    body: 'The same technician who measured installs your blind. Before and after photos sent same day.',
  },
];

export function USPSection() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.15);

  return (
    <section style={{ background: tokens.parchment, padding: '80px 80px' }}>
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 16,
          }}
        >
          WHY KLAY
        </div>
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: 'clamp(42px, 5vw, 72px)',
            fontWeight: 300,
            color: tokens.ink,
            lineHeight: 0.95,
          }}
        >
          Four steps.{' '}
          <span style={{ fontStyle: 'italic', color: tokens.gold }}>One team.</span>
        </h2>
      </div>

      <div
        ref={ref}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: '2px',
          marginTop: '48px',
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s.n}
            style={{
              background: '#1E1A16',
              padding: '40px 32px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s`,
            }}
          >
            <div
              style={{
                fontFamily: tokens.display,
                fontSize: 48,
                fontWeight: 300,
                color: tokens.gold,
                lineHeight: 1,
              }}
            >
              {s.n}
            </div>
            <h3
              style={{
                fontFamily: tokens.display,
                fontSize: 22,
                fontWeight: 400,
                color: tokens.warmWhite,
                marginTop: 12,
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 13,
                color: 'rgba(248,246,242,0.55)',
                lineHeight: 1.75,
                marginTop: 10,
              }}
            >
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          height: '1px',
          background: 'rgba(200,151,58,0.2)',
          marginTop: '2px',
        }}
      />
    </section>
  );
}
