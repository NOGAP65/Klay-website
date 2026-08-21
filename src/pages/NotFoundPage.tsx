import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens, motion, supporting } from '../theme';

// DARK ('#0f0d09') removed — this page is routed at path="*", so the one
// near-black left on the site was the page a lost visitor lands on.

export default function NotFoundPage() {
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <>
      <Nav />

      <section
        style={{
          background: tokens.charcoal,
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 40px',
        }}
      >
        <div style={{ fontFamily: tokens.display, fontSize: 160, fontWeight: 300, color: tokens.onDark, lineHeight: 1 }}>
          404
        </div>
        <h1 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.warmWhite, marginTop: 16, margin: '16px 0 0' }}>
          This page doesn't exist.
        </h1>
        <p style={{ ...supporting.onDark, fontSize: 14, marginTop: 12 }}>
          The window you're looking for may have been moved or removed.
        </p>
        <Link
          to="/"
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 32,
            fontFamily: tokens.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase',
            // AN OUTLINE BUTTON ON A DARK GROUND, so it inverts on hover rather
            // than darkening. It was gold text on transparent, filling to gold
            // with ink on it. The mechanical pass read the `ink` in that pair as
            // evidence of a light ground and left textMuted on charcoal at
            // 1.97:1, with the hover state as ink on ink — both caught by the
            // audit. Paper edge and paper text at rest (12.43:1), filling to
            // paper with ink on it (15.87:1).
            padding: '18px 40px', border: `1px solid ${tokens.onDarkEdge}`,
            background: ctaHover ? tokens.onDark : 'transparent',
            color: ctaHover ? tokens.ink : tokens.onDark,
            textDecoration: 'none',
            transition: motion.button,
          }}
        >
          Back to Klay →
        </Link>
      </section>

      <Footer />
    </>
  );
}
