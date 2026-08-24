// ---------------------------------------------------------------------------
// The homepage. Eleven sections, one job each.
//
// EVERY SECTION ANSWERS ONE QUESTION, in the order a customer asks it:
//
//    1  Is this legitimate?              trust ticker
//    3  What is this?                    hero
//    4  Where do I start?                steps bar
//    5  What can I buy, what's it cost?  four bestsellers
//    6  What if I don't know?            recommendation banner
//    7  What will it look like?          visualiser
//    8  Does it really look like that?   install strip
//    9  Who actually does the work?      about panel
//   10  Does anyone else trust them?     reviews
//
// THE TAIL IS A CLAIM AND THEN ITS RECEIPTS. 7 renders your own window, 8 is
// photographs of the same thing in real houses, 9 is who turned up to do it, 10
// is those people saying it went fine. The install strip used to be at the very
// bottom and the about panel directly under the visualiser, which answered "does
// it really look like that?" four sections after the render raised it.
//
// THERE IS NO FINAL CTA ANY MORE. A charcoal "Ready to complete your home?" band
// sat between the about panel and the reviews; its button scrolled back up to
// #visualiser, which from that far down is a trip to somewhere the visitor has
// already been. The ask is never more than a glance away regardless — Book a
// Measure is in the nav on every screen, the hero has Design Yours, and the range
// cards carry their own Visualise badges. The page ends on other people's voices,
// which is what the note on the reviews section always argued was better than a
// second button.
//
// THE RANGE IS ONE SECTION NOW, and this is the thing to understand before
// touching it. Section 5 SELLS: four bestsellers at reference scale with the
// configurator on them, one per part of the business. "What else do you make?"
// used to be its own section — FullRange, the other ten as small tiles with no
// buttons — and it is gone; the answer is the "Shop the full range" action on
// section 5, worded to say it leads somewhere bigger than what is on screen.
//
// The history is worth keeping, because it is a loop this page has been round
// twice. Every version BEFORE the split put selling and listing in one section
// and lost one of them — a fourteen-card scroller whose visible four were all
// indoor blinds, then a six-up grid that showed the shape of the range and ran
// to 1,649px doing it. The split fixed that by giving each job its own section.
// Removing the listing side is NOT a return to those: nothing was merged back
// into section 5, the listing moved off the homepage to the shop, which is the
// page built for it. If ten tiles ever come back here, they need a reason
// beyond "the range is bigger than four" — that is what the link says.
//
// THE BIG CHANGE: PRODUCTS FOLLOW CATEGORIES DIRECTLY. How It Works used to sit
// between them, and that is where the page fell over. The customer picks a
// category — the first genuine buying signal they give — and the page answered it
// by explaining its own logistics for a screen and a half before showing a single
// price. Kookai, Politix and Monday all run hero → categories → products, and none
// of them puts a service story in front of the catalogue; the customer who wants
// to know who measures it asks that question when they are close to buying, not
// while they are still browsing.
//
// So How It Works moved down to sit after the range, where it stops
// being an interruption and becomes the answer to the objection those panels
// raise. It is not load-bearing that high anyway: the trust ticker leads with the
// free measure and the installation, the hero's sub-line says "measured and
// installed by experts", and the hero's second button goes straight to it.
//
// THE GROUNDS. No two adjacent sections share one, and reordering the tail
// re-cut every colour in it. Down the page it now alternates:
//
//    7  visualiser     parchment
//    8  install strip  warm white   (was parchment, as the last panel)
//    9  about panel    parchment    (was warm white — and parchment before that)
//   10  reviews        warm white
//   11  footer         ink
//
// EVERY ONE OF THOSE THREE MOVED BECAUSE ITS NEIGHBOUR DID, not because anything
// looked wrong on its own. That is the thing to know before reordering this page
// again: a section's ground is a statement about what sits next to it, so moving
// two sections is never just two edits. The about panel has now been repainted
// twice in two commits for exactly this reason — parchment, then warm white when
// the full-range strip was deleted from above it, then parchment again now that
// the install strip has taken that slot.
//
// The visualiser is the only ink on the page — the deepest ground under the
// brightest panel, which is what makes the one section that does real work look
// like the centrepiece rather than another band. The charcoal banner immediately
// above it is the page starting to darken into that, not a bar dropped between
// two light sections.
//
// Section components live in components/home. Nav and Footer are shared with
// every other page and stay in components/.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { TrustTicker, BAR_HEIGHT } from '../components/home/TrustTicker';
import { Hero } from '../components/home/Hero';
import { StepsBar } from '../components/home/StepsBar';
import { RangeRow } from '../components/home/RangeRow';
import { RecommendationBanner } from '../components/home/RecommendationBanner';
import { VisualiserShowcase } from '../components/home/VisualiserShowcase';
import { AboutPanel } from '../components/home/AboutPanel';
import { SocialProof } from '../components/home/SocialProof';
import { Testimonials } from '../components/home/Testimonials';

export default function HomePage() {
  const setScrollY = useKlayStore((s) => s.setScrollY);

  // Publishes scroll position for the nav, which uses it twice: to swap from
  // transparent to solid charcoal, and to slide up as the trust ticker scrolls
  // off. rAF-throttled — this fires on every scroll event.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  return (
    <>
      {/* 1 — Trust credentials, moving. In flow rather than fixed, so it scrolls
          away and the nav takes the top edge for the rest of the page. */}
      <TrustTicker />

      {/* 2 — Nav. Solid charcoal at every scroll position, like every other page
          on the site — it used to start transparent over the hero and fill in on
          scroll, which meant the logo and the links sat on whatever frame of the
          video happened to be playing behind them. Still offset by the ticker's
          height until that has scrolled away. */}
      <Nav stickBelow={BAR_HEIGHT} />

      <main style={{ background: tokens.warmWhite }}>
        {/* 3 — The promise, full bleed under the transparent nav. */}
        <Hero />

        {/* 4 — The whole process in one gold line. It replaces a 635px How It
            Works section: the four steps are reassurance rather than persuasion,
            and answering "who does the work?" here means the customer meets the
            range already knowing how buying works. The detail moved to
            /how-it-works, which the bar links to. */}
        <StepsBar />

        {/* 5 — FOUR HERO PRODUCTS, one row, nothing behind an arrow. A roller
            blind, a curtain, a wardrobe and an awning: one per part of the
            business, each with the configurator on it. This is a selling
            surface and it is short on purpose — the rest of the range is a
            click away behind "Shop the full range". See the note at the top of
            RangeRow, and THE RANGE IS ONE SECTION NOW above. */}
        <RangeRow />

        {/* 6 — The catch, for anyone who read the range and still doesn't know
            which one is theirs. */}
        <RecommendationBanner />

        {/* 7 — The centrepiece: configure it, see it on your own window, buy it. */}
        <VisualiserShowcase />

        {/* 8 — In your home. DIRECTLY UNDER THE VISUALISER, and that adjacency is
            the point: the visualiser shows you a render of your own window, and
            the very next thing on the page is photographs of the real thing in
            real houses. Render, then proof it looks like that — the render is a
            claim, and this is the receipt for it.

            It was the page's last panel before, on the reasoning that ending on
            five ways back into the range beat ending on a claim. That still
            reads, but it was answering "does it really look like that?" four
            sections after the question was asked. */}
        <SocialProof />

        {/* 9 — Who turns up at the house — the only section about Klay rather than
            about a product. Nobody arrives wanting to read about a window
            furnishings business; they read it once they have decided they
            might buy, which is after the tool and the photographs above. */}
        <AboutPanel />

        {/* THE FINAL CTA IS GONE — it sat here, charcoal, "Ready to complete your
            home?" over a Start Designing button.

            Its button did not navigate; it scrolled back up to #visualiser. From
            this far down the page that is a journey to somewhere the visitor has
            already been, and the ask is never more than a glance away regardless
            — the nav carries Book a Measure on every screen, the hero has Design
            Yours, and the range cards now have their own Visualise badges. The
            page ends on other people's voices instead, which is what the note on
            the reviews section already argued for. */}

        {/* 10 — Reviews, and the page's last panel before the footer.
            What somebody wants at the very bottom of a long page is not another
            button but other people saying it went fine. */}
        <Testimonials />

        {/* 11 — Footer. */}
        <Footer />
      </main>
    </>
  );
}
