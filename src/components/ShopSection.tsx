import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { CATEGORIES } from '../data/categories';
import { RANGES } from '../data/products';

export function ShopSection() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState('blinds');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [linkHover, setLinkHover] = useState(false);

  const currentCategory = CATEGORIES.find(c => c.slug === activeCategory);

  return (
    <section id="collection">
      {/* Hero header */}
      <div
        style={{
          position: 'relative',
          height: isMobile ? 400 : 520,
          backgroundImage: "url('/images/lifestyle/room-kitchen.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(28,24,16,0.35) 0%, rgba(28,24,16,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

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
        </div>
      </div>

      {/* Category tabs */}
      <div
        style={{
          background: tokens.warmWhite,
          borderBottom: `1px solid ${tokens.lineFaint}`,
          position: 'sticky',
          top: 80,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? 16 : 48,
          }}
        >
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.slug;
            const hasAvailable = category.subcategories.some(s => s.available);
            return (
              <button
                key={category.slug}
                onClick={() => setActiveCategory(category.slug)}
                style={{
                  padding: '20px 8px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? tokens.gold : 'transparent'}`,
                  fontFamily: tokens.body,
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? tokens.gold : hasAvailable ? tokens.ink : tokens.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: hasAvailable ? 1 : 0.6,
                }}
              >
                {category.name}
                {!hasAvailable && (
                  <span
                    style={{
                      fontSize: 9,
                      marginLeft: 6,
                      color: tokens.gold,
                      verticalAlign: 'super',
                    }}
                  >
                    SOON
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory cards */}
      <div
        style={{
          background: tokens.warmWhite,
          padding: isMobile ? '60px 24px 100px' : '80px 80px 140px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Subcategory header */}
          <div style={{ marginBottom: 48 }}>
            <h3
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 32 : 42,
                fontWeight: 300,
                color: tokens.ink,
                margin: 0,
              }}
            >
              {currentCategory?.name}
            </h3>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 16,
                color: tokens.inkSoft,
                margin: 0,
                marginTop: 12,
              }}
            >
              {currentCategory?.description}
            </p>
          </div>

          {/* Grid of subcategories */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 32,
            }}
          >
            {currentCategory?.subcategories.map((sub, index) => {
              const hovered = hoveredIndex === index;
              return (
                <Link
                  key={sub.slug}
                  to={sub.available ? `/${activeCategory}/${sub.slug}` : '#'}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 16,
                    background: tokens.warmWhite,
                    border: `1px solid ${hovered && sub.available ? 'rgba(200,151,58,0.25)' : tokens.lineFaint}`,
                    transform: hovered && sub.available ? 'translateY(-6px)' : 'translateY(0)',
                    boxShadow: hovered && sub.available
                      ? '0 24px 56px rgba(28,24,16,0.15)'
                      : '0 4px 20px rgba(28,24,16,0.05)',
                    transition: 'all 0.4s ease',
                    opacity: sub.available ? 1 : 0.7,
                    cursor: sub.available ? 'pointer' : 'default',
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4 / 3' }}>
                    <img
                      src={sub.image}
                      alt={sub.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.6s ease',
                        transform: hovered && sub.available ? 'scale(1.05)' : 'scale(1)',
                        filter: sub.available ? 'none' : 'grayscale(50%)',
                      }}
                    />
                    {!sub.available && (
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
                          padding: '6px 12px',
                          borderRadius: 4,
                        }}
                      >
                        Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ padding: '24px 20px 28px' }}>
                    <h4
                      style={{
                        fontFamily: tokens.display,
                        fontSize: 24,
                        fontWeight: 300,
                        color: tokens.ink,
                        margin: 0,
                      }}
                    >
                      {sub.name}
                    </h4>
                    <p
                      style={{
                        fontFamily: tokens.body,
                        fontSize: 14,
                        color: tokens.inkSoft,
                        fontStyle: 'italic',
                        margin: 0,
                        marginTop: 8,
                      }}
                    >
                      {sub.tagline}
                    </p>
                    {sub.available && (
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
                        }}
                      >
                        Explore →
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* If Blinds selected and Roller available, show the roller products */}
          {activeCategory === 'blinds' && (
            <div style={{ marginTop: 80 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 40,
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: tokens.body,
                      fontSize: 11,
                      fontWeight: 500,
                      color: tokens.gold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      margin: 0,
                    }}
                  >
                    Roller Blinds
                  </p>
                  <h3
                    style={{
                      fontFamily: tokens.display,
                      fontSize: isMobile ? 28 : 36,
                      fontWeight: 300,
                      color: tokens.ink,
                      margin: 0,
                      marginTop: 8,
                    }}
                  >
                    Four fabric types. One perfect fit.
                  </h3>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                  gap: 24,
                }}
              >
                {RANGES.map((range, index) => {
                  const hovered = hoveredIndex === index + 100;
                  return (
                    <article
                      key={range.slug}
                      onClick={() => navigate(`/products/${range.productSlug}`)}
                      onMouseEnter={() => setHoveredIndex(index + 100)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 16,
                        cursor: 'pointer',
                        background: tokens.warmWhite,
                        border: `1px solid ${hovered ? 'rgba(200,151,58,0.25)' : tokens.lineFaint}`,
                        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                        boxShadow: hovered
                          ? '0 20px 48px rgba(28,24,16,0.15)'
                          : '0 4px 20px rgba(28,24,16,0.05)',
                        transition: 'all 0.4s ease',
                      }}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1 / 1' }}>
                        <img
                          src={range.image}
                          alt={range.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.6s ease',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)',
                          }}
                        />
                      </div>
                      <div style={{ padding: '20px 16px 24px' }}>
                        <div
                          style={{
                            fontFamily: tokens.body,
                            fontSize: 10,
                            color: tokens.gold,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontWeight: 500,
                          }}
                        >
                          {range.range}
                        </div>
                        <h4
                          style={{
                            fontFamily: tokens.display,
                            fontSize: 22,
                            fontWeight: 300,
                            color: tokens.ink,
                            margin: 0,
                            marginTop: 8,
                          }}
                        >
                          {range.name}
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 16,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: tokens.display,
                              fontSize: 16,
                              color: tokens.ink,
                            }}
                          >
                            {range.price}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <Link
              to="/blinds/roller-blinds"
              onMouseEnter={() => setLinkHover(true)}
              onMouseLeave={() => setLinkHover(false)}
              style={{
                textDecoration: 'none',
                display: 'inline-block',
                padding: '18px 48px',
                borderRadius: 8,
                border: `1px solid ${linkHover ? tokens.gold : tokens.line}`,
                fontFamily: tokens.body,
                fontSize: 13,
                fontWeight: 500,
                color: linkHover ? tokens.gold : tokens.ink,
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
