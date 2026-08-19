// ---------------------------------------------------------------------------
// 3. Hero — full bleed, room footage, one line and one button.
//
// SIMPLIFIED. The opening viewport carried about twenty-five discrete elements
// and four independent motions: the ticker sliding at 42px/s, the range rail
// rotating every five seconds, the video's own movement, and the montage's cuts.
// Three of those competed for the first two seconds on the page, which is the
// only two seconds a first-time visitor reliably gives.
//
// Three things went, and three of the four were duplication rather than content:
//
//   HeroRangeRail — the 24% right panel, seven elements plus rotating imagery.
//     Its job was showing the range; Our Range does that immediately below.
//   The lead paragraph — authorised removal. It leaves an orientation gap: the
//     sentence that said what Klay sells is no longer above the fold, and the
//     eyebrow and headline carry brand rather than category. The steps bar 58px
//     below does most of that work now.
//   The "How It Works" ghost CTA — the steps bar directly beneath this hero is
//     itself a link to /how-it-works, so that was one destination twice in one
//     viewport.
//
// Thirteen elements down to three: eyebrow, headline, CTA.
//
// THE SCRIM IS THE REAL CHANGE. The old one ran a 100deg ramp from 0.88 at the
// left edge to 0.15 at the right — 88% obscured on the left, 66% across the
// middle, and never more than 85% of the picture visible anywhere. It was a
// video hero in which the video had never actually been seen. With the type in
// one corner rather than spread across the frame, protection is needed in only
// two places, so there are two localised gradients and the band from ~14% to 50%
// of the frame height carries no scrim alpha at all.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { tokens, eyebrow, headline, layout, prefersReducedMotion, space } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaButton, scrollToId } from './primitives';
import { BAR_HEIGHT as TICKER_HEIGHT } from './TrustTicker';
import { STEPS_BAR_HEIGHT } from './StepsBar';

const HERO_VIDEO = '/hero_video.mp4';

/** Shown instead of the video when the visitor has asked for reduced motion, and
 * used as the video's `poster` besides. Without a poster the hero's first paint
 * — this page's LCP element — is whatever the browser decides to show, usually
 * nothing, and the first frame then arrives as a visible jump. */
const HERO_STILL = '/images/lifestyle/room-living.png';

/** Shared by the video and its still fallback, so the two fill the section
 * identically and swapping between them cannot shift the framing.
 *
 * `center center`, and deliberately NOT offset. The source is a montage — cuts
 * between several scenes, including a wardrobe interior and a curtain scene — so
 * it has no single focal point. An offset that protects one scene's composition
 * destroys another's, and at wide viewports, where the crop grows to around a
 * third of the height, the choice becomes a lottery over which scenes survive.
 * Centre is the only defensible value across scenes.
 *
 * If the source is ever swapped for a single looped scene this becomes tunable
 * again, and should be tuned: with one fixed composition there is a right answer
 * here, where currently there is not. */
const backdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center center',
  display: 'block',
};

export function Hero() {
  const isMobile = useIsMobile();
  // Read once, on mount. index.html kills CSS animation under a reduced-motion
  // preference, but an autoplaying video is not a CSS animation and slips
  // straight through that rule — it has to be handled here.
  const [reduceMotion] = useState(prefersReducedMotion);

  return (
    <section
      style={{
        // DERIVED, NEVER HARDCODED — the viewport less the two fixed-height bars
        // above and below it, each read from its own definition.
        //
        // It used to subtract 312: ticker 38, steps bar 54, and 220 reserved so
        // the Our Range band would peek above the fold. Two things were wrong
        // with that. The 54 was already stale — the bar measured 53.59, and the
        // design-system pass moved it again — and a literal goes wrong silently,
        // leaving the hero a few pixels over the fold with nothing to flag it.
        // The 220 cost the hero 274px and left it at 588, shorter than four of
        // the page's content sections. The steps bar sitting on the fold is the
        // scroll cue now, at ~58px instead of 274.
        //
        // svh rather than vh: on mobile `100vh` is the viewport with the address
        // bar hidden, so a vh-sized hero jumps by the bar's height the moment the
        // page scrolls. svh is the smallest stable viewport and does not move.
        height: `calc(100svh - ${TICKER_HEIGHT + STEPS_BAR_HEIGHT}px)`,
        // Floors, so the hero survives a short laptop or a landscape phone. Below
        // these the sum stops being achievable and legibility wins over the fold.
        minHeight: isMobile ? 420 : 460,
        maxHeight: 1000,
        overflow: 'hidden',
        background: tokens.charcoal,
        // One full-bleed column. It was a 76/24 grid holding the video and the
        // range rail; with the rail gone the video takes the whole frame.
        position: 'relative',
      }}
    >
      {reduceMotion ? (
        <img
          src={HERO_STILL}
          alt="A living room with sunscreen roller blinds drawn to the sill"
          style={backdropStyle}
        />
      ) : (
        <video
          // muted AND playsInline are both load-bearing, not belt and braces:
          // without muted no browser will autoplay at all, and without
          // playsInline iOS Safari takes the video fullscreen instead of playing
          // it in place.
          autoPlay
          muted
          loop
          playsInline
          poster={HERO_STILL}
          // Decorative — the headline carries the meaning.
          aria-hidden="true"
          tabIndex={-1}
          style={backdropStyle}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}

      {/* THE BOTTOM GRADIENT — protects the type stack and nothing else. It
          reaches zero at half the frame height, so everything above that line is
          the photograph unmodified.
          Composited against a worst-case white frame at the 0.80 stop: warm white
          measures 5.44:1 against a 4.5 requirement, and the 76px gold second line
          measures 3.55:1 against the 3:1 large-text threshold. Both pass. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(to top, rgba(28,24,16,0.80) 0%, rgba(28,24,16,0.50) 20%, rgba(28,24,16,0.15) 36%, transparent 50%)',
        }}
      />

      {/* THE TOP GRADIENT — protects the nav, and nothing else. 110px, the nav's
          own height plus a little. The nav is transparent over this section now
          rather than carrying an opaque charcoal band, so this is what its links
          read against. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 110,
          pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(28,24,16,0.45) 0%, transparent 100%)',
        }}
      />

      {/* LOWER-LEFT, not centred. Centred type over video is the most templated
          hero pattern there is, and ranging it into one corner is what leaves the
          frame's upper two-thirds clear — which is the point of rebuilding the
          scrim in the first place. */}
      <div
        style={{
          position: 'absolute',
          left: layout.inlinePad(isMobile),
          right: layout.inlinePad(isMobile),
          bottom: space.xxl,
          maxWidth: 700,
        }}
      >
        {/* WARM WHITE, NOT GOLD, and this is forced rather than preferred. Gold
            only ever passed here because the old 0.88 scrim was effectively a
            solid dark ground. Any scrim light enough to reveal the video puts
            gold near 2.3:1, and at 10px it needs 4.5:1 — no scrim value both
            shows the footage and keeps a gold eyebrow legible.
            The upside is that gold now appears exactly once in the hero, as the
            CTA fill. */}
        <p style={{ ...eyebrow, color: tokens.warmWhite, marginBottom: space.md }}>
          Klay Interiors
        </p>

        {/* The page's one h1, written out rather than going through SectionHead,
            which emits an h2. The line break and the italic gold second line are
            the existing treatment, unchanged. */}
        <h1 style={{ ...headline.hero, color: tokens.warmWhite }}>
          The finishing layer
          <br />
          of <span style={{ fontStyle: 'italic', color: tokens.gold }}>your home.</span>
        </h1>

        {/* Design Yours scrolls to the visualiser rather than navigating: the
            tool it promises is on this page, and a page load to reach something
            already loaded is a cost with no benefit. */}
        <div style={{ marginTop: space.lg }}>
          <CtaButton onClick={scrollToId('visualiser')}>Design Yours</CtaButton>
        </div>
      </div>
    </section>
  );
}
