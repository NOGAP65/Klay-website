import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { tokens, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { NAV_CATEGORIES } from '../data/categories';

interface NavProps {
  onLight?: boolean;
  solid?: boolean;
}

export function Nav({ onLight = false, solid = true }: NavProps = {}) {
  const scrollY = useKlayStore((s) => s.scrollY);
  const compressed = scrollY > 60;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ctaHover, setCtaHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const alwaysSolid = solid || compressed;
  const solidBar = alwaysSolid && !menuOpen;
  const onDarkGround = menuOpen || solidBar || (!compressed && !onLight);
  const linkColor = onDarkGround ? tokens.warmWhite : tokens.ink;

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
        padding: compressed ? '12px 5vw' : isMobile ? '14px 5vw' : '16px 5vw',
        background: solidBar ? tokens.charcoal : 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        borderBottom: 'none',
        transition: 'padding 0.5s ease, background 0.5s ease, border-color 0.5s ease',
      }}
    >
      {/* Left: Logo */}
      <Link
        to="/#top"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: linkColor,
          flex: '0 0 auto',
        }}
      >
        <img
          src="/images/klay-logo.png"
          alt="Klay Interiors"
          style={
            isMobile
              ? { width: '100px', height: '40px', objectFit: 'contain', display: 'block' }
              : { width: '120px', height: '48px', objectFit: 'contain', display: 'block' }
          }
        />
      </Link>

      {!isMobile && (
        <>
          {/* Center: All nav links */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 28,
              alignItems: 'center',
            }}
          >
            {/* Category dropdowns */}
            {NAV_CATEGORIES.map((category) => (
              <div
                key={category.slug}
                style={{ position: 'relative' }}
                onMouseEnter={() => setDropdownOpen(category.slug)}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <Link
                  to={`/${category.slug}`}
                  style={{
                    color: dropdownOpen === category.slug ? tokens.gold : linkColor,
                    textDecoration: 'none',
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: dropdownOpen === category.slug ? 1 : 0.82,
                    paddingBottom: 3,
                    borderBottom: `1px solid ${dropdownOpen === category.slug ? tokens.gold : 'transparent'}`,
                    transition: `${motion.link}, opacity 0.2s ease`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {category.name}
                  <span style={{ fontSize: 8, opacity: 0.6 }}>▼</span>
                </Link>

                {/* Dropdown */}
                {dropdownOpen === category.slug && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      paddingTop: 16,
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        background: tokens.warmWhite,
                        borderRadius: 12,
                        boxShadow: '0 16px 48px rgba(28,24,16,0.15)',
                        border: `1px solid ${tokens.lineFaint}`,
                        padding: '16px 8px',
                        minWidth: 220,
                      }}
                    >
                      {category.subcategories.map((sub) => (
                        <Link
                          key={sub.slug}
                          to={sub.available ? `/${category.slug}/${sub.slug}` : '#'}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: 8,
                            textDecoration: 'none',
                            fontFamily: tokens.body,
                            fontSize: 14,
                            color: sub.available ? tokens.ink : tokens.textMuted,
                            transition: 'background 0.2s ease',
                            background: 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (sub.available) {
                              e.currentTarget.style.background = 'rgba(200,151,58,0.08)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span>{sub.name}</span>
                          {!sub.available && (
                            <span
                              style={{
                                fontSize: 10,
                                color: tokens.gold,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Soon
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Other links including Design Yours */}
            {[
              { label: 'How It Works', to: '/#process' },
              { label: 'Reviews', to: '/#reviews' },
              { label: 'Design Yours', to: '/visualiser' },
            ].map((l) => {
              const isHovered = hovered === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onMouseEnter={() => setHovered(l.to)}
                  onMouseLeave={() => setHovered(cur => (cur === l.to ? null : cur))}
                  style={{
                    color: isHovered ? tokens.gold : linkColor,
                    textDecoration: 'none',
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    opacity: isHovered ? 1 : 0.82,
                    paddingBottom: 3,
                    borderBottom: `1px solid ${isHovered ? tokens.gold : 'transparent'}`,
                    transition: `${motion.link}, opacity 0.2s ease`,
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Cart button */}
          <Link
            to="/cart"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 8,
              border: `1px solid ${ctaHover ? tokens.gold : 'rgba(245,242,237,0.2)'}`,
              background: ctaHover ? 'rgba(200,151,58,0.1)' : 'transparent',
              color: ctaHover ? tokens.gold : tokens.warmWhite,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            aria-label="Cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
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
            borderRadius: 6,
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
            background: 'rgba(44,40,36,0.98)',
            zIndex: 8900,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            overflowY: 'auto',
            padding: '80px 24px',
          }}
        >
          {NAV_CATEGORIES.map((category) => (
            <div key={category.slug} style={{ textAlign: 'center' }}>
              <Link
                to={`/${category.slug}`}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: tokens.gold,
                  textDecoration: 'none',
                  fontFamily: tokens.display,
                  fontSize: 32,
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                {category.name}
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    to={sub.available ? `/${category.slug}/${sub.slug}` : '#'}
                    onClick={() => sub.available && setMenuOpen(false)}
                    style={{
                      color: sub.available ? tokens.warmWhite : tokens.textMuted,
                      textDecoration: 'none',
                      fontFamily: tokens.body,
                      fontSize: 15,
                      opacity: sub.available ? 0.8 : 0.5,
                    }}
                  >
                    {sub.name} {!sub.available && '(Soon)'}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <Link
              to="/#process"
              onClick={() => setMenuOpen(false)}
              style={{
                color: tokens.warmWhite,
                textDecoration: 'none',
                fontFamily: tokens.body,
                fontSize: 16,
                opacity: 0.8,
                display: 'block',
                marginBottom: 16,
              }}
            >
              How It Works
            </Link>
            <Link
              to="/#reviews"
              onClick={() => setMenuOpen(false)}
              style={{
                color: tokens.warmWhite,
                textDecoration: 'none',
                fontFamily: tokens.body,
                fontSize: 16,
                opacity: 0.8,
              }}
            >
              Reviews
            </Link>
          </div>

          <Link
            to="/visualiser"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 24,
              border: `1px solid ${tokens.gold}`,
              borderRadius: 6,
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
