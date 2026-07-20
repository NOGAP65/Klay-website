import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';

const DARK = '#0f0d09';

export default function VisualiserPage() {
  return (
    <>
      <Nav />

      <section
        style={{
          background: DARK,
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '140px 40px 80px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            border: `1px solid ${tokens.gold}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: tokens.display,
            fontSize: 48,
            color: tokens.gold,
          }}
        >
          K
        </div>

        <h1 style={{ fontFamily: tokens.display, fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: tokens.warmWhite, marginTop: 32, margin: '32px 0 0' }}>
          The Klay Visualiser
        </h1>

        <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.55)', maxWidth: 480, textAlign: 'center', marginTop: 16 }}>
          See your exact blind in your room before you order. Upload a photo of your window and configure your
          blind in real time.
        </p>

        <div
          style={{
            marginTop: 24,
            fontFamily: tokens.body,
            fontSize: 11,
            color: tokens.gold,
            border: '1px solid rgba(200,151,58,0.4)',
            padding: '10px 24px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          Coming Soon
        </div>

        <p style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(248,246,242,0.4)', marginTop: 16 }}>
          In the meantime, call us on 1300 00 KLAY and we'll walk you through the options.
        </p>
      </section>

      <Footer />
    </>
  );
}
