// ---------------------------------------------------------------------------
// 10. In your home — the installation strip.
//
// Trust, not conversion. It is the section that answers "does it actually look
// like that when it's up?", which is the question the renders elsewhere on the
// page can't answer, and the reason it comes after the two range panels have
// made their claims.
//
// PLACEHOLDER IMAGERY, as briefed. These are the same product and room renders
// used elsewhere on the page, which is exactly what this section cannot be in
// production: a strip captioned "real Klay installations, real Melbourne homes"
// has to be photographs of real jobs or it is working against the trust it is
// there to build. Five real install photos replace these.
//
// DIRECTLY UNDER THE VISUALISER, and that adjacency is the whole reason this
// section sits where it does. The visualiser renders a blind onto a photograph of
// your own window; this is photographs of the same thing in houses that actually
// have it. The render is a claim and these are the receipts, so they belong next
// to each other — a customer who has just watched a canvas draw a curtain is
// exactly the person asking "does it really look like that?"
//
// It has been in two other places, and both were defensible: directly above the
// about panel, where the two read as one argument (photographs, then the
// sentences behind them), and last on the page, where every tile linking to its
// product made the final panel five ways back into the range rather than a claim.
// What beat both is answering the question in the section where it gets asked.
//
// Every tile still links to the product in its photograph, which is worth as much
// here as it was at the bottom.
//
// Desktop is five equal columns, edge to edge. Mobile scrolls horizontally
// rather than folding into a 3x2 grid — five images do not divide into six cells
// without leaving a hole, and a scrolling strip keeps all five and stays a strip.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, space, type as typeScale } from '@/ds';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SectionBand, TILE_GAP, useHover } from './primitives';

const INSTAGRAM = 'https://www.instagram.com/klayinteriors';

const SHOTS = [
  { image: '/images/room-4.png', to: '/products/dusk', objectPosition: 'center 40%' },
  { image: '/images/Soleil%20Sunscreen%20product%20image.png', to: '/products/veil', objectPosition: 'center' },
  { image: '/images/room-3.png', to: '/products?category=sheer-curtains', objectPosition: '62% 45%' },
  { image: '/images/lifestyle/room-kitchen.png', to: '/products/dusk', objectPosition: 'center 36%' },
  // Cropped hard left, onto the dark timber wardrobe. Centred, this frame is a
  // yellow armchair with no window covering anywhere in it — which is the one
  // thing a strip of installations cannot show.
  { image: '/images/hero-room.jpg', to: '/products?category=wardrobes', objectPosition: '14% center' },
];

function Shot({ shot, isMobile }: { shot: (typeof SHOTS)[number]; isMobile: boolean }) {
  const { hover, bind } = useHover();
  return (
    // A route, so <Link> — a bare href here would tear down the SPA and refetch
    // the bundle just to move to a product page.
    <Link
      {...bind}
      to={shot.to}
      style={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        aspectRatio: '4 / 5',
        // Fixed width on mobile so the row scrolls; a grid track on desktop.
        flex: isMobile ? '0 0 62vw' : undefined,
        // What shows while the photograph loads, so it has to be the section's
        // own dark rather than warm white — five bright rectangles flashing on a
        // charcoal ground and then filling in is a worse first paint than five
        // dark ones, and on a slow connection it is the whole section.
        background: tokens.ink,
        textDecoration: 'none',
      }}
    >
      <img
        src={shot.image}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: shot.objectPosition,
          display: 'block',
          transform: hover ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.7s ease',
        }}
      />
      {/* The overlay only exists on hover — a permanent label on five tiles
          would compete with the section headline. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(29,29,29,0.42)',
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <span
          style={{
            ...typeScale.micro,
            color: tokens.paper,
            border: `1px solid ${tokens.onDarkEdge}`,
            padding: `${space.sm}px ${space.md}px`,
          }}
        >
          See Product
        </span>
      </div>
    </Link>
  );
}

export function SocialProof() {
  const isMobile = useIsMobile();
  const { hover, bind } = useHover();

  return (
    // CHARCOAL. A GALLERY WALL, AND THE ONE SECTION ON THE PAGE THAT EARNS ONE.
    //
    // This section is five photographs and almost nothing else — the band above
    // them and a handle below. On a light ground the ground itself is the biggest
    // thing in the frame and the photographs are five bright rectangles sitting
    // in it; on a dark one they are lit objects and the ground disappears, which
    // is why every gallery and every print portfolio does this. TILE_GAP is 4px,
    // so the dark also draws the hairlines BETWEEN the five, and the strip reads
    // as one panel of images rather than five separate tiles.
    //
    // CHARCOAL, NOT INK, and that is the whole of the decision. Ink is the
    // visualiser card, which is the page's one deepest object and the section
    // immediately above this one. A full-bleed ink band 84px under an ink card
    // would take that distinction away from the card — the biggest darkest thing
    // on the page would be a photo strip rather than the instrument the page is
    // built around. Charcoal is the site's ordinary band dark (the nav, the steps
    // bar, the recommendation banner) and it leaves ink to the card and the
    // footer.
    //
    // It has been warm white and parchment in the last two commits, both for
    // adjacency reasons rather than for its own sake. Dark satisfies the same
    // adjacency rule — parchment above, parchment below — and is the first value
    // this section has had that is about what the section IS. See THE GROUNDS in
    // HomePage.
    <section style={{ background: tokens.charcoal }}>
      {/* The page's shared band, same as the categories, the range and the
          visualiser. It supplies the section's top padding, so the section itself
          carries none. */}
      <SectionBand
        onDark
        label="Social proof"
        title="In your home"
        sub="Real Klay installations. Real Melbourne homes."
        isMobile={isMobile}
      />

      <div
        className="klay-hscroll"
        style={
          isMobile
            ? { display: 'flex', gap: TILE_GAP, overflowX: 'auto', padding: `0 ${space.md}px ${space.xs}px` }
            : {
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: TILE_GAP,
                // The outer two strips. Gap only applies between items, so the
                // edges have to be padding — same treatment as the range row, so
                // every tile row on the page is framed rather than one being
                // framed and the others running off into the viewport.
                padding: `0 ${TILE_GAP}px`,
              }
        }
      >
        {SHOTS.map(shot => (
          <Shot key={shot.image} shot={shot} isMobile={isMobile} />
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          paddingTop: isMobile ? space.lg : space.xl,
          paddingBottom: isMobile ? space.xl : space.xxl,
        }}
      >
        <a
          {...bind}
          href={INSTAGRAM}
          target="_blank"
          rel="noreferrer noopener"
          style={{
            ...typeScale.body,
            // WARM WHITE, AND IT WAS `ink`. On the light ground this section used
            // to have, ink was correct and the comment here argued against gold
            // on contrast grounds. On charcoal the same value is near-black on
            // near-black: the section's only link out, invisible.
            //
            // This is the fourth time this exact default has bitten in this run —
            // the selected pill, the group headings, the quote link, this. The
            // pattern is always a colour that was right for a ground the element
            // no longer sits on, which is why the visualiser panel resolves its
            // colours through a skin() rather than reaching for tokens directly.
            color: tokens.paper,
            textDecoration: 'none',
            borderBottom: `1px solid ${hover ? tokens.paper : 'transparent'}`,
            paddingBottom: space.xxs,
            transition: 'border-color 0.2s ease',
          }}
        >
          @klayinteriors
        </a>
      </div>
    </section>
  );
}
