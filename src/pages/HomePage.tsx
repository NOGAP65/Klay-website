// ---------------------------------------------------------------------------
// The homepage.
//
// Twelve sections, in one order, doing one job each. The page alternates warm
// white and parchment for the light sections and drops to charcoal twice — once
// at the trust bar and once at the closing CTA — so the scroll has a rhythm
// rather than being one continuous cream field.
//
// The visualiser at section five is the only section that does work. Everything
// above it earns the right to ask for a configuration (what Klay makes, what it
// costs, who installs it); everything below it answers the objections that stop
// someone finishing one.
//
// The section components live in components/home and are used only from here.
// Nav and Footer are shared with every other page and stay in components/.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { AnnouncementBar, BAR_HEIGHT } from '../components/home/AnnouncementBar';
import { Hero } from '../components/home/Hero';
import { CategoryStrip } from '../components/home/CategoryStrip';
import { VisualiserShowcase } from '../components/home/VisualiserShowcase';
import { HowItWorksSteps } from '../components/home/HowItWorksSteps';
import { RangeCarousel } from '../components/home/RangeCarousel';
import { TrustBar } from '../components/home/TrustBar';
import { EditorialPanel } from '../components/home/EditorialPanel';
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

        {/* 4 — What Klay makes, as five photographs. */}
        <CategoryStrip />

        {/* 5 — The centrepiece: configure it, see it, buy it. */}
        <VisualiserShowcase />

        {/* 6 — "Who measures it?", the objection that stops people ordering. */}
        <HowItWorksSteps />

        {/* 7 — What's for sale, named and priced. */}
        <RangeCarousel />

        {/* 8 — The four claims, on charcoal. */}
        <TrustBar />

        {/* 9 — The in-home service argument, at length. */}
        <EditorialPanel />

        {/* 10 — Proof, from customers who bought the products above. */}
        <Testimonials />

        {/* 11 — One last action, pointing back at the visualiser. */}
        <FinalCta />

        {/* 12 — Footer. */}
        <Footer />
      </main>
    </>
  );
}
