import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { ScrollProgress } from '../components/ScrollProgress';
import { Nav } from '../components/Nav';
import HeroScene from '../components/HeroScene';
import { ManifestoSection } from '../components/ManifestoSection';
import VisualiserSection from '../components/VisualiserSection';
import { ProcessSection } from '../components/ProcessSection';
import { DifferentiatorsSection } from '../components/DifferentiatorsSection';
import { ShopSection } from '../components/ShopSection';
import { ReviewsSection } from '../components/ReviewsSection';
import { FinalScene } from '../components/FinalScene';
import { Footer } from '../components/Footer';
import { SectionCounter } from '../components/SectionCounter';

export default function HomePage() {
  const setScrollY = useKlayStore((s) => s.setScrollY);

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
      <ScrollProgress />
      <Nav />
      <main style={{ background: tokens.warmWhite }}>
        {/* SECTION 1: Hero — video with centered CTAs */}
        <HeroScene />
        {/* SECTION 2: Manifesto — charcoal strip with stats */}
        <ManifestoSection />
        {/* SECTION 3: Visualiser — unchanged */}
        <VisualiserSection />
        {/* SECTION 4: How It Works — 4 steps on warm white */}
        <ProcessSection />
        {/* SECTION 5: Differentiators — 3 cards on charcoal */}
        <DifferentiatorsSection />
        {/* SECTION 6: Shop the Range — 4 product cards */}
        <ShopSection />
        {/* SECTION 7: Reviews — 3 static review cards on parchment */}
        <ReviewsSection />
        {/* SECTION 8: Final CTA — charcoal close */}
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
