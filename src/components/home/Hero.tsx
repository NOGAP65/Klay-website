// ---------------------------------------------------------------------------
// 3. Hero — full bleed, room photography, two CTAs.
//
// The nav sits over this section transparently, so the overlay has to do two
// jobs: hold the headline's contrast on the left, and keep the nav's own links
// legible across the top. That is why there are two gradients rather than one
// flat scrim — a single 50% wash would have muddied the photograph everywhere
// to solve a problem that only exists in two places.
// ---------------------------------------------------------------------------

import { tokens, eyebrow, headline, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaButton, scrollToId } from './primitives';

/** Roller blinds in a real room, shot wide. The hero has to show the product
 * doing its job, which rules out the furniture-led interiors in public/images. */
const HERO_IMAGE = '/images/lifestyle/room-living.png';

/** The nav's own height at rest, measured in the running page. Used to offset
 * the hero copy out from under it — see the note on the content container. */
const NAV_HEIGHT = 80;

export function Hero() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        position: 'relative',
        // Just short of the viewport, so the bottom edge of the section is
        // visible on load and the page reads as continuing.
        height: isMobile ? '88vh' : '96vh',
        minHeight: isMobile ? 540 : 660,
        maxHeight: 1000,
        overflow: 'hidden',
        background: tokens.charcoal,
      }}
    >
      <img
        src={HERO_IMAGE}
        alt="A living room with sunscreen roller blinds drawn to the sill"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // The blinds are in the upper half of the frame; centring vertically
          // crops them out on a tall viewport.
          objectPosition: 'center 38%',
          display: 'block',
        }}
      />

      {/* Left-to-right, for the copy */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(100deg, rgba(28,24,16,0.86) 0%, rgba(28,24,16,0.62) 38%, rgba(28,24,16,0.20) 78%, rgba(28,24,16,0.10) 100%)',
        }}
      />
      {/* Top-down, for the nav */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          background: 'linear-gradient(180deg, rgba(28,24,16,0.55) 0%, rgba(28,24,16,0) 100%)',
        }}
      />

      {/* Flush to the viewport edge, NOT inside a centred gridMax container
          like the sections below it. This is the alignment the previous hero
          had, and it is the right one for a full-bleed section: a centred
          container would walk the headline inwards as the viewport grows, so on
          a wide monitor the copy would drift towards the middle of the
          photograph while the section itself stayed edge to edge.

          paddingTop is the nav's height. The nav is transparent and overlays
          this section, so centring against the section's full height puts the
          copy behind it and reads high; this centres it in the space the nav
          leaves, which is what the old hero got from its marginTop. */}
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
        <div style={{ maxWidth: 780 }}>
          <p style={{ ...eyebrow, marginBottom: 24 }}>Klay Interiors</p>
          <h1 style={{ ...headline.hero, color: tokens.warmWhite }}>
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
              marginTop: 26,
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
            marginTop: isMobile ? 36 : 48,
          }}
        >
          {/* Design Yours scrolls to the visualiser rather than navigating: the
              tool it promises is on this page, and a page load to reach
              something already loaded is a cost with no benefit. */}
          <CtaButton onClick={scrollToId('visualiser')}>Design Yours</CtaButton>
          <CtaButton variant="ghost" onClick={scrollToId('how-it-works')}>
            How It Works
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
