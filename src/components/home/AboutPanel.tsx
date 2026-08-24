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

import { tokens, headline, eyebrow, layout, space, supporting } from '../../theme';
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
    // CAPPED AT 4:5 RATHER THAN STRETCHED TO THE COPY'S HEIGHT.
    //
    // It rendered at 720 × 787 — a 0.91 ratio, arbitrary because the column was
    // matching whatever height the prose beside it happened to make. Cropped
    // from a 1.78 source that is a 49% horizontal crop: half the room was gone,
    // and the amount that was gone changed with the copy.
    //
    // 4:5 is the install strip's ratio, so the site has one portrait crop
    // instead of two. `alignSelf: start` is what stops the grid stretching it.
    <div
      style={{
        overflow: 'hidden',
        aspectRatio: '4 / 5',
        alignSelf: 'start',
        width: '100%',
      }}
    >
      <img
        src={IMAGE}
        alt=""
        style={{
          width: '100%',
          height: '100%',
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
        // SYMMETRIC NOW: 84 / 80 / 84 / 80. The inner edge used to get 72
        // against the outer 80, on the reasoning that the copy should sit closer
        // to its photograph than to the page edge. It was the only horizontally
        // asymmetric padding on the page, and an 8px difference is far too small
        // to read as intent — once every other inset is on a scale it reads as a
        // mistake instead.
        padding: isMobile
          ? `${space.xl}px ${space.md}px`
          : `${space.xxl}px ${layout.inlinePad(isMobile)}px`,
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <p style={{ ...eyebrow, marginBottom: space.md }}>Who makes them</p>
        <h2 style={{ ...headline.section, color: tokens.ink }}>
          Measured, made and hung
          <br />
          <span style={{ fontStyle: 'italic' }}>by the same people.</span>
        </h2>
        <div
          style={{
            ...supporting.onLight,
            marginTop: space.md,
            display: 'flex',
            flexDirection: 'column',
            // Between paragraphs: within-group, so `md`. The `xl` below is the
            // between-group step to the CTA — 2.6×, which is the hierarchy rule.
            gap: space.md,
          }}
        >
          {BODY.map(para => (
            <p key={para.slice(0, 24)} style={{ margin: 0 }}>
              {para}
            </p>
          ))}
        </div>
        <div style={{ marginTop: space.xl }}>
          <CtaLink to="/about">About Klay →</CtaLink>
        </div>
      </div>
    </div>
  );

  return (
    <section
      style={{
        // PARCHMENT — AND THIS IS THE THIRD VALUE IN THREE COMMITS, which is
        // worth stating plainly rather than looking like churn.
        //
        // It was parchment, with the warm white full-range strip above it. That
        // strip was deleted, the parchment visualiser landed directly on top of
        // this, and it went warm white to keep the two apart. The install strip
        // now sits in that slot instead, warm white, so this goes back to
        // parchment — which also separates it from the warm white reviews below.
        //
        // The value is not the point; the neighbours are. See THE GROUNDS in
        // HomePage before changing either.
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
