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

import { tokens, headline, eyebrow, layout, space, supporting } from '@/ds';
import { useIsMobile } from '@/shared';

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
    // THE 4:5 CAP IS GONE ON DESKTOP, AND IT WAS THE WHOLE SECTION'S HEIGHT.
    //
    // A 4:5 portrait crop in a half-width column is 945px tall at a 1512
    // viewport — taller than the laptop viewport it is on, and 195px taller than
    // the copy beside it, which needs 750. The section was as tall as its
    // photograph and the photograph was as tall as the ratio demanded.
    //
    // A FIXED RATIO HERE GUARANTEES DEAD SPACE AT EVERY WIDTH BUT ONE. The
    // column is half the viewport, so the image's height tracks the viewport
    // while the copy's height tracks its own line count — they agree at one
    // width and disagree everywhere else. Measured: 945 image against 750 copy at
    // 1512, but 512 against 790 at 1024, which is 278px of bare parchment under
    // the photograph. Any ratio I picked would only move which width looks wrong.
    //
    // So the image takes the row's height instead (grid's default stretch, which
    // is what `alignSelf: start` was overriding) and the section is exactly as
    // tall as its copy. The crop varies with the viewport, which is what the
    // previous note here objected to — but the source is 1.78 and this is a
    // 50/50 editorial panel, so a varying crop is the normal cost, and it buys a
    // section that is never taller than it needs to be.
    //
    // MOBILE KEEPS A RATIO, because stacked there is no row height to stretch to.
    // 3:2 landscape rather than 4:5 portrait: 260px tall instead of 488 at a
    // 390 viewport, and a wide crop of a wide source rather than half the room
    // thrown away.
    <div
      style={{
        overflow: 'hidden',
        width: '100%',
        ...(isMobile ? { aspectRatio: '3 / 2' } : { alignSelf: 'stretch', minHeight: 0 }),
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
        // SYMMETRIC: 52 / 80 / 52 / 80. The inner edge used to get 72 against the
        // outer 80, on the reasoning that the copy should sit closer to its
        // photograph than to the page edge. It was the only horizontally
        // asymmetric padding on the page, and an 8px difference is far too small
        // to read as intent — once every other inset is on a scale it reads as a
        // mistake instead.
        //
        // VERTICAL IS `xl` (52), NOT `xxl` (84). xxl is the standard SECTION pad,
        // and it is right where a band's air is the only thing separating a
        // heading from the section above it. This panel is not that shape: it is
        // a two-column row whose other half is a full-bleed photograph running to
        // all four edges, so the copy already has 80px of horizontal inset and a
        // hard edge doing the framing. 84 top and bottom on top of that was air
        // paid for twice.
        padding: isMobile
          ? `${space.section}px ${space.item}px`
          : `${space.section}px ${layout.inlinePad(isMobile)}px`,
      }}
    >
      {/* 560, NOT 480. Measured, "Measured, made and hung" needs 621px at the
          64px section size, so a 480 cap forced the first line of a two-line
          headline to wrap and the h2 rendered as THREE lines — 192px where the
          explicit <br> was written for 128. 560 does not fully fix that at every
          width (621 still does not fit a 1280 column), but it takes both body
          paragraphs from four lines to three, which is the larger saving. The
          headline's own wrap is left alone rather than solved by shrinking type
          off `headline.section` — that scale is every section heading on the
          site and this panel does not get a private one. */}
      <div style={{ maxWidth: 560 }}>
        <p style={{ ...eyebrow, marginBottom: space.item }}>Who makes them</p>
        {/* THREE LINES, ALL THREE SET BY HAND, because two is not available and
            the automatic wrap of three is ugly.

            Measured at the 64px section size: "Measured, made and hung" is 621px
            and the column offers 596 at its widest, so the two-line reading the
            single <br> was written for cannot happen at any viewport. Left to
            wrap it broke as "Measured, made and" (488) / "hung" (120) — a
            one-word orphan.

            Breaking after "Measured," instead gives 242 / 390 / 406: ascending,
            no orphan, and the italic clause is the longest line so it anchors the
            block. Checked at 1512, 1280, 1024 and 390 — the display size steps
            down with the clamp and all three lines still fit at every one, so
            these breaks hold rather than being tuned to one width.

            It also reads as the sequence it is: measured, made, hung. */}
        <h2 style={{ ...headline.section, color: tokens.ink }}>
          Measured,
          <br />
          made and hung
          <br />
          <span style={{ fontStyle: 'italic' }}>by the same people.</span>
        </h2>
        <div
          style={{
            ...supporting.onLight,
            marginTop: space.item,
            display: 'flex',
            flexDirection: 'column',
            // Between paragraphs: within-group, so `md`. The `xl` below is the
            // between-group step to the CTA — 2.6×, which is the hierarchy rule.
            gap: space.item,
          }}
        >
          {BODY.map(para => (
            <p key={para.slice(0, 24)} style={{ margin: 0 }}>
              {para}
            </p>
          ))}
        </div>
        {/* `lg` (32), not `xl` (52). The between-group step is right where the
            groups are siblings; here the CTA is the end of this one block of
            copy, and the block already closes with 52px of section padding under
            it. */}
        <div style={{ marginTop: space.group }}>
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
        background: tokens.band,
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
