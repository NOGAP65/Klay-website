import { tokens } from '../theme';

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

export function Footer() {
  const linkStyle: React.CSSProperties = {
    color: tokens.textMuted,
    textDecoration: 'none',
    fontFamily: tokens.body,
    fontWeight: 300,
    fontSize: 14,
    lineHeight: 2.2,
    display: 'block',
  };

  return (
    <footer style={{ background: '#0F0E0B', borderTop: '1px solid rgba(200,151,58,0.16)', padding: '9vh 5vw 4vh' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 48,
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                border: `1px solid ${tokens.gold}`,
                color: tokens.gold,
                fontFamily: tokens.display,
                fontSize: 22,
              }}
            >
              K
            </span>
            <span style={{ fontFamily: tokens.display, fontSize: 22, color: tokens.warmWhite }}>
              Klay Interiors
            </span>
          </div>
          <p
            style={{
              fontFamily: tokens.body,
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.7,
              color: tokens.textMuted,
              maxWidth: 280,
              marginBottom: 18,
            }}
          >
            Australian made-to-measure window coverings. Designed with you, installed
            by hand across Victoria.
          </p>
          <p style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted }}>
            ABN 98 151 010 007 · Grand Kaman Pty Ltd
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.heading}>
            <h4
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: tokens.gold,
                marginBottom: 12,
              }}
            >
              {col.heading}
            </h4>
            {col.links.map((l) => (
              <a
                key={l}
                href="#collection"
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = tokens.warmWhite)}
                onMouseLeave={(e) => (e.currentTarget.style.color = tokens.textMuted)}
              >
                {l}
              </a>
            ))}
          </div>
        ))}

        <div>
          <h4
            style={{
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: tokens.gold,
              marginBottom: 12,
            }}
          >
            Contact
          </h4>
          <a href="tel:1300005529" style={linkStyle}>1300 00 KLAY</a>
          <a href="mailto:hello@klayinteriors.com.au" style={linkStyle}>hello@klayinteriors.com.au</a>
          <span style={{ ...linkStyle, cursor: 'none' }}>18 Maltings Cct, Epping VIC 3076</span>
          <span style={{ ...linkStyle }}>Mon–Fri 8am–6pm</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          maxWidth: 1280,
          margin: '0 auto',
          marginTop: 56,
          paddingTop: 26,
          borderTop: '1px solid rgba(248,246,242,0.08)',
        }}
      >
        <span style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted }}>
          © {new Date().getFullYear()} Klay Interiors. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: 26 }}>
          {['Privacy', 'Terms', 'Warranty'].map((l) => (
            <a
              key={l}
              href="#top"
              style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted, textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = tokens.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.color = tokens.textMuted)}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
