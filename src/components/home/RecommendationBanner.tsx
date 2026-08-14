// ---------------------------------------------------------------------------
// 6. The catch — for the customer who isn't ready to browse.
//
// It sits between the range and the visualiser deliberately. Someone who has just
// scrolled the whole range without clicking a tile is telling you they don't know
// which one is theirs, and the next thing they meet should be an offer to decide
// for them rather than a configurator that assumes they already have.
//
// A PHOTOGRAPH NOW, not a flat charcoal band. It is the one section on the page
// that asks a question rather than showing a product, and a full-bleed room behind
// it is what makes it read as an invitation rather than as an interruption between
// two things you were looking at. The frame is the whole back wall of a room in
// sheers — atmosphere rather than a product shot, which is right for a section
// that deliberately doesn't name a product.
//
// ON THE SCRIM, which is doing real work. This photograph is bright almost
// everywhere: pale cloth, sunlight, blond timber. Two consequences.
//
//   1. THE HEADLINE CANNOT BE GOLD. It was, on charcoal, where gold measures
//      5.6:1. Over this image even under a heavy scrim gold lands around 1.9:1 —
//      it would be decoration you cannot read. Warm white on the same ground is
//      4.4:1. The gold survives where it still holds: the filled CTA, which
//      carries its own contrast with ink on top of it.
//
//   2. THE SCRIM IS RADIAL, not flat. The text is centred, so the darkness is
//      needed in the middle and nowhere else — a flat wash heavy enough to hold
//      type in the centre dulls the photograph everywhere to solve a problem that
//      only exists in one place. This lands ~0.79 behind the words and ~0.53 at
//      the edges, so the picture is still a picture out where nothing sits on it.
//
// ON THE DESTINATION. The three-question recommender this CTA describes does not
// exist — there is no quiz route and no quiz component in the app. The button goes
// to the enquiry form, which is a real page staffed by a real person, so the
// promise is kept, just not self-service. Point it at the quiz once that is built.
// ---------------------------------------------------------------------------

import { tokens, headline, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';

const BANNER = '/images/range/sheer-curtains.jpg';

export function RecommendationBanner() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        // Taller than the flat band it replaces. At 300px a photograph is a strip
        // rather than a scene, and there is no point carrying one at all if it
        // cannot show a room.
        minHeight: isMobile ? 380 : 440,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '72px 24px' : '96px 80px',
        textAlign: 'center',
        // Behind the photograph rather than beside it — it is what shows while the
        // image is still loading, and charcoal keeps that moment on-brand instead
        // of flashing white.
        background: tokens.charcoal,
      }}
    >
      <img
        src={BANNER}
        // Decorative. The headline carries the meaning and the room is not a
        // product being described.
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Slightly below centre: the top third of this frame is ceiling track
          // and the bottom third is floor, so the cloth sits low in a letterbox
          // crop of it.
          objectPosition: 'center 58%',
          display: 'block',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(rgba(28,24,16,0.45), rgba(28,24,16,0.45)),
            radial-gradient(ellipse at center, rgba(28,24,16,0.62) 0%, rgba(28,24,16,0.15) 70%)`,
        }}
      />

      <div style={{ position: 'relative', maxWidth: layout.containerMax }}>
        {/* Below the section scale on purpose. This is a divider that happens to
            convert, and at the full 64px it competed with the range headline
            above it and the visualiser headline below — three headlines of equal
            weight in one screen, one of which is a passing offer. */}
        <h2
          style={{
            ...headline.section,
            color: tokens.warmWhite,
            fontSize: 'clamp(32px, 4vw, 48px)',
          }}
        >
          Not sure where to start?
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            lineHeight: 1.7,
            color: tokens.warmWhite,
            margin: '18px auto 0',
            maxWidth: 560,
            opacity: 0.88,
          }}
        >
          Answer a few questions and we&rsquo;ll recommend the right product for your room.
        </p>
        <div style={{ marginTop: 32 }}>
          <CtaLink to="/contact">Get My Recommendation</CtaLink>
        </div>
      </div>
    </section>
  );
}
