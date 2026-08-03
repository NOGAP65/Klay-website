import { useState } from 'react';
import { Link } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const CATEGORIES = [
  {
    name: 'Roller Blinds',
    tagline: 'Clean lines. Simple elegance.',
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    link: '/blinds',
    available: true,
  },
  {
    name: 'Curtains',
    tagline: 'Flowing fabrics for your home.',
    image: '/images/lifestyle/room-living.png',
    link: '/curtains',
    available: false,
  },
  {
    name: 'Wardrobes',
    tagline: 'Custom built-in solutions.',
    image: '/images/lifestyle/room-kitchen.png',
    link: '/wardrobes',
    available: false,
  },
];

export function ShopSection() {
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      id="collection"
      style={{
        background: tokens.warmWhite,
        padding: isMobile ? '80px 24px' : '120px 80px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              margin: 0,
            }}
          >
            Shop by Category
          </p>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 34 : 48,
              fontWeight: 300,
              color: tokens.ink,
              lineHeight: 1.1,
              margin: 0,
              marginTop: 16,
            }}
          >
            Made for Australian homes.
          </h2>
        </div>

        {/* Category cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 28,
          }}
        >
          {CATEGORIES.map((category, index) => {
            const hovered = hoveredIndex === index;
            return (
              <Link
                key={category.name}
                to={category.available ? category.link : '#'}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  textDecoration: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 16,
                  aspectRatio: isMobile ? '4 / 3' : '3 / 4',
                  display: 'block',
                  cursor: category.available ? 'pointer' : 'default',
                }}
              >
                {/* Background image */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url('${category.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: hovered && category.available ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.6s ease',
                    filter: category.available ? 'none' : 'grayscale(40%)',
                  }}
                />

                {/* Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: hovered && category.available
                      ? 'linear-gradient(180deg, rgba(28,24,16,0.2) 0%, rgba(28,24,16,0.7) 100%)'
                      : 'linear-gradient(180deg, rgba(28,24,16,0.1) 0%, rgba(28,24,16,0.6) 100%)',
                    transition: 'background 0.3s ease',
                  }}
                />

                {/* Coming soon badge */}
                {!category.available && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: tokens.charcoal,
                      color: tokens.gold,
                      fontFamily: tokens.body,
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '8px 14px',
                      borderRadius: 4,
                    }}
                  >
                    Coming Soon
                  </div>
                )}

                {/* Content */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: isMobile ? '24px' : '32px',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: tokens.display,
                      fontSize: isMobile ? 28 : 32,
                      fontWeight: 300,
                      color: tokens.warmWhite,
                      margin: 0,
                      lineHeight: 1.15,
                    }}
                  >
                    {category.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 14,
                      color: 'rgba(245,242,237,0.7)',
                      margin: 0,
                      marginTop: 8,
                    }}
                  >
                    {category.tagline}
                  </p>
                  {category.available && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 16,
                        fontFamily: tokens.body,
                        fontSize: 12,
                        color: tokens.gold,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      Shop Now →
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
