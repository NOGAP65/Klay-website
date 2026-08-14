// ---------------------------------------------------------------------------
// 8. One 50/50 panel — who actually makes and hangs the things.
//
// This was two alternating panels, one per range: curtains argued as light and
// proportion, blinds as precision and control. Both are gone as arguments. By
// the time the reader is here they have had the range row, the recommendation
// banner and the visualiser — three sections that all say what the products are
// — and a fourth restating it in prose was the page selling the same thing for
// the fourth time.
//
// So the surviving half keeps its photograph and its side of the page, and the
// copy changes job: it is the only section that talks about Klay rather than
// about a product. That is the question left unanswered at this point in the
// page. The reader knows what they would be buying and roughly what it costs;
// what they do not know is who turns up at the house.
//
// EVERY CLAIM HERE IS ALREADY ON THE SITE. The measure and the install being
// included, the Melbourne manufacture, the two-year warranty and the Victoria
// coverage are the trust ticker's six items; the technicians being employed
// rather than contracted is AboutPage's. Nothing is invented for this panel —
// if a claim changes it has to change in those places too.
// ---------------------------------------------------------------------------

import { tokens, headline, eyebrow, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';

/** The clearest roller shot in the library — the bracket line across the head of
 * the glazing is the product this company makes, which is the right picture
 * beside copy about making it. Also the hero's still fallback, which is a reuse,
 * but they are eight sections apart. */
const IMAGE = '/images/lifestyle/room-living.png';

const BODY = [
  'Every blind and curtain is cut to your window in Melbourne and fitted by our own technicians — the people who came to measure are the people who come back to install. Nothing is handed to whichever contractor happens to be free that week.',
  'There are no showrooms and no sales reps, which is why the in-home measure and the installation are part of the price rather than lines added to the end of it. Two-year warranty, and we cover Victoria.',
];

export function AboutPanel() {
  const isMobile = useIsMobile();

  const image = (
    <div style={{ minHeight: isMobile ? 320 : 620, overflow: 'hidden' }}>
      <img
        src={IMAGE}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          minHeight: isMobile ? 320 : 620,
          objectFit: 'cover',
          objectPosition: 'center 40%',
          display: 'block',
        }}
      />
    </div>
  );

  const copy = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        // The inner edge gets less inset than the outer one, so the copy sits
        // closer to the photograph it belongs to than to the page edge.
        padding: isMobile ? '64px 24px' : `96px 72px 96px ${layout.inlinePad(isMobile)}px`,
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <p style={{ ...eyebrow, marginBottom: 22 }}>Who makes them</p>
        <h2 style={{ ...headline.section, color: tokens.ink }}>
          Measured, made and hung
          <br />
          <span style={{ fontStyle: 'italic' }}>by the same people.</span>
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
          {BODY.map(para => (
            <p key={para.slice(0, 24)} style={{ margin: 0 }}>
              {para}
            </p>
          ))}
        </div>
        <div style={{ marginTop: 36 }}>
          <CtaLink to="/about">About Klay →</CtaLink>
        </div>
      </div>
    </div>
  );

  return (
    <section
      style={{
        // Parchment, which is what the blinds panel carried when it was the
        // second of two. It still lands between the visualiser's cream and the
        // social proof below, so the page's no-two-adjacent-grounds rule holds
        // with the other panel gone.
        background: tokens.parchment,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}
    >
      {/* On mobile the photograph leads. A column of prose above the picture it
          belongs to is the wrong way round on a phone. */}
      {isMobile ? (
        <>
          {image}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {image}
        </>
      )}
    </section>
  );
}
