// ---------------------------------------------------------------------------
// The homepage. Fifteen sections, one job each.
//
// The order is an argument, not a list. It opens on the outcome (a room, not a
// product), names the four rooms the customer recognises, explains who does the
// work, shows what things cost, catches the undecided, and only then hands over
// the configurator — by which point the visitor knows the range, the price and
// who installs it, so being asked to configure something is a reasonable request
// rather than one made of a stranger. Everything after the tool answers the
// objections that stop someone finishing: what the two ranges are actually for,
// what it looks like in a real house, and what other people thought.
//
// The grounds alternate warm white and parchment through the light half and drop
// to charcoal four times — the room grid, the recommendation band, the
// inspiration tiles and the close — so the scroll has a rhythm instead of being
// one continuous cream field.
//
// Section components live in components/home and are used only from here. Nav
// and Footer are shared with every other page and stay in components/.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { AnnouncementBar, BAR_HEIGHT } from '../components/home/AnnouncementBar';
import { Hero } from '../components/home/Hero';
import { ServiceBar } from '../components/home/ServiceBar';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { HowItWorksSteps } from '../components/home/HowItWorksSteps';
import { ProductGrid } from '../components/home/ProductGrid';
import { RecommendationBanner } from '../components/home/RecommendationBanner';
import { VisualiserShowcase } from '../components/home/VisualiserShowcase';
import { AlternatingPanels } from '../components/home/AlternatingPanels';
import { SocialProof } from '../components/home/SocialProof';
import { InspirationTiles } from '../components/home/InspirationTiles';
import { Testimonials } from '../components/home/Testimonials';
import { FinalCta } from '../components/home/FinalCta';

export default function HomePage() {
  const setScrollY = useKlayStore((s) => s.setScrollY);

  // Publishes scroll position for the nav, which uses it twice: to swap from
  // transparent to solid charcoal, and to slide up as the announcement bar
  // scrolls off. rAF-throttled — this fires on every scroll event.
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
      {/* 1 — Announcement bar, in flow so it scrolls away. */}
      <AnnouncementBar />

      {/* 2 — Nav. Transparent over the hero (solid={false}), solid charcoal
          once compressed, and offset by the bar's height until it's gone. */}
      <Nav solid={false} stickBelow={BAR_HEIGHT} />

      <main style={{ background: tokens.warmWhite }}>
        {/* 3 — The promise, full bleed under the transparent nav. */}
        <Hero />

        {/* 4 — What you actually get, in gold, before anyone has scrolled. */}
        <ServiceBar />

        {/* 5 — Indoor / Outdoor / Wardrobes, edge to edge. Outcomes before
            products, and the split the business actually runs on. */}
        <CategoryGrid />

        {/* 6 — Who does the work. It comes before the prices because "who
            measures it?" is the objection that stops people ordering. */}
        <HowItWorksSteps />

        {/* 7 — What's for sale, named and priced, no gatekeeping. */}
        <ProductGrid />

        {/* 8 — The catch for anyone who read six prices and still doesn't know
            which one they need. */}
        <RecommendationBanner />

        {/* 9 — The centrepiece: configure it, see it, buy it. */}
        <VisualiserShowcase />

        {/* 10 — One panel per range, one idea each: light, then control. */}
        <AlternatingPanels />

        {/* 11 — What it looks like once it's up. Trust, not conversion. */}
        <SocialProof />

        {/* 12 — Four ways further in, for the reader who isn't buying today. */}
        <InspirationTiles />

        {/* 13 — Proof, in customers' own words. */}
        <Testimonials />

        {/* 14 — One last action, pointing back at the tool. */}
        <FinalCta />

        {/* 15 — Footer. */}
        <Footer />
      </main>
    </>
  );
}
