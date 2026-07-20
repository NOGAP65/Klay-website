import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';
import { RANGES, SKU_CATALOGUE } from '../data/products';

const GOLD = '#C8973A';
const DARK = '#0f0d09';
const PARCHMENT = '#F2EDE4';
const INK = '#1E1A16';

const CATEGORY_CONTENT: Record<string, { quote: string; body: string; lightLabel: string; lightPercent: number }> = {
  blockout: {
    quote: 'Darkness on demand.',
    body: 'The Dusk range is built for bedrooms, home theatres and anywhere complete light control matters. Full blockout fabric means zero light penetration — day or night. Available in white, black and chrome hardware to match any interior.',
    lightLabel: '0%',
    lightPercent: 0,
  },
  sunscreen: {
    quote: 'The view, refined.',
    body: 'Veil lets natural light in while cutting glare and UV. You keep the connection to the outside world — the mesh fabric filters without blocking. Perfect for living rooms, offices and any space where the view matters.',
    lightLabel: '45%',
    lightPercent: 45,
  },
  dual: {
    quote: 'Two blinds. One window.',
    body: 'Duo runs a sunscreen and a blockout on the same roller system. During the day, drop the Veil. At night, bring down the Dusk. Maximum flexibility for rooms that need to do both.',
    lightLabel: '0–45%',
    lightPercent: 45,
  },
};

const HARDWARE_INFO = [
  { name: 'White', desc: 'Clean and versatile — suits light-toned interiors and Scandinavian aesthetics.' },
  { name: 'Black', desc: 'Bold and architectural — pairs with dark frames, concrete and industrial finishes.' },
  { name: 'Chrome', desc: 'Refined and reflective — complements brushed metal tapware and modern kitchens.' },
];

function hardwareDotStyle(name: string): React.CSSProperties {
  const base: React.CSSProperties = { borderRadius: '50%' };
  if (name === 'White') return { ...base, background: '#F0EDE8', border: '1px solid rgba(248,246,242,0.3)' };
  if (name === 'Black') return { ...base, background: '#1a1a1a', border: '1px solid rgba(248,246,242,0.2)' };
  return { ...base, background: 'linear-gradient(135deg, #e8e8e8, #a0a0a0)', border: '1px solid rgba(248,246,242,0.2)' };
}

export default function ProductCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const range = RANGES.find((r) => r.slug === category);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (!range) {
      navigate('/products', { replace: true });
    }
  }, [range, navigate]);

  useEffect(() => {
    if (!range) return;
    const content = CATEGORY_CONTENT[range.slug];
    const t = setTimeout(() => setBarWidth(content.lightPercent), 100);
    return () => clearTimeout(t);
  }, [range]);

  if (!range) return null;
  const content = CATEGORY_CONTENT[range.slug];
  const skus = SKU_CATALOGUE.filter((s) => s.type === range.range.toUpperCase());

  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{ background: DARK, padding: '160px 80px 80px' }}>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: 'rgba(248,246,242,0.3)', marginBottom: 24 }}>
          <Link to="/products" style={{ color: 'rgba(248,246,242,0.3)', textDecoration: 'none' }}>
            Blinds
          </Link>
          {' / '}
          <Link to={`/products/${category}`} style={{ color: 'rgba(248,246,242,0.3)', textDecoration: 'none' }}>
            {range.range}
          </Link>
        </div>
        <h1
          style={{
            fontFamily: tokens.display,
            fontSize: 'clamp(72px, 9vw, 130px)',
            fontWeight: 300,
            color: tokens.warmWhite,
            lineHeight: 0.85,
            margin: 0,
          }}
        >
          {range.name}
        </h1>
        <div style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: 24, color: GOLD, marginTop: 12 }}>
          {range.range}
        </div>
        <p style={{ fontFamily: tokens.body, fontSize: 15, color: 'rgba(248,246,242,0.5)', marginTop: 16, maxWidth: 480 }}>
          {range.tagline}
        </p>
      </section>

      {/* Range description */}
      <section style={{ background: PARCHMENT, padding: '80px' }}>
        <div style={{ display: 'flex', gap: 80, maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: tokens.display, fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 300, fontStyle: 'italic', color: INK, lineHeight: 1.1 }}>
              “{content.quote}”
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: tokens.body, fontSize: 16, lineHeight: 1.8, color: 'rgba(30,26,22,0.65)' }}>
              {content.body}
            </p>
            <div style={{ marginTop: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: tokens.body, fontSize: 11, color: 'rgba(30,26,22,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                <span>Light penetration</span>
                <span>{content.lightLabel}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(200,151,58,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: GOLD,
                    borderRadius: '2px',
                    transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SKU cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2px', padding: '0 80px 80px', background: DARK }}>
        {skus.map((s) => (
          <div
            key={s.sku}
            onClick={() => navigate(`/products/${category}/${s.slug}`)}
            style={{ background: '#1a1208', cursor: 'pointer' }}
          >
            <div style={{ height: '320px', overflow: 'hidden' }}>
              <img src={s.image} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ fontFamily: tokens.body, fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                {s.type}
              </div>
              <div style={{ fontFamily: tokens.display, fontSize: 24, color: tokens.warmWhite, marginTop: 8 }}>
                {s.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ width: 10, height: 10, ...hardwareDotStyle(s.hardware) }} />
                <span style={{ fontFamily: tokens.body, fontSize: 12, color: 'rgba(248,246,242,0.5)' }}>{s.hardware} hardware</span>
              </div>
              <div style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(248,246,242,0.4)', marginTop: 8 }}>
                from ${s.price.small}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hardware comparison */}
      <section style={{ background: PARCHMENT, padding: '80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h2 style={{ fontFamily: tokens.display, fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 300, color: INK, marginBottom: 56 }}>
            Three finishes. Same precision.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 48 }}>
            {HARDWARE_INFO.map((h) => (
              <div key={h.name}>
                <span style={{ display: 'block', width: 24, height: 24, marginBottom: 20, ...hardwareDotStyle(h.name) }} />
                <div style={{ fontFamily: tokens.display, fontSize: 28, color: INK }}>{h.name}</div>
                <p style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(30,26,22,0.55)', lineHeight: 1.7, marginTop: 10 }}>
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: DARK, padding: '80px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: tokens.display, fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 300, color: tokens.warmWhite, margin: 0 }}>
          Ready to design your {range.name}?
        </h2>
        <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          <Link
            to="/visualiser"
            style={{
              textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '17px 36px',
              background: GOLD, color: DARK,
            }}
          >
            Open Visualiser →
          </Link>
          <Link
            to="/products"
            style={{
              textDecoration: 'none', fontFamily: tokens.body, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '17px 36px',
              background: 'transparent', color: tokens.warmWhite, border: '1px solid rgba(248,246,242,0.3)',
            }}
          >
            View all blinds
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
