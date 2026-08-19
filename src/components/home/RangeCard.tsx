// ---------------------------------------------------------------------------
// One card in the range row. It does ONE job: make you want something, and let
// you find yourself in under two seconds. It asks for nothing.
//
// FOUR THINGS, AND THE FOURTH IS THE ONLY ONE THAT COSTS ANYTHING:
//
//     the name              what it is
//     the situation line    who it is for
//     one proof number      why to believe it
//     one action            the way in
//
// No price, no swatches, no chips, no rating stars, no second link. Every one
// of those was on this card a version ago and every one of them is a decision
// asked for before a reason to care has been given.
//
// NO CARD. There is no border, no fill, no shadow and no radius: a photograph
// with type under it, sitting on the section's own ground. Borders and filled
// panels are the generic-component tell — grouping here is done with space, and
// the boundaries earn it (32 between cards against 12 inside one, 2.67×).
//
// It is also why the row has no dead space. Nothing is stretched to match a
// sibling, so a two-line situation line simply makes that column taller and the
// row reads as editorial rather than as a broken grid.
// ---------------------------------------------------------------------------

import { tokens, motion, space, type, microCaps, prefersReducedMotion } from '../../theme';
import { proofOf, type CatalogueItem } from '../../data/catalogue';
import { useHover } from './primitives';

export function RangeCard({
  item,
  width,
  imageHeight,
  onChoose,
  chosen,
  dimmed,
  isMobile,
  /** Index in the row, used to stagger the entry wash. */
  index,
  entered,
}: {
  item: CatalogueItem;
  /** Fixed pixel width from the 12-column grid, or '100%' on mobile. */
  width: number | string;
  imageHeight: number;
  onChoose: () => void;
  chosen: boolean;
  dimmed: boolean;
  isMobile: boolean;
  index: number;
  entered: boolean;
}) {
  const { hover, bind } = useHover();
  const reduce = prefersReducedMotion();

  return (
    <article
      {...bind}
      style={{
        flex: `0 0 ${typeof width === 'number' ? `${width}px` : width}`,
        maxWidth: typeof width === 'number' ? width : undefined,
        scrollSnapAlign: 'start',
        // The entry wash: content crosses the row from the left, like light
        // crossing a room, staggered card by card. Not a fade-up — a fade-up is
        // what every site does and it says nothing about this business.
        opacity: entered ? (dimmed ? 0.85 : 1) : 0,
        transform: entered || reduce ? 'translateX(0)' : 'translateX(-32px)',
        transition: reduce
          ? 'opacity 0.3s ease'
          : `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${index * 90}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${index * 90}ms`,
      }}
    >
      {/* The photograph. The whole frame is the link into the product, so the
          picture is clickable at picture size rather than only at link size. */}
      <button
        onClick={onChoose}
        aria-expanded={chosen}
        style={{
          display: 'block',
          width: '100%',
          // 4:5 on a phone, where the column is fluid, and the row's fixed crop
          // height on desktop so every caption in the row lands on one line.
          height: isMobile ? undefined : imageHeight,
          aspectRatio: isMobile ? '4 / 5' : undefined,
          padding: 0,
          border: 'none',
          borderRadius: 0,
          overflow: 'hidden',
          cursor: 'pointer',
          background: tokens.parchment,
          position: 'relative',
        }}
      >
        <img
          src={item.image}
          alt={`${item.name} — ${item.situation ?? item.tagline}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: item.imagePosition ?? 'center',
            display: 'block',
            // Looking further through a window: the crop opens slightly rather
            // than the card lifting off the page. 1.03 over 600ms is the whole
            // hover vocabulary of this section.
            transform: hover && !reduce ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </button>

      {/* The caption. 12 from the image, 8 inside the name/situation pair —
          every gap here is smaller than the 32 between one card and the next,
          which is what makes four columns read as four things. */}
      <div style={{ paddingTop: space.sm, maxWidth: 420 }}>
        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 28 : type.card,
            fontWeight: 300,
            lineHeight: 1.05,
            color: tokens.ink,
            margin: 0,
          }}
        >
          {item.name}
        </h3>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: type.body,
            lineHeight: 1.6,
            color: tokens.inkBody,
            margin: 0,
            marginTop: space.xs,
            // 55–70 characters. The situation line is the one sentence in the
            // section that has to be read rather than scanned.
            maxWidth: '32ch',
          }}
        >
          {item.situation ?? item.tagline}
        </p>
        <p style={{ ...microCaps, marginTop: space.sm }}>{proofOf(item)}</p>

        {/* The action, and there is exactly one. A text link with a hairline
            under it, not a filled button: three filled buttons in a row is
            three shouts, and the photograph is already doing the persuading.
            A second link — a Details, a Learn more — was drafted here and cut,
            because a card with two ways out is a card that has started asking
            questions again. Everything else about the product is one click
            away inside the panel this opens. */}
        <div style={{ marginTop: space.sm }}>
          {/* The hit area is 44px tall and the rule still hugs the words: the
              padding is on the button and the border is on the span inside it.
              An underline sitting 13px below its own text to make a tap target
              is a tap target you can see. */}
          <button
            onClick={onChoose}
            aria-expanded={chosen}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              padding: `${space.sm}px 0`,
              cursor: 'pointer',
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
                paddingBottom: space.nudge,
                transition: motion.link,
              }}
            >
              {chosen ? 'Chosen' : 'Choose yours'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
