// ---------------------------------------------------------------------------
// THE NAV — two menus and a link: OUR RANGE, ABOUT, CONTACT.
//
// It used to be three top-level category items (Indoor, Outdoor, Wardrobes),
// each with its own dropdown of product types. That put the business's own
// filing system in the most valuable row on the site: nobody arrives wanting
// "Indoor", they arrive wanting curtains, and finding curtains meant knowing
// they were filed under Indoor first. Three dropdowns of nine, six and four
// items also meant nineteen destinations in the bar, of which one was buyable.
//
// Now there is ONE range menu, holding the six things Klay actually sells —
// Blinds, Curtains, Awnings, Wardrobes, Screens, Shelving. That list is not
// written here; it comes off data/ranges.ts, the same array the homepage
// carousel and hero rail read, so the nav cannot say a different range to the
// page underneath it. The Indoor/Outdoor/Wardrobes pages still exist and are
// still routed — they are just no longer the way in.
//
// THE PANEL IS DARK. It was a white rounded card with a soft shadow dropping
// out of a charcoal bar, which read as a different site's component borrowed
// into this one — 12px radius on a site whose every button is a 2px rectangle,
// and a bright rectangle punched into a dark bar. Charcoal on charcoal, with a
// hairline and a square corner, reads as the bar extending downwards.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { useCartStore } from '../store/cartStore';
import { tokens, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { RANGES } from '../data/ranges';

/** What a menu drops. Kept deliberately flat — a label and a destination — so
 * that adding a menu is adding an array, not another block of panel markup. */
interface MenuItem {
  label: string;
  to: string;
}

interface Menu {
  /** The word in the bar. */
  label: string;
  /** Where the word itself goes when clicked rather than hovered. A menu whose
   * heading is inert forces the visitor through the panel to get anywhere, and
   * on touch there is no hover to open it with. */
  to: string;
  items: MenuItem[];
}

const MENUS: Menu[] = [
  {
    label: 'Our Range',
    // There is no all-ranges index yet — /products is a resolver that redirects
    // to whatever ?category it is given and falls through to rollers on its own.
    // Until one exists the heading goes where the first item goes, which is also
    // the only range that reaches a real shop. This is the link to change when
    // the range index is built.
    to: '/blinds',
    items: RANGES.map(r => ({ label: r.label, to: r.to })),
  },
  {
    label: 'About',
    to: '/about',
    items: [
      { label: 'About Us', to: '/about' },
      { label: 'How It Works', to: '/how-it-works' },
    ],
  },
];

/** The dark panel. One component for both menus, because the range menu having
 * its own look was half of what made the old dropdown feel bolted on.
 *
 * The 16px of top padding is a bridge, not a gap: it is transparent and it is
 * inside the hover target, so the pointer can travel from the word to the first
 * item without crossing dead space and closing the menu on the way. */
function DropdownPanel({ items, onNavigate }: { items: MenuItem[]; onNavigate?: () => void }) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  return (
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
          background: tokens.charcoal,
          borderRadius: 2,
          border: `1px solid ${tokens.goldLine}`,
          // Deep and soft. The panel is the same colour as the bar above it, so
          // without a shadow the two merge into one shape and the panel stops
          // reading as something that opened.
          boxShadow: '0 22px 52px rgba(0,0,0,0.45)',
          padding: '10px 0',
          minWidth: 208,
        }}
      >
        {items.map((item) => {
          const isHovered = hoveredItem === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(cur => (cur === item.to ? null : cur))}
              style={{
                display: 'block',
                padding: '11px 26px',
                textDecoration: 'none',
                fontFamily: tokens.body,
                fontSize: 13,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
                color: isHovered ? tokens.gold : tokens.warmWhite,
                opacity: isHovered ? 1 : 0.78,
                background: isHovered ? 'rgba(200,151,58,0.10)' : 'transparent',
                transition: 'color 0.2s ease, background 0.2s ease, opacity 0.2s ease',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

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
            {/* The two menus — Our Range, About. The chevron rotates rather
                than swapping character, so an open menu is legible at a glance
                without the word beside it shifting by a pixel. */}
            {MENUS.map((menu) => {
              const isOpen = dropdownOpen === menu.label;
              return (
                <div
                  key={menu.label}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setDropdownOpen(menu.label)}
                  onMouseLeave={() => setDropdownOpen(cur => (cur === menu.label ? null : cur))}
                >
                  <Link
                    to={menu.to}
                    style={{
                      color: isOpen ? tokens.gold : linkColor,
                      textDecoration: 'none',
                      fontFamily: tokens.body,
                      fontSize: 13,
                      fontWeight: 400,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      opacity: isOpen ? 1 : 0.82,
                      paddingBottom: 3,
                      borderBottom: `1px solid ${isOpen ? tokens.gold : 'transparent'}`,
                      transition: `${motion.link}, opacity 0.2s ease`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}
                  >
                    {menu.label}
                    <svg
                      width="8"
                      height="5"
                      viewBox="0 0 8 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        opacity: 0.7,
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.25s ease',
                      }}
                    >
                      <path d="M1 1l3 3 3-3" />
                    </svg>
                  </Link>

                  {isOpen && <DropdownPanel items={menu.items} />}
                </div>
              );
            })}

            {/* Contact stays a direct link rather than a third menu — it is one
                destination, and burying a one-item menu behind a chevron is a
                click spent on nothing. How It Works moved into the About menu;
                Reviews and Design Yours are still off the bar, reachable from
                the hero, the closing CTA and the footer. */}
            {[{ label: 'Contact', to: '/contact' }].map((l) => {
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
          {/* Everything is open on mobile — there is no hover to open a panel
              with, and a tap-to-expand accordion two levels deep is worse than
              a list you scroll. Same two menus, same order as the bar. */}
          {MENUS.map((menu) => (
            <div key={menu.label} style={{ textAlign: 'center' }}>
              <Link
                to={menu.to}
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
                {menu.label}
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {menu.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      color: tokens.warmWhite,
                      textDecoration: 'none',
                      fontFamily: tokens.body,
                      fontSize: 15,
                      opacity: 0.8,
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 4,
              color: tokens.gold,
              textDecoration: 'none',
              fontFamily: tokens.display,
              fontSize: 32,
              letterSpacing: '0.04em',
            }}
          >
            Contact
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
