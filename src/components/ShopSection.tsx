import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const CATEGORIES = [
  {
    name: 'Roller Blinds',
    tagline: 'Clean lines, timeless elegance. Perfect light control for any room.',
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    link: '/blinds',
    available: true,
  },
  {
    name: 'Curtains',
    tagline: 'Flowing fabrics that transform your space with warmth and texture.',
    image: '/images/lifestyle/room-living.png',
    link: '/curtains',
    available: false,
  },
  {
    name: 'Wardrobes',
    tagline: 'Custom built-in solutions designed for the way you live.',
    image: '/images/lifestyle/room-kitchen.png',
    link: '/wardrobes',
    available: false,
  },
];

export function ShopSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="collection">
      {/* Hero header with background image */}
      <div
        style={{
          position: 'relative',
          height: isMobile ? 360 : 480,
          backgroundImage: "url('/images/lifestyle/room-bedroom.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(28,24,16,0.3) 0%, rgba(28,24,16,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Header content */}
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            padding: '0 24px',
            maxWidth: 700,
          }}
        >
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
              fontSize: isMobile ? 38 : 56,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.1,
              margin: 0,
              marginTop: 20,
            }}
          >
            Made for Australian homes.
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 16,
              color: 'rgba(245,242,237,0.7)',
              margin: 0,
              marginTop: 20,
              lineHeight: 1.7,
            }}
          >
            Premium window furnishings designed, measured, and installed by our expert team.
          </p>
        </div>
      </div>

      {/* Category cards */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '80px 24px 100px' : '100px 80px 120px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 32 : 32,
            }}
          >
            {CATEGORIES.map((category, index) => {
              const hovered = hoveredIndex === index;
              return (
                <article
                  key={category.name}
                  onClick={() => category.available && navigate(category.link)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 16,
                    cursor: category.available ? 'pointer' : 'default',
                    background: tokens.warmWhite,
                    border: `1px solid ${hovered && category.available ? 'rgba(200,151,58,0.25)' : 'rgba(28,24,16,0.06)'}`,
                    transform: hovered && category.available ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: hovered && category.available
                      ? '0 24px 48px rgba(28,24,16,0.14)'
                      : '0 4px 20px rgba(28,24,16,0.05)',
                    transition: 'all 0.4s ease',
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3' }}>
                    <img
                      src={category.image}
                      alt={category.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                        transition: 'transform 0.6s ease',
                        transform: hovered && category.available ? 'scale(1.04)' : 'scale(1)',
                        filter: category.available ? 'none' : 'grayscale(30%)',
                      }}
                    />
                    {/* Coming soon badge */}
                    {!category.available && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
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
                  </div>

                  {/* Text content */}
                  <div
                    style={{
                      padding: '28px 24px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 26,
                        fontWeight: 300,
                        color: tokens.ink,
                        lineHeight: 1.15,
                        margin: 0,
                      }}
                    >
                      {category.name}
                    </h3>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: 'rgba(28,24,16,0.55)',
                        margin: 0,
                        marginTop: 12,
                      }}
                    >
                      {category.tagline}
                    </p>
                    {category.available && (
                      <span
                        style={{
                          marginTop: 20,
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
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
