import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { PRODUCTS } from '../data/products';

// A plain ecommerce grid: photograph, then type / name / tagline / price below
// it on the page background. No card box — the image is the object and the
// text is a caption, which is how a product range this small reads best.
export default function ProductsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <main
      style={{
        background: tokens.warmWhite,
        minHeight: '100vh',
        padding: isMobile ? '64px 24px' : '80px 120px',
      }}
    >
      <header>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
          }}
        >
          The Collection
        </div>
        <h1
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 'clamp(38px, 11vw, 56px)' : 56,
            fontWeight: 300,
            lineHeight: 1.05,
            color: tokens.ink,
            margin: '16px 0 0',
          }}
        >
          Shop the range.
        </h1>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            lineHeight: 1.7,
            color: tokens.ink,
            opacity: 0.55,
            marginTop: 14,
            maxWidth: 520,
          }}
        >
          Four made-to-measure blinds. Every one built to your window and
          installed by hand across Victoria.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: 24,
          marginTop: isMobile ? 40 : 64,
        }}
      >
        {PRODUCTS.map(product => {
          const isHovered = hovered === product.slug;
          return (
            <article
              key={product.slug}
              onClick={() => navigate(`/products/${product.slug}`)}
              onMouseEnter={() => setHovered(product.slug)}
              onMouseLeave={() => setHovered(h => (h === product.slug ? null : h))}
              style={{ cursor: 'pointer', background: 'transparent' }}
            >
              {/* overflow:hidden on the wrapper so the scale-up crops to the
                  frame instead of pushing into the neighbouring column. */}
              <div style={{ aspectRatio: '3 / 4', overflow: 'hidden', borderRadius: 4 }}>
                <img
                  src={product.image}
                  alt={`${product.name} — ${product.type}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                    transition: 'transform 0.4s ease',
                  }}
                />
              </div>

              <div
                style={{
                  fontFamily: tokens.body,
                  fontSize: 10,
                  color: tokens.gold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginTop: 16,
                }}
              >
                {product.type}
              </div>
              <h2
                style={{
                  fontFamily: tokens.display,
                  fontSize: 32,
                  fontWeight: 300,
                  lineHeight: 1.1,
                  color: tokens.ink,
                  margin: '4px 0 0',
                }}
              >
                {product.name}
              </h2>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: tokens.ink,
                  opacity: 0.55,
                  margin: '4px 0 0',
                }}
              >
                {product.tagline}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <span style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.ink }}>
                  from ${product.priceFrom}
                </span>
                <span
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 11,
                    color: tokens.gold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.16em',
                    whiteSpace: 'nowrap',
                    transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  Explore →
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
