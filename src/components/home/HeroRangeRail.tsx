// ---------------------------------------------------------------------------
// The 24% beside the hero — one CATEGORY at a time, changing every five seconds.
//
// This replaces HeroProductRail, which cycled the four roller-blind PRODUCTS
// (Dusk, Veil, Duo) with a from-price on each. The panel is narrower now, and at
// ~24% a product card was doing the range row's job badly: a named SKU with a
// price is a buying decision, and the first screen is too early to ask for one.
// Three categories — Indoor, Outdoor, Wardrobes — is the question the visitor
// actually arrives with, and it is the same taxonomy the nav and the category
// pages already use, so the panel and everything it links to agree.
//
// WHITE AGAINST THE VIDEO. The column is warm white where everything around it —
// nav, hero scrim, steps bar — is charcoal, and that contrast is the point: it
// reads as a panel laid over the hero rather than as more hero. It is also the
// same ground the range section below uses, so scrolling from this into that is
// one continuous surface rather than two different whites.
//
// THE CROSSFADE IS STACKED, NOT SWAPPED. Every slide renders at once, absolutely
// positioned, with opacity carrying the transition. Swapping a single <img>'s
// src instead would blank the frame on every change while the next file decoded
// — the fade would be to white and back, not from one room to another. It also
// means all three images are fetched during the first idle moment rather than
// one every five seconds.
//
// EVERY STRING HERE IS DERIVED. Names and images come straight off CATEGORIES;
// the descriptor line is built from each category's own subcategory names — see
// descriptorFor. Nothing about the range is written down twice.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens, eyebrow, motion, prefersReducedMotion, space, type as typeScale } from '../../theme';
import { CATEGORIES, type Category } from '../../data/categories';
import { CtaLink, useHover } from './primitives';

/** How long each category holds. Matches the range carousel below it, so the two
 * moving things on the page keep the same beat rather than drifting against each
 * other into a permanent state of something-is-always-changing. */
const HOLD_MS = 5000;

/** The dissolve. Short — this is a whole slide changing, name and all, so a long
 * fade leaves two category names legible on top of each other for most of it. */
const FADE_MS = 300;

/** The nav's height, plus air. The nav is position:fixed and overlays the hero
 * rather than taking a row above it, so the top 80px of this panel are behind a
 * bar of opaque charcoal — the hero's own copy carries the same offset for the
 * same reason, see NAV_HEIGHT in Hero.tsx.
 *
 * The rail this replaced did not need it. Its photograph was a fixed 4:3 rather
 * than a share of the height, so its content was always SHORTER than the column
 * and justify-content:flex-end parked the whole block low enough to clear the
 * nav by accident. This one fills the panel, so the clearance has to be real:
 * without it "OUR RANGE" renders underneath the nav bar and is simply not there. */
const NAV_CLEARANCE = 80 + space.md;

/** The photograph's height — 58% of the VISIBLE panel, and neither of the two
 * things that makes it is the box the percentage is declared against.
 *
 * Visible first: the panel is 768px on a 1080-tall viewport, but NAV_CLEARANCE
 * of that is behind the nav, so what the visitor sees is 688 and that is what a
 * proportion should be read against. 58% of the panel's full height would put
 * the image at 445 — visibly about two thirds of the white, not three fifths.
 *
 * Then the box: a percentage here resolves against the slide area, which is the
 * panel less a constant — NAV_CLEARANCE, the eyebrow, the dots, the View All
 * button and the bottom padding come to 252px at every viewport (measured in the
 * running page; all of it is fixed type or fixed padding, none of it scales). So
 * visible = slide + 172, and 0.58 × (slide + 172) is 58% of the slide plus 100px.
 *
 * A flat percentage was tried first and drifted from 49% of the panel on a
 * 900-tall window to 61% on a tall one, because it was taking its share of a box
 * that shrinks by a constant rather than proportionally.
 *
 * The min() is the floor for the type. The name, the descriptor and Shop Now
 * need about 116px between them, and on a short window the 58% does not leave
 * that — under roughly 1000px of viewport the photograph gives way instead of
 * squeezing the words, which is the right way round for this to fail. The floor
 * went up from 96 when Shop Now became a filled chip: padding on a button is
 * height the words underneath it do not get. */
const IMAGE_HEIGHT = 'min(calc(58% + 100px), calc(100% - 116px))';

/** How many characters the descriptor line can run to before it wraps. The panel
 * is 24% of the viewport less 26px of padding either side — about 294px at
 * 1440, or roughly 48 characters of 11px Inter. */
const DESCRIPTOR_MAX = 46;

/** The one-line descriptor: this category's own subcategory names, dot-joined.
 *
 * Built rather than written down, so a category that gains or loses a type says
 * so here without anyone remembering to come back. Two rules, both of them about
 * fitting a very narrow column:
 *
 *   1. Take as many names as fit DESCRIPTOR_MAX, never fewer than two. Indoor's
 *      first three fit; Outdoor's and Wardrobes' don't, so those show two.
 *   2. If every name taken ends in the same word, print it once at the end —
 *      "Roller · Venetian · Roman Blinds" rather than saying Blinds three times.
 */
function descriptorFor(category: Category): string {
  const names = category.subcategories.map(s => s.name);

  let taken = names.slice(0, Math.min(3, names.length));
  while (taken.length > 2 && taken.join(' · ').length > DESCRIPTOR_MAX) {
    taken = taken.slice(0, -1);
  }

  const lastWord = (n: string) => n.slice(n.lastIndexOf(' ') + 1);
  const suffix = lastWord(taken[0]);
  const shared = taken.length > 1 && taken.every(n => lastWord(n) === suffix);

  if (!shared) return taken.join(' · ');

  // Strip the shared word off every name but the last, which keeps it.
  const trimmed = taken.map((n, i) =>
    i === taken.length - 1 ? n : n.slice(0, n.length - suffix.length).trimEnd(),
  );
  return trimmed.join(' · ');
}

export function HeroRangeRail() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Read once. Content that replaces itself on a timer is what this preference
  // exists to stop; under it the panel holds on the first category and the dots
  // become the way through.
  const [reduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const tick = window.setInterval(() => {
      setIndex(i => (i + 1) % CATEGORIES.length);
    }, HOLD_MS);
    return () => window.clearInterval(tick);
  }, [paused, reduceMotion]);

  return (
    <div
      // Pause on the whole panel, not just the slide. The dots and the View All
      // button are part of the same object, and having the rotation carry on
      // underneath the pointer while someone is reaching for a dot is the one
      // moment the timer is most in the way.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: tokens.warmWhite,
        display: 'flex',
        flexDirection: 'column',
        // Bottom-anchored, which matters only on the short viewports where the
        // min() in IMAGE_HEIGHT has shrunk the photograph and the content no
        // longer fills the column. What is left over should collect under the
        // nav, where it reads as air, rather than above the View All button,
        // where it reads as the button having come loose from the panel.
        justifyContent: 'flex-end',
        padding: `${NAV_CLEARANCE}px ${space.md}px ${space.md}px`,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <p style={{ ...eyebrow, marginBottom: space.sm, flexShrink: 0 }}>Our Range</p>

      {/* The stack. Takes whatever the eyebrow, the dots and the button leave —
          that leftover is the 100% every percentage inside a slide resolves
          against, which is what IMAGE_HEIGHT is correcting for. Every slide is
          absolutely positioned inside it so they can dissolve through each
          other; the container has to carry a height of its own because
          absolutely-positioned children contribute none. */}
      <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0 }}>
        {CATEGORIES.map((category, i) => (
          <CategorySlide
            key={category.slug}
            category={category}
            active={i === index}
          />
        ))}
      </div>

      {/* Dots. Real buttons, not decoration: they are the only way to reach the
          other categories under a reduced-motion preference, where the timer
          never runs. */}
      <div style={{ display: 'flex', gap: space.xs, marginTop: space.md, flexShrink: 0 }}>
        {CATEGORIES.map((category, i) => (
          <button
            key={category.slug}
            aria-label={`Show ${category.name}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              padding: 0,
              border: 'none',
              borderRadius: 2,
              // fillFaint, not `line`. This is a dot, and `line` is the token
              // for a UI component's edge — it was a border colour doing duty as
              // a fill, which is the second of the two colour corrections the
              // locked hero takes in this pass. Same 0.15 weight as before, so
              // nothing here changes visually; it just stops the dots tracking a
              // token that had to be darkened for borders.
              background: i === index ? tokens.gold : tokens.fillFaint,
              cursor: 'pointer',
              transition: `width 0.4s ease, ${motion.button}`,
            }}
          />
        ))}
      </div>

      {/* The way past the rotation entirely, for the visitor who wants the whole
          catalogue rather than whichever category happens to be showing. Full
          width, because at 24% a centred pill would leave two dead margins and
          the button is the panel's floor. */}
      <CtaLink
        to="/products"
        variant="gold"
        style={{
          width: '100%',
          marginTop: space.md,
          // The `color` override is gone — it was charcoal (#2C2824) on gold,
          // where every other gold button on the site puts ink (#1C1810). One
          // button spelling the label colour differently from the other nine is
          // the first of the two colour corrections the locked hero takes; the
          // CTA's own fill now supplies it.
          //
          // The vertical padding is gone with it: the CTA sets an explicit
          // height of 52 now, and padding on top of that is what made this
          // button 59.19 against the same component's 55 elsewhere. Full-width
          // variants keep the height and drop the horizontal padding, which is
          // what `padding: 0` does here.
          padding: 0,
          flexShrink: 0,
        }}
      >
        View All
      </CtaLink>
    </div>
  );
}

/** One slide: photograph, name, descriptor, action. Its own component so the
 * hover state is per-slide — the three are stacked on top of each other, and a
 * single shared hover would push in whichever image happened to be underneath. */
function CategorySlide({ category, active }: { category: Category; active: boolean }) {
  const { hover, bind } = useHover();

  return (
    <Link
      {...bind}
      to={`/${category.slug}`}
      // Only the visible slide is announced or reachable; the other two are
      // stacked underneath it purely so their bytes are already decoded.
      aria-hidden={!active}
      tabIndex={active ? undefined : -1}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        opacity: active ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        // The inactive slides sit under the pointer as well as under the
        // photograph, and without this they would take the clicks meant for the
        // one on top.
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          // height, not a flex basis: flex-basis percentages resolve against the
          // container the same way, but a basis is still subject to shrinking
          // once the text block below claims its own space, and the whole point
          // of IMAGE_HEIGHT is that the number is exact.
          height: IMAGE_HEIGHT,
          flexShrink: 0,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <img
          src={category.image}
          alt={category.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: category.objectPosition,
            display: 'block',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.7s ease',
          }}
        />
      </div>

      <div style={{ flex: '1 1 auto', minHeight: 0, paddingTop: space.md }}>
        <div
          style={{
            fontFamily: tokens.display,
            ...typeScale.card,
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.1,
            color: tokens.ink,
          }}
        >
          {category.name}
        </div>
        <div
          style={{
            fontFamily: tokens.body,
            ...typeScale.body,
            lineHeight: 1.5,
            color: tokens.inkSoft,
            marginTop: space.xxs,
          }}
        >
          {descriptorFor(category)}
        </div>
        {/* A filled gold chip, not the underlined ArrowLink the cards elsewhere
            use. Same reasoning as PhotoTile's corner chip: a photograph with a
            word under it is not obviously clickable, and on a panel this narrow
            the slide has no other affordance — the fill is what says the whole
            block is a link.

            A <span> rather than a <button> because this sits INSIDE the slide's
            Link and a nested interactive element would be invalid; the Link is
            what handles the click. */}
        <span
          style={{
            marginTop: space.sm,
            // The one pill definition: height 32, 20 either side.
            display: 'inline-flex',
            alignItems: 'center',
            height: 32,
            padding: `0 ${space.md}px`,
            ...typeScale.label,
            lineHeight: 1,
            color: tokens.ink,
            background: hover ? tokens.goldLight : tokens.gold,
            borderRadius: 2,
            whiteSpace: 'nowrap',
            transition: motion.button,
          }}
        >
          Shop Now →
        </span>
      </div>
    </Link>
  );
}
