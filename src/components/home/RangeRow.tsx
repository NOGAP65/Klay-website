// ---------------------------------------------------------------------------
// 4. Our Range — FOUR HERO PRODUCTS IN ONE ROW.
//
// WHAT THIS REPLACED, AND WHY. This section was a horizontal scroller holding
// all fourteen catalogue items, four visible at a time, advancing itself every
// five seconds. Measured in the running page, that arrangement showed Roller,
// Roman, Honeycomb and Venetian Blinds — four cards, all captioned INDOOR, all
// carrying the same gold SHOP NOW, all a beige-grey rectangle over a window.
// Venetian is the one product in the catalogue with no photograph, so a line
// drawing on charcoal was sitting in the shopfront too.
//
// So the shopfront of a business that also sells curtains, plantation shutters,
// wardrobes, shelving, awnings, zip guides, roller shutters, flyscreens and
// shower screens read as "we sell four kinds of blind". The other ten products
// were real and were entirely off-screen. That version paid the whole cost of
// showing everything — a scroller, arrows, autoplay, a reserved 560px open
// height, two files of geometry — and delivered the informational value of four
// cards, which were the four that made the range look narrowest.
//
// FOUR HERO PRODUCTS, AND ONE PER PART OF THE BUSINESS: a roller blind, a
// curtain, a wardrobe, a folding arm awning. Indoor hard furnishing, indoor soft
// furnishing, joinery, outdoor. Four is the number that fits one row at the
// width the references use — MONDAY, Sixpenny and HAY are all four-up between
// 310 and 335 — so there are no arrows, no autoplay and nothing off-screen, and
// the row is a row rather than a window onto a longer one.
//
// THIS SECTION SELLS FOUR THINGS. It is not the catalogue and it is not trying
// to be. The other ten products have their own section further down the page —
// see FullRange, which lists them as a compact strip of small tiles with no
// buttons on them. Splitting the two apart is what lets each do one job: this
// row is four products with the configurator on them, that strip is a directory.
// One section trying to be both is what produced every previous version of this.
//
// A SIX-UP GRID CAME BEFORE THIS and did not survive. It showed the whole shape
// of the range in one glance, which was the right instinct, but at three columns
// of a 1440 viewport the cards came out 416px wide and the section came out
// 1,649px tall — the largest on the page, and a third bigger than any card the
// references use. Four in a row is 317px cards and about half the height, and
// the breadth it gives up is what the strip below recovers.
//
// THIS IS THE KOOKAI MOVE AT KLAY'S GRAIN, and the reason it is not the MONDAY
// move is catalogue size. MONDAY has about six SKUs in total, so its range row
// IS its catalogue and showing everything costs it nothing. Kookai has hundreds
// and never puts the catalogue on the homepage — one level of category, and the
// range lives behind the shop. Neither of them shows a SLICE of a large
// catalogue, because a slice neither informs nor converts. Fourteen products is
// too many to comprehend in one pass and few enough that a shop page handles
// them, which puts Klay on Kookai's side of the line.
//
// WHAT WAS NOT THE PROBLEM: the count. Earlier versions of this section showed
// three or four tiles and read as narrow, and the note on the old carousel
// concluded that a grid "always drops products". It was the wrong diagnosis.
// Those versions read as narrow because every tile was a blind, not because
// there were few tiles. Four chosen to SPAN the business reads wider than
// fourteen ordered by group, because the visible frame is what the customer
// counts — and this time the rest of the range is named on the same page rather
// than left behind an arrow.
//
// THE CARD IS UNCHANGED — photograph, small-caps group, big name, one gold
// action, and the configurator on the card. It is still MONDAY's stack in
// Klay's faces: nothing is set over the photograph, so it needs no scrim, and
// the name gets to be big because it is under the picture rather than on it.
// What changed is where the configurator goes when it opens; see THE DRAWER.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { radius, tokens, motion, shadow, space, supporting, eyebrow, headline, layout, type as typeScale } from '../../theme';
import { useIsMobile, useMediaQuery } from '../../hooks/useIsMobile';
// The cards read data/catalogue.ts — the same fourteen products the shop lists,
// rendered by the same tile. Four of them, named below; nothing about the range
// is written down in this file.
import { CATALOGUE, type CatalogueItem } from '../../data/catalogue';
import { CtaLink, TILE_GAP, useHover } from './primitives';
import { ProductGlyph } from '../ProductGlyph';
import { RangeConfigurator } from './RangeConfigurator';
import { defaultSelection, fieldsFor, type Selection } from '../../data/configOptions';

/** THE FOUR, AND THE ONE RULE THAT DECIDES THEM: no two may be the same kind of
 * object. A roller blind stands for every blind, a curtain for every soft
 * furnishing, and the last two are the parts of the business a row of blinds
 * cannot say out loud — joinery, and outdoor.
 *
 * Plantation Shutters is the one that lost its place going from six to four, and
 * it is the right one to lose: it is a second indoor hard furnishing, so it is
 * the only card here whose job another card was already doing. It leads the
 * strip below instead.
 *
 * IDs rather than a hand-written list of names, so this cannot drift out of step
 * with the catalogue: change a product's name or its photograph in one place and
 * this section follows. An id that stops existing drops out rather than throwing.
 *
 * EXPORTED, because FullRange lists everything that is NOT in here — the two
 * sections partition the catalogue between them rather than each carrying its own
 * copy of the split, so a product promoted to the row leaves the strip on the
 * same edit. */
export const HERO_IDS = [
  'roller-blinds',
  'curtains',
  'wardrobes',
  'folding-arm-awnings',
];

const RANGE: CatalogueItem[] = HERO_IDS.map(id => CATALOGUE.find(i => i.id === id)).filter(
  (i): i is CatalogueItem => Boolean(i),
);

/** Relative luminance, for deciding whether the mechanism drawing goes on in
 * warm white or in ink. Only reached if one of the four loses its photograph —
 * see the note on the glyph fallback. */
const luminance = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** How long the drawer takes to open, and the same number the card waits before
 * unmounting it on the way out — so the close is the open in reverse rather than
 * the panel vanishing and the card then collapsing behind it. */
const EXPAND_MS = 450;

/** How far the gold frame stands off the selected card.
 *
 * The frame keeps its size and the card insets inside it, which puts a band of
 * the section's own ground between the gold line and the photograph — that is
 * what makes it read as a frame around the card rather than a stroke on the
 * card's edge. 4, the smallest step on the scale, and also exactly the strip
 * between two cards, so the air inside the frame matches the air between frames.
 *
 * The frame is an OVERLAY, not a border, and that is not a style preference: a
 * real border adds two pixels to the card's width, the tile is 4:5, and two
 * pixels of width become two and a half of height — every card in the row and
 * every section below it would move. */
const FRAME = space.xxs;

/** FOUR ACROSS ONLY ABOVE THIS. Below it the row drops to two, and the number
 * comes from the card rather than from a device: four-up at a 900px viewport
 * would measure a 182px tile, which is half the smallest card any reference
 * uses. Two-up at the same viewport gives 368px, which is inside the reference
 * band, so the row becomes two rows of two rather than four cramped columns.
 *
 * It is deliberately NOT the site's 768px mobile breakpoint. That one decides
 * whether the header stacks and whether the name drops to 20px; this one decides
 * how many columns the four sit in, and the two questions have different answers
 * between 769 and 999. */
const FOUR_UP = '(min-width: 1000px)';

// ---------------------------------------------------------------------------
// THE CARD.
//
// THE DRAWER — what changed when the row became a grid. In the scroller the
// configurator opened SIDEWAYS: the slot widened from one share to two and every
// card after it slid along, which is available in a row and is not available in
// a grid. Spanning two columns of three would push the third card of that row
// onto the next line and reshuffle everything after it — a far bigger movement
// than the sideways slide it replaced.
//
// So it opens DOWNWARDS, inside the card, under the gold button. Three things
// fall out of that, all of them good:
//
//   NOTHING MOVES SIDEWAYS. The two cards beside the open one keep their place
//     and their size; `align-items: start` on the grid stops them stretching to
//     match. Only the rows below shift down, which is what an accordion does and
//     what a visitor who just clicked expects.
//
//   THE PANEL GETS MORE WIDTH, NOT LESS. A card was ~307px in the four-up row
//     and the open panel took a second share beside it. Three-up it is the card's
//     own full width, which is wider — so the chip rows the panel was designed
//     for fit, and the whole two-shares-or-three business the scroller needed to
//     stop the panel wrapping and leaping is gone.
//
//   IT SIZES TO ITS CONTENT. The old panel was pinned to the photograph's height
//     so every card in the row could stay level, which meant a wardrobe asking
//     one question carried a roller's worth of slack and the roller scrolled
//     inside its own panel. Nothing needs to stay level in a grid whose rows size
//     themselves, so the panel is as tall as its questions and no taller.
//
// The height is animated by interpolating grid-template-rows from 0fr to 1fr,
// which is the one way to animate to an intrinsic height without measuring it in
// JS. Where it is not supported the drawer simply appears, which is a fine
// degrade. Under prefers-reduced-motion the global rule in index.html kills the
// transition and it appears instantly, which is the correct behaviour and needs
// no JS here.
//
// THE CONTENT MOUNTS BEFORE THE ANIMATION STARTS, one frame earlier — see the
// note on `expanded` in the section component. React mounting up to five fields,
// their chips and a seventeen-swatch colour row is real work, and the old
// scroller profiled it at 139ms when it landed on the same frame as a layout
// animation. A height transition cannot animate against an empty box the way a
// width transition could, so instead of deferring the mount we defer the
// animation by a frame and the two no longer share one.
// ---------------------------------------------------------------------------
function RangeCard({
  item,
  open,
  expanded,
  onToggle,
  isMobile,
}: {
  item: CatalogueItem;
  /** Whether this card's drawer is mounted. One at a time across the whole
   * section — the point of the drawer is that the visitor reads one set of
   * options rather than four. */
  open: boolean;
  /** Whether the drawer is at full height. Lags `open` by one frame on the way
   * in and leads it by EXPAND_MS on the way out. */
  expanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) {
  const { hover, bind } = useHover();
  const [sel, setSel] = useState<Selection>(() => defaultSelection(item));
  const choose = (fieldId: string, choiceId: string) =>
    setSel(s => ({ ...s, [fieldId]: choiceId }));

  // The chosen colour, read back so the tile can take it as its ground.
  const fields = fieldsFor(item);
  const leadField = fields.find(f => f.kind === 'swatches') ?? fields.find(f => f.id === 'variant');
  const chosen = leadField?.choices.find(c => c.id === sel[leadField.id]);
  // THE GLYPH FALLBACK, and all four of the current selection have photographs so
  // none of this is reached. It stays because the four are chosen by id above: if
  // one is swapped for a product with no photograph, the tile takes the chosen
  // fabric colour as its ground and draws the mechanism on it, rather than being
  // a charcoal hole in the page. Above 0.45 luminance the drawing flips to ink,
  // because a warm-white mechanism on a cream fabric is invisible.
  const tileGround = !item.image && chosen?.hex ? chosen.hex : undefined;
  const glyphOnLight = tileGround ? luminance(tileGround) > 0.45 : false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        // For the gold frame, which is an overlay — see FRAME.
        position: 'relative',
        // THE STANDOFF. The frame is drawn on this box's outer edge and the
        // contents sit in from it, so the gold line never touches the
        // photograph or the gold buttons.
        padding: FRAME,
        boxSizing: 'border-box',
      }}
    >
      {/* THE GOLD FRAME, ON THE OPEN CARD ONLY. Nothing carries it while the
          grid is just being browsed; opening one with Shop Now draws it, and it
          encloses the card and its drawer together because this wrapper IS that
          combined shape. So it grows with the drawer rather than being a second
          thing that has to be animated in step with it.

          Keyed on `open` rather than `expanded`, which is what keeps it through
          the collapse: `expanded` goes false to START the 450ms close, so a
          frame keyed on it would vanish at full height and leave the card
          shrinking behind nothing. `open` is cleared when the drawer unmounts,
          which is exactly when the frame has nothing left to enclose.

          Painted last and pointer-transparent, so it sits over the photograph
          and the chips without taking a single click off them. */}
      {open && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            border: `1px solid ${tokens.line}`,
            borderRadius: radius.md,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {/* Only the picture and the name are inside the link. The button below and
          the drawer beneath carry real buttons, and a <button> nested inside an
          <a> is invalid and swallows its own clicks. */}
      <Link
        {...bind}
        to={item.to}
        style={{ display: 'block', textDecoration: 'none', flex: '0 0 auto' }}
      >
        {/* The tile carries its own ground, one step off the section's — the
            mount the picture sits in. MONDAY does the same, and it is what makes
            the set read as a set of objects rather than pictures floating on a
            background. */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: radius.lg,
            // 4:5 — the site's one portrait ratio, shared with the install strip
            // and the About panel.
            aspectRatio: '4 / 5',
            background: tileGround ?? (item.image ? tokens.parchment : tokens.charcoal),
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
            <div
              style={{
                position: 'absolute',
                inset: space.md,
                border: `1px solid ${
                  hover ? tokens.onDarkEdge : glyphOnLight ? tokens.line : tokens.onDarkLine
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

        {/* Small caps group, big name — MONDAY's stack in Klay's faces.
            THE GROUP LINE EARNS ITS PLACE NOW, and it did not before. Four cards
            all reading INDOOR is four repetitions of one word; across these four
            it runs INDOOR, INDOOR, OTHER, OUTDOOR, which is the section's whole
            argument stated in four words. */}
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
            // SMALLER ON MOBILE, where a card is roughly half a 390px viewport.
            // "Frameless Shower Screens" at the full card scale wraps to three
            // lines in that width and the type becomes the tallest thing on the
            // card; at 20 it takes two and the photograph stays the subject.
            ...(isMobile ? { fontSize: 20 } : null),
            // TWO LINES' WORTH, RESERVED, whether the name needs them or not.
            // The gold buttons are the strongest horizontal line in the section
            // and they have to be ONE line across each row; with the cards
            // sizing to their own content, a single name that wraps drops its
            // button below its neighbours' and the row reads as broken. Two
            // lines is the worst case across the four at every width where the
            // row is two or four columns. It costs one line of empty space
            // under the five names that fit on one, which is cheaper than the
            // stagger and is invisible — it is the same warm white as the card.
            minHeight: `${2 * 1.1 * (isMobile ? 20 : 26)}px`,
            color: tokens.ink,
            marginTop: space.xs,
            transition: 'color 0.25s ease',
          }}
        >
          {/* THE NAME IS THE NAME. No price here — the drawer prices the actual
              configuration, and a from-figure on the card would be a second,
              vaguer number twenty pixels above a real one. */}
          {item.name}
        </h3>
      </Link>

      {/* THE ONE ACTION. Gold, full width, and it does not navigate — it opens
          the drawer under this card. */}
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
          borderRadius: radius.md,
          border: 'none',
          cursor: 'pointer',
          background: open || hover ? tokens.accentHover : tokens.accent,
          color: tokens.onAccent,
          ...typeScale.label,
          lineHeight: 1,
          transition: motion.button,
        }}
      >
        {open ? 'Close' : 'Shop Now'}
      </button>

      {/* THE DRAWER. The outer grid is the animation and holds nothing else; the
          middle box is the clip, and it must carry `min-height: 0` or a grid
          item refuses to go below its content's height and there is nothing to
          animate. See the note above the component. */}
      {open && (
        <div
          style={{
            display: 'grid',
            gridTemplateRows: expanded ? '1fr' : '0fr',
            transition: `grid-template-rows ${EXPAND_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          <div style={{ minHeight: 0, overflow: 'hidden' }}>
            <div
              style={{
                // The same 4px strip that runs between the cards, so the drawer
                // is separated from the button above it by the section's own
                // ground rather than butting against it.
                marginTop: TILE_GAP,
                // Rounded and clipped, because the configurator's action button
                // is square and flush to its edges — the radius has to be on the
                // box that contains it or the gold corners poke out.
                borderRadius: radius.md,
                overflow: 'hidden',
                // Fades with the height rather than after it. The old panel
                // waited for the width to settle because it was mounted late;
                // this one is already mounted, so it can simply arrive with the
                // box it is arriving in.
                opacity: expanded ? 1 : 0,
                transition: `opacity ${EXPAND_MS}ms ease`,
              }}
            >
              <RangeConfigurator item={item} sel={sel} onChange={choose} fill />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RangeRow() {
  const isMobile = useIsMobile();
  const fourUp = useMediaQuery(FOUR_UP);

  /** Which card's drawer is mounted, and whether it is at full height.
   *
   * TWO PIECES OF STATE, where the scroller needed five — openId, closing,
   * ready, framedId and frozen — plus three timers to keep them in order. All of
   * that existed to sequence a width animation against a late mount against a
   * scroll nudge against an autoplay timer. With no scroll and no autoplay the
   * whole machine is: mount, grow, shrink, unmount. */
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  /** GROW ONE FRAME AFTER THE MOUNT, not on the same one.
   *
   * The drawer renders at `0fr` and this is what moves it to `1fr`. It has to be
   * a separate frame: set both at once and the browser sees the element's first
   * computed value as 1fr and has nothing to interpolate from, so the drawer
   * would snap open. Deferring by a frame also keeps React's mount work — up to
   * five fields, their chips and a seventeen-swatch colour row — off the frame
   * the animation starts on. */
  useEffect(() => {
    if (!openId) return;
    const raf = requestAnimationFrame(() => setExpanded(true));
    return () => cancelAnimationFrame(raf);
  }, [openId]);

  /** Closing runs the open in reverse: drop `expanded` so the height animates
   * down, and only unmount once it has arrived. Switching straight from one card
   * to another skips the wait — the visitor has somewhere to be, so making them
   * watch one drawer close before the next opens would be a delay with nothing
   * behind it. */
  const toggle = (id: string) => {
    if (openId !== id) {
      setExpanded(false);
      setOpenId(id);
      return;
    }
    setExpanded(false);
  };

  useEffect(() => {
    if (!openId || expanded) return;
    // Only fires on the way OUT. On the way in `expanded` is false for exactly
    // one frame, and the rAF above wins that race — it is queued before this
    // 450ms timer can come anywhere near firing.
    const t = window.setTimeout(() => setOpenId(null), EXPAND_MS);
    return () => window.clearTimeout(t);
  }, [openId, expanded]);

  // Escape closes it. A panel that can only be dismissed by finding its own
  // control is a panel people feel trapped by.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  /** ONE CONTAINER FOR THE HEADER AND THE GRID, so the first card's left edge
   * lands on the same vertical line as "Our Range" by construction rather than
   * by two paddings that happen to agree. The scroller had the heading 80px in
   * and the row at 0, which is two different left margins in one section. */
  const inner: React.CSSProperties = {
    maxWidth: layout.gridMax,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: layout.inlinePad(isMobile),
    paddingRight: layout.inlinePad(isMobile),
  };

  return (
    // Warm white, and the 4px strip between the cards is this colour showing
    // through. See TILE_GAP.
    <section style={{ background: tokens.warmWhite }}>
      {/* THE HEADER IS RANGED LEFT WITH THE ACTION OPPOSITE, which is the other
          half of what MONDAY's range section does: heading hard left at display
          scale, the supporting line under it, and one link alone on the right of
          the same band. Centred reads as a caption above a row; ranged left with
          something opposite it reads as a section heading with a decision
          attached.

          Compact, because this is the first section under the hero and every
          pixel the band takes is a pixel of product pushed below the fold. */}
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
          <p style={{ ...eyebrow, marginBottom: space.md }}>The collection</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>Our Range</h2>
          <p style={{ ...supporting.onLight, marginTop: space.md, maxWidth: 460 }}>
            Made to measure. Installed by experts.
          </p>
        </div>
        {/* DESKTOP ONLY, HERE. On mobile the header is a column, so Shop All
            landed directly under the supporting line and ABOVE the grid — a
            full-width gold button asking the visitor to leave for the shop
            before they had been shown a single product. It moves below the
            cards, where it means "and there is more", which is what it is for. */}
        {!isMobile && <CtaLink to="/products">Shop All</CtaLink>}
      </div>

      {/* FOUR ACROSS, ONE ROW — and two across below 1000px, where four columns
          would cost the card more than the fourth column is worth. See FOUR_UP.
          Four is the number that comes out even either way, which is half of why
          it is four; the other half is that it fits one row at the width the
          references use.

          `align-items: start` is load-bearing: without it the two cards beside
          an open one stretch to the height of its drawer, and a 4:5 tile handed
          extra height either distorts or leaves the name floating at the bottom
          of a tall box. With it they keep their own height and the drawer grows
          into the space under them. */}
      <div
        style={{
          ...inner,
          display: 'grid',
          gridTemplateColumns: `repeat(${fourUp ? 4 : 2}, 1fr)`,
          gap: TILE_GAP,
          alignItems: 'start',
        }}
      >
        {RANGE.map(item => (
          <RangeCard
            key={item.id}
            item={item}
            open={openId === item.id}
            expanded={openId === item.id && expanded}
            isMobile={isMobile}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>

      {/* Mobile's Shop All, under the four rather than over them. Ranged left
          with the cards, not centred — it is the same object that sits at the
          end of the header row on desktop, so it keeps the same alignment.

          The padding below it closes the section. Deliberately thin: this is a
          margin finishing a section rather than a gap between two, so it is
          closer in weight to the 4px strips framing the cards than to the
          padding a real section carries. */}
      <div style={{ ...inner, paddingTop: isMobile ? space.lg : 0, paddingBottom: space.md }}>
        {isMobile && <CtaLink to="/products">Shop All</CtaLink>}
      </div>
    </section>
  );
}
