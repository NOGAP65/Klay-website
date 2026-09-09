// ---------------------------------------------------------------------------
// 10. From the feed — the Instagram strip.
//
// Trust, not conversion. It is the section that answers "does it actually look
// like that when it's up?", which is the question the renders elsewhere on the
// page can't answer, and the reason it comes after the two range panels have
// made their claims.
//
// IT IS THE INSTAGRAM FEED NOW, and the caption changed with it. This was
// "In your home / Real Klay installations. Real Melbourne homes." over five
// room renders — a claim the tiles could not support, and the note here has
// admitted as much since the day it was written. Pointing the strip at the
// actual account does not fix that by itself, because the account's one post is
// a brand card rather than a job; what fixes it is the section no longer
// claiming to be something it is not. It says it is the feed, and it is.
//
// THE FIRST TILE IS THE REAL POST. @klay.interiors has exactly one, published
// 7 September 2026 — a "Meet Klay" launch carousel whose first frame is a sheer
// curtain photograph carrying the wordmark. It leads the strip and links to the
// post itself.
//
// A STORED COPY, NOT A HOTLINK. Instagram's CDN URLs are signed and carry an
// expiry (`oe=`), so an <img src> pointed at one works for a few days and then
// serves nothing. The frame is downloaded into public/images/social/ and served
// from there. Re-download it if the post is edited.
//
// THE OTHER FIVE ARE STILL PLACEHOLDERS, and are meant to become the five most
// recent posts. That needs a feed, and a feed needs credentials: Instagram's
// Basic Display API is gone, so the route is a Graph API long-lived token
// against an Instagram Business or Creator account linked to a Facebook page,
// refreshed every 60 days — a build-time fetch into a JSON file is the honest
// shape for a page that is otherwise static. Until that exists, these five are
// the room renders they always were, marked below so nobody mistakes them for
// posts.
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
// Desktop is six equal columns, edge to edge — one per tile, so the real post
// and the five slots behind it read as one row. Mobile scrolls horizontally
// rather than folding into a grid: a strip that scrolls keeps every tile and
// stays a strip, which is also how the feed it stands for is read.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';

import * as site from '@/config/site';

import { tokens, space, type as typeScale, SectionBand, useHover } from '@/ds';
import { useIsMobile } from '@/shared';

import { TILE_GAP } from '../furniture';

const INSTAGRAM = site.instagram;

interface Tile {
  image: string;
  /** Where the tile goes. An `href` is off-site and opens in a new tab; a `to`
   * is a route and stays in the SPA. Exactly one of the two. */
  to?: string;
  href?: string;
  objectPosition: string;
  /** What the hover plate says. A post goes to Instagram; a placeholder goes to
   * the shop, and saying so is the difference between a tile that is a post and
   * a tile standing in for one. */
  cta: string;
  alt: string;
}

/** THE REAL POST, FIRST — see the note at the top of the file.
 *
 * The permalink is the post's own, not the profile's, so the tile lands on the
 * thing it is showing. It is the only tile here that is genuinely a post. */
const POST: Tile = {
  image: '/images/social/klay-interiors-launch.webp',
  href: 'https://www.instagram.com/p/DdA2cgNlN4Q/',
  // The frame is composed as a square-ish card and the tile is 4/5, so it is
  // centred rather than cropped off-centre: the wordmark sits low in the frame
  // and any downward bias cuts it.
  objectPosition: 'center center',
  cta: 'View on Instagram',
  alt: 'Meet Klay — complete interior solutions designed to transform the way you live.',
};

/** THE FIVE SLOTS BEHIND IT, still room renders.
 *
 * These are placeholders for the five most recent posts and are not posts, so
 * they go to the shop rather than pretending to link to Instagram. Three of
 * them once pointed at product pages that no longer exist; the category links
 * are left as they are because a filtered shop is still the shop.
 *
 * When the feed lands, this whole list is what it replaces. */
const PLACEHOLDERS: Tile[] = [
  { image: '/images/rooms/room-4.png', to: '/products', objectPosition: 'center 40%', cta: 'Shop the range', alt: '' },
  { image: '/images/rooms/room-5.png', to: '/products', objectPosition: 'center 40%', cta: 'Shop the range', alt: '' },
  { image: '/images/rooms/room-3.png', to: '/products?category=sheer-curtains', objectPosition: '62% 45%', cta: 'Shop the range', alt: '' },
  { image: '/images/rooms/room-kitchen.png', to: '/products', objectPosition: 'center 36%', cta: 'Shop the range', alt: '' },
  // Cropped hard left, onto the dark timber wardrobe. Centred, this frame is a
  // yellow armchair with no window covering anywhere in it — which is the one
  // thing a strip standing for a furnishings feed cannot show.
  { image: '/images/rooms/hero-room.jpg', to: '/products?category=wardrobes', objectPosition: '14% center', cta: 'Shop the range', alt: '' },
];

const TILES: Tile[] = [POST, ...PLACEHOLDERS];

function Shot({ shot, isMobile }: { shot: Tile; isMobile: boolean }) {
  const { isHovered, bind } = useHover();
  // A route gets <Link> — a bare href there would tear down the SPA and refetch
  // the bundle just to move to a product page. Instagram is not a route, so it
  // gets a real anchor and a new tab: the one tile that leaves the site should
  // not take the page they were reading with it.
  //
  // TWO ELEMENTS RATHER THAN ONE POLYMORPHIC ONE. This was a `Wrapper` variable
  // holding either 'a' or Link with the differing props spread in, which reads
  // neatly and does not typecheck: the union of an anchor's props and
  // LinkProps has no common shape TS will accept, because `to` is required on
  // one and absent on the other. Two returns sharing one `inner` is longer and
  // is the version the compiler can check.
  const frame: React.CSSProperties = {
    position: 'relative',
    display: 'block',
    overflow: 'hidden',
    aspectRatio: '4 / 5',
    // Fixed width on mobile so the row scrolls; a grid track on desktop.
    flex: isMobile ? '0 0 62vw' : undefined,
    // What shows while the photograph loads, so it has to be the section's own
    // dark rather than warm white — six bright rectangles flashing on a
    // charcoal ground and then filling in is a worse first paint than six dark
    // ones, and on a slow connection it is the whole section.
    background: tokens.ink,
    textDecoration: 'none',
  };

  const inner = (
    <>
      <img
        src={shot.image}
        alt={shot.alt}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: shot.objectPosition,
          display: 'block',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.7s ease',
        }}
      />
      {/* The overlay only exists on hover — a permanent label on six tiles
          would compete with the section headline. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(29,29,29,0.42)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <span
          style={{
            ...typeScale.micro,
            color: tokens.paper,
            border: `1px solid ${tokens.onDarkEdge}`,
            padding: `${space.snug}px ${space.item}px`,
          }}
        >
          {shot.cta}
        </span>
      </div>
    </>
  );

  // Instagram is not a route, so it gets a real anchor and a new tab: the one
  // tile that leaves the site should not take the page they were reading with
  // it. Everything else gets <Link> — a bare href there would tear down the SPA
  // and refetch the bundle just to move to a product page.
  return shot.href ? (
    <a {...bind} href={shot.href} target="_blank" rel="noreferrer noopener" style={frame}>
      {inner}
    </a>
  ) : (
    <Link {...bind} to={shot.to ?? '/products'} style={frame}>
      {inner}
    </Link>
  );
}

export function SocialProof() {
  const isMobile = useIsMobile();
  const { isHovered, bind } = useHover();

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
      {/* THE CAPTION SAYS WHAT THE TILES ARE. It read "In your home / Real Klay
          installations. Real Melbourne homes." over five room renders, which
          was a claim about photographs the section did not have — and now that
          the strip leads with the account's own post, "in your home" would be
          wrong about the first tile too. It is the feed, so it says so, and the
          handle comes from config rather than being typed here. */}
      <SectionBand
        onDark
        label="Instagram"
        title="From the feed"
        sub={`The latest from ${site.instagramHandle}.`}
        isMobile={isMobile}
      />

      <div
        className="klay-hscroll"
        style={
          isMobile
            ? { display: 'flex', gap: TILE_GAP, overflowX: 'auto', padding: `0 ${space.item}px ${space.tight}px` }
            : {
                display: 'grid',
                // Six now: the post plus the five slots behind it.
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: TILE_GAP,
                // The outer two strips. Gap only applies between items, so the
                // edges have to be padding — same treatment as the range row, so
                // every tile row on the page is framed rather than one being
                // framed and the others running off into the viewport.
                padding: `0 ${TILE_GAP}px`,
              }
        }
      >
        {TILES.map(shot => (
          <Shot key={shot.image} shot={shot} isMobile={isMobile} />
        ))}
      </div>

      <div
        style={{
          textAlign: 'center',
          paddingTop: isMobile ? space.group : space.section,
          paddingBottom: isMobile ? space.section : space.band,
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
            borderBottom: `1px solid ${isHovered ? tokens.paper : 'transparent'}`,
            paddingBottom: space.hairline,
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* FROM CONFIG, NOT TYPED HERE. This was the literal
              "@klayinteriors" next to an href read from site.ts, so the label
              and the link could point at two different accounts — and they did:
              the handle is klay.interiors, with the dot. */}
          {site.instagramHandle}
        </a>
      </div>
    </section>
  );
}
