import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { tokens } from '../theme';
import { RANGES, SKU_CATALOGUE, MOTORISED_ADDON } from '../data/products';

const GOLD = '#C8973A';
const DARK = '#0f0d09';

const HARDWARE_INFO: Record<string, string> = {
  White: 'Clean and versatile — suits light-toned interiors and Scandinavian aesthetics.',
  Black: 'Bold and architectural — pairs with dark frames, concrete and industrial finishes.',
  Chrome: 'Refined and reflective — complements brushed metal tapware and modern kitchens.',
};

const WHAT_IT_IS: Record<string, { headline: string; body: string[] }> = {
  'BLOCKOUT ROLLER': {
    headline: 'Total light control for every room.',
    body: [
      'Blockout roller blinds use a fully opaque fabric that stops light penetration completely, so the room goes as dark as you need it — day or night. That makes them the standard choice for bedrooms, nurseries and home theatres.',
      'Each blind is made to the millimetre for your exact window, with a smooth roller mechanism and a choice of hardware finish so it disappears into the room rather than fighting the rest of your interior.',
    ],
  },
  'SUNSCREEN ROLLER': {
    headline: 'Softened light. Uninterrupted views.',
    body: [
      'Sunscreen roller blinds use an open-weave mesh fabric that filters glare and UV while keeping your view to the outside intact. You get privacy during the day without losing natural light or the connection to the street or garden.',
      'They suit living rooms, home offices and any north or west-facing window where direct sun makes a room hard to use in the afternoon.',
    ],
  },
  'DUAL ROLLER': {
    headline: 'The best of both, on one window.',
    body: [
      'Dual roller blinds combine a sunscreen layer and a full blockout layer on the same roller system, so one window can do both jobs. Drop the sunscreen for daytime glare control, or the blockout for total darkness at night.',
      'It is the simplest way to avoid compromising between light control and privacy — no second blind, no extra hardware, just one system with two settings.',
    ],
  },
};

const PROCESS_STEPS = [
  { n: '01', title: 'Design', body: 'Configure your blind online in minutes.' },
  { n: '02', title: 'Measure', body: 'A technician measures your window, free.' },
  { n: '03', title: 'Make', body: 'Cut to the millimetre in our workshop.' },
  { n: '04', title: 'Install', body: 'The same technician fits it on site.' },
];

const REVIEWS_BY_TYPE: Record<string, { quote: string; name: string; suburb: string }[]> = {
  'BLOCKOUT ROLLER': [
    { quote: 'Pitch black in the nursery, exactly as promised. Our baby actually naps now.', name: 'Tom Redmond', suburb: 'Essendon, VIC' },
    { quote: 'No light creeping in around the edges like our old blinds. Genuinely total blockout.', name: 'Sarah Kim', suburb: 'Richmond, VIC' },
    { quote: 'Installed in the home theatre and it is like a cinema in there now.', name: 'Marcus Webb', suburb: 'Hawthorn, VIC' },
  ],
  'SUNSCREEN ROLLER': [
    { quote: 'Still get the view of the garden but the afternoon glare is gone. Perfect balance.', name: 'Priya Nadar', suburb: 'Kew, VIC' },
    { quote: 'Our home office finally usable after 2pm without squinting at the screen.', name: 'James Ollerton', suburb: 'Fitzroy, VIC' },
    { quote: 'Lets the light in but you cannot see inside from the street. Exactly what we wanted.', name: 'Elena Cross', suburb: 'Brunswick, VIC' },
  ],
  'DUAL ROLLER': [
    { quote: 'One blind, two jobs. Sunscreen during the day, blockout at night. So simple.', name: 'Daniel Pace', suburb: 'Ivanhoe, VIC' },
    { quote: 'Didn’t want two separate blinds cluttering the window and this solved it perfectly.', name: 'Amara Whitfield', suburb: 'Brighton, VIC' },
    { quote: 'Switch between the layers depending on the time of day. Genuinely useful, not just a gimmick.', name: 'Sofia Marchetti', suburb: 'Camberwell, VIC' },
  ],
};

function hardwareDotStyle(name: string): React.CSSProperties {
  const base: React.CSSProperties = { borderRadius: '50%' };
  if (name === 'White') return { ...base, background: '#F0EDE8', border: '1px solid rgba(248,246,242,0.3)' };
  if (name === 'Black') return { ...base, background: '#1a1a1a', border: '1px solid rgba(248,246,242,0.2)' };
  return { ...base, background: 'linear-gradient(135deg, #e8e8e8, #a0a0a0)', border: '1px solid rgba(248,246,242,0.2)' };
}

export default function ProductDetailPage() {
  const { category, sku } = useParams<{ category: string; sku: string }>();
  const navigate = useNavigate();
  const product = SKU_CATALOGUE.find((p) => p.slug === sku);
  const range = RANGES.find((r) => r.slug === category);

  useEffect(() => {
    if (!product) {
      navigate('/products', { replace: true });
    }
  }, [product, navigate]);

  if (!product) return null;

  const whatItIs = WHAT_IT_IS[product.type];
  const reviews = REVIEWS_BY_TYPE[product.type];

  return (
    <>
      <Nav />

      {/* Hero */}
      <section style={{ position: 'relative', height: '70vh', overflow: 'hidden' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 80, right: 80 }}>
          <div style={{ fontFamily: tokens.body, fontSize: 11, color: 'rgba(248,246,242,0.6)', marginBottom: 20 }}>
            <Link to="/products" style={{ color: 'rgba(248,246,242,0.6)', textDecoration: 'none' }}>Blinds</Link>
            {' / '}
            <Link to={`/products/${category}`} style={{ color: 'rgba(248,246,242,0.6)', textDecoration: 'none' }}>{range?.range}</Link>
            {' / '}
            <span>{product.name}</span>
          </div>
          <h1 style={{ fontFamily: tokens.display, fontSize: 'clamp(52px, 7vw, 96px)', fontWeight: 300, color: tokens.warmWhite, margin: 0, lineHeight: 0.95 }}>
            {product.name}
          </h1>
          <div style={{ fontFamily: tokens.body, fontSize: 14, color: 'rgba(248,246,242,0.6)', marginTop: 12 }}>
            {product.hardware} hardware · from ${product.price.small}
          </div>
        </div>
      </section>

      {/* Sticky sidebar CTA */}
      <div
        style={{
          position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)', zIndex: 50,
          background: '#1a1208', border: '1px solid rgba(200,151,58,0.3)', padding: '32px 28px', width: '280px',
        }}
      >
        <div style={{ fontFamily: tokens.display, fontSize: 24, color: tokens.warmWhite, marginBottom: 16 }}>
          {product.name}
        </div>
        <div>
          {[
            { label: 'Small (up to 1m)', value: `$${product.price.small}` },
            { label: 'Medium (up to 2m)', value: `$${product.price.medium}` },
            { label: 'Large (up to 3m)', value: `$${product.price.large}` },
            { label: 'Motorised add-on', value: `+$${MOTORISED_ADDON}` },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex', justifyContent: 'space-between', fontFamily: tokens.body, fontSize: 13,
                color: 'rgba(248,246,242,0.7)', padding: '10px 0', borderBottom: '1px solid rgba(248,246,242,0.06)',
              }}
            >
              <span>{row.label}</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>
        <Link
          to="/visualiser"
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none', fontFamily: tokens.body, fontSize: 12,
            fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px', width: '100%',
            background: GOLD, color: DARK, marginTop: 24, boxSizing: 'border-box',
          }}
        >
          Design in Visualiser →
        </Link>
        <a
          href="tel:1300005529"
          style={{
            display: 'block', textAlign: 'center', textDecoration: 'none', fontFamily: tokens.body, fontSize: 12,
            fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px', width: '100%',
            background: 'transparent', color: tokens.warmWhite, border: '1px solid rgba(248,246,242,0.3)',
            marginTop: 8, boxSizing: 'border-box',
          }}
        >
          Call 1300 00 KLAY
        </a>
      </div>

      <div style={{ background: tokens.parchment }}>
      <div style={{ maxWidth: '720px', padding: '80px 80px 80px 80px' }}>
        {/* Section 1 — What it is */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.ink, margin: 0 }}>
            {whatItIs.headline}
          </h2>
          {whatItIs.body.map((p) => (
            <p key={p} style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.8, color: tokens.textMid, marginTop: 18 }}>
              {p}
            </p>
          ))}
        </section>

        {/* Section 2 — Hardware finish */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.ink, marginBottom: 24 }}>
            Your hardware, your choice.
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 32, height: 32, flexShrink: 0, ...hardwareDotStyle(product.hardware) }} />
            <div>
              <div style={{ fontFamily: tokens.display, fontSize: 22, color: tokens.ink }}>{product.hardware}</div>
              <p style={{ fontFamily: tokens.body, fontSize: 14, color: tokens.textMid, marginTop: 4 }}>
                {HARDWARE_INFO[product.hardware]}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 — Sizing */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.ink, marginBottom: 18 }}>
            Made to your exact measurements.
          </h2>
          <p style={{ fontFamily: tokens.body, fontSize: 15, lineHeight: 1.8, color: tokens.textMid }}>
            After you order, a Klay technician visits your home within 7–10 days to measure every window precisely.
            Your blind is then cut to the millimetre in our workshop.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Small', sub: 'up to 1m', price: product.price.small },
              { label: 'Medium', sub: 'up to 2m', price: product.price.medium },
              { label: 'Large', sub: 'up to 3m', price: product.price.large },
            ].map((size) => (
              <div key={size.label} style={{ border: '1px solid rgba(30,26,22,0.15)', padding: '16px 22px' }}>
                <div style={{ fontFamily: tokens.display, fontSize: 18, color: tokens.ink }}>{size.label}</div>
                <div style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{size.sub}</div>
                <div style={{ fontFamily: tokens.body, fontSize: 14, color: GOLD, marginTop: 8 }}>${size.price}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 — The process */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.ink, marginBottom: 28 }}>
            From click to fitted window.
          </h2>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {PROCESS_STEPS.map((s) => (
              <div key={s.n} style={{ flex: '1 1 140px' }}>
                <div style={{ fontFamily: tokens.display, fontSize: 32, color: GOLD }}>{s.n}</div>
                <div style={{ fontFamily: tokens.display, fontSize: 18, color: tokens.ink, marginTop: 6 }}>{s.title}</div>
                <p style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      </div>

      {/* Reviews */}
      <section style={{ background: tokens.parchment, padding: '80px 80px 100px' }}>
        <h2 style={{ fontFamily: tokens.display, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 300, color: tokens.ink, marginBottom: 48 }}>
          What people say.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {reviews.map((r) => (
            <div key={r.name} style={{ background: tokens.cream, border: '1px solid rgba(30,26,22,0.12)', padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ color: GOLD, fontSize: 14, letterSpacing: '0.2em' }}>★★★★★</div>
              <p style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: 18, lineHeight: 1.4, color: tokens.ink, margin: 0 }}>
                “{r.quote}”
              </p>
              <div style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: tokens.textMid, marginTop: 'auto' }}>
                {r.name} · {r.suburb}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
