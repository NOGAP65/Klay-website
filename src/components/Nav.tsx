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
// THE BUTTON AND THE FIRST WORD BOTH SAY SHOP, and both go to /products.
// The button was "Book a Measure" for a while, on the argument that with SHOP
// already in the bar a Shop Now button beside it is the same link twice and the
// most valuable pixel on the page should carry what the links do not. That was
// overruled and the reasoning is worth recording either way: the shop is the
// priority, and duplicating the route means a visitor who never registers a
// 12px word in the middle of a bar still has one unmissable way in.
//
// Both were gold. The button is now the royal-blue `accent` fill — the one place
// in this bar carrying any chroma at all — and the word is distinguished by
// weight rather than colour, see the note on barLink. That split is deliberate:
// the button is the action and takes the colour, the word is a destination and
// does not.
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

/** The gap between the cart and the CTA button — two controls, sitting as a
 * pair. The links keep their own, wider gap from the cluster. */
const CONTROL_GAP = 20;

/** THE HEIGHT OF THE CART, THE CTA AND THE HAMBURGER — one number, because they
 * are the same object at three jobs and they were 52 / 52 / 40.
 *
 * 42, down from 52, and this is what actually made the bar sleeker. The bar
 * measured 85px and the logo was only 40 of it: the controls were setting the
 * height and the logo was sitting in 12px of headroom on each side. Shrinking
 * the logo would have done nothing to the bar, and growing it was free.
 *
 * Monday's nav row measures 60px and Kookaï's 96. At 42 with NAV_PAD either side
 * the bar lands at 68 with a bigger mark in it than it had at 85. */
const NAV_CONTROL = 42;

/** Vertical padding, by state. Was 16 / 14 / 12, and the whole reason the bar
 * read heavy: 32px of air around controls that did not need it. */
const NAV_PAD = { rest: 11, mobile: 10, compressed: 8 };

/** THE LOGO, and it is the one thing here that got BIGGER — 46 against the old
 * 40, with the bar 17px shorter. The mark is a wordmark with INTERIORS
 * letterspaced beneath it, so it needs real height before the second line is
 * legible at all; 40 was the ceiling only because the controls had already
 * spent the bar's height. */
const NAV_LOGO = { rest: 46, mobile: 38 };

interface NavLink {
  label: string;
  to: string;
  /** Set on the one word that is not just a destination. Weight 500 at full
   * opacity, against three at 400 and 0.82 — see the note on LINKS. */
  accent?: boolean;
}

/** Four destinations, flat. SHOP is first because it is what the site is for;
 * VISUALISE is second because it is the thing Klay has that its competitors do
 * not, and burying it in a footer wastes it.
 *
 * SHOP IS SET APART AT REST. Four words set identically is a list, and a list
 * has no first item — the eye picks whichever is nearest, which on a centred row
 * is whichever the pointer happened to land beside. Marking the one that leads
 * to the catalogue makes the bar say where to start without adding a word, a
 * chevron or a second button.
 *
 * That mark used to be gold. It is now weight and opacity, because the palette
 * has no accent hue left to spend — see barLink. The distinction survived the
 * colour being removed, which is the argument for the whole neutral pass in
 * miniature.
 *
 * It does not collide with the button beside it. That is a filled black block
 * and this is a word in the bar's own colour; they read as one system rather
 * than as two CTAs, and they point at different things — browse the range,
 * versus book someone to come and measure.
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

/** Every word in the bar shares this, so the four cannot drift apart.
 *
 * THE ACCENT IS NO LONGER A COLOUR, and this is the clearest case on the site of
 * why it could not stay one. SHOP was gold against three warm-white siblings.
 * With the palette neutral there is no second hue to promote it with, and the
 * mechanical swap made it `fillStrong` — #1D1D1D on a #303030 bar, which the
 * contrast audit caught at 1.28:1. The accent word had become invisible.
 *
 * Every word now takes `linkColor`, and the two devices that were already here
 * do the whole job: SHOP is weight 500 at full opacity, the other three are
 * weight 400 at 0.82. That is a real difference at 12px — and it is the same
 * difference the bar was making before, with the colour merely sitting on top of
 * it. The active word additionally takes the underline it always had. */
const barLink = (active: boolean, linkColor: string, accent = false) => ({
  color: linkColor,
  textDecoration: 'none',
  ...typeScale.label,
  fontWeight: accent ? 500 : 400,
  whiteSpace: 'nowrap' as const,
  opacity: accent || active ? 1 : 0.82,
  paddingBottom: space.xxs,
  borderBottom: `1px solid ${active ? tokens.line : 'transparent'}`,
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
  /** THE SOLID BAR IS LIGHT NOW, which inverts what this used to mean.
   *
   * It read `menuOpen || solidBar || (!compressed && !onLight)` — solidBar was
   * charcoal, so being solid was itself a reason to treat the ground as dark.
   * The bar is paper, so the only two dark cases left are the drawer, which is a
   * near-black full-screen overlay, and a transparent bar sitting over a hero
   * photograph on a page that has not declared itself light.
   *
   * Every caller takes the default `solid = true`, so in practice this resolves
   * to `menuOpen`. It stays written out because `solid={false}` is still a
   * supported prop and a transparent bar over a photograph genuinely does need
   * the light treatment. */
  const onDarkGround = menuOpen || (!solidBar && !onLight);
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
        padding: `${compressed ? NAV_PAD.compressed : isMobile ? NAV_PAD.mobile : NAV_PAD.rest}px 5vw`,
        // PAPER, not charcoal. Same value as the page ground, which is how the
        // references do it — Monday runs a black marquee straight into a nav the
        // colour of the page, and the hairline below is the only thing dividing
        // them. Paper is also the logo's own export field, so the dark mark sits
        // in this bar without a seam behind it.
        background: solidBar ? tokens.paper : 'transparent',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        // The edge has to carry the whole separation now that the bar and the
        // page are the same colour, so it is a light-ground hairline rather than
        // the on-dark one. `lineFaint` over paper resolves to about #E5E5E5.
        borderBottom: solidBar ? `1px solid ${tokens.lineFaint}` : '1px solid transparent',
        // `top` is deliberately NOT transitioned — it tracks scroll position
        // frame by frame, and easing it would make the nav lag the page.
        // 300ms on the ground and the hairline together, so the bar arrives as
        // one object rather than fading in before its own edge does.
        transition: 'padding 0.5s ease, background 0.3s ease, border-color 0.3s ease',
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
        {/* THE DARK MARK ON THE LIGHT BAR, and it follows the ground rather than
            being pinned to one file — the drawer is still a near-black overlay
            and a #303030 mark would vanish into it.

            `klay-logo.png` is the mark in #303030 for light grounds;
            `klay-logo-light.png` is the same artwork with its greyscale part in
            #F8F8F8. The tan leg of the k is untouched in both, so it is the one
            thing that does not change with the ground. Both are generated from
            public/images/logo_full.png.

            HEIGHT-ONLY, NO EXPLICIT WIDTH, AND NO object-fit. The comment this
            replaced set both axes to chase the old gold wordmark's 2.536 ratio
            and used `contain` to absorb the error. This asset is cropped to its
            own bounding box — the source was 2000 × 2000 with the mark inset and
            92% of it empty field — so its ratio is 2.074, and letting width be
            `auto` means there is no ratio to match and nothing to letterbox. */}
        <img
          src={onDarkGround ? '/images/klay-logo-light.png' : '/images/klay-logo.png'}
          alt="Klay Interiors"
          style={{ height: isMobile ? NAV_LOGO.mobile : NAV_LOGO.rest, width: 'auto', display: 'block' }}
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
                // Square, and the same height as the CTA beside it — the cart and
                // the button are a pair of controls. See NAV_CONTROL.
                width: NAV_CONTROL,
                height: NAV_CONTROL,
                borderRadius: 2,
                border: `1px solid ${cartHover ? tokens.line : onDarkGround ? tokens.onDarkEdge : tokens.line}`,
                // The hover wash follows the ground. A paper wash at 0.12 was
                // the right move on a charcoal bar and is invisible on a paper
                // one, so on light it inverts to ink at 0.06 — enough to read as
                // a pressed state without becoming a second button.
                background: cartHover
                  ? onDarkGround
                    ? 'rgba(248,248,248,0.12)'
                    : 'rgba(29,29,29,0.06)'
                  : 'transparent',
                color: linkColor,
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
                  background: tokens.accent,
                  color: tokens.onAccent,
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
                height: NAV_CONTROL,
                padding: `0 ${space.lg}px`,
                borderRadius: 2,
                background: ctaHover ? tokens.accentHover : tokens.accent,
                color: tokens.onAccent,
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
            width: NAV_CONTROL,
            height: NAV_CONTROL,
            border: `1px solid ${tokens.line}`,
            borderRadius: 2,
            background: 'transparent',
            // linkColor, not onDark. It was onDark, which is paper — invisible on
            // the paper bar the moment the ground inverted. The contrast audit
            // did not catch it because the glyph is a single character and the
            // walk only judges nodes carrying two or more.
            color: linkColor,
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
            // The drawer stays dark — it is a full-screen overlay, not the bar. The
            // literal was rgba(44,40,36,0.98), the old warm charcoal, which the
            // hex sweep did not catch because it was written as rgba.
            background: 'rgba(29,29,29,0.98)',
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
                color: tokens.onDark,
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
              background: tokens.accent,
              borderRadius: 2,
              color: tokens.onAccent,
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
