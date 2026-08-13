// ---------------------------------------------------------------------------
// 10. Testimonials — three quotes, three columns.
//
// The quotes are the ones already carried on the site (see ReviewsCarousel),
// with the product each customer actually bought named underneath, because a
// review that names the product is evidence and one that doesn't is decoration.
// No star rows, no cards, no avatars — a gold quotation mark, the words, and
// the attribution.
// ---------------------------------------------------------------------------

import { tokens, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SectionHead } from './primitives';

const QUOTES = [
  {
    quote:
      'Absolutely love my new roller blinds. The visualiser helped me choose the perfect fabric, and the installation was flawless.',
    name: 'Sarah M.',
    suburb: 'Toorak',
    product: 'Dusk Blockout',
  },
  {
    quote:
      'From start to finish the Klay team were professional and attentive. The blinds look stunning and the quality is exceptional.',
    name: 'James L.',
    suburb: 'Brighton',
    product: 'Veil Sunscreen',
  },
  {
    quote:
      'Best decision we made for our renovation. The made-to-measure fit is perfect and the motorised feature is a game changer.',
    name: 'Emma T.',
    suburb: 'South Yarra',
    product: 'Duo Dual Roller',
  },
];

export function Testimonials() {
  const isMobile = useIsMobile();

  return (
    <section
      id="reviews"
      style={{ background: tokens.warmWhite, padding: layout.sectionPad(isMobile) }}
    >
      <div style={{ maxWidth: layout.containerMax, margin: '0 auto' }}>
        <SectionHead
          label="Reviews"
          title="What our customers say"
          align="center"
          style={{ marginBottom: isMobile ? 52 : 80 }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 52 : 56,
          }}
        >
          {QUOTES.map(q => (
            <figure key={q.name} style={{ margin: 0 }}>
              {/* Decorative, so it is hidden from assistive tech — the mark is
                  punctuation the sighted reader gets for free from the layout. */}
              <div
                aria-hidden="true"
                style={{
                  fontFamily: tokens.display,
                  // Cormorant sets its quotation marks small relative to the em,
                  // so this needs to be well past the headline sizes to read as
                  // the large mark it is meant to be.
                  fontSize: 116,
                  fontWeight: 400,
                  lineHeight: 0.62,
                  color: tokens.gold,
                  marginBottom: 18,
                  userSelect: 'none',
                }}
              >
                &ldquo;
              </div>
              <blockquote
                style={{
                  fontFamily: tokens.display,
                  fontSize: 22,
                  fontStyle: 'italic',
                  fontWeight: 300,
                  lineHeight: 1.5,
                  color: tokens.ink,
                  margin: 0,
                }}
              >
                {q.quote}
              </blockquote>
              <figcaption
                style={{
                  fontFamily: tokens.body,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: tokens.inkFaint,
                  marginTop: 26,
                  lineHeight: 1.9,
                }}
              >
                <span style={{ color: tokens.ink }}>{q.name}</span>
                <br />
                {q.suburb} · {q.product}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
