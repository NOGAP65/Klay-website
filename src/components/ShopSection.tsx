import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { RANGES } from '../data/products';

export function ShopSection() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section style={{ background: '#F2EDE4', padding: '100px 80px' }}>
      <div
        style={{
          fontFamily: tokens.body,
          fontSize: 11,
          color: tokens.gold,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          marginBottom: 16,
        }}
      >
        The Collection
      </div>
      <h2
        style={{
          fontFamily: tokens.display,
          fontSize: 'clamp(42px, 5vw, 68px)',
          fontWeight: 300,
          color: '#1E1A16',
          lineHeight: 0.92,
          margin: 0,
        }}
      >
        Shop the range.
      </h2>
      <p
        style={{
          fontFamily: tokens.body,
          fontSize: 15,
          color: 'rgba(30,26,22,0.5)',
          marginTop: 16,
          maxWidth: 520,
        }}
      >
        Nine made-to-measure blinds. Three ranges. All installed by hand across Victoria.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px', marginTop: 48 }}>
        {RANGES.map((range, index) => {
          const hovered = hoveredIndex === index;
          return (
            <div
              key={range.slug}
              onClick={() => navigate(`/products/${range.slug}`)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex((i) => (i === index ? null : i))}
              style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            >
              <div style={{ height: '400px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={range.image}
                  alt={range.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    transition: 'transform 0.6s ease',
                    transform: hovered ? 'scale(1.04)' : 'scale(1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: hovered ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0)',
                    transition: 'background 0.3s ease',
                  }}
                />
              </div>

              <div style={{ background: '#1E1A16', padding: '28px 32px' }}>
                <div
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 10,
                    color: tokens.gold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.25em',
                    marginBottom: 8,
                  }}
                >
                  {range.range}
                </div>
                <div style={{ fontFamily: tokens.display, fontSize: 36, fontWeight: 300, color: '#F8F6F2' }}>
                  {range.name}
                </div>
                <div
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 13,
                    color: 'rgba(248,246,242,0.5)',
                    fontStyle: 'italic',
                    marginTop: 8,
                  }}
                >
                  {range.tagline}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 20,
                  }}
                >
                  <span style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(248,246,242,0.35)' }}>
                    {range.price}
                  </span>
                  <span style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.gold, letterSpacing: '0.1em' }}>
                    Explore →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link
          to="/products"
          style={{
            textDecoration: 'none',
            display: 'inline-block',
            borderBottom: '1px solid rgba(200,151,58,0.3)',
            paddingBottom: '4px',
            fontFamily: tokens.body,
            fontSize: 12,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}
        >
          View all 9 products →
        </Link>
      </div>
    </section>
  );
}
