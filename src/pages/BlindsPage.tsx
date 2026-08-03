import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import { PRODUCTS, HARDWARE_HEX, HARDWARE_OPTIONS } from '../data/products';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'name-az';
type FilterType = 'all' | 'blockout' | 'sunscreen' | 'lightfilter' | 'dual';

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All Fabrics' },
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'lightfilter', label: 'Light Filter' },
  { id: 'dual', label: 'Dual' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'name-az', label: 'Name: A to Z' },
];

function ProductCard({
  product,
}: {
  product: (typeof PRODUCTS)[number];
}) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      to={`/products/${product.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: tokens.warmWhite,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(200,151,58,0.2)' : tokens.lineFaint}`,
        boxShadow: hover
          ? '0 16px 40px rgba(28,24,16,0.12)'
          : '0 2px 12px rgba(28,24,16,0.04)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: '#f5f3ef' }}>
        <img
          src={product.image}
          alt={`${product.name} — ${product.type}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            transform: hover ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />
      </div>

      <div style={{ padding: '20px 16px 24px' }}>
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 500,
          }}
        >
          {product.type}
        </span>

        <h3
          style={{
            fontFamily: tokens.display,
            fontSize: 24,
            fontWeight: 300,
            color: tokens.ink,
            margin: 0,
            marginTop: 8,
            lineHeight: 1.2,
          }}
        >
          {product.name}
        </h3>

        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 13,
            color: 'rgba(28,24,16,0.5)',
            lineHeight: 1.5,
            margin: 0,
            marginTop: 8,
            height: 40,
            overflow: 'hidden',
          }}
        >
          {product.tagline}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${tokens.lineFaint}`,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              fontWeight: 500,
              color: tokens.ink,
            }}
          >
            From ${product.priceFrom}
          </span>
          <span style={{ display: 'flex', gap: 4 }}>
            {HARDWARE_OPTIONS.map(h => (
              <span
                key={h.id}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: HARDWARE_HEX[h.id],
                  border: `1px solid rgba(28,24,16,0.1)`,
                }}
              />
            ))}
          </span>
        </div>

        <span
          style={{
            display: 'block',
            marginTop: 16,
            padding: '12px 20px',
            borderRadius: 6,
            background: tokens.gold,
            color: tokens.ink,
            fontFamily: tokens.body,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Design Yours
        </span>
      </div>
    </Link>
  );
}

export default function BlindsPage() {
  const isMobile = useIsMobile();
  const setScrollY = useKlayStore(s => s.setScrollY);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    // Apply filter
    if (activeFilter !== 'all') {
      result = result.filter(p => p.blindType === activeFilter);
    }

    // Apply sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case 'price-high':
        result.sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case 'name-az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // featured - keep original order
        break;
    }

    return result;
  }, [activeFilter, sortBy]);

  return (
    <>
      <Nav />

      <main style={{ background: tokens.warmWhite, minHeight: '100vh' }}>
        {/* Hero */}
        <section
          style={{
            position: 'relative',
            height: isMobile ? 280 : 360,
            paddingTop: 72,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: "url('/images/lifestyle/room-living.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(28,24,16,0.7) 0%, rgba(28,24,16,0.3) 100%)',
            }}
          />
          <div
            style={{
              position: 'relative',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: isMobile ? '0 24px' : '0 80px',
              maxWidth: 1200,
              margin: '0 auto',
            }}
          >
            <nav
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: 'rgba(245,242,237,0.5)',
                marginBottom: 16,
              }}
            >
              <Link to="/" style={{ color: 'rgba(245,242,237,0.5)', textDecoration: 'none' }}>
                Home
              </Link>
              <span style={{ margin: '0 8px' }}>/</span>
              <span style={{ color: tokens.warmWhite }}>Roller Blinds</span>
            </nav>
            <h1
              style={{
                fontFamily: tokens.display,
                fontSize: isMobile ? 36 : 52,
                fontWeight: 300,
                color: tokens.warmWhite,
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Roller Blinds
            </h1>
            <p
              style={{
                fontFamily: tokens.body,
                fontSize: 15,
                color: 'rgba(245,242,237,0.7)',
                lineHeight: 1.6,
                margin: 0,
                marginTop: 12,
                maxWidth: 500,
              }}
            >
              Clean lines, simple elegance. Four fabric types for different ways of living with light.
            </p>
          </div>
        </section>

        {/* Filter & Sort bar */}
        <div
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '16px 24px' : '20px 24px',
            borderBottom: `1px solid ${tokens.lineFaint}`,
            position: 'sticky',
            top: 72,
            zIndex: 90,
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: 16,
            }}
          >
            {/* Filter tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 6,
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: activeFilter === option.id ? tokens.charcoal : 'transparent',
                    color: activeFilter === option.id ? tokens.warmWhite : tokens.ink,
                    border: `1px solid ${activeFilter === option.id ? tokens.charcoal : tokens.lineFaint}`,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort & count */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <span
                style={{
                  fontFamily: tokens.body,
                  fontSize: 13,
                  color: 'rgba(28,24,16,0.5)',
                }}
              >
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </span>

              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 6,
                    fontFamily: tokens.body,
                    fontSize: 13,
                    cursor: 'pointer',
                    background: 'transparent',
                    color: tokens.ink,
                    border: `1px solid ${tokens.lineFaint}`,
                  }}
                >
                  <span>Sort: {SORT_OPTIONS.find(s => s.id === sortBy)?.label}</span>
                  <span style={{ fontSize: 10 }}>▼</span>
                </button>

                {showSortDropdown && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 98,
                      }}
                      onClick={() => setShowSortDropdown(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: 4,
                        background: tokens.warmWhite,
                        border: `1px solid ${tokens.lineFaint}`,
                        borderRadius: 8,
                        boxShadow: '0 8px 24px rgba(28,24,16,0.12)',
                        overflow: 'hidden',
                        zIndex: 99,
                        minWidth: 180,
                      }}
                    >
                      {SORT_OPTIONS.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setShowSortDropdown(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            fontFamily: tokens.body,
                            fontSize: 13,
                            cursor: 'pointer',
                            background: sortBy === option.id ? tokens.parchment : 'transparent',
                            color: tokens.ink,
                            border: 'none',
                            borderBottom: `1px solid ${tokens.lineFaint}`,
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products grid */}
        <section
          style={{
            background: tokens.parchment,
            padding: isMobile ? '32px 24px 80px' : '48px 24px 120px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {filteredProducts.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: isMobile ? 16 : 24,
                }}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 24px',
                }}
              >
                <p
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 16,
                    color: 'rgba(28,24,16,0.5)',
                  }}
                >
                  No products found. Try adjusting your filters.
                </p>
                <button
                  onClick={() => setActiveFilter('all')}
                  style={{
                    marginTop: 16,
                    padding: '12px 24px',
                    borderRadius: 6,
                    fontFamily: tokens.body,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: tokens.gold,
                    color: tokens.ink,
                    border: 'none',
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section
          style={{
            background: tokens.warmWhite,
            padding: isMobile ? '64px 24px 80px' : '80px 24px 100px',
          }}
        >
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
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
                FAQ
              </p>
              <h2
                style={{
                  fontFamily: tokens.display,
                  fontSize: isMobile ? 28 : 36,
                  fontWeight: 300,
                  color: tokens.ink,
                  margin: 0,
                  marginTop: 12,
                }}
              >
                Common Questions
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  q: 'What are Roller Blinds?',
                  a: 'The modern classic. A single panel of fabric on a spring-loaded or chain-operated roller. Clean, minimal, and effective at controlling light and privacy.',
                },
                {
                  q: 'How does the process work?',
                  a: 'Configure online with our visualiser. A technician measures at your home. We manufacture in South Australia. The same technician returns to install — perfectly fitted, every time.',
                },
                {
                  q: 'What fabric types are available?',
                  a: 'We offer four fabric types: Blockout for total darkness, Sunscreen to keep the view while reducing glare, Light Filter for a soft diffused glow, and Dual blinds that combine two fabrics for day and night.',
                },
                {
                  q: 'How long does it take?',
                  a: 'After your in-home measure, manufacturing typically takes 2-3 weeks. Installation is scheduled at a time that suits you.',
                },
                {
                  q: 'Do you service my area?',
                  a: 'We currently service all of metropolitan Melbourne and greater Victoria. Contact us for regional availability.',
                },
                {
                  q: 'What warranty do you offer?',
                  a: 'All Klay blinds come with a 5-year warranty on manufacturing defects. Our installation workmanship is guaranteed.',
                },
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    style={{
                      borderBottom: `1px solid ${tokens.lineFaint}`,
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 0',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: tokens.display,
                          fontSize: 18,
                          fontWeight: 400,
                          color: tokens.ink,
                          margin: 0,
                        }}
                      >
                        {faq.q}
                      </h3>
                      <span
                        style={{
                          fontSize: 24,
                          color: tokens.gold,
                          fontWeight: 300,
                          transition: 'transform 0.3s ease',
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                      >
                        +
                      </span>
                    </button>
                    <div
                      style={{
                        maxHeight: isOpen ? 200 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease, padding 0.3s ease',
                        paddingBottom: isOpen ? 20 : 0,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: tokens.body,
                          fontSize: 15,
                          color: 'rgba(28,24,16,0.65)',
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <p
                style={{
                  fontFamily: tokens.body,
                  fontSize: 15,
                  color: 'rgba(28,24,16,0.6)',
                  margin: 0,
                }}
              >
                Still have questions?{' '}
                <Link
                  to="/visualiser"
                  style={{
                    color: tokens.gold,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Try the Visualiser
                </Link>{' '}
                or call 1300 00 KLAY
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
