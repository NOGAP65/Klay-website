// ---------------------------------------------------------------------------
// 11. Closing CTA — a room behind the words, not a flat charcoal band.
//
// It sends the reader back up to the visualiser, the same place the hero's
// Design Yours goes. Someone who has read the whole page has already been given
// the range, the process and the proof; what is left is the tool, and it is on
// this page rather than behind another navigation.
//
// SAME TREATMENT AS THE RECOMMENDATION BANNER, deliberately, and a different
// photograph. The two are the page's only full-bleed text-on-image sections and
// they bracket everything between them — the offer on the way in, the ask on the
// way out — so they should read as a pair. A second copy of the same room would
// read as the page having looped instead.
//
// THE HEADLINE IS NOT GOLD ANY MORE. It was, on charcoal, where gold measures
// 5.6:1. Over a photograph even under a heavy scrim it lands near 2:1 and
// becomes decoration you cannot read. Warm white holds; the gold survives on the
// filled button, which carries ink on top of it and so brings its own contrast.
// ---------------------------------------------------------------------------

import { tokens, headline, layout, space, supporting, type as typeScale } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaButton, scrollToId } from './primitives';

/** Freed up by the about panel, which used to be two panels and carried this on
 * the curtains half. Warm light through cloth — atmosphere rather than a product
 * shot, which is right for the one section not naming a product. */
const BANNER = '/images/room-5.png';

export function FinalCta() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        // 562 = 1440 / 2.56, the same crop the recommendation banner now takes.
        // Both are full-bleed photographic bands doing the same job, and they
        // were cropping at two different ratios.
        minHeight: isMobile ? 420 : 562,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // One of the two focal sections at `xxxl`. Air is how this and the
        // visualiser are marked as more important than their neighbours.
        padding: layout.sectionPadFocal(isMobile),
        textAlign: 'center',
        // Behind the photograph rather than beside it — it is what shows while
        // the image is still loading, and charcoal keeps that moment on-brand
        // instead of flashing white.
        background: tokens.charcoal,
      }}
    >
      <img
        src={BANNER}
        // Decorative. The headline carries the meaning and the room is not a
        // product being described.
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 45%',
          display: 'block',
        }}
      />

      {/* Flat wash plus a radial. The text is centred, so the darkness is needed
          in the middle and nowhere else — a flat scrim heavy enough to hold type
          in the centre dulls the picture everywhere to solve a problem that only
          exists in one place. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(rgba(28,24,16,0.5), rgba(28,24,16,0.5)),
            radial-gradient(ellipse at center, rgba(28,24,16,0.62) 0%, rgba(28,24,16,0.15) 70%)`,
        }}
      />

      <div style={{ position: 'relative', maxWidth: layout.containerMax }}>
        <h2 style={{ ...headline.section, color: tokens.warmWhite }}>
          Ready to complete your home?
        </h2>
        <p
          style={{
            ...supporting.onDark,
            // Warm white rather than the muted variant — this sits on a
            // photograph, not a flat charcoal ground.
            color: tokens.warmWhite,
            marginTop: space.md,
            opacity: 0.88,
          }}
        >
          Design online. We measure, manufacture and install. Every time.
        </p>
        {/* Between-group: `xl` against the `md` inside the head block above,
            which is the 2.6× the hierarchy rule asks for. */}
        <div style={{ marginTop: space.xl }}>
          <CtaButton onClick={scrollToId('visualiser')}>Start Designing</CtaButton>
        </div>
        {/* The two objections that stop a last-section click, in one line and
            deliberately quiet — it reassures without becoming a second CTA. */}
        <p
          style={{
            ...typeScale.label,
            letterSpacing: 'normal',
            textTransform: 'none',
            fontWeight: 400,
            color: tokens.warmWhite,
            opacity: 0.7,
            marginTop: space.md,
          }}
        >
          Free measure &amp; installation included. No obligation.
        </p>
      </div>
    </section>
  );
}
