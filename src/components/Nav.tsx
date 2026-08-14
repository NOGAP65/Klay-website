import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { useCartStore } from '../store/cartStore';
import { tokens, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { NAV_CATEGORIES } from '../data/categories';

interface NavProps {
  onLight?: boolean;
  solid?: boolean;
  /** Pixels of something above the nav that scrolls away — the homepage's
   * announcement bar. The nav starts that far down and slides up to the top
   * edge as the bar leaves, so the two never overlap and the bar isn't pinned
   * to the viewport for the whole page. Left at 0, the nav sits at the top as
   * before, which is what every other page wants. */
  stickBelow?: number;
}

export function Nav({ onLight = false, solid = true, stickBelow = 0 }: NavProps = {}) {
  const scrollY = useKlayStore((s) => s.scrollY);
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const compressed = scrollY > 60;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ctaHover, setCtaHover] = useState(false);
  const [quoteHover, setQuoteHover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const alwaysSolid = solid || compressed;
  const solidBar = alwaysSolid && !menuOpen;
  const onDarkGround = menuOpen || solidBar || (!compressed && !onLight);
  const linkColor = onDarkGround ? tokens.warmWhite : tokens.ink;

  // scrollY is only published by pages that install the listener (the
  // homepage); everywhere else it stays 0, which resolves to stickBelow — and
  // stickBelow is only passed by the homepage. Both defaults agree on 0.
  const top = Math.max(0, stickBelow - scrollY);

  return (
    <nav
      style={{
        position: 'fixed',
        top,
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
        // `top` is deliberately NOT transitioned — it tracks scroll position
        // frame by frame, and easing it would make the nav lag the page.
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

            {/* Four links in the centre and one action on the right. Reviews and
                Design Yours were dropped from here: Reviews pointed at a
                homepage anchor that read as a page, and Design Yours competed
                with the gold CTA for the same click while /visualiser is behind
                a host allowlist. Both are still reachable — from the hero, from
                the closing CTA, and from the footer. */}
            {[{ label: 'How It Works', to: '/how-it-works' }].map((l) => {
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

          {/* Right: the gold pill, then the cart. The pill is the nav's one
              action; the cart is a utility and stays an outline so the two
              don't read as two competing CTAs. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
            {/* Shop Now, and square. It was a "Get a Quote" pill pointing at the
                enquiry form — a quote request is the gatekeeping this brand is
                built to remove, and it was the only rounded button on a site whose
                every other CTA is a 2px rectangle. It goes to the blinds listing
                now: the one place on the site you can genuinely shop. */}
            <Link
              to="/blinds"
              onMouseEnter={() => setQuoteHover(true)}
              onMouseLeave={() => setQuoteHover(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 44,
                padding: '0 26px',
                borderRadius: 2,
                background: quoteHover ? tokens.goldLight : tokens.gold,
                color: tokens.ink,
                fontFamily: tokens.body,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: motion.button,
              }}
            >
              Shop Now
            </Link>

            <Link
              to="/cart"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 8,
                border: `1px solid ${ctaHover ? tokens.gold : onDarkGround ? tokens.onDarkEdge : tokens.line}`,
                background: ctaHover ? 'rgba(200,151,58,0.1)' : 'transparent',
                color: ctaHover ? tokens.gold : linkColor,
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
              {cartItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: tokens.gold,
                  color: tokens.ink,
                  fontFamily: tokens.body,
                  fontSize: 10,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
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

          <Link
            to="/how-it-works"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 16,
              color: tokens.warmWhite,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 16,
              opacity: 0.8,
            }}
          >
            How It Works
          </Link>

          {/* Same action, destination and fill as the desktop button. */}
          <Link
            to="/blinds"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 24,
              background: tokens.gold,
              borderRadius: 2,
              color: tokens.ink,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '16px 34px',
            }}
          >
            Shop Now
          </Link>

          <Link
            to="/cart"
            onClick={() => setMenuOpen(false)}
            style={{
              color: tokens.warmWhite,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
          </Link>
        </div>
      )}
    </nav>
  );
}
