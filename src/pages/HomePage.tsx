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
// NOTE: SocialMedia maps a PLACEHOLDERS array that carries no video source, so
// it renders three empty boxes with play buttons that do nothing. It is kept
// on the page by request; it needs real reels dropped into that array to stop
// reading as broken.
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
        {/* 1. Hero — the promise. */}
        <HeroScene />

        {/* 2. THE CATEGORIES — what Klay makes, as rooms. Carries its own
            full-bleed banner, which is the break between the hero and the
            shop proper. */}
        <ProductsBanner />

        {/* 3. THE RANGE — what is actually for sale, named and priced. This is
            the change that matters most on this page: the homepage previously
            ran hero → visualiser → category tiles, so a shopper met a
            five-field configurator before seeing a single product name or
            price, and the four real products in data/products.ts appeared
            nowhere on the page at all. */}
        <CollectionSection />

        {/* 4. How it works — answers "who measures it?", the objection that
            stops people configuring. It has to come BEFORE the tool, not
            after. */}
        <HowItWorks />

        {/* 5. Visualiser — moved from position two to here, and this is the
            first point on the page where it makes sense. By now the visitor
            knows the categories, the products, what they cost, and who
            installs them; the configurator is the natural next step rather
            than a demand made of a stranger. */}
        <VisualiserSection />

        {/* 6. Reviews — proof, immediately after the tool that asks for
            commitment. */}
        <ReviewsCarousel />

        {/* 7. Social. */}
        <SocialMedia />

        {/* 8. Our story. */}
        <OurStory />

        {/* 9. Final CTA. */}
        <FinalScene />
        <Footer />
      </main>
      <SectionCounter />
    </>
  );
}
