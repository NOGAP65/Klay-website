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
// Desktop is five equal columns, edge to edge. Mobile scrolls horizontally
// rather than folding into a 3x2 grid — five images do not divide into six cells
// without leaving a hole, and a scrolling strip keeps all five and stays a strip.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { tokens, space, type as typeScale } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SectionBand, TILE_GAP, useHover } from './primitives';

const INSTAGRAM = 'https://www.instagram.com/klayinteriors';

const SHOTS = [
  { image: '/images/room-4.png', to: '/blinds/roller-blinds', objectPosition: 'center 40%' },
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
        background: tokens.parchment,
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
            color: tokens.warmWhite,
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
    <section style={{ background: tokens.warmWhite }}>
      {/* The page's shared band, same as the categories, the range and the
          visualiser. It supplies the section's top padding, so the section itself
          carries none. */}
      <SectionBand
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
            // goldText: @klayinteriors sits on warm white, where brand gold
            // measures 2.37.
            color: tokens.ink,
            textDecoration: 'none',
            borderBottom: `1px solid ${hover ? tokens.ink : 'transparent'}`,
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
