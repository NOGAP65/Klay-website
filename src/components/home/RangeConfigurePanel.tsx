// ---------------------------------------------------------------------------
// THE SIGNATURE MOMENT.
//
// Choosing a range draws it aside like a curtain: the row above dims a few
// percent and the chosen photograph widens into a lit panel where the
// specifying happens. It is the one bold thing in the section and there is
// deliberately nothing else on the page competing with it — no lifts, no
// shadows, no autoplay, no fade-ups.
//
// WHY A CURTAIN WIPE AND NOT A FADE. The metaphor is the product. A panel that
// opens left to right, revealing the photograph as it goes, is a curtain being
// drawn — which is a thing no competitor can borrow without borrowing the whole
// brand with it. A fade is what a modal does.
//
// WHY IN PLACE AND NOT A ROUTE. The visitor chose a category two hundred pixels
// above; sending them to another page costs the context that made them choose,
// and returning them costs the scroll position too. The row stays visible and
// dimmed behind the decision, which is what makes it feel like a step rather
// than a departure.
//
// It carries the configurator unchanged — same fields, same store binding, same
// cart line. See RangeConfigurator.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { tokens, motion, space, type, grid, microCaps, prefersReducedMotion } from '../../theme';
import type { CatalogueItem } from '../../data/catalogue';
import { RangeConfigurator } from './RangeConfigurator';
import { useHover } from './primitives';

function CloseButton({ onClose }: { onClose: () => void }) {
  const { hover, bind } = useHover();
  return (
    <button
      {...bind}
      onClick={onClose}
      aria-label="Close"
      style={{
        flexShrink: 0,
        // 44px, the tap-target floor, even though it is a small mark.
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: `1px solid ${hover ? tokens.gold : tokens.line}`,
        borderRadius: 2,
        color: tokens.ink,
        fontFamily: tokens.body,
        fontSize: type.lead,
        lineHeight: 1,
        cursor: 'pointer',
        transition: motion.button,
      }}
    >
      ×
    </button>
  );
}

export function RangeConfigurePanel({
  item,
  onClose,
  isMobile,
}: {
  item: CatalogueItem;
  onClose: () => void;
  isMobile: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = prefersReducedMotion();

  // Bring the panel into view when it opens. Not decoration — the row sits well
  // down the homepage and a panel that opens below the fold reads as nothing
  // having happened. Instant under reduced motion.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }, 60);
    return () => window.clearTimeout(t);
  }, [reduce]);

  // Escape closes it. A panel that can only be dismissed by finding a small ×
  // is a trap on a keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      ref={ref}
      // The curtain. A clip-path inset that starts fully closed on the right and
      // opens across, so the photograph and the controls are revealed by the
      // edge travelling over them rather than by appearing. `key` on the item id
      // in the parent replays it for each product chosen.
      style={{
        marginTop: space.xxl,
        background: tokens.cream,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? space.md : space.xl,
        animation: reduce ? undefined : 'klay-curtain 0.64s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      {/* The photograph, widened out of the card that was clicked. 38% —
          the minor share, because at this point the picture has done its job
          and the specifying is the work. */}
      <div
        style={{
          // The picture takes whatever the controls do not need. Giving it a
          // percentage instead left a band of empty cream down the right of the
          // panel at every viewport over about 1200 — the controls are a text
          // column and stop at their measure, so the leftover has to go
          // somewhere, and the photograph is the half worth looking at.
          flex: isMobile ? '0 0 auto' : '1 1 auto',
          height: isMobile ? 260 : 'auto',
          minHeight: isMobile ? undefined : 480,
          overflow: 'hidden',
          background: tokens.parchment,
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: item.imagePosition ?? 'center',
            display: 'block',
          }}
        />
      </div>

      {/* The controls. 62%, and padded off the photograph by a full group
          boundary so the two halves never read as one crowded box. */}
      <div
        style={{
          // Six columns of the grid — the width a fourteen-swatch colour card
          // needs and a comfortable measure for the labels above it.
          flex: isMobile ? '1 1 auto' : `0 0 ${grid.span(6)}px`,
          minWidth: 0,
          paddingTop: isMobile ? space.md : space.xl,
          paddingBottom: isMobile ? space.lg : space.xl,
          paddingRight: isMobile ? space.md : space.xl,
          paddingLeft: isMobile ? space.md : 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: space.md,
            marginBottom: space.xl,
          }}
        >
          <div>
            <p style={{ ...microCaps, letterSpacing: '0.24em' }}>You chose · we make it</p>
            <h3
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 28 : type.card,
                fontWeight: 300,
                lineHeight: 1.05,
                color: tokens.ink,
                margin: 0,
                marginTop: space.xs,
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
                maxWidth: '46ch',
              }}
            >
              {item.situation ?? item.tagline}
            </p>
          </div>
          <CloseButton onClose={onClose} />
        </div>

        <RangeConfigurator item={item} isMobile={isMobile} />

        {/* The way to everything the panel deliberately does not carry —
            specifications, fabrics, the full description. Last, quiet, and
            below the action rather than beside it. */}
        <p style={{ margin: 0, marginTop: space.md }}>
          <Link
            to={item.to}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontFamily: tokens.body,
                fontSize: type.fine,
                color: tokens.inkBody,
                borderBottom: `1px solid ${tokens.line}`,
                paddingBottom: 2,
                transition: motion.link,
              }}
            >
              Everything about {item.name.toLowerCase()}
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
