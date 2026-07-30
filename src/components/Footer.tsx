import { useState } from 'react';
import { tokens, eyebrow, layout, motion, supporting } from '../theme';

const columns = [
  {
    heading: 'Products',
    links: ['Blockout Roller', 'Sunscreen Roller', 'Dual Roller', 'Sheer Curtains', 'Plantation Shutters', 'Outdoor Blind'],
  },
  {
    heading: 'Company',
    links: ['Our Process', 'The Visualiser', 'Reviews', 'Warranty', 'Careers'],
  },
];

const linkStyle: React.CSSProperties = {
  color: tokens.onDarkMuted,
  textDecoration: 'none',
  fontFamily: tokens.body,
  fontWeight: 300,
  fontSize: 14,
  lineHeight: 2.2,
  display: 'block',
  width: 'fit-content',
  transition: motion.link,
};

/** Every footer link, so hover can't be present on some columns and missing
 * on others — which is exactly what had happened: the Products and Company
 * columns lit up, the Contact column's phone and email did not. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...linkStyle, color: hover ? tokens.gold : tokens.onDarkMuted }}
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    // Charcoal — the same ground as FinalScene above it, so the page closes on
    // one continuous dark block rather than stepping down into a second,
    // darker tone. Bookends the charcoal hero at the top of the page.
    <footer
      style={{
        background: tokens.charcoal,
        borderTop: `1px solid ${tokens.goldLine}`,
        padding: '120px 80px 48px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 56,
          maxWidth: layout.containerMax,
          margin: '0 auto',
        }}
      >
        <div>
          <div style={{ marginBottom: 20 }}>
            <img
              src="/images/klay%202.jpeg"
              alt="Klay Interiors"
              style={{ width: '170px', height: '74px', objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <p
            style={{
              ...supporting.onDark,
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.7,
              maxWidth: 280,
              marginBottom: 18,
            }}
          >
            Australian made-to-measure window coverings. Designed with you, installed
            by hand across Victoria.
          </p>
          <p style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted, margin: 0 }}>
            ABN 98 151 010 007 · Grand Kaman Pty Ltd
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h4 style={{ ...eyebrow, marginBottom: 14 }}>{col.heading}</h4>
            {col.links.map((l) => (
              <FooterLink key={l} href="/products">
                {l}
              </FooterLink>
            ))}
          </div>
        ))}

        <div>
          <h4 style={{ ...eyebrow, marginBottom: 14 }}>Contact</h4>
          <FooterLink href="tel:1300005529">1300 00 KLAY</FooterLink>
          <FooterLink href="mailto:hello@klayinteriors.com.au">hello@klayinteriors.com.au</FooterLink>
          {/* Not links, so no hover and no pointer — but cursor:'none' hid the
              mouse pointer outright on hover, which reads as the page having
              crashed. */}
          <span style={{ ...linkStyle, cursor: 'default' }}>18 Maltings Cct, Epping VIC 3076</span>
          <span style={{ ...linkStyle, cursor: 'default' }}>Mon–Fri 8am–6pm</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          maxWidth: layout.containerMax,
          margin: '0 auto',
          marginTop: 72,
          paddingTop: 30,
          borderTop: `1px solid ${tokens.onDarkLine}`,
        }}
      >
        <span style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted }}>
          © {new Date().getFullYear()} Klay Interiors. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: 26 }}>
          {['Privacy', 'Terms', 'Warranty'].map((l) => (
            <FooterLink key={l} href="/contact">
              <span style={{ fontSize: 12, lineHeight: 1 }}>{l}</span>
            </FooterLink>
          ))}
        </div>
      </div>
    </footer>
  );
}
