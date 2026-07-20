import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';

const DARK = '#0f0d09';

export default function NotFoundPage() {
  return (
    <>
      <Nav />

      <section
        style={{
          background: DARK,
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 40px',
        }}
      >
        <div style={{ fontFamily: tokens.display, fontSize: 160, fontWeight: 300, color: tokens.gold, lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.warmWhite, marginTop: 16, margin: '16px 0 0' }}>
          This page doesn't exist.
        </h1>
        <p style={{ fontFamily: tokens.body, fontSize: 14, color: 'rgba(248,246,242,0.5)', marginTop: 12 }}>
          The window you're looking for may have been moved or removed.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 32,
            fontFamily: tokens.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '16px 32px', border: `1px solid ${tokens.gold}`, background: 'transparent', color: tokens.gold,
            textDecoration: 'none',
          }}
        >
          Back to Klay →
        </Link>
      </section>

      <Footer />
    </>
  );
}
