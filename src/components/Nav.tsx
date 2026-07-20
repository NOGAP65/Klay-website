import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const links = [
  { label: 'Collection', to: '/products' },
  { label: 'Process', to: '/how-it-works' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'Contact', to: '/contact' },
];

export function Nav() {
  const scrollY = useKlayStore((s) => s.scrollY);
  const compressed = scrollY > 60;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compressed ? '14px 5vw' : isMobile ? '18px 5vw' : '26px 5vw',
        background: compressed || menuOpen ? 'rgba(20,20,20,0.72)' : 'transparent',
        backdropFilter: compressed || menuOpen ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: compressed || menuOpen ? 'blur(14px)' : 'none',
        borderBottom: compressed ? '1px solid rgba(200,151,58,0.16)' : '1px solid transparent',
        transition: 'padding 0.5s ease, background 0.5s ease, border-color 0.5s ease',
      }}
    >
      <Link
        to="/#top"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: tokens.warmWhite,
        }}
      >
        <img
          src="/images/klay%202.jpeg"
          alt="Klay Interiors"
          style={
            isMobile
              ? { width: '110px', height: '47px', objectFit: 'cover', objectPosition: 'center' }
              : { width: '150px', height: '64px', objectFit: 'cover', objectPosition: 'center' }
          }
        />
      </Link>

      {!isMobile && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 38,
              alignItems: 'center',
            }}
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  color: tokens.warmWhite,
                  textDecoration: 'none',
                  fontFamily: tokens.body,
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.82,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <Link
            to="/visualiser"
            style={{
              border: `1px solid ${tokens.gold}`,
              color: tokens.gold,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '12px 22px',
              transition: 'background 0.3s ease, color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tokens.gold;
              e.currentTarget.style.color = tokens.dark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = tokens.gold;
            }}
          >
            Design Yours
          </Link>
        </>
      )}

      {isMobile && (
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 40,
            height: 40,
            border: `1px solid ${tokens.gold}`,
            background: 'transparent',
            color: tokens.gold,
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      )}

      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'rgba(15,14,11,0.98)',
            zIndex: 8900,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                color: tokens.warmWhite,
                textDecoration: 'none',
                fontFamily: tokens.display,
                fontSize: 28,
                letterSpacing: '0.04em',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/visualiser"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 16,
              border: `1px solid ${tokens.gold}`,
              color: tokens.gold,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '14px 28px',
            }}
          >
            Design Yours
          </Link>
        </div>
      )}
    </nav>
  );
}
