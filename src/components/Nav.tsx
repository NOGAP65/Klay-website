import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { tokens, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const links = [
  { label: 'Collection', to: '/products' },
  { label: 'Process', to: '/how-it-works' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'Contact', to: '/contact' },
];

interface NavProps {
  /** Set on pages that open on a LIGHT hero. The nav is transparent until it
   * compresses, and over a dark hero its links are warmWhite — the same value
   * as a light page's background — so without this they are invisible above
   * the fold. Still required after the scrolled state was inverted to warm
   * white: inverting fixed the scrolled half, but the transparent half is
   * still light-on-dark by default. */
  onLight?: boolean;
}

export function Nav({ onLight = false }: NavProps = {}) {
  const scrollY = useKlayStore((s) => s.scrollY);
  const compressed = scrollY > 60;
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [ctaHover, setCtaHover] = useState(false);

  // What the bar is sitting on, which is the only thing that decides link
  // colour. Three grounds: the charcoal menu overlay, a dark hero while
  // transparent, or warm white (scrolled, or transparent over a light hero).
  const onDarkGround = menuOpen || (!compressed && !onLight);
  const linkColor = onDarkGround ? tokens.warmWhite : tokens.ink;

  // Scrolled, the bar becomes warm white with a blur — the page's own surface
  // rising behind the type rather than a dark slab dropped over it. Reads as
  // part of the page instead of a separate chrome layer, and keeps the whole
  // site off the near-black rgba(20,20,20) this used to use.
  // While the mobile menu is open the overlay behind supplies the ground, so
  // the bar itself stays transparent rather than stacking two scrims.
  const solidBar = compressed && !menuOpen;

  // Gold outline over the hero, solid gold once scrolled. The button gains
  // weight exactly as the nav does — by the time it is a solid gold block the
  // visitor has scrolled past the hero's own CTA and this is the only one left
  // on screen.
  const ctaSolid = solidBar;

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
        background: solidBar ? 'rgba(245,242,237,0.85)' : 'transparent',
        backdropFilter: solidBar ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: solidBar ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${solidBar ? tokens.line : 'transparent'}`,
        transition: 'padding 0.5s ease, background 0.5s ease, border-color 0.5s ease',
      }}
    >
      <Link
        to="/#top"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: linkColor,
        }}
      >
        <img
          src="/images/klay-logo.png"
          alt="Klay Interiors"
          style={
            isMobile
              ? { width: '150px', height: '59px', objectFit: 'contain', display: 'block' }
              : { width: '200px', height: '79px', objectFit: 'contain', display: 'block' }
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
            {links.map((l) => {
              const isHovered = hovered === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onMouseEnter={() => setHovered(l.to)}
                  onMouseLeave={() => setHovered(cur => (cur === l.to ? null : cur))}
                  style={{
                    // Gold on hover, and a gold rule under it. The transition
                    // here was previously dead code — declared, but with no
                    // hover handler to drive it, so the links never responded
                    // to the cursor at all.
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

          <Link
            to="/visualiser"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            style={{
              border: `1px solid ${tokens.gold}`,
              // Solid gold once scrolled; gold outline over the hero. Hover
              // fills the outline and brightens the solid, so both states have
              // somewhere to go.
              background: ctaSolid
                ? ctaHover
                  ? tokens.goldLight
                  : tokens.gold
                : ctaHover
                  ? tokens.gold
                  : 'transparent',
              color: ctaSolid || ctaHover ? tokens.ink : tokens.gold,
              textDecoration: 'none',
              fontFamily: tokens.body,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '12px 22px',
              transition: motion.button,
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
            // Charcoal, not the near-black rgba(15,14,11) this used to be —
            // a full-screen overlay is a dark section like any other, and
            // charcoal is the darkest surface the palette allows.
            background: 'rgba(44,40,36,0.98)',
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
