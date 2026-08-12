import { useEffect } from 'react';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { ScrollProgress } from '../components/ScrollProgress';
import { Nav } from '../components/Nav';
import HeroScene from '../components/HeroScene';
import { CollectionSection } from '../components/CollectionSection';
import VisualiserSection from '../components/VisualiserSection';
import { ProductsBanner } from '../components/ProductsBanner';
import { HowItWorks } from '../components/HowItWorks';
import { ReviewsCarousel } from '../components/ReviewsCarousel';
// SocialMedia is deliberately NOT rendered. It is 1,167px — the second-largest
// section on the page — of three empty boxes: the component maps over a
// PLACEHOLDERS array with no video source in it, so it drew three grey
// rectangles with play buttons that do nothing. Empty media on a luxury page
// reads as broken, not as coming-soon. The component is untouched and ready to
// mount again the moment there are real reels to put in it.
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
        {/* 1. Hero — the promise. */}
        <HeroScene />

        {/* 2. THE COLLECTION — what is actually for sale, named and priced.
            This is the change that matters most on this page. The homepage
            previously ran hero → visualiser → category tiles, which meant a
            shopper met a five-field configurator before they had seen a single
            product name or price, and the four real products in
            data/products.ts appeared nowhere on the page at all. */}
        <CollectionSection />

        {/* 3. The range as rooms — the categories, now reading as inspiration
            beneath the products rather than standing in for them. */}
        <ProductsBanner />

        {/* 4. How it works — answers "who measures it?", the objection that
            stops people configuring. It has to come BEFORE the tool, not
            after. */}
        <HowItWorks />

        {/* 5. Visualiser — moved from position two to here, and this is the
            first point on the page where it makes sense. By now the visitor
            knows the four products, what they cost, and who installs them; the
            configurator is the natural next step rather than a demand made of
            a stranger. */}
        <VisualiserSection />

        {/* 6. Reviews — proof, immediately after the tool that asks for
            commitment. */}
        <ReviewsCarousel />

        {/* 7. Our story. */}
        <OurStory />

        {/* 8. Final CTA. */}
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
