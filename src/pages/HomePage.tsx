import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { ScrollProgress } from '../components/ScrollProgress';
import { Nav } from '../components/Nav';
import HeroScene from '../components/HeroScene';
import VisualiserSection from '../components/VisualiserSection';
import { ProductsBanner } from '../components/ProductsBanner';
import { HowItWorks } from '../components/HowItWorks';
import { ReviewsCarousel } from '../components/ReviewsCarousel';
import { SocialMedia } from '../components/SocialMedia';
import { OurStory } from '../components/OurStory';
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
        {/* 1. Hero */}
        <HeroScene />
        {/* 2. Visualiser */}
        <VisualiserSection />
        {/* 3. Products Banner */}
        <ProductsBanner />
        {/* 4. How It Works */}
        <HowItWorks />
        {/* 5. Reviews Carousel */}
        <ReviewsCarousel />
        {/* 6. Social Media */}
        <SocialMedia />
        {/* 7. Our Story */}
        <OurStory />
        {/* 8. Final CTA */}
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
