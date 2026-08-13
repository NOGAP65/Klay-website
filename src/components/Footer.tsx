// ---------------------------------------------------------------------------
// 12. Footer.
//
// Warm white, four columns, one hairline at the top. The hairline is doing real
// work: several pages close on warmWhite themselves, and without it the footer
// and the last section run together into one undifferentiated block.
//
// Every link is a react-router <Link>, not an <a href>. The previous footer
// used bare anchors, so clicking any of them tore down the SPA and re-fetched
// the whole bundle — and every link in the Products and Company columns pointed
// at /products regardless of its label, which itself just redirects. External
// destinations (tel:, mailto:) stay as anchors, because they are not routes.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, layout, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { PRODUCTS } from '../data/products';

const linkStyle: React.CSSProperties = {
  fontFamily: tokens.body,
  fontWeight: 400,
  fontSize: 14,
  lineHeight: 2.1,
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
  const style = { ...linkStyle, color: hover ? tokens.gold : tokens.inkSoft };
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
      // The blog does not exist yet — see InspirationTiles. Points at the
      // process page until it does, rather than at nothing.
      { label: 'Journal', to: '/how-it-works' },
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
        background: tokens.warmWhite,
        borderTop: `1px solid ${tokens.line}`,
        padding: isMobile ? '64px 24px 32px' : '96px 80px 40px',
      }}
    >
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? '40px 24px' : 48,
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
              style={{ width: 128, height: 51, objectFit: 'contain', objectPosition: 'left', display: 'block' }}
            />
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 14,
                lineHeight: 1.75,
                color: tokens.inkSoft,
                margin: '20px 0 0',
                maxWidth: 260,
              }}
            >
              Australian made-to-measure blinds, curtains and wardrobes — measured and installed
              by hand across Victoria.
            </p>
            <div style={{ marginTop: 18 }}>
              <FooterLink to="https://www.instagram.com/klayinteriors">@klayinteriors</FooterLink>
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.heading}>
              <h4 style={{ ...eyebrow, marginBottom: 18 }}>{col.heading}</h4>
              {col.links.map(l => (
                <FooterLink key={l.label} to={l.to}>
                  {l.label}
                </FooterLink>
              ))}
              {/* The address and trading hours belong under Contact but are not
                  links, so they sit outside the loop rather than being faked
                  into it with a dead href. */}
              {col.heading === 'Contact' && (
                <div style={{ ...linkStyle, color: tokens.inkSoft }}>
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
            gap: 14,
            marginTop: isMobile ? 48 : 72,
            paddingTop: 28,
            borderTop: `1px solid ${tokens.lineFaint}`,
          }}
        >
          <span style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted }}>
            © {new Date().getFullYear()} Klay Interiors · Grand Kaman Pty Ltd · ABN 98 151 010 007
          </span>
          <div style={{ display: 'flex', gap: 26 }}>
            {['Privacy', 'Terms', 'Warranty'].map(l => (
              <FooterLink key={l} to="/contact">
                <span style={{ fontSize: 12, lineHeight: 1 }}>{l}</span>
              </FooterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
