// ---------------------------------------------------------------------------
// 12. Footer.
//
// Ink, four columns, one hairline at the top. It was warm white, and the
// hairline was load-bearing then — several pages close on warmWhite themselves,
// and without a rule the footer and the last section ran together. On ink the
// separation is the ground doing it, and the hairline stays only as the line
// under the columns.
//
// One consequence worth keeping in mind: this footer is on every page, so it is
// now the last thing on pages that were entirely light. That is the intent — the
// page ends on a dark band rather than fading out — but it does mean the section
// immediately above it should not also be dark, or the join disappears.
//
// Every link is a react-router <Link>, not an <a href>. The previous footer
// used bare anchors, so clicking any of them tore down the SPA and re-fetched
// the whole bundle — and every link in the Products and Company columns pointed
// at /products regardless of its label, which itself just redirects. External
// destinations (tel:, mailto:) stay as anchors, because they are not routes.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, layout, motion, space, type as typeScale } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { PRODUCTS } from '../data/products';

const linkStyle: React.CSSProperties = {
  // Body role. It was 14 at line-height 2.1 — the loosest leading on the page,
  // and one of six body sizes.
  ...typeScale.body,
  fontWeight: 400,
  textDecoration: 'none',
  display: 'block',
  width: 'fit-content',
  transition: motion.link,
};

/** One hover treatment for every link in the footer. The old version tracked
 * hover per column, so the Contact column's phone and email were the only
 * links on the page that didn't light up. */
function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  const style = { ...linkStyle, color: hover ? tokens.gold : tokens.onDarkMuted };
  const bind = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  // tel:, mailto: and https: are not routes — <Link> would push them onto the
  // history stack and navigate to /tel:1300005529. Only the off-site ones open
  // in a new tab; a mail or phone handler replacing the page would be wrong.
  const external = /^https?:/.test(to);
  return to.includes(':') ? (
    <a
      {...bind}
      href={to}
      style={style}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
    >
      {children}
    </a>
  ) : (
    <Link {...bind} to={to} style={style}>
      {children}
    </Link>
  );
}

const COLUMNS: { heading: string; links: { label: string; to: string }[] }[] = [
  {
    heading: 'Products',
    links: [
      // Derived, so a renamed or retired product can't leave a dead link here.
      ...PRODUCTS.map(p => ({ label: `${p.name} ${p.type}`, to: `/products/${p.slug}` })),
      // Curtains and wardrobes have no listing page yet — the /products
      // resolver sends both to the enquiry form rather than to a 404.
      { label: 'Curtains', to: '/products?category=curtains' },
      { label: 'Wardrobes', to: '/products?category=wardrobes' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'About Klay', to: '/about' },
      // Journal is gone with the homepage tiles that were the only other place
      // it appeared. It never had a blog behind it — the link pointed at
      // /how-it-works — so a nav entry for it was promising a section of the
      // site that does not exist. Put it back when there is something to read.
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    heading: 'Contact',
    links: [
      { label: '1300 00 KLAY', to: 'tel:1300005529' },
      { label: 'hello@klayinteriors.com.au', to: 'mailto:hello@klayinteriors.com.au' },
    ],
  },
];

export function Footer() {
  const isMobile = useIsMobile();

  return (
    <footer
      style={{
        background: tokens.ink,
        borderTop: `1px solid ${tokens.onDarkLine}`,
        padding: isMobile
          ? `${space.xl}px ${space.md}px ${space.lg}px`
          : `${space.xxl}px 80px ${space.xl}px`,
      }}
    >
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: `${space.lg}px ${space.md}px`,
          }}
        >
          {/* Column one is the brand rather than a list of links: mark, one line
              on what Klay does, and the Instagram handle — which is where this
              customer researches before they buy, so it is a first-class exit
              from the footer and not a row of grey social glyphs. */}
          <div style={{ gridColumn: isMobile ? 'span 2' : undefined }}>
            <img
              src="/images/klay-logo.png"
              alt="Klay Interiors"
              // 132 x 52 — the logo's own 2.536 ratio (558 x 220), so
              // object-fit: contain has nothing to letterbox. It was 128 x 51,
              // a 2.51 box, which padded the artwork by a different amount than
              // the nav's 2.50 box did.
              style={{ width: 132, height: 52, objectFit: 'contain', objectPosition: 'left', display: 'block' }}
            />
            <p
              style={{
                fontFamily: tokens.body,
                ...typeScale.body,
                color: tokens.onDarkMuted,
                margin: '20px 0 0',
                maxWidth: 260,
              }}
            >
              Australian made-to-measure blinds, curtains and wardrobes — measured and installed
              by hand across Victoria.
            </p>
            <div style={{ marginTop: space.md }}>
              <FooterLink to="https://www.instagram.com/klayinteriors">@klayinteriors</FooterLink>
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.heading}>
              {/* Brand gold — the footer is ink, and goldText is for light
                  grounds only. */}
              <h4 style={{ ...eyebrow, color: tokens.gold, marginBottom: space.md }}>{col.heading}</h4>
              {col.links.map(l => (
                <FooterLink key={l.label} to={l.to}>
                  {l.label}
                </FooterLink>
              ))}
              {/* The address and trading hours belong under Contact but are not
                  links, so they sit outside the loop rather than being faked
                  into it with a dead href. */}
              {col.heading === 'Contact' && (
                <div style={{ ...linkStyle, color: tokens.onDarkMuted }}>
                  18 Maltings Cct, Epping VIC 3076
                  <br />
                  Mon–Fri 8am–6pm
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: space.sm,
            marginTop: isMobile ? space.xl : space.xxl,
            paddingTop: space.lg,
            borderTop: `1px solid ${tokens.onDarkLine}`,
          }}
        >
          <span style={{ ...typeScale.body, color: tokens.onDarkMuted }}>
            © {new Date().getFullYear()} Klay Interiors · Grand Kaman Pty Ltd · ABN 98 151 010 007
          </span>
          <div style={{ display: 'flex', gap: space.md }}>
            {['Privacy', 'Terms', 'Warranty'].map(l => (
              <FooterLink key={l} to="/contact">
                <span style={{ ...typeScale.body, lineHeight: 1 }}>{l}</span>
              </FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
