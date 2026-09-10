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
// the card's own COLUMN_MIN allows, and the other two are one press away.
//
// PAIRED SO NO PAGE SHOWS TWO OF A KIND. The rule that picks these four — no
// two may be the same sort of object — now decides their order as well: blinds
// with wardrobes, curtains with the outdoor screen. Each page is one thing you
// hang in a window and one thing you do not, which is the range's whole claim
// made twice rather than a page of soft furnishings followed by a page of
// everything else.
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

/** One of the two pagers.
 *
 * IT WRAPS RATHER THAN DISABLING. With two pages a disabled arrow is a control
 * that is dead half the time it is looked at, and on a set this small there is
 * no sense of position to lose by cycling — the pair reads as "the other two",
 * not as a scrollbar. Both arrows therefore always work, which is also what
 * having one on each side is for. */
function Pager({
  direction,
  onPress,
  label,
  style,
}: {
  direction: 'left' | 'right';
  onPress: () => void;
  label: string;
  /** Where to put it. Flanking, the two are lifted out of flow into the page's
   * own margins — see the note where they are placed. */
  style?: React.CSSProperties;
}) {
  const { isHovered, bind } = useHover();
  return (
    <button
      {...bind}
      type="button"
      onClick={onPress}
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
        border: `1px solid ${isHovered ? tokens.lineStrong : tokens.line}`,
        background: isHovered ? tokens.band : 'transparent',
        color: tokens.ink,
        cursor: 'pointer',
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
  const size = perPage(isMobile);
  const pageCount = Math.ceil(RANGE.length / size);

  /** WHICH PAGE, IN PAGES RATHER THAN IN CARDS. Holding an item offset instead
   * would need re-deriving every time the breakpoint changed the page size, and
   * would land the row mid-pair on a rotate. */
  const [page, setPage] = useState(0);
  const turn = (by: number) => setPage(p => (p + by + pageCount) % pageCount);

  /** EVERY CARD'S SELECTION, KEPT BY ID — the same shape the shop page holds.
   *
   * Lifted out of the cards because paging unmounts the two that leave, and a
   * configuration that evaporates when the customer looks at the other pair is
   * one they have to make twice. Keyed by product so the pairs cannot inherit
   * each other's answers, and sparse: a product gets an entry the first time it
   * is touched and defaultSelection fills in for the rest. */
  const [sel, setSel] = useState<Record<string, Selection>>({});

  const shown = RANGE.slice(page * size, page * size + size);

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
                onPress={() => turn(-1)}
                label="Previous bestsellers"
                style={{
                  position: 'absolute',
                  left: -(PAGER_SIZE + PAGER_GAP),
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <Pager
                direction="right"
                onPress={() => turn(1)}
                label="More bestsellers"
                style={{
                  position: 'absolute',
                  right: -(PAGER_SIZE + PAGER_GAP),
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </>
          )}
          {/* minWidth 0 on the track, or a ShopCard's own content floors the
              flex item and the pair overflows the band instead of sharing it. */}
          <div style={{ display: 'flex', gap: space.item }}>
            {shown.map(item => (
              <div key={item.id} style={{ flex: '1 1 0', minWidth: 0 }}>
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

        {/* The phone's pagers, and mobile's Shop All under them. Centred as a
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
            <Pager direction="left" onPress={() => turn(-1)} label="Previous bestsellers" />
            <Pager direction="right" onPress={() => turn(1)} label="More bestsellers" />
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
