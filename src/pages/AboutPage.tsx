import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens, eyebrow, headline, motion, supporting } from '../theme';
import { COLOUR_COUNT, PRODUCT_COUNT } from '../data/products';

// DARK ('#0f0d09', a near-black outside the palette) and PARCHMENT (a second
// copy of a token whose value had since diverged) both used to live here.
// Everything reads from theme.ts now.

const VALUES = [
  { title: 'Precision', body: 'Every blind cut to the millimetre. Every time.' },
  { title: 'Continuity', body: 'The same person who measures your window installs it.' },
  { title: 'Transparency', body: 'Prices online. No hidden fees. No surprise quotes.' },
  { title: 'Accountability', body: 'Five-year warranty. Before and after photos. Always.' },
];

/** The figures that are actually true, pulled from the catalogue rather than
 * asserted. There is no install count or review count anywhere in this
 * codebase, so none is claimed here — an invented "500+ installs" is the one
 * kind of social proof that costs more than it earns. */
const CREDENTIALS = [
  { figure: `${PRODUCT_COUNT}`, label: 'Made-to-measure ranges' },
  { figure: `${COLOUR_COUNT}`, label: 'Rynamic fabric colours' },
  { figure: '5 yr', label: 'Warranty on every blind' },
  { figure: '2–3 wk', label: 'First click to finished window' },
];

export default function AboutPage() {
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <>
      <Nav />

      {/* Hero — charcoal behind the photograph rather than a near-black wash.
          The eyebrow was missing entirely, so the page opened on an italic
          sentence with nothing to place it. */}
      <section style={{ position: 'relative', minHeight: '62vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tokens.charcoal, padding: '180px 80px 120px' }}>
        <img
          src="/images/room-5.png"
          alt="A Klay-fitted living room"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(15deg, rgba(44,40,36,0.88) 0%, rgba(44,40,36,0.66) 55%, rgba(44,40,36,0.42) 100%)' }} />
        <div style={{ position: 'relative', maxWidth: 900, textAlign: 'center' }}>
          <div style={{ ...eyebrow, color: tokens.onDarkMuted, marginBottom: 22 }}>Why We Exist</div>
          <h1
            style={{
              ...headline.hero,
              fontStyle: 'italic',
              lineHeight: 1.12,
              color: tokens.warmWhite,
            }}
          >
            We started Klay because buying blinds shouldn't be hard.
          </h1>
        </div>
      </section>

      {/* Story — warm white. Personal and human, and the lightest ground on the
          page for the one section that is purely someone talking to you. */}
      <section style={{ background: tokens.warmWhite, padding: '120px 80px' }}>
        <div style={{ display: 'flex', gap: 80, maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{ ...headline.section, color: tokens.ink }}>
              Made for Victorian homes.
            </h2>
          </div>
          <div style={{ flex: '1 1 420px' }}>
            <p style={{ ...supporting.onLight, fontSize: 16, lineHeight: 1.9 }}>
              Klay sells direct to homeowners — no showrooms, no commission-driven sales reps, no markup for a
              retail floor you never asked for. You design and price your blinds online, and every dollar goes
              toward the product and the person who fits it.
            </p>
            <p style={{ ...supporting.onLight, fontSize: 16, lineHeight: 1.9, marginTop: 22 }}>
              The technicians who measure your windows are the same people who come back to install them. They
              are trained, employed and accountable to us directly — not contracted out to whoever is
              available that week.
            </p>
            <p style={{ ...supporting.onLight, fontSize: 16, lineHeight: 1.9, marginTop: 22 }}>
              Everything ships out of our warehouse in Epping, and we cover Melbourne metro and surrounding
              Victorian regions — the same team, start to finish, wherever you are in the state.
            </p>
          </div>
        </div>
      </section>

      {/* Values — parchment. Trust building, and warm rather than the near-black
          this used to be: a page about who you can rely on should not be the
          darkest thing on the site. */}
      <section style={{ background: tokens.parchment, padding: '120px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ ...headline.section, color: tokens.ink, marginBottom: 64 }}>
            What we stand for.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 56, maxWidth: 900 }}>
            {VALUES.map((v) => (
              <div key={v.title}>
                <h3 style={{ fontFamily: tokens.display, fontSize: 30, fontWeight: 400, color: tokens.ink, margin: 0 }}>
                  {v.title}
                </h3>
                <p style={{ ...supporting.onLight, marginTop: 12 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials — warm white. Your brief asks for team or credentials here;
          there is no team content in the codebase and inventing bios for real
          people is not something a design pass should do, so this states the
          four figures that are verifiable from the catalogue instead. */}
      <section style={{ background: tokens.warmWhite, padding: '120px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ ...eyebrow, marginBottom: 22 }}>By the numbers</div>
          <h2 style={{ ...headline.section, color: tokens.ink }}>
            What that adds up to.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginTop: 64 }}>
            {CREDENTIALS.map((c) => (
              <div key={c.label}>
                {/* `ink`, not `onDark`. This was onDark on a warmWhite section —
                    and onDark IS warmWhite, before this pass and after it, so
                    these four figures have always rendered invisible on their own
                    ground. Found by the contrast audit at exactly 1:1, which is
                    the signature of a token used on the surface it is named
                    against. */}
                <div style={{ fontFamily: tokens.display, fontSize: 56, fontWeight: 300, lineHeight: 1, color: tokens.ink }}>
                  {c.figure}
                </div>
                <div style={{ ...supporting.onLight, fontSize: 13, marginTop: 12, maxWidth: 180 }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* The page had no CTA and no interactive element of any kind — a
              brand-conviction page that gave a convinced reader nowhere to go. */}
          <div style={{ marginTop: 80, paddingTop: 48, borderTop: `1px solid ${tokens.lineFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <p style={{ ...supporting.onLight, fontSize: 14, margin: 0 }}>
              18 Maltings Cct, Epping VIC 3076 · hello@klayinteriors.com.au · 1300 00 KLAY
            </p>
            <Link
              to="/visualiser"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                textDecoration: 'none',
                fontFamily: tokens.body,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '18px 40px',
                borderRadius: 2,
                background: ctaHover ? tokens.fillStrongHover : tokens.fillStrong,
                color: tokens.onFillStrong,
                whiteSpace: 'nowrap',
                transition: motion.button,
              }}
            >
              Design Yours
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
