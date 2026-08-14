// ---------------------------------------------------------------------------
// 3. Hero — full bleed, room footage, two CTAs.
//
// The nav sits over this section transparently, so the overlay has to do two
// jobs: hold the headline's contrast on the left, and keep the nav's own links
// legible across the top. That is why there are two gradients rather than one
// flat scrim — a single 50% wash would have muddied the picture everywhere to
// solve a problem that only exists in two places.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { tokens, eyebrow, headline, layout, prefersReducedMotion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaButton, CtaLink, scrollToId } from './primitives';
import { HeroRangeRail } from './HeroRangeRail';

const HERO_VIDEO = '/hero_video.mp4';

/** Shown instead of the video when the visitor has asked for reduced motion.
 * A poster frame would not do here: it would still be the video element, and a
 * still frame of unknown content is a worse first paint than a photograph
 * chosen for the job. Roller blinds in a real room, shot wide. */
const HERO_STILL = '/images/lifestyle/room-living.png';

/** The nav's own height at rest, measured in the running page. Used to offset
 * the hero copy out from under it — see the note on the content container. */
const NAV_HEIGHT = 80;

/** Everything between the top of the document and the first product photograph,
 * excluding the hero: the trust ticker (38), the steps bar (54) and the range
 * band that carries the eyebrow, "Our Range" and its one line (220, measured in
 * the running page).
 *
 * The hero is sized to fill exactly what is left, so a visitor landing on the
 * page sees the hero, the steps bar and the whole of the range heading — and the
 * cards start one pixel below the fold. That is deliberate: the heading is the
 * promise of product, and stopping there is what makes the page ask to be
 * scrolled rather than showing a row of half-cut cards on arrival.
 *
 * The nav is not in this sum. It is position:fixed and overlays the hero rather
 * than taking a row of its own, which is also why the hero still carries
 * NAV_HEIGHT of top padding to keep its copy clear of it. */
const ABOVE_CARDS = 38 + 54 + 220;
const ABOVE_CARDS_MOBILE = 38 + 52 + 180;

/** The share of the hero given to the video. The remaining 24% is held for the
 * range rail that runs beside it — see the note on the reserved column.
 *
 * Was 70/30, and the rail was a product card. 24% is not enough width to put a
 * named SKU and a price in front of anyone properly, which is what forced the
 * question of what that column is actually for: it is the range, one category at
 * a time, and a category needs a photograph and two lines rather than a card. */
const MEDIA_COLUMN = '76%';

/** Shared by the video and its still fallback, so the two fill the section
 * identically and swapping between them can't shift the framing. */
const backdropStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
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
        // Sized to land the fold exactly on the range heading — see ABOVE_CARDS.
        // It was a flat 96vh, which put the hero's own bottom edge just above the
        // fold and everything below it wherever it happened to fall.
        height: `calc(100vh - ${isMobile ? ABOVE_CARDS_MOBILE : ABOVE_CARDS}px)`,
        // Floors, so the hero survives a short laptop or a landscape phone. Below
        // these the sum stops being achievable and legibility wins over the fold.
        minHeight: isMobile ? 420 : 460,
        maxHeight: 1000,
        overflow: 'hidden',
        background: tokens.charcoal,
        // 76/24. The video and the copy take the left; the right is held empty
        // for the range rail. One column on a phone, where 24% of the width is
        // not enough to run anything in.
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : `${MEDIA_COLUMN} 1fr`,
      }}
    >
      {/* The media column. position:relative moved here from the section, so the
          video, its scrim and the copy all size to 70% rather than to the full
          width — absolutely-positioned children resolve against their nearest
          positioned ancestor, and left on the section they would have spanned the
          reserved column too. */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
      {reduceMotion ? (
        <img
          src={HERO_STILL}
          alt="A living room with sunscreen roller blinds drawn to the sill"
          style={{
            ...backdropStyle,
            // The blinds are in the upper half of this frame; centring
            // vertically crops them out on a tall viewport.
            objectPosition: 'center 38%',
          }}
        />
      ) : (
        <video
          // muted AND playsInline are both load-bearing, not belt and braces:
          // without muted no browser will autoplay at all, and without
          // playsInline iOS Safari takes the video fullscreen instead of
          // playing it in place.
          autoPlay
          muted
          loop
          playsInline
          // Decorative — the headline carries the meaning, and the copy below
          // describes what is on screen.
          aria-hidden="true"
          tabIndex={-1}
          style={backdropStyle}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      )}

      {/* Left-to-right, for the copy. Its stops moved right with the column: the
          same ramp that cleared the headline across a full-width hero runs out of
          scrim well before the right edge of a 76% one, because the copy now
          occupies a much larger share of the frame it sits on. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(100deg, rgba(28,24,16,0.88) 0%, rgba(28,24,16,0.66) 45%, rgba(28,24,16,0.28) 85%, rgba(28,24,16,0.15) 100%)',
        }}
      />
      {/* The top-down gradient is gone. It existed for one reason — keeping the
          nav's links legible where they crossed a bright frame of the video — and
          the nav is opaque charcoal at every scroll position now, so it carries
          its own ground and the wash was darkening the top of the picture to
          solve a problem that no longer exists. */}

      {/* Flush to the viewport edge, NOT inside a centred gridMax container
          like the sections below it. This is the alignment the previous hero
          had, and it is the right one for a full-bleed section: a centred
          container would walk the headline inwards as the viewport grows, so on
          a wide monitor the copy would drift towards the middle of the
          photograph while the section itself stayed edge to edge.

          paddingTop is the nav's height. The nav overlays this section rather
          than sitting above it, so centring against the section's full height
          puts the copy behind it and reads high; this centres it in the space the
          nav leaves. */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          padding: `${NAV_HEIGHT}px ${layout.inlinePad(isMobile)}px 0`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Written out rather than going through SectionHead, which emits an
            h2 — this is the page's one h1. */}
        <div style={{ maxWidth: 700 }}>
          <p style={{ ...eyebrow, marginBottom: 20 }}>Klay Interiors</p>
          {/* Below the shared hero scale. That clamp tops out at 100px, sized for
              a hero running the full width of the viewport; inside a 76% column
              with 80px of inset there are about 934px to play with, and "The
              finishing layer" sets to roughly 855 at 100px — it would have
              wrapped mid-phrase on exactly the widths this is tuned for. */}
          <h1
            style={{
              ...headline.hero,
              fontSize: 'clamp(38px, 5.4vw, 76px)',
              color: tokens.warmWhite,
            }}
          >
            The finishing layer
            <br />
            of <span style={{ fontStyle: 'italic', color: tokens.gold }}>your home.</span>
          </h1>
          {/* Brighter than tokens.onDarkMuted, which is tuned for a flat
              charcoal ground. This line lands over the sunlit half of the
              photograph, where 0.6 warm white drops to the edge of legible. */}
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 17,
              lineHeight: 1.7,
              color: 'rgba(245,242,237,0.86)',
              margin: 0,
              marginTop: 22,
              // Kept well inside the column so the line breaks where it reads
              // best rather than at whatever width the 70% happens to be.
              maxWidth: 560,
            }}
          >
            Blinds, curtains and wardrobes. Measured and installed by experts. See it in your
            space before you buy.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            marginTop: isMobile ? 32 : 40,
          }}
        >
          {/* Design Yours scrolls to the visualiser rather than navigating: the
              tool it promises is on this page, and a page load to reach
              something already loaded is a cost with no benefit. */}
          <CtaButton onClick={scrollToId('visualiser')}>Design Yours</CtaButton>
          {/* Navigates now rather than scrolling. It pointed at #how-it-works,
              which was a section on this page until that section was replaced by
              the gold steps bar immediately below this hero — the anchor no longer
              exists, and scrollIntoView on a missing element fails silently, so
              the button would have looked broken rather than errored. The full
              process, photographs and all, is the /how-it-works page. */}
          <CtaLink variant="ghost" to="/how-it-works">
            How It Works
          </CtaLink>
        </div>
      </div>
      </div>

      {/* The 24%: one category at a time, on white, changing every five seconds.
          Desktop only — at phone widths there is no second column to put it in,
          and the range row a screen below is the same job done properly for that
          viewport. */}
      {!isMobile && <HeroRangeRail />}
    </section>
  );
}
