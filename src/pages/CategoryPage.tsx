// ---------------------------------------------------------------------------
// /indoor, /outdoor, /wardrobes — one component, three routes, driven entirely
// by the category data.
//
// This is where the product-type grid moved to when it came off the homepage. It
// is the same furniture the homepage uses — SectionBand for the header, PhotoTile
// for the tiles — so a category page reads as the same site rather than as a
// second design. They live in components/home because that is where the kit grew
// up; the name is now the only thing homepage-specific about them.
//
// A type with a price gets a Buy Now. A type without one gets COMING SOON and no
// button, for the same reason it does on the homepage: a tile that says both
// contradicts itself in one glance.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens, layout } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { getCategoryBySlug } from '../data/categories';
import { PhotoTile, SectionBand, CtaLink } from '../components/home/primitives';

/** The slug arrives as a prop from the route App.tsx generated for it, not as a
 * URL param — see the note there. */
export default function CategoryPage({ slug }: { slug: string }) {
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);
  const category = getCategoryBySlug(slug);

  // The nav reads scrollY to swap from transparent to solid. Without this it
  // would sit transparent over a light page and its links would be invisible —
  // so these pages publish it exactly as the homepage does.
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

  // Each page starts at its own top rather than wherever the previous one was
  // scrolled to — react-router keeps the scroll position across a navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // An unknown slug is a typed URL, not a broken link. Sending it to the
  // catalogue is friendlier than a 404 for something this shallow.
  if (!category) return <Navigate to="/blinds/roller-blinds" replace />;

  return (
    <>
      <Nav />
      <main style={{ background: tokens.warmWhite }}>
        {/* A short photographic header rather than a full hero: this is a listing
            page, and 90vh of picture between the customer and the products would
            be the site admiring itself. */}
        <section
          style={{
            position: 'relative',
            height: isMobile ? 280 : 380,
            overflow: 'hidden',
            background: tokens.charcoal,
          }}
        >
          <img
            src={category.image}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: category.objectPosition,
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(28,24,16,0.62) 0%, rgba(28,24,16,0.40) 45%, rgba(28,24,16,0.72) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: `${isMobile ? 24 : 40}px ${layout.inlinePad(isMobile)}px 0`,
            }}
          >
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 10,
                fontWeight: 500,
                color: tokens.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                margin: 0,
                marginBottom: 16,
              }}
            >
              {category.name}
            </p>
            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: 'clamp(34px, 4.6vw, 58px)',
                fontWeight: 300,
                lineHeight: 1.05,
                color: tokens.warmWhite,
                margin: 0,
              }}
            >
              {category.headline}
            </h1>
          </div>
        </section>

        <SectionBand label="The range" title={category.blurb} isMobile={isMobile} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${category.columns}, 1fr)`,
            // Gapless, like every other tile grid on the site. See the note on
            // `columns` in the category data for why the counts matter.
            gap: 0,
          }}
        >
          {category.subcategories.map(sub => (
            <PhotoTile
              key={sub.slug}
              to={`/products?category=${sub.slug}`}
              label={sub.name}
              image={sub.image}
              blurb={sub.image ? undefined : sub.tagline}
              note={sub.priceFrom ? `From $${sub.priceFrom}` : 'Coming soon'}
              cta={sub.priceFrom ? 'Buy Now' : undefined}
              minHeight={isMobile ? 300 : 420}
            />
          ))}
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '56px 24px' : '80px 80px',
            background: tokens.parchment,
          }}
        >
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: 'clamp(26px, 3vw, 38px)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: tokens.ink,
              margin: 0,
              marginBottom: 20,
            }}
          >
            Not sure which suits your room?
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              lineHeight: 1.7,
              color: tokens.inkSoft,
              margin: '0 auto 30px',
              maxWidth: 520,
            }}
          >
            A Klay technician measures every window himself and will tell you what actually works
            for the space.
          </p>
          <CtaLink to="/book">Book a Free Measure</CtaLink>
        </div>
      </main>
      <Footer />
    </>
  );
}
