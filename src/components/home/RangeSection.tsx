// ---------------------------------------------------------------------------
// 4. Our Range.
//
// THE SECTION DOES ONE JOB: desire and orientation. "Which of these is mine?"
// It asks for zero decisions and shows zero controls.
//
// It used to do two. Every card carried a photograph on top and a five-field
// configurator underneath, which fused two incompatible psychological jobs into
// one object — the top half editorial aspiration, the bottom half a form — so
// the section asked for roughly forty-five decisions before it had given anyone
// one reason to want anything. Neither job was done well because both were
// happening in the same 331px column.
//
// Nothing was deleted. It was SEQUENCED. Configuration now happens on a focused
// single-product surface, opened by choosing a category — see
// RangeConfigurePanel, which carries the same controls, the same store bindings
// and the same cart line as before.
//
// THREE STRUCTURAL DECISIONS, all of them departures from what a generic
// "premium range section" produces:
//
//   ASYMMETRIC HEADER. Text left at 62%, the way out right at 38%, sharing one
//   optical baseline. A centred eyebrow-title-sub stack is the single largest
//   contributor to "this could be any website", and equal weighting gives the
//   reader no ranking to borrow, so they do the work themselves or decline.
//
//   ONE DOMINANT CARD. The hero runs 6 columns against the satellites' 3, and
//   at a 4:5 satellite crop that resolves to 1.685:1 — a proportion that falls
//   out of the grid rather than being imposed on it. A stranger given two
//   seconds can say which product Klay wants them to look at.
//
//   THE ROW BLEEDS RIGHT. It starts on the container's left gutter and runs
//   past the container to the viewport edge, so a partial card is always
//   visible. The arrows are then honest — there is demonstrably more — and the
//   range reads as larger than the screen.
//
// WHAT IS NOT HERE: no autoplay, no dots, no lift-and-shadow hover, no price,
// no rating stars, no gold fills. Nothing on this page moves except the entry
// wash, the 1.03 hover push, and the curtain.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, motion, space, type, grid, microCaps, prefersReducedMotion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CATALOGUE, PHOTOGRAPHED } from '../../data/catalogue';
import { RangeCard } from './RangeCard';
import { RangeConfigurePanel } from './RangeConfigurePanel';
import { useHover } from './primitives';

/** Card geometry, straight off the 12-column grid — see theme's `grid`. */
const HERO_W = grid.span(6); // 620
const SAT_W = grid.span(3); // 294
/** 4:5 on the satellites. The hero takes the same height, which is what puts
 * every caption in the row on one baseline; at 620 wide that makes the hero
 * 1.685:1. Portrait raises perceived product prominence and matches how people
 * photograph their own rooms — a wide, short crop makes the product incidental
 * in its own frame. */
const IMG_H = Math.round(SAT_W * 1.25); // 368

/** Arrow. Ink hairline on the warm ground, gold only under the pointer. */
function Arrow({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const { hover, bind } = useHover();
  return (
    <button
      {...bind}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'transparent',
        border: `1px solid ${hover && !disabled ? tokens.gold : tokens.line}`,
        color: disabled ? tokens.inkFaint : tokens.ink,
        fontFamily: tokens.body,
        fontSize: type.lead,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transition: motion.button,
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

export function RangeSection() {
  const isMobile = useIsMobile();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  const cards = PHOTOGRAPHED;
  const open = cards.find(c => c.id === openId) ?? null;

  /** The entry wash fires once, when the section first crosses into view. */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setEntered(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const syncEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(syncEdges, [syncEdges]);

  const scrollByCards = (n: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: n * (SAT_W + space.lg),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  /** Left edge of the content column: the container's own gutter, expressed so
   * the row can bleed past the container on the right while still starting on
   * the page's vertical line. */
  const railLeft = isMobile
    ? space.md
    : `max(${space.xxl}px, calc((100vw - ${grid.max}px) / 2 + ${space.xxl}px))`;

  return (
    <section
      ref={sectionRef}
      style={{
        background: tokens.warmWhite,
        paddingTop: isMobile ? space.xxl : space.section,
        paddingBottom: isMobile ? space.xxl : space.section,
        overflow: 'hidden',
      }}
    >
      {/* ---- HEADER — 62 / 38, one optical baseline ---------------------- */}
      <div
        style={{
          maxWidth: grid.max,
          margin: '0 auto',
          paddingLeft: grid.gutter(isMobile),
          paddingRight: grid.gutter(isMobile),
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isMobile ? space.md : space.lg,
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={{ flex: '0 1 62%' }}>
          <p style={{ ...microCaps, letterSpacing: '0.3em' }}>The collection</p>
          <h2
            style={{
              fontFamily: tokens.display,
              // Discrete steps, not a clamp: a clamp travels through every size
              // between 34 and 56, and the whole point of the type system is
              // that those sizes do not exist.
              fontSize: isMobile ? type.card : type.section,
              fontWeight: 300,
              lineHeight: 1.02,
              color: tokens.ink,
              margin: 0,
              marginTop: space.sm,
            }}
          >
            Our Range
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: type.lead,
              lineHeight: 1.65,
              color: tokens.inkBody,
              margin: 0,
              marginTop: space.md,
              maxWidth: '54ch',
            }}
          >
            Made to measure in Australia, measured and installed by our own
            fitters. Find the room you are trying to fix.
          </p>
        </div>

        {/* Ranged right and sitting on the headline block's own baseline, so
            the two halves read as one line of thought rather than as a heading
            with a button parked next to it. */}
        <div
          style={{
            flex: '0 1 38%',
            display: 'flex',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            paddingBottom: space.xs,
          }}
        >
          <HeaderLink />
        </div>
      </div>

      {/* ---- ROW — starts on the container's line, bleeds right ---------- */}
      <div
        style={{
          marginTop: isMobile ? space.xl : space.xxl,
          // A FEW PERCENT, not a scrim. The row is still the thing the visitor
          // just chose from and it has to stay legible behind the decision —
          // dropping it to a half-opacity backdrop turns a step in one flow
          // into a modal over another. 0.9 here, and the unchosen cards take a
          // further 0.85 inside it, so the chosen one is relatively the
          // brightest object on the page without anything being hidden.
          opacity: open ? 0.9 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        <div
          ref={scrollerRef}
          onScroll={syncEdges}
          className={isMobile ? undefined : 'klay-hscroll'}
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            // Content-sized, never stretched. A flex row defaults to stretch,
            // which would give every card the height of the tallest and put a
            // region of dead space under the short ones — the single most
            // damaging thing a layout can show, because it is visible evidence
            // that the grid is doing the deciding rather than the content.
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: isMobile ? space.xl : space.lg,
            // Mobile is a single column and never scrolls sideways.
            overflowX: isMobile ? 'visible' : 'auto',
            scrollSnapType: isMobile ? undefined : 'x mandatory',
            paddingLeft: railLeft,
            // The snapport has to start where the rail does. Without this,
            // snapping aligns the first card to the scroll container's own edge
            // and quietly eats the 84px gutter — the row starts flush against
            // the viewport and stops sharing the page's vertical line.
            scrollPaddingLeft: railLeft,
            paddingRight: isMobile ? space.md : 0,
          }}
        >
          {cards.map((item, i) => (
            <RangeCard
              key={item.id}
              item={item}
              index={i}
              entered={entered}
              // One dominant card: the first runs double width. Everything
              // after it is a satellite.
              width={isMobile ? '100%' : i === 0 ? HERO_W : SAT_W}
              imageHeight={isMobile ? Math.round(320 * 1.25) : IMG_H}
              isMobile={isMobile}
              chosen={openId === item.id}
              dimmed={openId !== null && openId !== item.id}
              onChoose={() => setOpenId(cur => (cur === item.id ? null : item.id))}
            />
          ))}
        </div>

        {/* Arrows sit under the row, ranged with the content column. Under it
            rather than floating over the photographs: a control on top of the
            picture is a control competing with the thing it is showing. */}
        {!isMobile && cards.length > 2 && (
          <div
            style={{
              display: 'flex',
              gap: space.sm,
              paddingLeft: railLeft,
              // A group boundary, not a within-group gap: 32 against the 12
              // inside a card is 2.67×, which is what keeps the arrows reading
              // as controls for the row rather than as part of the last card.
              marginTop: space.lg,
            }}
          >
            <Arrow direction="prev" onClick={() => scrollByCards(-1)} disabled={atStart} />
            <Arrow direction="next" onClick={() => scrollByCards(1)} disabled={atEnd} />
          </div>
        )}
      </div>

      {/* ---- THE PANEL — the one signature moment ------------------------ */}
      {open && (
        <div
          style={{
            maxWidth: grid.max,
            margin: '0 auto',
            paddingLeft: grid.gutter(isMobile),
            paddingRight: grid.gutter(isMobile),
          }}
        >
          <RangeConfigurePanel
            // Keyed on the product so choosing a second range replays the
            // curtain rather than swapping the contents silently.
            key={open.id}
            item={open}
            isMobile={isMobile}
            onClose={() => setOpenId(null)}
          />
        </div>
      )}

      {/* ---- THE REST OF THE RANGE --------------------------------------
          Ten products are configurable, priced and reachable, and have no
          photograph — see PHOTOGRAPHED in data/catalogue. They are named here
          in type rather than shown as icon cards: a drawn glyph beside a
          photographed room reads as an inferior product, and asymmetric visual
          quality across a row is taken as asymmetric product quality. This is a
          content blocker stated in the interface, not a gap being filled. */}
      {CATALOGUE.length > cards.length && (
        <div
          style={{
            maxWidth: grid.max,
            margin: '0 auto',
            paddingLeft: grid.gutter(isMobile),
            paddingRight: grid.gutter(isMobile),
            // 84, not 136: this is a boundary inside the section, and a
            // section's worth of air here reads as the row having ended and
            // something unrelated starting.
            marginTop: isMobile ? space.xl : space.xxl,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? space.sm : space.xl,
            borderTop: `1px solid ${tokens.lineFaint}`,
            paddingTop: space.lg,
          }}
        >
          <p style={{ ...microCaps, flex: '0 0 auto', marginTop: space.nudge }}>
            Also in the range
          </p>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: type.body,
              lineHeight: 1.7,
              color: tokens.inkBody,
              margin: 0,
              maxWidth: '70ch',
            }}
          >
            {CATALOGUE.filter(i => !i.image)
              .map(i => i.name)
              .join(' · ')}
            {'  '}
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 44,
                color: tokens.ink,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ borderBottom: `1px solid ${tokens.lineStrong}`, paddingBottom: 2 }}>
                See all {CATALOGUE.length} →
              </span>
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}

/** The header's right half. Text with a hairline, not a filled button: the
 * section's own action is on the cards, and a second filled control up here
 * would compete with them for the same click. */
function HeaderLink() {
  const { hover, bind } = useHover();
  return (
    <Link
      {...bind}
      to="/products"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 44,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontFamily: tokens.body,
          fontSize: type.fine,
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: tokens.ink,
          borderBottom: `1px solid ${hover ? tokens.gold : tokens.lineStrong}`,
          paddingBottom: space.xs,
          transition: motion.link,
        }}
      >
        All {CATALOGUE.length} products →
      </span>
    </Link>
  );
}
