// ---------------------------------------------------------------------------
// THE NAV — four words, no menus.
//
//   KLAY        SHOP · VISUALISE · ABOUT · CONTACT        [cart] [SHOP NOW]
//
// Three versions preceded this, and each one was the navigation trying to do a
// page's job.
//
//   1. Indoor / Outdoor / Wardrobes, each with a dropdown of product types.
//      That is the business's filing system, not the customer's question —
//      nobody arrives wanting "Indoor", and finding curtains meant knowing they
//      were filed under it.
//
//   2. One OUR RANGE menu holding the six ranges. Better, but still a click to
//      learn what a window furnishings company sells, behind a label that says
//      nothing.
//
//   3. The six ranges spelled across the bar. Honest, and it read well, but it
//      spent the entire width of the nav on a taxonomy and still could not say
//      anything about what was inside each one. It also forced the whole bar to
//      collapse into a drawer below 1240px.
//
// The taxonomy now lives on /products, which is a real page with real filters
// and can show all twenty-two products at once — see the note at the top of
// ProductsPage. So the bar is four destinations and nothing opens on hover.
//
// THE GOLD BUTTON AND THE GOLD WORD BOTH SAY SHOP, and both go to /products.
// The button was "Book a Measure" for a while, on the argument that with SHOP
// already in the bar a Shop Now button beside it is the same link twice and the
// most valuable pixel on the page should carry what the links do not. That was
// overruled and the reasoning is worth recording either way: the shop is the
// priority, and duplicating the route means a visitor who never registers a
// 12px word in the middle of a bar still has one unmissable gold way in.
//
// Booking a measure is still reachable — it is the CTA on the homepage, on the
// category pages and in the footer.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKlayStore } from '../store';
import { useCartStore } from '../store/cartStore';
import { tokens, motion, space, type as typeScale } from '../theme';
import { useIsMobile, useMediaQuery } from '../hooks/useIsMobile';

/** WHERE THE BAR BECOMES A DRAWER.
 *
 * It was 1240px when the six ranges were spelled across the middle: that row
 * was 524px wide and collided with the right cluster just under 1180. Four
 * short words is about 250px, so the bar clears its own contents down to a
 * little over 800 — the constraint moved out of the way when the taxonomy did.
 *
 * 860 leaves real clearance and still hands phones and small tablets the
 * drawer. It is deliberately NOT the site's 768px `isMobile`: that breakpoint
 * is about phone layout, this one is about whether a row of words fits, and
 * tying them together is what put a broken bar on every 1024px laptop the last
 * time the nav grew. */
const NAV_COLLAPSE = '(max-width: 860px)';

/** The gap between the cart and the gold button — two controls, sitting as a
 * pair. The links keep their own, wider gap from the cluster. */
const CONTROL_GAP = 20;

interface NavLink {
  label: string;
  to: string;
  /** Set on the one word that is not just a destination. Gold, at rest,
   * against three warm-white ones — see the note on LINKS. */
  accent?: boolean;
}

/** Four destinations, flat. SHOP is first because it is what the site is for;
 * VISUALISE is second because it is the thing Klay has that its competitors do
 * not, and burying it in a footer wastes it.
 *
 * SHOP IS GOLD AT REST. Four words set identically is a list, and a list has no
 * first item — the eye picks whichever is nearest, which on a centred row is
 * whichever the pointer happened to land beside. Colouring the one that leads to
 * the catalogue makes the bar say where to start without adding a word, a
 * chevron or a second button.
 *
 * It does not collide with the gold button beside it. That is a filled block and
 * this is a coloured word; they read as the same brand rather than as two CTAs,
 * and they point at different things — browse the range, versus book someone to
 * come and measure.
 *
 * How It Works is deliberately not here. It is one page of process copy, it is
 * linked from /about and from the footer, and a fifth word would start this bar
 * back down the road the previous three versions took. */
const LINKS: NavLink[] = [
  { label: 'Shop', to: '/products', accent: true },
  // The homepage's visualiser section, not the standalone /visualiser page.
  // The section is the better surface — it introduces the tool, sits in the run
  // of the page and has the range around it — and /visualiser is gated to an
  // allowlist of hosts, so a bare link to it can dead-end depending on where
  // the site is served from. App's ScrollToHash does the scrolling.
  { label: 'Visualise', to: '/#visualiser' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

/** Every word in the bar shares this, so the four cannot drift apart. */
const barLink = (active: boolean, linkColor: string, accent = false) => ({
  // An accented word is already gold, so hover has to move somewhere else or
  // the link appears dead under the pointer. It goes lighter; the plain words
  // go gold.
  color: accent ? (active ? tokens.goldLight : tokens.gold) : active ? tokens.gold : linkColor,
  textDecoration: 'none',
  ...typeScale.label,
  // Half a step heavier when accented. Gold on charcoal at 12px is a lower
  // contrast pairing than warm white on charcoal, and at weight 400 it reads
  // thinner than the words either side of it rather than more important.
  fontWeight: accent ? 500 : 400,
  whiteSpace: 'nowrap' as const,
  // Gold is the accent; dimming it to 0.82 is just a muddier gold.
  opacity: accent || active ? 1 : 0.82,
  paddingBottom: space.xxs,
  borderBottom: `1px solid ${active ? tokens.gold : 'transparent'}`,
  transition: `${motion.link}, opacity 0.2s ease`,
});

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
  // the logo and the bar's padding — that is about a phone. `collapsed` (860)
  // decides whether the links are a row or a drawer. See NAV_COLLAPSE.
  const isMobile = useIsMobile();
  const collapsed = useMediaQuery(NAV_COLLAPSE);

  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [cartHover, setCartHover] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

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
              // THE LOGO'S OWN RATIO, so nothing letterboxes. The source is
              // 558 × 220 = 2.536; these boxes were 2.50 (120 × 48) and the
              // footer's was 2.51, so `object-fit: contain` was padding the
              // artwork inside both — by a different amount in each, which is
              // why the mark sat at two apparent sizes.
              ? { width: '101px', height: '40px', objectFit: 'contain', display: 'block' }
              : { width: '122px', height: '48px', objectFit: 'contain', display: 'block' }
          }
        />
      </Link>

      {!collapsed && (
        <>
          {/* Centre: the four words. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: space.lg,
              alignItems: 'center',
            }}
          >
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onMouseEnter={() => setHovered(l.to)}
                onMouseLeave={() => setHovered(cur => (cur === l.to ? null : cur))}
                style={barLink(hovered === l.to, linkColor, l.accent)}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right: the cart, then the gold button hard against the edge. The
              cart sits inside because the button is the terminal action and
              terminal actions belong at the end of the row; a utility parked to
              the right of the primary CTA reads as the last word when it is the
              least important thing there. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: CONTROL_GAP, flex: '0 0 auto' }}>
            <Link
              to="/cart"
              onMouseEnter={() => setCartHover(true)}
              onMouseLeave={() => setCartHover(false)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // 52, matching the CTA beside it — the cart and the button are a
                // pair of controls and were 44 against 52.
                width: 52,
                height: 52,
                borderRadius: 2,
                border: `1px solid ${cartHover ? tokens.gold : onDarkGround ? tokens.onDarkEdge : tokens.line}`,
                background: cartHover ? 'rgba(200,151,58,0.1)' : 'transparent',
                color: cartHover ? tokens.gold : linkColor,
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
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: tokens.gold,
                  color: tokens.ink,
                  fontFamily: tokens.body,
                  ...typeScale.micro,
                  letterSpacing: 'normal',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Shop Now. It was Book a Measure for a while, on the argument
                that with SHOP already in the bar a Shop Now button beside it is
                the same link twice and the gold slot should carry what the
                links do not. Overruled: the shop is the priority, and a visitor
                who has not registered the small word in the middle of the bar
                still has one unmissable gold way in. Both go to /products. */}
            <Link
              to="/products"
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 52,
                padding: `0 ${space.lg}px`,
                borderRadius: 2,
                background: ctaHover ? tokens.goldLight : tokens.gold,
                color: tokens.ink,
                ...typeScale.label,
                lineHeight: 1,
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
            borderRadius: 2,
            background: 'transparent',
            color: tokens.gold,
            ...typeScale.card,
            fontSize: 20,
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
            gap: 22,
            overflowY: 'auto',
            padding: '80px 24px',
          }}
        >
          {/* The same four, in the same order as the bar. The drawer and the row
              have to agree, or the site teaches two different maps depending on
              window width. */}
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{
                color: tokens.gold,
                textDecoration: 'none',
                fontFamily: tokens.display,
                fontSize: 34,
                letterSpacing: '0.04em',
              }}
            >
              {l.label}
            </Link>
          ))}

          <span
            aria-hidden="true"
            style={{ width: 56, height: 1, background: tokens.onDarkEdge, marginTop: 6 }}
          />

          {/* Same action, destination and fill as the desktop button. */}
          <Link
            to="/products"
            onClick={() => setMenuOpen(false)}
            style={{
              marginTop: 6,
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
