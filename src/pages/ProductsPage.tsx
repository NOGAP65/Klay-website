import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { SKU_COUNT } from '../data/products';
import { CollectionScene } from '../components/CollectionScene';
import { CurtainsScene } from '../components/CurtainsScene';
import { WardrobesScene } from '../components/WardrobesScene';

export default function ProductsPage() {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Was a bare <h1>All Products</h1> centred on #141414 — a near-black
          outside the palette, and the destination the homepage's "view all"
          link points at. A real header now, on ink, matching the page ends. */}
      <header
        style={{
          background: tokens.ink,
          padding: isMobile ? '112px 24px 72px' : '168px 80px 104px',
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto' }}>
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              marginBottom: 18,
            }}
          >
            {SKU_COUNT} made-to-measure products
          </div>
          <h1
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 'clamp(44px, 13vw, 64px)' : 'clamp(56px, 7vw, 104px)',
              fontWeight: 300,
              lineHeight: 0.94,
              color: tokens.warmWhite,
              margin: 0,
            }}
          >
            The full <em style={{ color: tokens.goldLight }}>collection</em>.
          </h1>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 16,
              lineHeight: 1.7,
              color: 'rgba(245,242,237,0.6)',
              marginTop: 24,
              maxWidth: 540,
            }}
          >
            Blinds, curtains and wardrobes — every one measured, made and
            installed by hand across Victoria.
          </p>
        </div>
      </header>
      <CollectionScene />
      <CurtainsScene />
      <WardrobesScene />
    </>
  );
}
