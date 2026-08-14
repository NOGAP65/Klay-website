// ---------------------------------------------------------------------------
// The 30% beside the hero — one product at a time, changing every five seconds.
//
// The hero holds the promise and the range row below holds the categories;
// neither of them puts a nameable product with a price in front of the visitor
// before they scroll. This does, in the only space on the first screen that was
// not already carrying something.
//
// WHITE AGAINST THE VIDEO. The column is warm white where everything around it —
// nav, hero scrim, steps bar — is charcoal, and that contrast is the point: it
// reads as a panel laid over the hero rather than as more hero. It is also the
// same ground the range section below uses, so scrolling from this into that is
// one continuous surface rather than two different whites.
//
// ONE AT A TIME, NOT A ROW. At roughly 430px there is room for exactly one
// product to be shown properly — photograph, name, type, price and an action. A
// row of three miniatures in the same space would be three things too small to
// read, which is the failure mode of most hero carousels.
//
// THE CROSSFADE IS STACKED, NOT SWAPPED. Every product renders at once,
// absolutely positioned, with opacity carrying the transition. Swapping a single
// <img>'s src instead would blank the frame on every change while the next file
// decoded — the fade would be to white and back, not from one room to another.
// It also means all four images are fetched during the first idle moment rather
// than one every five seconds.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, motion, prefersReducedMotion } from '../../theme';
import { PRODUCTS } from '../../data/products';
import { ArrowLink, useHover } from './primitives';

/** How long each product holds. Matches the range carousel below it, so the two
 * moving things on the page keep the same beat rather than drifting against each
 * other into a permanent state of something-is-always-changing. */
const HOLD_MS = 5000;

/** One entry per DISTINCT photograph.
 *
 * PRODUCTS has four, but Haze has no imagery of its own yet and falls back to the
 * Sunscreen shot — see the placeholder note in data/products.ts. Cycling the raw
 * list would show the identical room twice in a row under two different names,
 * which reads as the component having failed to advance rather than as two
 * products. Filtering by image rather than hardcoding three names means Haze
 * appears here by itself the day it is photographed. */
const RAIL = PRODUCTS.filter(
  (p, i, all) => all.findIndex(o => o.image === p.image) === i,
);

export function HeroProductRail() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { hover, bind } = useHover();
  // Read once. Content that replaces itself on a timer is what this preference
  // exists to stop; under it the rail holds on the first product and the dots
  // become the way through.
  const [reduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const tick = window.setInterval(() => {
      setIndex(i => (i + 1) % RAIL.length);
    }, HOLD_MS);
    return () => window.clearInterval(tick);
  }, [paused, reduceMotion]);

  const current = RAIL[index];

  return (
    <Link
      {...bind}
      to={`/products/${current.slug}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: tokens.warmWhite,
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        // Anchored to the BOTTOM of the column, not stretched down it. The
        // product is one block sitting in the lower part of the white rather than
        // a panel filling the whole 30% — the empty white above it is what makes
        // it read as a considered placement instead of a second hero competing
        // with the first, and it gives the headline beside it room to be the
        // thing you look at first.
        justifyContent: 'flex-end',
        padding: '28px 26px 26px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <p style={{ ...eyebrow, marginBottom: 14, flexShrink: 0 }}>Featured</p>

      {/* A fixed 4:3, not flex:1. Filling the leftover height made the photograph
          grow with the viewport until it was the tallest thing on the first
          screen — on a 1080 monitor it stood taller than the hero headline. At a
          set ratio the block keeps its proportions and the extra height becomes
          white space above it instead. */}
      <div
        style={{
          position: 'relative',
          flex: '0 0 auto',
          aspectRatio: '4 / 3',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {RAIL.map((product, i) => (
          <img
            key={product.slug}
            src={product.image}
            alt={`${product.name} ${product.type}`}
            // Only the visible one is announced; the other three are stacked
            // underneath it purely so their bytes are already decoded.
            aria-hidden={i !== index}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
              opacity: i === index ? 1 : 0,
              // Long, because this is a dissolve between two rooms rather than a
              // UI state change — at 200ms it flickers.
              transition: 'opacity 0.9s ease',
              transform: hover && i === index ? 'scale(1.04)' : 'scale(1)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '0.9s, 0.7s',
            }}
          />
        ))}
      </div>

      <div style={{ flexShrink: 0, paddingTop: 18 }}>
        <div
          style={{
            fontFamily: tokens.display,
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.1,
            color: tokens.ink,
          }}
        >
          {current.name}
        </div>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 12,
            color: tokens.inkSoft,
            marginTop: 5,
          }}
        >
          {current.type}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              fontWeight: 500,
              color: tokens.gold,
            }}
          >
            ${current.priceFrom}
          </span>
          <ArrowLink label="Shop Now" hovered={hover} />
        </div>

        {/* Dots. Real buttons, not decoration: they are the only way to reach the
            other products under a reduced-motion preference, where the timer
            never runs. Nested inside a Link, so each one has to stop the click
            from also navigating to whatever happens to be showing. */}
        <div style={{ display: 'flex', gap: 7, marginTop: 20 }}>
          {RAIL.map((product, i) => (
            <button
              key={product.slug}
              aria-label={`Show ${product.name}`}
              aria-current={i === index}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setIndex(i);
              }}
              style={{
                width: i === index ? 22 : 7,
                height: 7,
                padding: 0,
                border: 'none',
                borderRadius: 4,
                background: i === index ? tokens.gold : tokens.line,
                cursor: 'pointer',
                transition: `width 0.4s ease, ${motion.button}`,
              }}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
