// ---------------------------------------------------------------------------
// Testimonials — a continuous side-to-side marquee.
//
// It was a static three-column grid; it moves again now. Movement earns its place
// here specifically: five reviews do not fit three columns without dropping two,
// and a row that drifts says "there are more of these" in a way a grid of exactly
// three cannot.
//
// HOW IT MOVES. A transform on an inner track, not scrollLeft. The old carousel
// drove el.scrollLeft from a timestamp — `(elapsed * speed) % (scrollWidth / 3)` —
// which had two faults: the elapsed clock restarted from zero every time the
// pointer left, so unpausing snapped the row back to the beginning, and it fought
// anyone who tried to scroll the strip by hand. Here the offset lives in a ref and
// is advanced by the frame delta, so pausing and resuming is seamless, and the
// list is duplicated once with the offset wrapping at exactly half the track so
// the loop has no visible seam.
//
// The styling is the grid's: a large gold quotation mark, the quote in Cormorant
// italic, and the attribution in small Inter caps. No stars and no rating widget —
// the words are the evidence.
// ---------------------------------------------------------------------------

import { useState } from 'react';
import { tokens, prefersReducedMotion, space, layout, type as typeScale } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SectionBand } from './primitives';

/** How long one full pass of the five reviews takes. Slow — the point is that
 * the row is alive, not that it is going anywhere.
 *
 * A duration rather than the pixels-per-second the rAF loop used, because that
 * is what a keyframed transform takes. Ten cards at ~436px each is roughly
 * 4,360px, so 160s is about 27px/s — the pace the loop ran at. */
const DURATION_S = 160;

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
  {
    quote:
      'Exceptional service and quality. The installer took his time to make sure everything was perfect. Highly recommend them.',
    name: 'Michael R.',
    suburb: 'Hawthorn',
    product: 'Dusk Blockout',
  },
  {
    quote:
      'The online design process was so easy. I could see exactly how my blinds would look before ordering. Beautiful results.',
    name: 'Lisa K.',
    suburb: 'Malvern',
    product: 'Sheer Curtains',
  },
];

function Quote({ q, isMobile }: { q: (typeof QUOTES)[number]; isMobile: boolean }) {
  return (
    <figure
      style={{
        flex: '0 0 auto',
        width: isMobile ? 290 : 380,
        margin: 0,
        // The cards are separated by air, not by rules or card edges — the same
        // restraint the grid had.
        paddingRight: isMobile ? space.lg : space.xl,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          // Cormorant sets its quotation marks small relative to the em, so the
          // ornament role runs well past the headline sizes to read as the large
          // mark it is meant to be.
          ...typeScale.ornament,
          // goldText: this sits on a light card ground where the brand gold
          // measures 2.47.
          color: tokens.goldText,
          marginBottom: space.md,
          userSelect: 'none',
        }}
      >
        &ldquo;
      </div>
      <blockquote
        style={{
          ...typeScale.card,
          fontStyle: 'italic',
          lineHeight: 1.5,
          color: tokens.ink,
        }}
      >
        {q.quote}
      </blockquote>
      <figcaption
        style={{
          ...typeScale.micro,
          // inkSoft, not inkFaint. At 0.4 this measured 2.50 on cream and 2.44
          // on parchment — it was the clearest case of a non-text token
          // carrying text. inkSoft at 0.7 measures 5.86–6.33.
          color: tokens.inkSoft,
          marginTop: space.md,
        }}
      >
        <span style={{ color: tokens.ink }}>{q.name}</span>
        <br />
        {q.suburb} · {q.product}
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const isMobile = useIsMobile();
  const [paused, setPaused] = useState(false);
  // Read once. A row that slides sideways forever is precisely what this
  // preference exists to stop, so under it the marquee holds still and becomes a
  // strip the reader scrolls themselves.
  const [reduceMotion] = useState(prefersReducedMotion);

  return (
    // WARM WHITE. The section-ground sequence is reassigned in this pass so no
    // two adjacent sections share one, and this is the last light section before
    // the ink footer: about panel (parchment) → final CTA (charcoal) → reviews
    // (warm white) → footer (ink).
    //
    // The old note here reasoned that two warm whites touching would run
    // together as one field. That was true when the install strip sat directly
    // above; the charcoal final CTA sits between them now, so the join it was
    // guarding against no longer exists.
    <section id="reviews" style={{ background: tokens.warmWhite }}>
      <SectionBand label="Reviews" title="What our customers say" isMobile={isMobile} />

      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className={reduceMotion ? 'klay-hscroll' : undefined}
        style={{
          // Hidden while it animates, scrollable when it does not — under reduced
          // motion the reader needs some way to reach the quotes that are off
          // screen.
          overflowX: reduceMotion ? 'auto' : 'hidden',
          paddingBottom: isMobile ? space.xl : space.xxl,
          paddingLeft: layout.inlinePad(isMobile),
        }}
      >
        {/* A CSS ANIMATION, NOT A rAF LOOP — see the same note in TrustTicker.
            Between them the two marquees were writing `style.transform` from
            JavaScript on every frame, forever, which invalidated style on both
            subtrees every frame: 592 style recalculations in two idle seconds
            and 35% of a throttled CPU, starving every other animation on the
            page. `klay-testimonials` was already declared in index.html — twice,
            in fact — and unused.
            PAUSE IS animation-play-state, not a torn-down loop. The old version
            cancelled its rAF on hover, which was the reason the offset had to
            live in a ref: a restarted loop began from zero. Pausing the
            animation holds the exact position with no bookkeeping at all. */}
        <div
          style={{
            display: 'flex',
            width: 'max-content',
            // Its own compositor layer; without it a transform this wide
            // repaints the section every frame.
            willChange: 'transform',
            animation: reduceMotion ? undefined : `klay-testimonials ${DURATION_S}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {/* Twice. The duplicate is what the wrap at half-width lands on, and it
              is aria-hidden so a screen reader is not read five reviews twice. */}
          {QUOTES.map(q => (
            <Quote key={q.name} q={q} isMobile={isMobile} />
          ))}
          <div aria-hidden="true" style={{ display: 'flex' }}>
            {QUOTES.map(q => (
              <Quote key={`dup-${q.name}`} q={q} isMobile={isMobile} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
