// ---------------------------------------------------------------------------
// THE NAV — the range spelled out, then ABOUT and CONTACT.
//
// BLINDS · CURTAINS · AWNINGS · WARDROBES · SCREENS · SHELVING | ABOUT ▾ | CONTACT
//
// Two versions preceded this. First, three category items — Indoor, Outdoor,
// Wardrobes — each dropping its own list of product types. That put the
// business's filing system in the most valuable row on the site: nobody arrives
// wanting "Indoor", they arrive wanting curtains, and finding curtains meant
// knowing it was filed under Indoor first.
//
// Then one OUR RANGE menu holding the six. Better, but still a click to find out
// what a window furnishings company sells, and "Our Range" is a label that says
// nothing — every word of the actual answer was hidden behind it.
//
// So the range is spelled out. Six words, no chevron, no hover, no panel: the
// visitor reads what Klay sells without touching anything, and reaching any of
// it is one click rather than two. It costs the bar most of its spare width,
// which is what the tightened gap and the 12px type below are paying for, and
// it is worth it — this row IS the range.
//
// The six come off data/ranges.ts, the same array the homepage carousel and hero
// rail read, so the nav cannot say a different range to the page underneath it.
// The Indoor/Outdoor/Wardrobes pages still exist and are still routed — they are
// just no longer the way in.
//
// ABOUT KEEPS ITS PANEL, because About Us and How It Works are two spellings of
// the same errand and neither earns a word in a row this full. That panel is
// dark: it was a white rounded card dropping out of a charcoal bar, 12px radius
// on a site whose every button is a 2px rectangle. Charcoal on charcoal with a
// hairline and a square corner reads as the bar extending downwards.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { useCartStore } from '../store/cartStore';
import { tokens, motion } from '../theme';
import { useIsMobile, useMediaQuery } from '../hooks/useIsMobile';
import { RANGES } from '../data/ranges';

/** WHERE THE BAR GIVES UP AND BECOMES A DRAWER — and it is not the site's 768px
 * phone breakpoint, which is the whole reason this constant exists.
 *
 * Measured, not guessed. The centre row is 689px wide with the range spelled
 * out; the logo takes 120, the Shop Now button and cart take 185, and the bar
 * carries 5vw of padding either side. Those add up to a collision at 1180px —
 * the words run into the button, and at 1024 they run under the logo as well.
 * Every laptop between 1024 and 1200, and every windowed browser, sat in that
 * range while `isMobile` still said desktop.
 *
 * The alternative was shrinking the type and the gaps until eight words fit a
 * 1024 bar, which buys a legible layout at one width by making it cramped at
 * every other. The drawer already holds all of it, comfortably.
 *
 * 1200 rather than 1180: the measurement is the failure point, and a breakpoint
 * set exactly at the failure point fails at the first font that renders a pixel
 * wider than Chrome's. */
const NAV_COLLAPSE = '(max-width: 1200px)';

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

/** The six ranges, straight into the bar. Off data/ranges.ts rather than typed
 * here — this row and the homepage's range carousel have to be the same list. */
const RANGE_LINKS: MenuItem[] = RANGES.map(r => ({ label: r.label, to: r.to }));

/** What is left with a panel. One entry, and the type is kept plural because the
 * shape is the reusable one: adding a second menu is adding an object. */
const MENUS: Menu[] = [
  {
    label: 'About',
    to: '/about',
    items: [
      { label: 'About Us', to: '/about' },
      { label: 'How It Works', to: '/how-it-works' },
    ],
  },
];

/** The one link with no panel under it. */
const CONTACT_LINK: MenuItem = { label: 'Contact', to: '/contact' };

/** Every word in the bar shares this. It was written out three times — once for
 * the range links, once for a menu heading and once for Contact — and the three
 * copies had already drifted on `gap` before this pulled them together.
 *
 * `active` covers both states that light a word up: the pointer being on it, and
 * its panel being open. They look identical on purpose. */
const barLink = (active: boolean, linkColor: string) => ({
  color: active ? tokens.gold : linkColor,
  textDecoration: 'none',
  fontFamily: tokens.body,
  // 12px, down from 13. Eight words plus a logo plus two buttons is most of a
  // 1440 bar, and the pixel comes back as breathing room between them.
  fontSize: 12,
  fontWeight: 400,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  whiteSpace: 'nowrap' as const,
  opacity: active ? 1 : 0.82,
  paddingBottom: 3,
  borderBottom: `1px solid ${active ? tokens.gold : 'transparent'}`,
  transition: `${motion.link}, opacity 0.2s ease`,
});

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
  // Two thresholds, and they are not the same question. `isMobile` (768) sizes
  // the logo and the bar's padding — that is about a phone. `collapsed` (1200)
  // decides whether the links are a row or a drawer — that is about whether
  // eight words fit, which stops being true long before a phone. See NAV_COLLAPSE.
  const isMobile = useIsMobile();
  const collapsed = useMediaQuery(NAV_COLLAPSE);
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

      {!collapsed && (
        <>
          {/* Center: the range, then the divider, then About and Contact. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              // 22px, down from 28. Eight words in this row rather than three;
              // the gap is what pays for the six that are new.
              gap: 22,
              alignItems: 'center',
            }}
          >
            {/* THE RANGE, SPELLED OUT. Six plain links — no chevron, no panel,
                nothing to open. The whole point of moving them out of a menu is
                that the visitor reads what Klay sells without acting. */}
            {RANGE_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onMouseEnter={() => setHovered(l.to)}
                onMouseLeave={() => setHovered(cur => (cur === l.to ? null : cur))}
                style={barLink(hovered === l.to, linkColor)}
              >
                {l.label}
              </Link>
            ))}

            {/* A hairline between the range and the rest. Without it eight
                identically-set words read as one undifferentiated list, and
                ABOUT sits in the row looking like a seventh thing Klay sells.
                Sized to the type rather than the bar so it never becomes a rule
                across the nav. */}
            <span
              aria-hidden="true"
              style={{
                width: 1,
                height: 13,
                background: onDarkGround ? tokens.onDarkEdge : tokens.line,
                opacity: 0.55,
                // Cancels half the flex gap on either side, so the divider sits
                // in a slightly tighter well than the words do — it is a seam,
                // not another item in the row.
                margin: '0 -4px',
              }}
            />

            {/* About keeps its panel: About Us and How It Works are two
                spellings of one errand, and neither earns a word in a row this
                full. The chevron rotates rather than swapping character, so an
                open menu is legible without the word beside it shifting. */}
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
                      ...barLink(isOpen, linkColor),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
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

            {/* Contact is one destination, so burying it behind a chevron would
                be a click spent on nothing. Reviews and Design Yours are still
                off the bar — reachable from the hero, the closing CTA and the
                footer — and there is now less room for them than ever. */}
            <Link
              to={CONTACT_LINK.to}
              onMouseEnter={() => setHovered(CONTACT_LINK.to)}
              onMouseLeave={() => setHovered(cur => (cur === CONTACT_LINK.to ? null : cur))}
              style={barLink(hovered === CONTACT_LINK.to, linkColor)}
            >
              {CONTACT_LINK.label}
            </Link>
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

      {collapsed && (
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

      {collapsed && menuOpen && (
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
          {/* The range, in the same order as the bar. Set in the display face at
              26 rather than the 32 the headings take — six of them at 32 fill a
              phone on their own and push About and Contact below the fold, and
              the panel scrolls but a menu you have to scroll to find Contact in
              is a menu that has hidden Contact. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {RANGE_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: tokens.gold,
                  textDecoration: 'none',
                  fontFamily: tokens.display,
                  fontSize: 26,
                  letterSpacing: '0.04em',
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* The same seam the bar carries, between what Klay sells and
              everything else. */}
          <span
            aria-hidden="true"
            style={{ width: 56, height: 1, background: tokens.onDarkEdge }}
          />

          {/* About is open rather than collapsed — there is no hover to open a
              panel with, and a tap-to-expand accordion is worse than two lines
              you can already see. */}
          {MENUS.map((menu) => (
            <div key={menu.label} style={{ textAlign: 'center' }}>
              <Link
                to={menu.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: tokens.gold,
                  textDecoration: 'none',
                  fontFamily: tokens.display,
                  fontSize: 26,
                  letterSpacing: '0.04em',
                  display: 'block',
                  marginBottom: 10,
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
              marginTop: 2,
              color: tokens.gold,
              textDecoration: 'none',
              fontFamily: tokens.display,
              fontSize: 26,
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
