// ---------------------------------------------------------------------------
// 7. Editorial separator — the catch for someone who isn't ready to browse.
//
// It sits between the range and the visualiser deliberately: a customer who
// scrolled past six priced products without clicking one is telling you they
// don't know which they need, and the next thing they meet should be an offer to
// decide for them rather than a configurator that assumes they already have.
//
// NOTE ON THE DESTINATION. The three-question recommender this CTA describes
// does not exist — there is no quiz route and no quiz component in the app. The
// button goes to the enquiry form, which is a real page staffed by a real
// person, so the promise ("we'll recommend the right product") is still kept,
// just not self-service. Point it at the quiz here once that is built.
// ---------------------------------------------------------------------------

import { tokens, headline, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';

export function RecommendationBanner() {
  const isMobile = useIsMobile();

  return (
    <section
      style={{
        // Parchment, not charcoal. It sits between the range grid's dark tiles and
        // the visualiser, which is now dark itself — as charcoal it would have run
        // straight into the section below it and stopped being a divider at all.
        // Parchment rather than warmWhite so it also differs from the range band
        // above, which leaves all three grounds through here distinct.
        background: tokens.parchment,
        // Short by design — it is a divider that happens to convert, not a
        // section competing with the two it separates.
        minHeight: isMobile ? 260 : 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '64px 24px' : '72px 80px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: layout.containerMax }}>
        {/* Ink, not the gold this headline had on charcoal. Gold on parchment is
            about 1.9:1 — it fails the 3:1 that even display-size text needs, and
            it looked washed out rather than accented. The gold survives where it
            still reads: the eyebrow-weight CTA below. */}
        <h2 style={{ ...headline.section, color: tokens.ink, fontSize: 'clamp(32px, 4vw, 48px)' }}>
          Not sure where to start?
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            lineHeight: 1.7,
            color: tokens.inkSoft,
            margin: 0,
            marginTop: 18,
            maxWidth: 560,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Answer three questions and we'll recommend the right product for your room.
        </p>
        <div style={{ marginTop: 32 }}>
          <CtaLink to="/contact">Get My Recommendation</CtaLink>
        </div>
      </div>
    </section>
  );
}
