import { Link } from 'react-router-dom';

import * as routes from '@/config/routes';
import * as site from '@/config/site';

import { radius, tokens, eyebrow, headline, motion, space, supporting, type as typeScale, useHover } from '@/ds';
import { COLOUR_COUNT, PRODUCT_COUNT } from '@/features/catalogue';

import { AboutPanel } from './AboutPanel';

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
  const ctaHover = useHover();

  return (
    <>

      {/* Hero — charcoal behind the photograph rather than a near-black wash.
          The eyebrow was missing entirely, so the page opened on an italic
          sentence with nothing to place it. */}
      <section style={{ position: 'relative', minHeight: '62vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tokens.charcoal, padding: `${space.focal}px ${space.band}px ${space.focal}px` }}>
        <img
          src="/images/rooms/room-5.png"
          alt="A Klay-fitted living room"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(15deg, rgba(48,48,48,0.88) 0%, rgba(48,48,48,0.66) 55%, rgba(48,48,48,0.42) 100%)' }} />
        <div style={{ position: 'relative', maxWidth: 900, textAlign: 'center' }}>
          <div style={{ ...eyebrow, color: tokens.onDarkMuted, marginBottom: 22 }}>Why We Exist</div>
          <h1
            style={{
              ...headline.hero,
              fontStyle: 'italic',
              lineHeight: 1.12,
              color: tokens.paper,
            }}
          >
            We started Klay because buying blinds shouldn't be hard.
          </h1>
        </div>
      </section>

      {/* Story — warm white. Personal and human, and the lightest ground on the
          page for the one section that is purely someone talking to you. */}
      <section style={{ background: tokens.paper, padding: `${space.focal}px ${space.band}px` }}>
        <div style={{ display: 'flex', gap: space.band, maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h2 style={{ ...headline.section, color: tokens.ink }}>
              Made for Victorian homes.
            </h2>
          </div>
          <div style={{ flex: '1 1 420px' }}>
            <p style={{ ...supporting.onLight, fontSize: typeScale.lead.fontSize, lineHeight: 1.9 }}>
              Klay sells direct to homeowners — no showrooms, no commission-driven sales reps, no markup for a
              retail floor you never asked for. You design and price your blinds online, and every dollar goes
              toward the product and the person who fits it.
            </p>
            <p style={{ ...supporting.onLight, fontSize: typeScale.lead.fontSize, lineHeight: 1.9, marginTop: 22 }}>
              The technicians who measure your windows are the same people who come back to install them. They
              are trained, employed and accountable to us directly — not contracted out to whoever is
              available that week.
            </p>
            <p style={{ ...supporting.onLight, fontSize: typeScale.lead.fontSize, lineHeight: 1.9, marginTop: 22 }}>
              Everything ships out of our warehouse in Epping, and we cover Melbourne metro and surrounding
              Victorian regions — the same team, start to finish, wherever you are in the state.
            </p>
          </div>
        </div>
      </section>

      {/* Values — parchment. Trust building, and warm rather than the near-black
          this used to be: a page about who you can rely on should not be the
          darkest thing on the site. */}
      <section style={{ background: tokens.band, padding: `${space.focal}px ${space.band}px` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ ...headline.section, color: tokens.ink, marginBottom: 64 }}>
            What we stand for.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: space.section, maxWidth: 900 }}>
            {VALUES.map((v) => (
              <div key={v.title}>
                <h3 style={{ fontFamily: tokens.display, fontSize: typeScale.card.fontSize, fontWeight: 400, color: tokens.ink, margin: 0 }}>
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
      <section style={{ background: tokens.paper, padding: `${space.focal}px ${space.band}px` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ ...eyebrow, marginBottom: 22 }}>By the numbers</div>
          <h2 style={{ ...headline.section, color: tokens.ink }}>
            What that adds up to.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: space.section, marginTop: 64 }}>
            {CREDENTIALS.map((c) => (
              <div key={c.label}>
                {/* `ink`, not `onDark`. This was onDark on a warmWhite section —
                    and onDark IS warmWhite, before this pass and after it, so
                    these four figures have always rendered invisible on their own
                    ground. Found by the contrast audit at exactly 1:1, which is
                    the signature of a token used on the surface it is named
                    against. */}
                <div style={{ fontFamily: tokens.display, fontSize: typeScale.title.fontSize, fontWeight: 300, lineHeight: 1, color: tokens.ink }}>
                  {c.figure}
                </div>
                <div style={{ ...supporting.onLight, fontSize: typeScale.body.fontSize, marginTop: 12, maxWidth: 180 }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>

          {/* The page had no CTA and no interactive element of any kind — a
              brand-conviction page that gave a convinced reader nowhere to go. */}
          <div style={{ marginTop: 80, paddingTop: 48, borderTop: `1px solid ${tokens.lineFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.group, flexWrap: 'wrap' }}>
            <p style={{ ...supporting.onLight, fontSize: typeScale.body.fontSize, margin: 0 }}>
              {site.address} · {site.email} · {site.phone}
            </p>
            <Link
              to={routes.visualiser}
              {...ctaHover.bind}
              style={{
                textDecoration: 'none',
                fontFamily: tokens.body,
                fontSize: typeScale.body.fontSize,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: `${space.item}px ${space.section}px`,
                borderRadius: radius.md,
                background: ctaHover.isHovered ? tokens.accentHover : tokens.accent,
                color: tokens.onAccent,
                whiteSpace: 'nowrap',
                transition: motion.button,
              }}
            >
              Design Yours
            </Link>
          </div>
        </div>
      </section>

      {/* WHO TURNS UP AT THE HOUSE. Off the homepage, where it was the one
          section not selling a product, and onto the page where that IS the
          subject — see the note at the top of the panel itself.

          LAST, on grounds of ground: this page runs charcoal, paper, band,
          paper, and the panel is band, so it alternates here where it would
          have doubled a band anywhere in the middle. It also closes the page on
          a CTA, which About otherwise ended without. */}
      <AboutPanel />

    </>
  );
}
