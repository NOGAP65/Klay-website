// ---------------------------------------------------------------------------
// The full range — the other ten products, as a directory rather than a pitch.
//
// WHY IT IS A SEPARATE SECTION. Our Range sells four things: a roller blind, a
// curtain, a wardrobe and an awning, at reference scale, each with the
// configurator on it. That is a selling surface and it works because it is
// short. But Klay makes fourteen products, and a homepage that names four of
// them is a homepage that has quietly narrowed the business — every previous
// version of the range section failed in exactly this direction, and the last
// one failed the other way by trying to be both at once in a single scroller.
//
// So the two jobs are two sections. This one answers "what else do you make?"
// and nothing else. It is deliberately the quieter of the two:
//
//   NO BUTTONS. Not one. The row above has four gold Shop Now buttons, and ten
//     more of them here would flatten the difference between the products Klay
//     is leading with and the products it also makes. The whole tile is the
//     link; the only other action in the section is one text link to the shop.
//
//   NO CONFIGURATOR. Thirteen of the fourteen products are price-on-measure, so
//     a configurator on these tiles could not quote anyway — it would collect a
//     specification and then ask for a phone call. That conversation belongs on
//     the product page, which is where the tile goes.
//
//   LANDSCAPE, NOT PORTRAIT. 4:3, which the site already uses on How It Works,
//     the process strip and the shop banner. The 4:5 portrait is the hero ratio
//     and it belongs to the four above; at ten tiles it would also have made
//     this section 750px tall, which is a directory taking more room than the
//     thing it is a directory for.
//
// FIVE ACROSS, TWO DOWN, and ten is what makes that come out even — the same
// arithmetic that decided four above. Below 1000px it becomes a swipe strip
// rather than reflowing: ten items divide into 5 and 2 and nothing else, and
// 2-up would be five rows of tiles nobody asked to scroll through. A thumb
// through ten thumbnails is the right control for a directory on a phone, and
// it is the same treatment the install strip already uses.
//
// IT READS THE CATALOGUE MINUS THE HERO IDS, so the two sections partition the
// range between them. Promote a product into the row above and it leaves this
// strip on the same edit; add a fifteenth product to the catalogue and it
// appears here without this file changing.
// ---------------------------------------------------------------------------

import { Link } from 'react-router-dom';
import { radius, tokens, shadow, space, supporting, eyebrow, headline, layout, type as typeScale } from '../../theme';
import { useIsMobile, useMediaQuery } from '../../hooks/useIsMobile';
import { CATALOGUE, type CatalogueItem } from '../../data/catalogue';
import { TextLink, TILE_GAP, useHover } from './primitives';
import { ProductGlyph } from '../ProductGlyph';
import { HERO_IDS } from './RangeRow';

/** Everything the row above is not showing, in catalogue order — which is the
 * business's own grouping, so the strip runs indoor, then outdoor, then the
 * three that are neither. */
const REST: CatalogueItem[] = CATALOGUE.filter(item => !HERO_IDS.includes(item.id));

/** Five across above this, a swipe strip below it. See the note on the layout. */
const FIVE_UP = '(min-width: 1000px)';

/** How many tiles the swipe strip shows at once, and it is a FRACTION on
 * purpose: the sliver of the next tile is the only thing that says the strip
 * scrolls at all, and on a whole number the row ends on a tile edge and reads as
 * a complete grid.
 *
 * Two numbers, because one did not serve both ends of the range this strip
 * covers. At 2.4 a 390px phone measured a 128px tile — 96px tall at 4:3, which
 * is smaller than the product name under it and past the point where a
 * photograph of a blind is legible. 1.8 gives 192px there. The same 1.8 at a
 * 900px tablet would give 409px, which is hero scale for a directory tile, so
 * above the mobile breakpoint it goes the other way. */
const colsScroll = (isMobile: boolean) => (isMobile ? 1.8 : 3.4);

function RangeTile({ item }: { item: CatalogueItem }) {
  const { hover, bind } = useHover();
  return (
    <Link
      {...bind}
      to={item.to}
      style={{ display: 'block', textDecoration: 'none', minWidth: 0 }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: radius.md,
          // 4:3 — landscape, and the site's other established ratio. See the
          // note at the top for why this section does not take the hero's 4:5.
          aspectRatio: '4 / 3',
          background: item.image ? tokens.parchment : tokens.charcoal,
          // The same shadow the hero cards carry, so the two sections read as
          // one family of objects at two scales rather than two designs.
          boxShadow: shadow.rest,
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} — ${item.group}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: item.imagePosition ?? 'center',
              display: 'block',
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.7s ease',
            }}
          />
        ) : (
          // Venetian Blinds is the one product with no photograph, and this is
          // where it lands rather than in the hero row — a line drawing at
          // directory scale is a legible placeholder, where at hero scale it was
          // a black hole in the shopfront.
          <div
            style={{
              position: 'absolute',
              inset: space.sm,
              border: `1px solid ${hover ? tokens.onDarkEdge : tokens.onDarkLine}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.3s ease',
            }}
          >
            <ProductGlyph
              type={item.glyph ?? ''}
              size={72}
              color={tokens.warmWhite}
              ground={tokens.charcoal}
              opacity={hover ? 0.75 : 0.6}
            />
          </div>
        )}
      </div>

      {/* THE NAME ONLY, at body size. The hero cards carry a small-caps group
          line above the name and this does not: at ten tiles the group repeats
          in blocks — five INDOOR, then OUTDOOR, then OTHER — and a label that
          repeats five times in a row is noise rather than information. The
          grouping is legible from the order itself. */}
      <div
        style={{
          ...typeScale.body,
          color: hover ? tokens.ink : tokens.inkSoft,
          marginTop: space.sm,
          transition: 'color 0.25s ease',
        }}
      >
        {item.name}
      </div>
    </Link>
  );
}

export function FullRange() {
  const isMobile = useIsMobile();
  const fiveUp = useMediaQuery(FIVE_UP);

  /** The same container the row above uses, so the first tile's left edge lands
   * on the same vertical line as the hero cards' and the two sections read as
   * one column of the page. */
  const inner: React.CSSProperties = {
    maxWidth: layout.gridMax,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: layout.inlinePad(isMobile),
    paddingRight: layout.inlinePad(isMobile),
  };

  return (
    <section style={{ background: tokens.warmWhite }}>
      {/* THE SAME HEADER SHAPE AS OUR RANGE — eyebrow, Cormorant heading, one
          supporting line, action opposite — but with a text link where that one
          has a gold button. Same composition, one step quieter, which is how the
          section says "this is the other half of the range" rather than "this is
          a second range section". */}
      <div
        style={{
          ...inner,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: space.lg,
          padding: isMobile
            ? `${space.xl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`
            : `${space.xxl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`,
        }}
      >
        <div>
          <p style={{ ...eyebrow, marginBottom: space.md }}>More from Klay</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>The full range</h2>
          <p style={{ ...supporting.onLight, marginTop: space.md, maxWidth: 460 }}>
            {/* THE COUNT IS COMPUTED, not typed. A homepage that says "fourteen"
                while the catalogue holds fifteen is worse than one that says
                nothing, and the catalogue is the kind of list that grows. */}
            {CATALOGUE.length} products in all — every one measured, made and
            installed by the same people.
          </p>
        </div>
        {!isMobile && <TextLink to="/products">Shop the full range</TextLink>}
      </div>

      <div
        className={fiveUp ? undefined : 'klay-hscroll'}
        style={
          fiveUp
            ? { ...inner, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: TILE_GAP }
            : {
                // The swipe strip. Padding rather than the shared container,
                // because padding on a scroll container sits at the start and
                // end of the scrollable CONTENT — which is what holds the left
                // edge in line with the header and gives the last tile the same
                // margin the first one has.
                display: 'flex',
                gap: TILE_GAP,
                overflowX: 'auto',
                padding: `0 ${layout.inlinePad(isMobile)}px`,
                // NO SCROLL SNAPPING, and this is a fix rather than a
                // preference. With `scroll-snap-type: x mandatory` the browser
                // snaps the first item to the SCROLLPORT edge, which does not
                // include the container's start padding — measured, it silently
                // set scrollLeft to exactly the padding (20px on a phone, 80 on
                // a tablet) and the first tile sat flush against the viewport
                // while the heading above it was correctly inset. The install
                // strip scrolls without snapping too; a directory does not need
                // to rest on tile boundaries.
              }
        }
      >
        {REST.map(item => (
          <div
            key={item.id}
            style={
              fiveUp
                ? { minWidth: 0 }
                : {
                    // ONE GAP SUBTRACTED, NOT THE PADDING TOO. It read
                    // `100% - inlinePad*2 - gap`, and the padding term was a
                    // double count: 100% on a flex child resolves against the
                    // parent's CONTENT box, which the strip's own horizontal
                    // padding has already been taken out of. Measured, that made
                    // the tiles 170px where 192 was intended on a phone and 169
                    // where 216 was intended on a tablet — and the tablet came out
                    // narrower than the phone, which is the tell.
                    flex: `0 0 calc((100% - ${TILE_GAP}px) / ${colsScroll(isMobile)})`,
                  }
            }
          >
            <RangeTile item={item} />
          </div>
        ))}
      </div>

      {/* Mobile's link to the shop, under the strip rather than above it — same
          reasoning as the row above, and the padding closes the section.

          The top padding is mobile-only because on desktop this box holds
          nothing: the link is up in the header there, and 32px of padding above
          an empty div is 32px of warm white between the last tile row and the
          section that follows. */}
      <div
        style={{
          ...inner,
          paddingTop: isMobile ? space.lg : 0,
          paddingBottom: isMobile ? space.xl : space.xxl,
        }}
      >
        {isMobile && <TextLink to="/products">Shop the full range</TextLink>}
      </div>
    </section>
  );
}
