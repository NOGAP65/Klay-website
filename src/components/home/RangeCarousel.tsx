// ---------------------------------------------------------------------------
// 4. Our Range — one row of product cards, arrows, and it moves on its own.
//
// A CARD IS A PHOTOGRAPH, A NAME, AND THE CONFIGURATOR. The top two thirds are
// built against MONDAY Haircare's range row; the last third is Klay's own
// economics. MONDAY sells four shampoos off a shelf and its cards carry no
// controls at all. Klay sells made to measure, where the configuration IS the
// product — pushing it a page away costs a click and a page load to ask
// something the row could have asked directly.
//
// What did not survive is the old geometry. The tile and the panel were given
// the SAME fixed height, 470 and 470, which made the card 940 against MONDAY at
// 642 and Sixpenny at 504, showed three products of fourteen, and forced the
// panel to scroll inside itself because a wardrobe asks one question and a
// roller asks five. Both size to their own content now, and the row's flex
// children stretch so every gold button still lands on one line.
//
// This replaces TWO sections: the Indoor/Outdoor/Wardrobes category grid and the
// Dusk/Veil/Duo SKU grid that followed it. They were the same question asked
// twice — two photo grids back to back, both saying "pick what you want to shop
// for", about 1,900px of page between them.
//
// Of the two, the category grid was the weaker idea even though it was the better
// looking one. Nobody shops by "Indoor". They shop for blinds, or for curtains.
// Indoor/Outdoor/Wardrobes is how the business is organised, not how the customer
// thinks — Kookai's tiles are Jackets/Tops/Bottoms, one level below where Klay's
// were. The SKU grid failed the other way: "Dusk / Blockout Roller / From $220"
// makes a first-time visitor decode a brand name before they can decide anything,
// and three of its four cards were rollers, which made the range look narrower
// than the business actually is.
//
// SAME TILE, SMALLER, IN A ROW. The top half is PhotoTile, unchanged — the same
// object the category grid used, because that design works. What changed is the
// scale and the axis: ~330px wide against the category tiles' 480, and a
// horizontal scroller instead of a grid.
//
// WHY A CAROUSEL EARNS ITS PLACE HERE. Not for motion's sake. A grid has to divide
// evenly or it leaves holes, and that constraint is what forced every previous
// version of this section into either three tiles or four — always fewer than the
// range Klay actually sells. A row has no such constraint, so this is the first
// version of this section that shows the whole range without dropping one to make
// the maths work. The drift is also the only honest way to say "there is more
// here than fits", which is exactly the message.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { tokens, motion, prefersReducedMotion, space, supporting, eyebrow, headline, layout, type as typeScale } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
// The row reads data/catalogue.ts — the same fourteen products the shop lists,
// in the same order, rendered by the same tile. It used to read a data/ranges.ts
// of its own holding six invented ranges, which meant the homepage and the shop
// described the business differently: the homepage offered "Screens" and
// "Shelving" as peers of "Blinds", and neither Honeycomb Blinds nor Roller
// Shutters nor Frameless Shower Screens appeared anywhere on it.
import { CATALOGUE, type CatalogueItem } from '../../data/catalogue';
import { CtaLink, TILE_GAP, useHover } from './primitives';
import { Link } from 'react-router-dom';
import { ProductGlyph } from '../ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';
import { defaultSelection, fieldsFor, type Selection } from '../../data/configOptions';

/** Relative luminance, for deciding whether the mechanism drawing goes on in
 * warm white or in ink. The fabric card runs from a 0.905 white to a 0.078
 * black, so one stroke colour cannot serve both ends of it. */
const luminance = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

// FULL CONTAINER, not 70%. At 70% the row was 1000px inside a 1440 viewport —
// 220px of dead margin down each side while the cards were simultaneously
// cramped enough to need a 280px floor under them. Narrow and tight at once,
// which is the tell that the width was not derived from the content. MONDAY's
// row is 1340 of 1440; every reference measured sits between 1330 and 1374.
const ROW_WIDTH = '100%';

/** Card width, as a share of the row rather than a fixed pixel count.
 *
 * It was a flat 300px, and that is what left the odd sliver of dead space: six
 * fixed cards land wherever 6 x 304 happens to land against the viewport, so the
 * row ended on a partial card of arbitrary width and the amount left over changed
 * with every monitor. Sized in even shares, exactly three cards fill the row at
 * any width — nothing is ever cut mid-card.
 *
 * Fourteen cards, four visible: the arrows always have somewhere to go. */

const cardBasis = (isMobile: boolean) =>
  isMobile
    ? `calc((100% - ${TILE_GAP}px) / 1.6)`
    // FOUR ACROSS, not three. With the configurator off the card and the row
    // at full width there is room for four ~307px cards, which is what every
    // reference shows — MONDAY, Sixpenny and HAY are all four-up at 310-335.
    // The CARD_MIN floor goes with the three-up maths that needed it.
    : `calc((100% - ${3 * TILE_GAP}px) / 4)`;

/** The open card's slot: TWO shares, so the configurator gets a full card's
 * width beside the photograph and needs no scrolling of its own. Every card
 * after it slides along by exactly one share.
 *
 * On mobile the card already takes most of the row, so it goes to the whole of
 * it and the panel stacks under the photograph instead of beside it. */
const cardBasisOpen = (isMobile: boolean) =>
  isMobile ? '100%' : `calc(((100% - ${3 * TILE_GAP}px) / 4) * 2 + ${TILE_GAP}px)`;

/** The tile height the arrows centre on. The card is taller than this — the
 * name block sits under the tile — but the arrows belong on the PHOTOGRAPH, not
 * on the card's own midpoint, which would put them over the type. */
const CARD_H = 470;


/** How long the row rests before advancing itself. Five seconds — ten read as a
 * row that had stopped rather than one that was waiting, since with four of six
 * cards on screen a whole minute could pass without the visitor seeing it move
 * at all. Still slow enough to read a label, a line and a price before it goes. */
const AUTO_MS = 5000;

/** How long a card takes to widen. Shared by the slot transition, the panel's
 * entrance and the scroll nudge that follows both, so the three cannot drift
 * out of step — the nudge in particular has to start AFTER the width has
 * settled, or two layout animations run at once. */
const EXPAND_MS = 450;

/** Round arrow, overlaid on the row's edge and vertically centred.
 *
 * Overlaid rather than parked above the row, because the section's heading band
 * is centred and a pair of arrows ranged right underneath it reads as debris
 * beside the headline. On the row's edges they read as controls belonging to the
 * row. Warm white fill so they hold over any photograph — a hairline-on-
 * transparent arrow disappears against the pale frames here. */
function Arrow({
  direction,
  onClick,
  disabled,
  top,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
  /** Centred on the PHOTOGRAPH rather than on the card. At the card’s own
   * midpoint the arrows land on the configurator panel, reading as controls
   * belonging to it and sitting over its first row of chips. */
  top: number;
}) {
  const { hover, bind } = useHover();
  const active = hover && !disabled;
  return (
    <button
      {...bind}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous ranges' : 'Next ranges'}
      style={{
        position: 'absolute',
        top,
        [direction === 'prev' ? 'left' : 'right']: space.md,
        transform: 'translateY(-50%)',
        zIndex: 2,
        // 52 and radius 2 — the site's one control height and its one radius.
        // It was a 46px circle, which made it the only round object on the page
        // and one of seven radii.
        width: 52,
        height: 52,
        borderRadius: 2,
        // A hairline instead of the drop shadow it carried. §5.5 gives the
        // homepage exactly one elevated object — the visualiser card — so a
        // second shadow here would spend the hierarchy that buys. The border
        // does the job the shadow was actually doing, which was separating a
        // warm-white control from a pale photograph rather than lifting it.
        border: `1px solid ${tokens.line}`,
        background: active ? tokens.gold : tokens.warmWhite,
        color: tokens.ink,
        ...typeScale.body,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        // Fades out rather than vanishing at the ends of the row, so the control
        // stays where the pointer expects it.
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: `${motion.button}, opacity 0.3s ease`,
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// THE CARD — a clean photograph, then the name underneath it.
//
// Built against MONDAY Haircare's range row, which is the reference: seventeen
// products in a horizontal scroller, cards at 315 × 642, and NOTHING on the
// photograph. The name sits below the tile in the display face at heading size,
// with a small caps category above it and one line of meta below.
//
// Two things that buys, and neither is decoration:
//
//   THE PHOTOGRAPH IS NEVER TOUCHED. Nothing is set over it, so it needs no
//     scrim, no text-shadow and no deep gradient — the same lesson the hero
//     just learned. Klay's case is stronger than MONDAY's, because ten of the
//     fourteen tiles carry a line drawing rather than a photograph and type
//     over those was competing with the drawing for the same dark ground.
//
//   THE NAME GETS TO BE BIG. Over a photograph a product name has to stay small
//     enough to sit in a corner and light enough not to fight the picture. Under
//     it, "Frameless Shower Screens" can be set in Cormorant at the card scale
//     and read as the loudest thing on the card, which is what MONDAY's
//     personality actually comes from — type scale, not ornament.
//
// The configurator that used to hang under every tile is gone from the row. It
// made the card 940px tall against MONDAY's 642, which meant three products
// visible instead of four and fourteen simultaneous forms on a browse surface.
// RangeConfigurator.tsx is left in the tree, unused — restoring it is one line.
// ---------------------------------------------------------------------------
function RangeCard({
  item,
  open,
  onToggle,
  isMobile,
}: {
  item: CatalogueItem;
  /** Whether this card's configuration panel is showing. One at a time across
   * the whole row — the carousel owns which. */
  open: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) {
  const { hover, bind } = useHover();
  const [sel, setSel] = useState<Selection>(() => defaultSelection(item));
  const choose = (fieldId: string, choiceId: string) =>
    setSel(s => ({ ...s, [fieldId]: choiceId }));

  // The chosen variant or colour, read back so the card can SHOW the selection
  // rather than only hold it. A colour card where one exists, otherwise the
  // product's own variant — Blockout / Light filter for a roman, Aluminium /
  // Timber / Faux for a venetian.
  const fields = fieldsFor(item);
  const leadField = fields.find(f => f.kind === 'swatches') ?? fields.find(f => f.id === 'variant');
  const chosen = leadField?.choices.find(c => c.id === sel[leadField.id]);
  // THE FABRIC COLOUR BECOMES THE TILE'S GROUND on the ten products with no
  // photograph. It still works — better, in fact — now the controls sit in a
  // panel BESIDE the card rather than under it: the card stays in view while
  // you configure, so choosing Forest Green visibly repaints the tile next to
  // the swatch you just clicked. Above 0.45 luminance the drawing flips to ink,
  // because a warm-white mechanism on a cream fabric is invisible.
  const tileGround = !item.image && chosen?.hex ? chosen.hex : undefined;
  const glyphOnLight = tileGround ? luminance(tileGround) > 0.45 : false;

  return (
    // TWO COLUMNS WHEN OPEN, one when shut. The card itself widens — see the
    // note on the scroller item — and the configurator takes the width that
    // appears, at exactly the card's own height. Nothing overlays anything and
    // nothing scrolls inside.
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'stretch',
        gap: open ? TILE_GAP : 0,
        height: '100%',
      }}
    >
      {/* The card proper. It keeps its own width while the wrapper grows, so the
          photograph never stretches — the extra width goes entirely to the panel
          beside it. */}
      <div
        style={{
          flex: isMobile ? '0 0 auto' : `0 0 ${open ? `calc(50% - ${TILE_GAP / 2}px)` : '100%'}`,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Only the picture and the name are inside the link. The button below
          and the panel beside carry real buttons, and a <button> nested inside
          an <a> is invalid and swallows its own clicks. */}
      <Link
        {...bind}
        to={item.to}
        style={{ display: 'block', textDecoration: 'none', flex: '0 0 auto' }}
      >
      {/* The tile carries its own ground, one step off the section's. On the ten
          photoless products it is what stops the card reading as a hole punched
          in the page; on the four photographed ones it is the mount the picture
          sits in. MONDAY does the same — its tiles are a shade off the page
          white, which is what makes the row read as a set of objects rather than
          as pictures floating on a background. */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          // 4:5 — the site's one portrait ratio, shared with the install strip
          // and the About panel.
          aspectRatio: '4 / 5',
          background: tileGround ?? (item.image ? tokens.parchment : tokens.charcoal),
          // NO TRANSITION on the ground. It faded over 0.45s, which repaints a
          // 317x396 box every frame for the whole of that — and it fired at the
          // same moment the row was animating flex-basis, so two expensive
          // animations overlapped. The colour change is legible instantly; it
          // was the fade that cost, not the swap.
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
          <div
            style={{
              position: 'absolute',
              inset: space.md,
              border: `1px solid ${
                hover ? tokens.goldLine : glyphOnLight ? tokens.line : tokens.onDarkLine
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.3s ease',
            }}
          >
            <ProductGlyph
              type={item.glyph ?? ''}
              size={140}
              color={glyphOnLight ? tokens.ink : tokens.warmWhite}
              ground={tileGround ?? tokens.charcoal}
              opacity={hover ? 0.75 : 0.6}
            />
          </div>
        )}
      </div>

      {/* Small caps category, big name, one line of meta — MONDAY's stack
          exactly, in Klay's faces. */}
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: tokens.inkSoft,
          marginTop: space.md,
        }}
      >
        {item.group}
      </div>

      <h3
        style={{
          ...typeScale.card,
          color: hover ? tokens.goldText : tokens.ink,
          marginTop: space.xs,
          transition: 'color 0.25s ease',
        }}
      >
        {item.name}
        {/* THE SELECTION IS IN THE NAME. Article writes the chosen colourway
            into the product title — "Sven 88in Tufted Leather Sofa - Charme
            Tan" — so the card states what you have specified rather than only
            showing you the control that specified it. */}
        {chosen && <span style={{ color: tokens.inkSoft }}> — {chosen.label}</span>}
      </h3>

        {/* No price here. The panel prices the actual configuration, and a
            from-figure on the card would be a second, vaguer number twenty
            pixels above a real one. */}
      </Link>

      {/* THE ONE ACTION. Gold, full width, and it does not navigate — it opens
          the configuration panel beside this card. */}
      <button
        onClick={onToggle}
        style={{
          marginTop: space.md,
          width: '100%',
          height: 52,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          border: 'none',
          cursor: 'pointer',
          background: open || hover ? tokens.goldLight : tokens.gold,
          color: tokens.ink,
          ...typeScale.label,
          lineHeight: 1,
          transition: motion.button,
        }}
      >
        {open ? 'Close' : 'Shop Now'}
      </button>
      </div>

      {/* THE PANEL — in the flow, in the space the row just made.
          It is a flex sibling rather than an overlay, so it covers nothing and
          the neighbouring cards genuinely move aside instead of being hidden
          behind it. Fading and sliding in over 0.45s rather than appearing:
          without that the width animation finishes and the contents pop, which
          reads as two events instead of one. */}
      {open && (
        <div
          style={{
            flex: isMobile ? '1 1 auto' : `0 0 calc(50% - ${TILE_GAP / 2}px)`,
            minWidth: 0,
            marginTop: isMobile ? TILE_GAP : 0,
            display: 'flex',
            flexDirection: 'column',
            background: tokens.cream,
            border: `1px solid ${tokens.line}`,
            borderRadius: 2,
            overflow: 'hidden',
            animation: 'klay-panel-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/* Names what is being configured, and carries the close. The gold
              button on the card says Close as well — two ways out, because the
              X is where a pointer goes and the button is where the click that
              opened it already was. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: space.sm,
              padding: `${space.md}px ${space.md}px 0`,
            }}
          >
            <h4 style={{ ...typeScale.card, color: tokens.ink }}>{item.name}</h4>
            <button
              onClick={onToggle}
              aria-label="Close"
              style={{
                flexShrink: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: space.xxs,
                lineHeight: 1,
                fontSize: 16,
                color: tokens.inkSoft,
              }}
            >
              ✕
            </button>
          </div>
          <RangeConfigurator item={item} sel={sel} onChange={choose} fill />
        </div>
      )}
    </div>
  );
}

export function RangeCarousel() {
  const isMobile = useIsMobile();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [paused, setPaused] = useState(false);
  /** Set the first time anyone touches a control in any card configurator, and
   * never cleared. Hover already pauses the drift, but hover does not exist on
   * a touch screen — and carrying a card off the edge while someone is halfway
   * through choosing a fabric is worse than a row that never moves. */
  const [frozen, setFrozen] = useState(false);
  /** Which card has its configuration panel open. One at a time — the whole
   * point of moving the controls off the card is that the visitor reads one set
   * of options rather than fourteen. */
  const [openId, setOpenId] = useState<string | null>(null);

  /** BRING THE EXPANDED CARD FULLY INTO VIEW. Opening the rightmost visible
   * card doubles its width, which measured put its right edge at 1681 against a
   * row ending at 1360 — the panel simply fell off the end. The row nudges
   * itself along by however much is overhanging, and by nothing at all when the
   * card already fits.
   *
   * Waits a frame: the flex-basis is still the closed width on the tick the
   * state changes, so measuring immediately reads the old geometry. */
  useEffect(() => {
    if (!openId) return;
    // AFTER the width transition, not during it. Both a smooth scroll and a
    // flex-basis transition force layout on every frame, and running them
    // together was the jank: profiled at 4x CPU throttle the overlap produced
    // frames of 91ms, 49ms and 242ms clustered in the first 300ms. Sequenced,
    // each is a cheap animation on its own.
    //
    // It costs nothing in feel, because the card is already visibly expanding
    // during those 450ms — the nudge only tidies the case where the expanded
    // card would overhang the row's right edge.
    const timer = window.setTimeout(() => {
      const row = scrollerRef.current;
      const slot = row?.querySelector<HTMLElement>(`[data-slot="${openId}"]`);
      if (!row || !slot) return;
      // MEASURE AGAINST THE TARGET WIDTH, not the current one. The flex-basis is
      // mid-transition on the frame after the state change — reading
      // offsetWidth here gives a card partway between one share and two, and
      // the nudge lands short. Measured that way the rightmost card still
      // overhung by 241px.
      //
      // The target is two shares plus the gap between them, and a closed
      // sibling is the honest source for one share: it is the same calc() the
      // slot itself uses, already resolved by the browser.
      const closed = Array.from(row.children).find(c => c !== slot) as HTMLElement | undefined;
      const target = closed ? closed.offsetWidth * 2 + TILE_GAP : slot.offsetWidth;
      const over = slot.offsetLeft + target - (row.scrollLeft + row.clientWidth);
      if (over > 0) row.scrollTo({ left: row.scrollLeft + over, behavior: 'smooth' });
    }, EXPAND_MS);
    return () => window.clearTimeout(timer);
  }, [openId]);

  // Escape closes the panel. A pop-out that can only be dismissed by finding
  // its own X is a pop-out people feel trapped by.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);
  // Read once. A row that advances itself is exactly what this preference exists
  // to stop; under it the row holds still and becomes one the reader scrolls.
  const [reduceMotion] = useState(prefersReducedMotion);

  /** One card plus its strip. Measured off the rendered row rather than computed
   * from a constant, because the cards are sized in percentages now — the arrows
   * have to move by whatever a quarter of THIS viewport turned out to be. */
  const step = () => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | undefined;
    return first ? first.offsetWidth + TILE_GAP : 0;
  };

  /** Which arrows are live. Read off real scroll position rather than tracked in
   * state, so a touch swipe or a trackpad scroll updates them too — this row is
   * natively scrollable and the arrows are not its only control. */
  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    // 2px of slack: scrollWidth and clientWidth are fractional at some zoom
    // levels and an exact comparison never becomes true, which would leave the
    // next arrow live at the end of the row forever.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  const scrollByCards = (n: number) => {
    scrollerRef.current?.scrollBy({ left: n * step(), behavior: 'smooth' });
  };

  useEffect(syncEdges, [syncEdges]);

  // The row moves on its own when it is left alone. It pauses under the pointer,
  // and on reaching the end it returns to the start rather than stopping — a
  // carousel that quietly dies after one pass looks broken rather than finished.
  useEffect(() => {
    if (reduceMotion || paused || frozen) return;
    const tick = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step(), behavior: 'smooth' });
      }
    }, AUTO_MS);
    return () => window.clearInterval(tick);
  }, [paused, frozen, reduceMotion]);

  return (
    // Warm white, the ground the category grid had — and the strip between the
    // cards is this colour showing through. See TILE_GAP.
    <section style={{ background: tokens.warmWhite }}>
      {/* Compact. This is the first section under the hero, so every pixel the
          band takes is a pixel of product pushed below the fold — which defeats
          the point of moving the range up here in the first place. Same type as
          every other band on the page, so the page still speaks in one voice;
          only the air around it is tighter. */}
      {/* THE HEADER IS RANGED LEFT WITH THE ACTION OPPOSITE, which is the other
          half of what MONDAY's range section is doing. Their heading sits hard
          left at display scale, the supporting line under it, and "Where To Buy"
          alone on the right of the same band.
          Centred — which this was, through SectionBand — is the safe
          arrangement and it reads as a caption above a row. Ranged left with
          something opposite it uses the full width and reads as a section
          heading with a decision attached. */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: space.lg,
          maxWidth: layout.gridMax,
          margin: '0 auto',
          padding: isMobile
            ? `${space.xl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`
            : `${space.xxl}px ${layout.inlinePad(isMobile)}px ${space.lg}px`,
        }}
      >
        <div>
          <p style={{ ...eyebrow, marginBottom: space.md }}>The collection</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>Our Range</h2>
          <p style={{ ...supporting.onLight, marginTop: space.md, maxWidth: 460 }}>
            Made to measure. Installed by experts.
          </p>
        </div>
        <CtaLink to="/products" variant="onDark">
          Shop All
        </CtaLink>
      </div>

      {/* The same strip down the outside edges as between the cards, so the row
          is framed on all four sides by warm white rather than running off into
          the viewport on the left and right. Grid gap and flex gap both only
          apply BETWEEN items, so the outer two have to be padding — and putting
          it here rather than on the scroller matters: padding on a scroll
          container sits at the start and end of the scrollable CONTENT, so it
          would slide away with the row instead of holding the edges. */}
      {/* paddingBottom closes the section. Without it the last row of Shop Now
          chips sat hard against the charcoal band below, so the row read as
          having been cut off rather than as having ended — the strips frame it on
          three sides and the fourth was the next section.

          Deliberately thin, and it was 64. That is a section's worth of air: it
          separated the row from the banner below instead of finishing it, leaving
          a band of empty warm white doing nothing between two things that both
          want attention. This is a margin closing a section, not a gap between
          two — closer in weight to the 4px strips framing the other three sides
          than to the padding a real section carries. */}
      {/* THE SAME CONTAINER AS THE HEADER ABOVE IT, so the first card's left
          edge lands on the same vertical line as "Our Range". It ran edge to
          edge, which put the heading 80px in and the row at 0 — two different
          left margins in one section, and the first card cut by the viewport.
          Aligning them is most of what makes the section read as composed
          rather than assembled. */}
      <div
        style={{
          position: 'relative',
          width: ROW_WIDTH,
          maxWidth: layout.gridMax,
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: layout.inlinePad(isMobile),
          paddingRight: layout.inlinePad(isMobile),
          paddingBottom: space.md,
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Arrows are hidden on mobile: the row is natively scrollable, a thumb
            is a better control than a 46px target, and two buttons floating over
            a 232px card cover most of it. */}
        {!isMobile && (
          <>
            <Arrow direction="prev" onClick={() => scrollByCards(-1)} disabled={atStart} top={CARD_H / 2} />
            <Arrow direction="next" onClick={() => scrollByCards(1)} disabled={atEnd} top={CARD_H / 2} />
          </>
        )}

        <div
          ref={scrollerRef}
          onScroll={syncEdges}
          className="klay-hscroll"
          style={{
            display: 'flex',
            gap: TILE_GAP,
            overflowX: 'auto',
            // Snaps to card edges so the row never rests showing two half cards,
            // however it was moved — arrow, thumb or trackpad.
            // Off while a card is open — see the note on the slot below.
            scrollSnapType: openId ? 'none' : 'x mandatory',
          }}
        >
          {CATALOGUE.map(item => {
            const open = openId === item.id;
            return (
            <div
              key={item.id}
              // THE ANIMATION IS THE LAYOUT. Opening a card widens its slot
              // from one share to two, and because these are flex siblings in
              // a row every card after it slides along by exactly that much —
              // no card is covered and no space is wasted. Transitioning
              // flex-basis is what makes the row move rather than jump.
              data-slot={item.id}
              // CONTAINMENT. The flex-basis transition changes this box every
              // frame, and without a containment boundary the browser has to
              // consider the whole row's subtree each time.  tells
              // it nothing inside affects anything outside, so the per-frame
              // work is scoped to one card. Measured: 432 style recalculations
              // for a single card opening before this.
              className="klay-slot"
              style={{
                flex: `0 0 ${open ? cardBasisOpen(isMobile) : cardBasis(isMobile)}`,
                // SNAP OFF WHILE OPEN. Mandatory snapping and a programmatic
                // scroll fight each other — the browser re-snaps to the nearest
                // card edge and undoes the nudge that was bringing the open card
                // into view. It comes back the moment the panel closes.
                scrollSnapAlign: open ? 'none' : 'start',
                transition: `flex-basis ${EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              <RangeCard
                item={item}
                open={open}
                isMobile={isMobile}
                onToggle={() =>
                  setOpenId(cur => {
                    const next = cur === item.id ? null : item.id;
                    // Opening a panel stops the row for good. Carrying a card
                    // off the edge mid-configuration is the one thing that would
                    // make this unusable, and hover does not exist on touch.
                    if (next) setFrozen(true);
                    return next;
                  })
                }
              />
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
