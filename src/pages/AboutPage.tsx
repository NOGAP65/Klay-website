import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';

const DARK = '#0f0d09';
const PARCHMENT = '#F2EDE4';

const VALUES = [
  { title: 'Precision', body: 'Every blind cut to the millimetre. Every time.' },
  { title: 'Continuity', body: 'The same person who measures your window installs it.' },
  { title: 'Transparency', body: 'Prices online. No hidden fees. No surprise quotes.' },
  { title: 'Accountability', body: 'Five-year warranty. Before and after photos. Always.' },
];

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{ position: 'relative', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src="/images/room-5.png"
          alt="A Klay-fitted living room"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,5,0.6)' }} />
        <h1
          style={{
            position: 'relative',
            fontFamily: tokens.display,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(32px, 4vw, 60px)',
            lineHeight: 1.2,
            color: tokens.warmWhite,
            textAlign: 'center',
            maxWidth: 900,
            padding: '0 40px',
          }}
        >
          We started Klay because buying blinds shouldn't be hard.
        </h1>
      </section>

      {/* Story */}
      <section style={{ background: PARCHMENT, padding: '100px 80px' }}>
        <div style={{ display: 'flex', gap: 80, maxWidth: 1280, margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{ fontFamily: tokens.display, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 300, color: tokens.ink, lineHeight: 1.1, margin: 0 }}>
              Made for Victorian homes.
            </h2>
          </div>
          <div style={{ flex: '1 1 420px' }}>
            <p style={{ fontFamily: tokens.body, fontSize: 16, lineHeight: 1.8, color: tokens.textMid, marginTop: 0 }}>
              Klay sells direct to homeowners — no showrooms, no commission-driven sales reps, no markup for a
              retail floor you never asked for. You design and price your blinds online, and every dollar goes
              toward the product and the person who fits it.
            </p>
            <p style={{ fontFamily: tokens.body, fontSize: 16, lineHeight: 1.8, color: tokens.textMid, marginTop: 20 }}>
              The technicians who measure your windows are the same people who come back to install them. They
              are trained, employed and accountable to us directly — not contracted out to whoever is
              available that week.
            </p>
            <p style={{ fontFamily: tokens.body, fontSize: 16, lineHeight: 1.8, color: tokens.textMid, marginTop: 20 }}>
              Everything ships out of our warehouse in Epping, and we cover Melbourne metro and surrounding
              Victorian regions — the same team, start to finish, wherever you are in the state.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: DARK, padding: '100px 80px' }}>
        <h2 style={{ fontFamily: tokens.display, fontSize: 52, fontWeight: 300, color: tokens.warmWhite, marginBottom: 56 }}>
          What we stand for.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 48, maxWidth: 900 }}>
          {VALUES.map((v) => (
            <div key={v.title}>
              <h3 style={{ fontFamily: tokens.display, fontSize: 28, fontWeight: 400, color: tokens.gold, margin: 0 }}>
                {v.title}
              </h3>
              <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.7, color: 'rgba(248,246,242,0.6)', marginTop: 10 }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section style={{ background: PARCHMENT, padding: '60px 80px', textAlign: 'center' }}>
        <p style={{ fontFamily: tokens.body, fontSize: 14, color: tokens.ink, margin: 0 }}>
          18 Maltings Cct, Epping VIC 3076 · hello@klayinteriors.com.au · 1300 00 KLAY
        </p>
      </section>

      <Footer />
    </>
  );
}
