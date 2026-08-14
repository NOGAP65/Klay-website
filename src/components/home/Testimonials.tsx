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

import { useEffect, useRef, useState } from 'react';
import { tokens, prefersReducedMotion } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { SectionBand } from './primitives';

/** Pixels per second. Slow enough to read a quote as it passes — the point is
 * that the row is alive, not that it is going anywhere. */
const SPEED = 26;

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
        paddingRight: isMobile ? 32 : 56,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          fontFamily: tokens.display,
          // Cormorant sets its quotation marks small relative to the em, so this
          // has to run well past the headline sizes to read as the large mark it
          // is meant to be.
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
          fontSize: isMobile ? 19 : 21,
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
          marginTop: 24,
          lineHeight: 1.9,
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
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  // Read once. A row that slides sideways forever is precisely what this
  // preference exists to stop, so under it the marquee holds still and becomes a
  // strip the reader scrolls themselves.
  const [reduceMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (reduceMotion || paused) return;
    let frame = 0;
    let last: number | null = null;

    const step = (now: number) => {
      const track = trackRef.current;
      if (track) {
        // Delta-driven, so the speed is the same on a 60Hz and a 144Hz screen,
        // and a paused-then-resumed row carries on from where it stopped rather
        // than restarting from zero.
        const dt = last === null ? 0 : (now - last) / 1000;
        last = now;
        // The list is rendered twice, so half the scroll width is one full pass.
        // Wrapping there rather than at the end means the seam always lands on an
        // identical frame and is invisible.
        const half = track.scrollWidth / 2;
        if (half > 0) offsetRef.current = (offsetRef.current + dt * SPEED) % half;
        track.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [paused, reduceMotion]);

  return (
    // Warm white. It was parchment for as long as the install strip sat directly
    // above it — two warm whites touching would have run together as one field.
    // The journal tiles divide them again now, and they are charcoal, so this can
    // go back to the brand's own testimonial ground.
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
          paddingBottom: isMobile ? 68 : 92,
          paddingLeft: isMobile ? 24 : 80,
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            width: 'max-content',
            // willChange keeps the track on its own compositor layer; without it
            // a transform this wide repaints the section every frame.
            willChange: 'transform',
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
