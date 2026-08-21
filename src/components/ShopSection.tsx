import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

const CATEGORIES = [
  {
    slug: 'roller-blinds',
    name: 'Roller Blinds',
    category: 'Blinds',
    tagline: 'Clean lines and timeless elegance. Perfect light control for any room.',
    image: '/images/Phoenix%20Blockout%20product%20image.png',
    price: 'From $189',
    link: '/blinds',
    available: true,
  },
  {
    slug: 'curtains',
    name: 'Curtains',
    category: 'Soft Furnishings',
    tagline: 'Flowing fabrics that transform your space with warmth and texture.',
    image: '/images/lifestyle/room-living.png',
    price: 'Coming Soon',
    link: '/curtains',
    available: false,
  },
  {
    slug: 'wardrobes',
    name: 'Wardrobes',
    category: 'Built-Ins',
    tagline: 'Custom built-in solutions designed for the way you live.',
    image: '/images/lifestyle/room-kitchen.png',
    price: 'Coming Soon',
    link: '/wardrobes',
    available: false,
  },
];

export function ShopSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [linkHover, setLinkHover] = useState(false);

  return (
    <section id="collection">
      {/* Hero header with background image */}
      <div
        style={{
          position: 'relative',
          height: isMobile ? 400 : 560,
          backgroundImage: "url('/images/lifestyle/room-kitchen.png')",
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
            background: 'linear-gradient(180deg, rgba(28,24,16,0.35) 0%, rgba(28,24,16,0.6) 100%)',
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
              fontSize: 12,
              fontWeight: 500,
              color: tokens.onDark,
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
              fontSize: isMobile ? 42 : 64,
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 1.05,
              margin: 0,
              marginTop: 24,
            }}
          >
            Made for Australian homes.
          </h2>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 17,
              color: 'rgba(245,242,237,0.7)',
              margin: 0,
              marginTop: 24,
              lineHeight: 1.65,
            }}
          >
            Premium window furnishings designed, measured, and installed by our expert team across Victoria.
          </p>
        </div>
      </div>

      {/* Product cards - 3 column grid */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '80px 24px 100px' : '120px 80px 160px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 32 : 40,
            }}
          >
            {CATEGORIES.map((category, index) => {
              const hovered = hoveredIndex === index;
              return (
                <article
                  key={category.slug}
                  onClick={() => category.available && navigate(category.link)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(i => (i === index ? null : i))}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderRadius: 20,
                    cursor: category.available ? 'pointer' : 'default',
                    background: tokens.warmWhite,
                    border: `1px solid ${hovered && category.available ? 'rgba(200,151,58,0.25)' : 'rgba(28,24,16,0.06)'}`,
                    transform: hovered && category.available ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hovered && category.available
                      ? '0 32px 64px rgba(28,24,16,0.18)'
                      : '0 8px 32px rgba(28,24,16,0.06)',
                    transition: 'all 0.4s ease',
                  }}
                >
                  {/* Image - larger aspect ratio */}
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
                        transition: 'transform 0.7s ease',
                        transform: hovered && category.available ? 'scale(1.05)' : 'scale(1)',
                        filter: category.available ? 'none' : 'grayscale(30%)',
                      }}
                    />
                    {/* Subtle gradient overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(180deg, transparent 0%, rgba(28,24,16,0.04) 100%)',
                        pointerEvents: 'none',
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
                          color: tokens.onDark,
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
                      padding: '36px 32px 40px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 11,
                        color: tokens.onDark,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        fontWeight: 500,
                      }}
                    >
                      {category.category}
                    </div>
                    <h3
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 32,
                        fontWeight: 300,
                        color: tokens.ink,
                        lineHeight: 1.15,
                        margin: 0,
                        marginTop: 12,
                      }}
                    >
                      {category.name}
                    </h3>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: 'rgba(28,24,16,0.55)',
                        fontStyle: 'italic',
                        margin: 0,
                        marginTop: 16,
                      }}
                    >
                      {category.tagline}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 28,
                        paddingTop: 24,
                        borderTop: `1px solid rgba(28,24,16,0.08)`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: tokens.display,
                          fontSize: 22,
                          color: category.available ? tokens.ink : 'rgba(28,24,16,0.4)',
                        }}
                      >
                        {category.price}
                      </span>
                      {category.available && (
                        <span
                          style={{
                            fontFamily: tokens.body,
                            fontSize: 12,
                            color: tokens.onDark,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            fontWeight: 500,
                            transform: hovered ? 'translateX(6px)' : 'translateX(0)',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          Explore →
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ marginTop: 80, textAlign: 'center' }}>
            <Link
              to="/blinds"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '20px 56px',
                borderRadius: 8,
                border: `1px solid ${linkHover ? tokens.line : 'rgba(28,24,16,0.12)'}`,
                fontFamily: tokens.body,
                fontSize: 13,
                fontWeight: 500,
                color: linkHover ? tokens.textMuted : tokens.ink,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                transition: 'all 0.3s ease',
                background: linkHover ? 'rgba(200,151,58,0.06)' : 'transparent',
              }}
            >
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
