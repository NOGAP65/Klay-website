// ---------------------------------------------------------------------------
// 9. Editorial panel — photograph left, argument right.
//
// Full-bleed rather than contained: the photograph runs to the left edge of the
// viewport and the copy column carries its own inset, so the image reads as a
// window in the page instead of a picture in a box. The two halves are equal
// and the copy is vertically centred against the photograph, which is what
// makes the layout read as considered rather than as a two-column grid.
// ---------------------------------------------------------------------------

import { tokens, headline, eyebrow, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';

const PANEL_IMAGE = '/images/room-4.png';

export function EditorialPanel() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        background: tokens.parchment,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}
    >
      <div style={{ minHeight: isMobile ? 320 : 640, overflow: 'hidden' }}>
        <img
          src={PANEL_IMAGE}
          alt="A roller blind and a sheer curtain fitted in the same room"
          style={{
            width: '100%',
            height: '100%',
            minHeight: isMobile ? 320 : 640,
            objectFit: 'cover',
            objectPosition: 'center 42%',
            display: 'block',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? '64px 24px' : `96px ${layout.inlinePad(isMobile)}px 96px 72px`,
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <p style={{ ...eyebrow, marginBottom: 22 }}>The Klay difference</p>
          <h2 style={{ ...headline.section, color: tokens.ink }}>
            Measured and installed.
            <br />
            <span style={{ fontStyle: 'italic' }}>Never a gap.</span>
          </h2>
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              lineHeight: 1.85,
              color: tokens.inkSoft,
              marginTop: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <p style={{ margin: 0 }}>
              Most of what goes wrong with a blind goes wrong before it is made. A window measured
              10mm wide lets a stripe of light down one side for the next decade, and no fabric
              choice fixes it.
            </p>
            <p style={{ margin: 0 }}>
              So we don't ask you to measure. A Klay technician comes to your home, measures every
              window himself, and returns to install what he specified — which means there is one
              person accountable for the fit, and it isn't you.
            </p>
          </div>
          <div style={{ marginTop: 36 }}>
            <CtaLink to="/how-it-works">Learn How It Works</CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
