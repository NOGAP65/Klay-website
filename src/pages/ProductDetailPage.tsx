import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens, eyebrow, motion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  ProductBlindType,
  productByBlindType,
  productBySlug,
} from '../data/products';
import KlayConfigurator from '../visualiser/KlayConfigurator';
import VisualiserControls from '../visualiser/VisualiserControls';
import { useVisualiserStore } from '../visualiser/useVisualiserStore';
import { bookingLink } from '../lib/bookingLink';

const INK_55 = 'rgba(28,24,16,0.55)';

// Trust badges shown at top
const TRUST_BADGES = [
  { icon: '🇦🇺', label: 'Australian Made' },
  { icon: '🛡️', label: '5 Year Warranty' },
  { icon: '📏', label: 'Free Measure' },
  { icon: '🔧', label: 'Expert Install' },
];

// SVG Icons for features
const FeatureIcon = ({ type }: { type: string }) => {
  const icons: Record<string, JSX.Element> = {
    moon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    mute: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
    thermometer: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
    lock: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    sun: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    eye: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    wind: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>,
    contrast: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 2a10 10 0 0 1 0 20"/></svg>,
    zap: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    minimize: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
    target: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    sparkle: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/></svg>,
    home: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    user: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    palette: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="13.5" cy="6.5" r="2"/><circle cx="19" cy="11.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/><circle cx="6.5" cy="12.5" r="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.1 2.6-.3.5-.1.8-.6.7-1.1-.1-.4-.2-.8-.2-1.1 0-1.1.9-2 2-2h1.5c2.2 0 3.4-1.5 3.4-3.5 0-4.4-4-8-10-8z"/></svg>,
  };
  return icons[type] || null;
};

// Feature highlights by type
const FEATURES_BY_TYPE: Record<ProductBlindType, { icon: string; title: string; desc: string }[]> = {
  blockout: [
    { icon: 'moon', title: 'Complete Darkness', desc: 'Blocks 100% of light for perfect sleep' },
    { icon: 'mute', title: 'Noise Reduction', desc: 'Acrylic foam backing dampens sound' },
    { icon: 'thermometer', title: 'Energy Efficient', desc: 'Insulates against heat and cold' },
    { icon: 'lock', title: 'Total Privacy', desc: 'No light bleed, no silhouettes' },
  ],
  sunscreen: [
    { icon: 'sun', title: 'UV Protection', desc: 'Blocks up to 85% of harmful UV rays' },
    { icon: 'eye', title: 'Keep the View', desc: 'See outside while reducing glare' },
    { icon: 'thermometer', title: 'Heat Control', desc: 'Reduces solar heat gain' },
    { icon: 'wind', title: 'Airflow', desc: 'Maintains natural ventilation' },
  ],
  dual: [
    { icon: 'contrast', title: 'Day & Night', desc: 'Two blinds, one elegant system' },
    { icon: 'zap', title: 'Instant Switch', desc: 'Change modes in seconds' },
    { icon: 'minimize', title: 'Space Saving', desc: 'Single headrail design' },
    { icon: 'target', title: 'Versatile', desc: 'Perfect for any room' },
  ],
  lightfilter: [
    { icon: 'sparkle', title: 'Soft Glow', desc: 'Diffuses harsh sunlight beautifully' },
    { icon: 'home', title: 'Cozy Ambiance', desc: 'Creates warm, inviting spaces' },
    { icon: 'user', title: 'Daytime Privacy', desc: 'See out, they can\'t see in' },
    { icon: 'palette', title: 'Rich Colors', desc: 'Fabric colors stay vibrant' },
  ],
};

// Specs by type
const SPEC_BY_TYPE: Record<ProductBlindType, { label: string; value: string }[]> = {
  blockout: [
    { label: 'Composition', value: '100% Polyester with acrylic foam backing' },
    { label: 'Light Control', value: 'Complete blockout' },
    { label: 'Privacy', value: 'Total' },
  ],
  sunscreen: [
    { label: 'Composition', value: 'PVC coated fibreglass' },
    { label: 'Light Control', value: 'Filters 85%' },
    { label: 'Privacy', value: 'Daytime only' },
  ],
  dual: [
    { label: 'Composition', value: 'Blockout + Sunscreen paired' },
    { label: 'Light Control', value: 'Switchable' },
    { label: 'Privacy', value: 'Switchable' },
  ],
  lightfilter: [
    { label: 'Composition', value: '100% Polyester' },
    { label: 'Light Control', value: 'Softens and diffuses' },
    { label: 'Privacy', value: 'Partial' },
  ],
};

const SHARED_SPECS = [
  { label: 'Made In', value: 'Australia' },
  { label: 'Warranty', value: '5 years' },
  { label: 'Hardware', value: 'White / Black / Chrome' },
  { label: 'Max Width', value: '3000mm' },
  { label: 'Max Drop', value: '3300mm' },
];

// FAQs by type
const FAQ_BY_TYPE: Record<ProductBlindType, { q: string; a: string }[]> = {
  blockout: [
    { q: 'Will it completely block all light?', a: 'Yes. Our blockout fabric has an acrylic foam backing that eliminates light bleed, including at the edges when properly installed.' },
    { q: 'Can I still use it in a living room?', a: 'Absolutely. Blockout blinds work in any room — many customers use them in living areas for afternoon glare and privacy.' },
  ],
  sunscreen: [
    { q: 'Can I still see outside during the day?', a: 'Yes. Sunscreen fabric filters glare while preserving your view. At night the effect reverses — interior lighting makes you visible from outside.' },
    { q: 'What percentage of UV does it block?', a: 'Our Veil sunscreen fabric blocks up to 85% of UV radiation while maintaining natural light.' },
  ],
  dual: [
    { q: 'How does the dual roller work?', a: 'Two blinds on one bracket — a sunscreen for daytime and a blockout for night. Each operates independently on the same headrail.' },
    { q: 'Is it harder to install than a single blind?', a: 'No. Our technician handles measurement and installation. The dual system installs in the same time as a single blind.' },
  ],
  lightfilter: [
    { q: 'What is the difference between light filter and sunscreen?', a: 'Light filter softly diffuses daylight into a warm glow. Sunscreen preserves your view through the fabric. Light filter is more opaque and better for privacy.' },
    { q: 'Is it good for bedrooms?', a: 'Yes — it creates a soft ambient light during the day while maintaining privacy, making it ideal for bedrooms and nurseries.' },
  ],
};

const SHARED_FAQS = [
  { q: 'How long does installation take?', a: 'A typical single window takes 15–20 minutes. Our technician will measure, then return to install once your blind is manufactured.' },
  { q: 'What warranty do I get?', a: 'Every blind carries a 5 year warranty covering the fabric, the hardware and the motor.' },
];


// --- UI Components ---

function GoldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ ...eyebrow, letterSpacing: '0.25em' }}>{children}</div>;
}

function FaqRow({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(open ? (bodyRef.current?.scrollHeight ?? 0) : 0);
  }, [open, a]);

  return (
    <div style={{ borderBottom: `1px solid rgba(28,24,16,0.1)` }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          width: '100%',
          padding: '20px 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: tokens.ink,
        }}
      >
        <span style={{ fontFamily: tokens.body, fontSize: 15, fontWeight: 500, color: tokens.ink }}>{q}</span>
        <span style={{ flexShrink: 0, color: tokens.gold, fontSize: 20, fontWeight: 300, transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>+</span>
      </button>
      <div style={{ height, overflow: 'hidden', transition: 'height 0.3s ease' }}>
        <p ref={bodyRef} style={{ fontFamily: tokens.body, fontSize: 14, lineHeight: 1.7, color: INK_55, paddingBottom: 20, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const store = useVisualiserStore();
  const setScrollY = useKlayStore(s => s.setScrollY);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [quoteHover, setQuoteHover] = useState(false);
  const [cartHover, setCartHover] = useState(false);
  const [barCartHover, setBarCartHover] = useState(false);
  const [barQuoteHover, setBarQuoteHover] = useState(false);

  const product = productBySlug(slug);
  const legacy = product ? undefined : productByBlindType(slug);

  useEffect(() => {
    if (product) return;
    navigate(legacy ? `/products/${legacy.slug}` : '/products', { replace: true });
  }, [product, legacy, navigate]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false; });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  if (!product) return null;

  const bookHref = bookingLink({ blindType: store.blindType, windowSize: store.windowSize, operation: store.operation, fabricColour: store.fabricColour, hardwareColour: store.hardwareColour });
  const price = store.getCurrentPrice();
  const specRows = [...SPEC_BY_TYPE[product.blindType], ...SHARED_SPECS];
  const faqs = [...FAQ_BY_TYPE[product.blindType], ...SHARED_FAQS];
  const features = FEATURES_BY_TYPE[product.blindType];

  return (
    <>
      <Nav onLight />
      <div style={{ background: tokens.warmWhite }}>

        {/* Trust badges bar */}
        <div style={{ background: tokens.charcoal, padding: '14px 24px', marginTop: isMobile ? 60 : 72 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: isMobile ? 16 : 40 }}>
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{badge.icon}</span>
                <span style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.warmWhite, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero section - identical to homepage visualiser layout */}
        <section style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'stretch', width: '100%', background: tokens.warmWhite, overflow: 'visible', padding: isMobile ? '24px' : '80px 60px', gap: 32 }}>
          {/* Visualiser - same as homepage */}
          <div style={{ flex: '1 1 55%', background: tokens.warmWhite, position: 'relative' }}>
            <KlayConfigurator defaultBlindType={product.blindType} />
          </div>

          {/* Controls panel */}
          <div style={{ flex: '0 0 380px', background: tokens.warmWhite, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Product info at top */}
            <div>
              <GoldLabel>{product.type}</GoldLabel>
              <h1 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: tokens.ink, lineHeight: 1.1, margin: '8px 0 0' }}>
                {product.name}
              </h1>
              <p style={{ fontFamily: tokens.body, fontSize: 14, color: INK_55, lineHeight: 1.5, margin: '8px 0 0' }}>
                {product.tagline}
              </p>
              {/* Star rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ color: tokens.gold, fontSize: 14 }}>★</span>)}
                </div>
                <span style={{ fontFamily: tokens.body, fontSize: 12, color: tokens.inkSoft }}>5.0 (47 reviews)</span>
              </div>
            </div>

            {/* VisualiserControls */}
            <VisualiserControls lockedRange={product.blindType} compact />

            {/* Two large CTAs right after price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onMouseEnter={() => setCartHover(true)}
                onMouseLeave={() => setCartHover(false)}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: cartHover ? tokens.goldLight : tokens.gold,
                  color: tokens.ink,
                  fontFamily: tokens.body,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: motion.button,
                  textAlign: 'center',
                }}
              >
                Add to Cart
              </button>
              <Link
                to={bookHref}
                onMouseEnter={() => setQuoteHover(true)}
                onMouseLeave={() => setQuoteHover(false)}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  background: 'transparent',
                  color: quoteHover ? tokens.gold : tokens.ink,
                  fontFamily: tokens.body,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  border: `1px solid ${quoteHover ? tokens.gold : tokens.lineStrong}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: motion.button,
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                Get Quote
              </Link>
            </div>
          </div>
        </section>

        {/* Features section - dark background for contrast */}
        <section style={{ background: tokens.charcoal, padding: isMobile ? '64px 24px' : '80px 80px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontFamily: tokens.body, fontSize: 11, fontWeight: 500, color: tokens.gold, textTransform: 'uppercase', letterSpacing: '0.25em', margin: 0 }}>Why Choose {product.name}</p>
              <h2 style={{ fontFamily: tokens.display, fontSize: isMobile ? 32 : 42, fontWeight: 300, color: tokens.warmWhite, margin: '12px 0 0' }}>Built for the way you live.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 24 : 32 }}>
              {features.map((f) => (
                <div key={f.title} style={{ textAlign: 'center', padding: 24, background: 'rgba(245,242,237,0.05)', borderRadius: 8, border: '1px solid rgba(245,242,237,0.1)' }}>
                  <div style={{ color: tokens.gold, marginBottom: 16, display: 'flex', justifyContent: 'center' }}><FeatureIcon type={f.icon} /></div>
                  <h3 style={{ fontFamily: tokens.display, fontSize: 20, fontWeight: 400, color: tokens.warmWhite, margin: 0 }}>{f.title}</h3>
                  <p style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(245,242,237,0.65)', margin: '8px 0 0', lineHeight: 1.5 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Specs section */}
        <section style={{ background: tokens.parchment, padding: isMobile ? '64px 24px' : '80px 80px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <GoldLabel>Specifications</GoldLabel>
              <h2 style={{ fontFamily: tokens.display, fontSize: isMobile ? 32 : 42, fontWeight: 300, color: tokens.ink, margin: '12px 0 0' }}>The details that matter.</h2>
            </div>
            <div style={{ background: tokens.warmWhite, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(28,24,16,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {specRows.map((row, i) => (
                    <tr key={row.label} style={{ borderBottom: i < specRows.length - 1 ? `1px solid ${tokens.lineFaint}` : 'none' }}>
                      <td style={{
                        padding: '18px 24px',
                        fontFamily: tokens.body,
                        fontSize: 13,
                        color: tokens.inkSoft,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        width: '40%',
                        verticalAlign: 'middle',
                      }}>
                        {row.label}
                      </td>
                      <td style={{
                        padding: '18px 24px',
                        fontFamily: tokens.body,
                        fontSize: 15,
                        color: tokens.ink,
                        fontWeight: 500,
                        textAlign: 'right',
                        verticalAlign: 'middle',
                      }}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section style={{ background: tokens.warmWhite, padding: isMobile ? '64px 24px' : '80px 80px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <GoldLabel>FAQ</GoldLabel>
              <h2 style={{ fontFamily: tokens.display, fontSize: isMobile ? 32 : 42, fontWeight: 300, color: tokens.ink, margin: '12px 0 0' }}>Common questions.</h2>
            </div>
            <div>
              {faqs.map((f, i) => (
                <FaqRow key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(cur => cur === i ? null : i)} />
              ))}
            </div>
          </div>
        </section>

        <Footer />

        {/* Spacer for fixed bar */}
        <div style={{ height: 56, background: tokens.ink }} />

        {/* Sticky bottom bar */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 50,
          background: 'rgba(245,242,237,0.98)',
          backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${tokens.lineFaint}`,
          padding: isMobile ? '8px 24px' : '10px 80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: tokens.body, fontSize: 11, color: tokens.inkSoft, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.name}</div>
            <div style={{ fontFamily: tokens.display, fontSize: isMobile ? 20 : 24, fontWeight: 300, color: tokens.ink }}>${price}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link
              to={bookHref}
              onMouseEnter={() => setBarQuoteHover(true)}
              onMouseLeave={() => setBarQuoteHover(false)}
              style={{
                background: 'transparent',
                color: barQuoteHover ? tokens.gold : tokens.ink,
                fontFamily: tokens.body,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: isMobile ? '8px 16px' : '10px 20px',
                borderRadius: 4,
                border: `1px solid ${barQuoteHover ? tokens.gold : tokens.lineStrong}`,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: motion.button,
              }}
            >
              Get Quote
            </Link>
            <button
              onMouseEnter={() => setBarCartHover(true)}
              onMouseLeave={() => setBarCartHover(false)}
              style={{
                background: barCartHover ? tokens.goldLight : tokens.gold,
                color: tokens.ink,
                fontFamily: tokens.body,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: isMobile ? '8px 16px' : '10px 20px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                transition: motion.button,
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
