// ---------------------------------------------------------------------------
// THE NAV — the range spelled out, then ABOUT and CONTACT.
//
// BLINDS · CURTAINS · AWNINGS · WARDROBES · SCREENS · SHELVING | ABOUT ▾
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
 * Measured in the running page, not guessed. The centre row of six ranges is
 * 524px; the right cluster — About, cart, Shop Now — is 267; the logo is 120;
 * and the bar carries 5vw of padding either side. Because the centre is
 * absolutely centred on the viewport rather than flowed between the two, the
 * binding constraint is the RIGHT side, which is the wider of the two ends:
 *
 *     gap = viewport/2 − 0.05·viewport − 267 − 262
 *
 * That reaches zero at 1176px, so the words run into the Shop Now button just
 * under 1180. Below about 1024 they would run under the logo as well. Every
 * laptop in that range, and every windowed browser, was getting the desktop bar
 * because `isMobile` says 768.
 *
 * 1240 leaves ~30px of real clearance at the handover instead of trusting the
 * measurement to the pixel — Chrome's metrics are not every browser's, and a
 * breakpoint set at the failure point fails on the first font that renders a
 * hair wider. It moved up from 1200 when Shop Now and the cart gained About as
 * a neighbour: the centre got NARROWER in that change and the bar still needs
 * more width, which is the whole argument for measuring both ends rather than
 * counting words.
 *
 * The alternative was shrinking type and gaps until it all fits a 1024 bar,
 * which buys one width by making every other one cramped. The drawer already
 * holds all of it, comfortably — see the panel below. */
const NAV_COLLAPSE = '(max-width: 1240px)';

/** The gap between the cart and Shop Now — two controls, sitting as a pair. */
const CONTROL_GAP = 18;

/** The gap between ABOUT and the cart, which is deliberately NOT CONTROL_GAP.
 *
 * The right cluster is one flex row, so a single gap spaced About, the cart and
 * Shop Now identically — and identical spacing is wrong here, because the three
 * are not peers. The cart and the button are a pair of controls; About is a
 * word, and a word set as tight to an icon as the icon is to a button reads as
 * a label ON the control rather than as a link beside it.
 *
 * So it is wider than CONTROL_GAP, not narrower. Tried at 9 first, which pulled
 * About so close it looked like the cart's caption; the fix for a word floating
 * between two groups is not to weld it to one of them.
 *
 * Expressed as a real gap and applied as the DIFFERENCE from CONTROL_GAP,
 * because the cluster is anchored to the bar's right edge: changing the shared
 * gap would drag the cart with it. A margin on one side moves only the item to
 * its left, which is exactly and only About. This is the one number to change if
 * it wants to sit further either way. */
const ABOUT_GAP = 26;

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

/** Everything that is not a range. One menu, and the type is kept plural because
 * the shape is the reusable one: adding a second menu is adding an object.
 *
 * Contact sits in here rather than beside it. Three errands — who Klay is, how
 * the job runs, how to reach someone — are one errand as far as the bar is
 * concerned, and a seventh word in a row of six ranges reads as a seventh thing
 * Klay sells. It is still one hover and one click, and the footer and every
 * page's closing CTA carry a direct line to it besides. */
const MENUS: Menu[] = [
  {
    label: 'About',
    to: '/about',
    items: [
      { label: 'About Us', to: '/about' },
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Contact', to: '/contact' },
    ],
  },
];

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
function DropdownPanel({
  items,
  onNavigate,
  align = 'center',
}: {
  items: MenuItem[];
  onNavigate?: () => void;
  /** 'center' hangs the panel under the middle of its word. 'right' pins its
   * right edge to the word's — which is what a menu near the right margin of
   * the bar needs, since a 208px panel centred on a five-letter word that close
   * to the edge overhangs the viewport and adds a horizontal scrollbar. */
  align?: 'center' | 'right';
}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        ...(align === 'right'
          ? { right: 0 }
          : { left: '50%', transform: 'translateX(-50%)' }),
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
          {/* CENTRE: THE RANGE, AND NOTHING ELSE. Six plain links — no chevron,
              no panel, nothing to open. Everything that is not something Klay
              sells has moved to the right cluster, so the middle of the bar
              answers exactly one question: what do you make?

              That also means the centre is now genuinely optically centred.
              With About sitting in here the row was six product words plus a
              menu, so the true middle of the range fell left of the logo's
              centre line — the eye reads the products as the row, and the row
              was off. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              // 26px. It was 22 when eight words shared this row; two of them
              // left, so the six get the space back rather than the bar getting
              // a wider empty middle.
              gap: 26,
              alignItems: 'center',
            }}
          >
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
          </div>

          {/* RIGHT: About, then the cart, then Shop Now hard against the edge.
              Ordered by how committed the click is — read about us, look at what
              you have picked, buy — so the row builds left to right into the one
              gold thing on the bar.

              The cart sits between them rather than outside because Shop Now is
              the terminal action and terminal actions belong at the end of the
              row; a utility parked to the right of the primary CTA reads as the
              last word when it is the least important thing there. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: CONTROL_GAP, flex: '0 0 auto' }}>
            {/* About, and it keeps its panel — About Us, How It Works and
                Contact are three spellings of one errand, and none of the three
                belongs in a row reserved for what Klay sells. The chevron
                rotates rather than swapping character, so an open menu is
                legible without the word beside it shifting by a pixel. */}
            {MENUS.map((menu) => {
              const isOpen = dropdownOpen === menu.label;
              return (
                <div
                  key={menu.label}
                  // Its own spacing to the cart, wider than the two controls
                  // give each other — see ABOUT_GAP. The cluster is anchored to
                  // the bar's right edge, so a margin here moves ABOUT and
                  // leaves the cart and Shop Now exactly where they are.
                  style={{ position: 'relative', marginRight: ABOUT_GAP - CONTROL_GAP }}
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

                  {/* Ranged right rather than centred under the word. This menu
                      is near the edge of the bar now, and a panel centred on a
                      five-letter word that close to the right margin hangs off
                      the side of the viewport. */}
                  {isOpen && <DropdownPanel items={menu.items} align="right" />}
                </div>
              );
            })}

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

            {/* Shop Now, hard against the right edge, and square. It was a "Get
                a Quote" pill pointing at the enquiry form — a quote request is
                the gatekeeping this brand is built to remove, and it was the
                only rounded button on a site whose every other CTA is a 2px
                rectangle. It goes to the blinds listing: the one place on the
                site you can genuinely shop.

                It sat to the LEFT of the cart until now, which put a utility
                icon in the most valuable pixel on the bar and made the gold
                button read as one of two things ranged right rather than as the
                end of the row. */}
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

          {/* Contact used to be a heading of its own here. It is one of the
              three lines under About now, exactly as it is in the bar — the
              drawer and the row have to agree about where things live, or the
              same site teaches two different maps depending on window width. */}

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
