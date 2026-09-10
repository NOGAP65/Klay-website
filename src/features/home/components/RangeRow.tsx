// ---------------------------------------------------------------------------
// Bestsellers — four products, two at a time, on the shop's own card.
//
// IT DREW ITS OWN CARD FOR A LONG TIME, and that is what changed here. The
// homepage had a bespoke tile — a photograph, a name block, a lead swatch row,
// and a configuration panel that animated out of the side of it — while the
// shop had ShopCard. Two cards for one product, maintained apart, and they did
// not stay level: the shop's card grew traced photo layers that dye the cloth in
// the browser, a location row, dependent dimensions, a price on measure and a
// working Add to cart, and the homepage's did not. The same roller blind looked
// like two different products two sections apart, and the homepage's was the
// worse of the two by a widening margin.
//
// So Bestsellers renders ShopCard. Not a copy of it — the component itself, out
// of the catalogue barrel. There is one product card on this site now, and a
// change to it lands in both places by construction.
//
// WHAT WENT WITH THE OLD TILE: the expand-on-click panel, the flex-basis
// animation that widened a slot from one share to two, the scroll nudge that
// brought the widened card back into view, the snap suppression that had to lag
// the close, the spotlight dimming of the other three, the framed-id that
// trailed the width transition, and the reserved row height that stopped the
// section below moving. Every one of those existed to make a card grow sideways
// inside a scroller. Nothing grows now — two full cards are simply on screen —
// and none of that machinery has anything to hold up.
//
// TWO AT A TIME, WITH ARROWS. A ShopCard is a photograph beside a column of
// questions and it wants about 480px to be either of those things; four across
// a 1280px band would give each 313 and neither half would work. Two is what
// the card's own COLUMN_MIN allows, and the rest are one press away.
//
// IT MOVES ONE CARD, NOT TWO, AND IT SLIDES. This began as a pager: two cards
// swapped for the other two, instantly. Stepping by one is the better control
// for four products — it gives three views rather than two, every adjacent pair
// gets seen, and the card that stays put is what tells the eye the row moved
// rather than the page changing under it. That only reads if it is animated: a
// swap where one of the two happens to be identical is indistinguishable from a
// stutter.
//
// SO IT IS A TRACK, NOT A SLICE. All four cards are always rendered in one row
// and the row is translated; the wrapper clips. Nothing mounts or unmounts on a
// press, which is also why the transition can be a plain transform — the
// cheapest thing a browser animates, and no layout is touched by it.
//
// THE STEP IS COMPUTED, NOT MEASURED. One card plus one gap, in a calc against
// the track's own width, so the slide stays exact at every viewport instead of
// depending on a pixel read that is wrong for a frame after any resize.
// ---------------------------------------------------------------------------

import { useState } from 'react';

import * as routes from '@/config/routes';

import { radius, tokens, motion, space, supporting, eyebrow, headline, layout, CtaLink, useHover } from '@/ds';
import { CATALOGUE, ShopCard, defaultSelection, withChoice, type CatalogueItem, type Selection } from '@/features/catalogue';
import { useIsMobile } from '@/shared';

/** THE FOUR, AND THE ONE RULE THAT DECIDES THEM: no two may be the same kind of
 * object. A roller blind stands for every blind, a curtain for every soft
 * furnishing, and the last two are the parts of the business a row of blinds
 * cannot say out loud — joinery, and outdoor.
 *
 * Plantation Shutters is the one that lost its place going from six to four, and
 * it is the right one to lose: it is a second indoor hard furnishing, so it is
 * the only card here whose job another card was already doing. It leads the shop
 * instead.
 *
 * THE ORDER IS THE PAIRING NOW. At four across it did not matter; at two a page
 * the sequence decides what sits beside what, so the rule above is extended one
 * step — blinds with wardrobes, then curtains with the screens, so neither page
 * is two of the same kind of thing. Curtains moved past wardrobes to do it.
 *
 * IDs rather than a hand-written list of names, so this cannot drift out of step
 * with the catalogue: change a product's name or its photograph in one place and
 * this section follows. An id that stops existing drops out rather than throwing. */
const HERO_IDS = [
  'roller-blinds',
  'wardrobes',
  'curtains',
  // ZIP SCREENS RATHER THAN THE AWNING, and the rule above is untouched by the
  // swap: both are the outdoor card, so the row still holds no two of the same
  // kind of object. It is the business's call about which one leads outdoor.
  'zip-guide-systems',
];

const RANGE: CatalogueItem[] = HERO_IDS.map(id => CATALOGUE.find(i => i.id === id)).filter(
  (i): i is CatalogueItem => Boolean(i),
);

/** How many cards a page holds. Two on a desktop, one on a phone.
 *
 * Not a style choice either way — it is what ShopCard needs. Its own COLUMN_MIN
 * is 480, being a photograph beside a column of chips, and below the phone
 * breakpoint the card stacks those two halves and takes the full width on its
 * own. One per page there is the same decision as two here. */
const perPage = (isMobile: boolean) => (isMobile ? 1 : 2);

/** The pager button, and the gap it keeps from the cards.
 *
 * Together they have to fit inside the page's own margin — `layout.inlinePad`
 * is 80 on a desktop and these come to 56, which is what lets the arrows sit
 * OUTSIDE the content edge rather than inside it. See where they are placed. */
const PAGER_SIZE = 40;
const PAGER_GAP = 16;

/** The gap between two cards on the track, and the same number the step is
 * built from — held once because the two cannot disagree without the slide
 * landing a gap out. */
const CARD_GAP = 16;

/** How long one card's travel takes.
 *
 * Long enough to be seen as travel rather than as a cut, short enough that a
 * second press does not feel queued. The easing is the same
 * cubic-bezier(0.22, 1, 0.36, 1) the range card's own expansion used — it
 * arrives quickly and settles, which is what stops a slide reading as a drag. */
const SLIDE_MS = 460;

/** A chevron, drawn here rather than imported — the same reason the rest of the
 * site draws its own marks. Points whichever way it is told. */
function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d={direction === 'left' ? 'M7.5 1L1.5 8l6 7' : 'M1.5 1l6 7-6 7'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One of the two arrows.
 *
 * IT DIMS AT THE END OF THE TRACK RATHER THAN VANISHING, which is the same call
 * the quantity stepper in RangeConfigurator makes and for the same reason: a
 * control that disappears at one end is a control the customer has to
 * rediscover at the other. It used to wrap instead, which suited a two-page
 * pager and does not suit a track — cycling from the last card back to the
 * first is a slide the whole width of the row, and the one thing this animation
 * is for is showing that the row moved by ONE. */
function Pager({
  direction,
  onPress,
  label,
  disabled,
  style,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
  label: string;
  disabled: boolean;
  /** Where to put it. Flanking, the two are lifted out of flow into the page's
   * own margins — see the note where they are placed. */
  style?: React.CSSProperties;
}) {
  const { isHovered, bind } = useHover();
  const lit = isHovered && !disabled;
  return (
    <button
      {...bind}
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={label}
      style={{
        flex: '0 0 auto',
        width: PAGER_SIZE,
        height: PAGER_SIZE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        padding: 0,
        borderRadius: radius.md,
        border: `1px solid ${lit ? tokens.lineStrong : tokens.line}`,
        background: lit ? tokens.band : 'transparent',
        color: disabled ? tokens.inkFaint : tokens.ink,
        cursor: disabled ? 'default' : 'pointer',
        transition: motion.button,
        ...style,
      }}
    >
      <Chevron direction={direction} />
    </button>
  );
}

export function RangeRow() {
  const isMobile = useIsMobile();
  const visible = perPage(isMobile);

  /** THE LEFTMOST CARD ON SCREEN, counted in cards.
   *
   * The furthest it can go is however many cards do not fit — four with two
   * visible gives three positions, 0 to 2. It was a page number when the arrows
   * moved two at a time; counting cards is what lets them move one.
   *
   * CLAMPED ON READ, not on write, because `visible` changes underneath it: a
   * phone rotated to a tablet goes from four positions to three, and an index
   * of 3 held from the narrow layout would slide the track a card past the end
   * of itself. */
  const [wanted, setWanted] = useState(0);
  const lastIndex = Math.max(0, RANGE.length - visible);
  const index = Math.min(wanted, lastIndex);
  const step = (by: number) => setWanted(Math.min(Math.max(index + by, 0), lastIndex));

  /** EVERY CARD'S SELECTION, KEPT BY ID — the same shape the shop page holds.
   *
   * Lifted out of the cards because paging unmounts the two that leave, and a
   * configuration that evaporates when the customer looks at the other pair is
   * one they have to make twice. Keyed by product so the pairs cannot inherit
   * each other's answers, and sparse: a product gets an entry the first time it
   * is touched and defaultSelection fills in for the rest. */
  const [sel, setSel] = useState<Record<string, Selection>>({});

  /** ONE CARD'S TRAVEL, as a CSS length against the track's own width.
   *
   * A card is its share of the visible band less the gaps between the shares;
   * a step is that plus one gap. Written as a calc rather than a measurement so
   * it stays exact through a resize — percentages in a translate resolve
   * against the element's own border box, and the track's box IS the visible
   * band, however wide that turns out to be. */
  const cardWidth = `((100% - ${(visible - 1) * CARD_GAP}px) / ${visible})`;
  const slide = `calc(-1 * ${index} * (${cardWidth} + ${CARD_GAP}px))`;

  const inner: React.CSSProperties = {
    maxWidth: layout.gridMax,
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: layout.inlinePad(isMobile),
    paddingRight: layout.inlinePad(isMobile),
  };

  return (
    <section style={{ background: tokens.paper }}>
      {/* THE HEADER IS RANGED LEFT WITH THE ACTION OPPOSITE, which is the other
          half of what MONDAY's range section does: heading hard left at display
          scale, the supporting line under it, and one link alone on the right of
          the same band. Centred reads as a caption above a row; ranged left with
          something opposite it reads as a section heading with a decision
          attached. */}
      <div
        style={{
          ...inner,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: space.group,
          // paddingTop/Bottom rather than the `padding` shorthand: the
          // shorthand resets the left and right that `inner` just set, which
          // pulls the heading out to the viewport edge while the cards below
          // stay inset — the two stopped landing on one vertical line.
          paddingTop: isMobile ? space.section : space.band,
          paddingBottom: space.group,
        }}
      >
        <div>
          {/* THIS WAS "The collection" / "Our Range" AND THAT WAS THE PROBLEM.
              The section is four products and the catalogue is twelve, so a
              heading claiming to be THE RANGE was competing with the section
              that actually is it. Naming these as the ones that sell most
              answers why these four and not the others. */}
          <p style={{ ...eyebrow, marginBottom: space.item }}>Most asked for</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>Bestsellers</h2>
          <p style={{ ...supporting.onLight, marginTop: space.item, maxWidth: 460 }}>
            Made to measure. Installed by experts.
          </p>
        </div>
        {/* DESKTOP ONLY, HERE. On mobile the header is a column, so Shop All
            landed directly under the supporting line and ABOVE the cards — a
            full-width link asking the visitor to leave for the shop before they
            had been shown a single product. It moves below them. */}
        {!isMobile && <CtaLink to={routes.products}>Shop the full range</CtaLink>}
      </div>

      <div style={{ ...inner, paddingBottom: space.item }}>
        {/* THE CARDS, FLANKED. On a desktop the two arrows sit outside the pair,
            which is where a control that moves the row belongs — pressing the
            right-hand one moves the cards leftward, and the gesture reads
            correctly only if the control is on the side it is pulling from.
            NOT FLANKED ON A PHONE. Two 40px buttons and their gaps take 112px
            of a 390px screen, and the card has to be the whole width to stack
            its photograph over its questions at all. They move below instead —
            see the row after this one. */}
        <div style={{ position: 'relative' }}>
          {/* IN THE MARGIN, NOT IN THE ROW. Sitting the arrows inside the flex
              row pushed both cards inward by 56px, which broke the one thing
              the header and the cards are meant to share: the first card's left
              edge landing on the same vertical line as "Bestsellers". Lifted
              out of flow into the page's own 80px gutter, the cards keep the
              container's edges and the arrows have somewhere to be.
              Centred on the CARDS rather than on the section, which is why this
              wrapper is only around them — the pagers and the Shop All link
              below would otherwise drag the arrows down past the photographs. */}
          {!isMobile && (
            <>
              <Pager
                direction="left"
                onPress={() => step(-1)}
                label="Previous product"
                disabled={index === 0}
                style={{
                  position: 'absolute',
                  left: -(PAGER_SIZE + PAGER_GAP),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              />
              <Pager
                direction="right"
                onPress={() => step(1)}
                label="Next product"
                disabled={index === lastIndex}
                style={{
                  position: 'absolute',
                  right: -(PAGER_SIZE + PAGER_GAP),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              />
            </>
          )}
          {/* THE WINDOW. It clips the track to the visible band — which is the
              whole mechanism, and it is safe to clip because ShopCard carries
              no shadow to cut off: border, radius and background, all inside its
              own box. See the note on the article in ShopCard. */}
          <div style={{ overflow: 'hidden' }}>
            {/* THE TRACK. Every card, always rendered, always in order; only its
                offset changes. willChange because this is the one thing on the
                section that animates, and it keeps the slide off the main
                thread's paint. */}
            <div
              style={{
                display: 'flex',
                gap: CARD_GAP,
                transform: `translateX(${slide})`,
                transition: `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                willChange: 'transform',
              }}
            >
              {RANGE.map(item => (
                // flex-basis rather than `1 1 0`: the cards off screen have to
                // keep the same width as the ones on it, and a growing basis
                // would share the track between four instead of showing two.
                <div key={item.id} style={{ flex: `0 0 calc(${cardWidth})`, minWidth: 0 }}>
                <ShopCard
                  item={item}
                  sel={sel[item.id] ?? defaultSelection(item)}
                  // Through withChoice, not a spread: answering one row can
                  // invalidate the row below it — a linen code is made in its
                  // own widths — and this is the same call the shop page makes.
                  onChange={(fieldId, choiceId) =>
                    setSel(current => ({
                      ...current,
                      [item.id]: withChoice(
                        item,
                        current[item.id] ?? defaultSelection(item),
                        fieldId,
                        choiceId,
                      ),
                    }))
                  }
                />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The phone's arrows, and mobile's Shop All under them. Centred as a
            pair rather than ranged out to the edges: at this width they are two
            controls sitting together, not the ends of a track. */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.item,
              paddingTop: space.group,
            }}
          >
            <Pager
              direction="left"
              onPress={() => step(-1)}
              label="Previous product"
              disabled={index === 0}
            />
            <Pager
              direction="right"
              onPress={() => step(1)}
              label="Next product"
              disabled={index === lastIndex}
            />
          </div>
        )}
        {isMobile && (
          <div style={{ paddingTop: space.group }}>
            <CtaLink to={routes.products}>Shop the full range</CtaLink>
          </div>
        )}
      </div>
    </section>
  );
}
