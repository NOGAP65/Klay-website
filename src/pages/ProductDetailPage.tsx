import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import { useKlayStore } from '../store';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  HARDWARE_OPTIONS,
  MOTORISED_ADDON,
  ProductBlindType,
  RYNAMIC_COLOURS,
  productByBlindType,
  productBySlug,
} from '../data/products';
import KlayConfigurator from '../visualiser/KlayConfigurator';
import { useVisualiserStore } from '../visualiser/useVisualiserStore';

// Section 4's background. Off-palette on purpose because the brief asks for
// it — theme.ts documents removing this exact value as "a fourth off-white
// outside the palette", and tokens.parchment (#F2EDE4) is the sanctioned step
// below warmWhite if this is ever brought back in line.
const SHELL = '#EAE5DC';

const LINE_FAINT = 'rgba(28,24,16,0.08)';
const LINE = 'rgba(28,24,16,0.1)';
const INK_55 = 'rgba(28,24,16,0.55)';
const INK_40 = 'rgba(28,24,16,0.4)';

/** Chrome reads as a finish rather than a grey only if it has a highlight.
 * The flat HARDWARE_HEX.chrome is what the canvas fills with; this is the
 * swatch the customer picks from. */
const CHROME_GRADIENT = 'linear-gradient(135deg, #E8E8E8, #A0A0A0)';

const SIZE_OPTIONS: { id: 'small' | 'medium' | 'large'; label: string; sub: string }[] = [
  { id: 'small', label: 'Small', sub: 'up to 1m' },
  { id: 'medium', label: 'Medium', sub: 'up to 2m' },
  { id: 'large', label: 'Large', sub: 'up to 3m' },
];

const OPERATION_OPTIONS: { id: 'manual' | 'motorised'; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: `Motorised (+$${MOTORISED_ADDON})` },
];

// --- Specifications --------------------------------------------------------
// The three that differ by blind type lead, so the detail that actually
// distinguishes one product from another isn't buried under nine rows every
// product shares.

const SPEC_BY_TYPE: Record<ProductBlindType, { label: string; value: string }[]> = {
  blockout: [
    { label: 'Composition', value: '100% Polyester with acrylic foam backing' },
    { label: 'Light control', value: 'Complete blockout' },
    { label: 'Privacy', value: 'Total' },
  ],
  sunscreen: [
    { label: 'Composition', value: 'PVC coated fibreglass' },
    { label: 'Light control', value: 'Filters 85%' },
    { label: 'Privacy', value: 'Daytime only' },
  ],
  dual: [
    { label: 'Composition', value: 'Blockout + Sunscreen paired' },
    { label: 'Light control', value: 'Switchable' },
    { label: 'Privacy', value: 'Switchable' },
  ],
  lightfilter: [
    { label: 'Composition', value: '100% Polyester' },
    { label: 'Light control', value: 'Softens and diffuses' },
    { label: 'Privacy', value: 'Partial' },
  ],
};

const SHARED_SPECS: { label: string; value: string }[] = [
  { label: 'Made in', value: 'Australia' },
  { label: 'Warranty', value: '5 years' },
  { label: 'Operation', value: 'Chain drive (Manual) or 24V Motor (Motorised)' },
  { label: 'Hardware finish', value: 'White / Black / Chrome' },
  { label: 'Minimum width', value: '400mm' },
  { label: 'Maximum width', value: '3000mm' },
  { label: 'Minimum drop', value: '400mm' },
  { label: 'Maximum drop', value: '3300mm' },
  { label: 'Cleaning', value: 'Wipe with damp cloth' },
];

// --- FAQs ------------------------------------------------------------------

const FAQ_BY_TYPE: Record<ProductBlindType, { q: string; a: string }[]> = {
  blockout: [
    {
      q: 'Will it completely block all light?',
      a: 'Yes. Our blockout fabric has an acrylic foam backing that eliminates light bleed, including at the edges when properly installed.',
    },
    {
      q: 'Can I still use it in a living room?',
      a: 'Absolutely. Blockout blinds work in any room — many customers use them in living areas for afternoon glare and privacy.',
    },
  ],
  sunscreen: [
    {
      q: 'Can I still see outside during the day?',
      a: 'Yes. Sunscreen fabric filters glare while preserving your view. At night the effect reverses — interior lighting makes you visible from outside.',
    },
    {
      q: 'What percentage of UV does it block?',
      a: 'Our Veil sunscreen fabric blocks up to 85% of UV radiation while maintaining natural light.',
    },
  ],
  dual: [
    {
      q: 'How does the dual roller work?',
      a: 'Two blinds on one bracket — a sunscreen for daytime and a blockout for night. Each operates independently on the same headrail.',
    },
    {
      q: 'Is it harder to install than a single blind?',
      a: 'No. Our technician handles measurement and installation. The dual system installs in the same time as a single blind.',
    },
  ],
  lightfilter: [
    {
      q: 'What is the difference between light filter and sunscreen?',
      a: 'Light filter softly diffuses daylight into a warm glow. Sunscreen preserves your view through the fabric. Light filter is more opaque and better for privacy.',
    },
    {
      q: 'Is it good for bedrooms?',
      a: 'Yes — it creates a soft ambient light during the day while maintaining privacy, making it ideal for bedrooms and nurseries.',
    },
  ],
};

// The brief supplied one shared FAQ and asked for five in total. These two
// make up the difference and are composed only from facts already stated
// elsewhere — the 5-year warranty from the specs table above, and the free
// technician measure and 7–10 day window from the site's existing process
// copy. NEEDS COPY REVIEW before this is treated as published policy.
const SHARED_FAQS: { q: string; a: string }[] = [
  {
    q: 'How long does installation take?',
    a: 'A typical single window takes 15–20 minutes. Our technician will measure, then return to install once your blind is manufactured.',
  },
  {
    q: 'How does measuring work?',
    a: 'Once you order, a Klay technician visits your home to measure every window precisely — usually within 7 to 10 days, and at no cost. Your blind is then cut to the millimetre in our workshop.',
  },
  {
    q: 'What warranty do I get?',
    a: 'Every blind carries a 5 year warranty covering the fabric, the hardware and the motor. Installation by our own technicians is what lets us stand behind it.',
  },
];

const QUALITY_COPY: Record<ProductBlindType, string[]> = {
  blockout: [
    'Every Dusk blind is cut to the millimetre for the window it will hang in. Nothing is trimmed on site to fit — the measurement happens first, the fabric is cut to it, and the blind arrives already correct.',
    'The acrylic foam backing is what does the work: it stops light passing through the weave rather than merely darkening it. Paired with a face-mounted bracket that overlaps the casing, that is what removes the halo most blockout blinds leave around the edge.',
  ],
  sunscreen: [
    'Every Veil blind is cut to the millimetre for the window it will hang in. Nothing is trimmed on site to fit — the measurement happens first, the fabric is cut to it, and the blind arrives already correct.',
    'The PVC coated fibreglass mesh holds its shape and its openness for the life of the blind. It will not stretch, sag or yellow the way an untreated fabric does in a west-facing window.',
  ],
  dual: [
    'Every Duo blind is cut to the millimetre for the window it will hang in. Nothing is trimmed on site to fit — the measurement happens first, the fabric is cut to it, and the blind arrives already correct.',
    'Both layers run on a single headrail machined to carry the pair. That is what keeps a dual system as slim on the wall as a single blind, and why it takes our technician no longer to fit.',
  ],
  lightfilter: [
    'Every Haze blind is cut to the millimetre for the window it will hang in. Nothing is trimmed on site to fit — the measurement happens first, the fabric is cut to it, and the blind arrives already correct.',
    'The polyester weave is chosen for how evenly it spreads light rather than how much it blocks. Harsh direct sun arrives as a flat warm glow instead of a bright band across the floor.',
  ],
};

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function GoldLabel({ children, spacing = '0.2em' }: { children: React.ReactNode; spacing?: string }) {
  return (
    <div
      style={{
        fontFamily: tokens.body,
        fontSize: 10,
        color: tokens.gold,
        textTransform: 'uppercase',
        letterSpacing: spacing,
      }}
    >
      {children}
    </div>
  );
}

function Pill({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        fontFamily: tokens.body,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        padding: '10px 20px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        background: active ? tokens.ink : 'transparent',
        border: `1px solid ${active ? tokens.ink : hover ? tokens.gold : 'rgba(28,24,16,0.2)'}`,
        color: active ? tokens.warmWhite : hover ? tokens.gold : 'rgba(28,24,16,0.6)',
        transition: 'background 0.25s ease, border-color 0.25s ease, color 0.25s ease',
      }}
    >
      <span>{label}</span>
      {sub && (
        <span style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'none', opacity: 0.7 }}>
          {sub}
        </span>
      )}
    </button>
  );
}

/** 32px circle. The selected ring sits 2px outside the swatch rather than
 * thickening its edge, so choosing a colour doesn't visibly shrink it. */
function Swatch({
  background,
  label,
  active,
  onClick,
}: {
  background: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        padding: 0,
        flexShrink: 0,
        cursor: 'pointer',
        background,
        border: `1px solid ${LINE}`,
        boxShadow: active ? `0 0 0 2px ${tokens.warmWhite}, 0 0 0 4px ${tokens.gold}` : 'none',
        transition: 'box-shadow 0.2s ease',
      }}
    />
  );
}

/** The fabric / hardware / size / operation stack, bound to the shared
 * visualiser store so the selections and the blind on the canvas beside it can
 * never fall out of step.
 *
 * Deliberately no blind type control. The customer is on the Dusk page; the
 * URL already answered that question. The only type switcher in the app lives
 * in VisualiserControls, which this page does not use, and KlayConfigurator's
 * defaultBlindType locks the store's type on top of that. */
function ConfiguratorControls() {
  const store = useVisualiserStore();
  const nameColor = tokens.ink;

  return (
    <>
      <div>
        <GoldLabel>Fabric Colour</GoldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {RYNAMIC_COLOURS.map(c => (
            <Swatch
              key={c.name}
              background={c.hex}
              label={c.name}
              active={store.fabricColour === c.name}
              onClick={() => store.setFabricColour(c.name)}
            />
          ))}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: nameColor, marginTop: 8 }}>
          {store.fabricColour}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <GoldLabel>Hardware Colour</GoldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {HARDWARE_OPTIONS.map(h => (
            <Swatch
              key={h.id}
              background={h.id === 'chrome' ? CHROME_GRADIENT : (h.id === 'white' ? '#E8E4DE' : '#2C2824')}
              label={h.label}
              active={store.hardwareColour === h.id}
              onClick={() => store.setHardwareColour(h.id)}
            />
          ))}
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: nameColor, marginTop: 8 }}>
          {HARDWARE_OPTIONS.find(h => h.id === store.hardwareColour)?.label}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <GoldLabel>Window Size</GoldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {SIZE_OPTIONS.map(s => (
            <Pill
              key={s.id}
              label={s.label}
              sub={s.sub}
              active={store.windowSize === s.id}
              onClick={() => store.setWindowSize(s.id)}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <GoldLabel>Operation</GoldLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {OPERATION_OPTIONS.map(o => (
            <Pill
              key={o.id}
              label={o.label}
              active={store.operation === o.id}
              onClick={() => store.setOperation(o.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/** Accordion row. Height is animated off the measured content rather than a
 * guessed max-height, so a two-line answer and a five-line answer both open
 * at the same speed and neither gets clipped. Re-measured on resize, since
 * the answer reflows with the column. */
function FaqRow({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const measure = () => setHeight(open ? (bodyRef.current?.scrollHeight ?? 0) : 0);
    measure();
    if (!open) return;
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, a]);

  return (
    <div style={{ borderBottom: '1px solid rgba(28,24,16,0.12)' }}>
      <button
        onClick={onToggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-expanded={open}
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
        }}
      >
        <span
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            fontWeight: 400,
            color: hover ? tokens.gold : tokens.ink,
            transition: 'color 0.25s ease',
          }}
        >
          {q}
        </span>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: tokens.gold,
            fontSize: 11,
            lineHeight: 1,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          ▼
        </span>
      </button>
      <div
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        <p
          ref={bodyRef}
          style={{
            fontFamily: tokens.body,
            fontSize: 14,
            lineHeight: 1.8,
            color: 'rgba(28,24,16,0.65)',
            paddingTop: 12,
            paddingBottom: 20,
            margin: 0,
          }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

function SpecTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 24,
            padding: '16px 0',
            borderBottom: `1px solid ${LINE_FAINT}`,
            background: i % 2 === 1 ? 'rgba(28,24,16,0.03)' : tokens.warmWhite,
          }}
        >
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              flexShrink: 0,
            }}
          >
            {row.label}
          </span>
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 14,
              color: tokens.ink,
              // flex:1 as well as textAlign — space-between already pushes a
              // single-line value to the right edge, but a value long enough to
              // wrap (Operation) shrink-wraps and its second line was landing
              // ragged-left. Claiming the space makes both lines align right.
              flex: 1,
              textAlign: 'right',
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const store = useVisualiserStore();
  const setScrollY = useKlayStore(s => s.setScrollY);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const product = productBySlug(slug);
  // The section used to live at /products/:category on blind-type slugs
  // (blockout, sunscreen…). Those URLs are still in the wild, so send them to
  // the product they became instead of bouncing everyone to the index.
  const legacy = product ? undefined : productByBlindType(slug);

  useEffect(() => {
    if (product) return;
    navigate(legacy ? `/products/${legacy.slug}` : '/products', { replace: true });
  }, [product, legacy, navigate]);

  // Nav's transparent/compressed state is driven by the shared store, and only
  // HomePage and ProductsPage were feeding it — without this the nav here never
  // darkens on scroll and inherits whatever offset the previous page left
  // behind. Same rAF-throttled shape HomePage uses.
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [setScrollY]);

  useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  if (!product) return null;

  const showToast = () => {
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    setToast('Coming soon — booking flow in progress');
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };

  // One source for the price. BASE_PRICE in the visualiser store already holds
  // exactly the figures in the brief — 220/260/330, dual 320/380/480, plus
  // MOTORISED_ADDON — and the canvas prices off the same call, so a second
  // table here could only ever drift from it.
  const price = store.getCurrentPrice();

  const specRows = [...SPEC_BY_TYPE[product.blindType], ...SHARED_SPECS];
  const faqs = [...FAQ_BY_TYPE[product.blindType], ...SHARED_FAQS];
  const quality = QUALITY_COPY[product.blindType];

  const sectionPad = isMobile ? '72px 24px' : '120px 160px';
  /** The fixed bar's own height, used to keep the toast clear of it and to
   * float it over footer-toned space rather than over footer content. */
  const BAR_CLEARANCE = 80;

  return (
    <>
      {/* onLight: the hero is warmWhite to both edges now, and the nav's own
          links are warmWhite — without this they are invisible until the page
          is scrolled far enough for the nav to darken. */}
      <Nav onLight />
      <div style={{ background: tokens.warmWhite }}>
      {/* Reserves the fixed nav's height. The hero used to open on a
          full-bleed charcoal column that the nav could sit over; on a light
          background it needs real space, and putting it here keeps both hero
          columns on the specified 64px padding. */}
      <div style={{ height: isMobile ? 76 : 96 }} />

      {/* ---- SECTION 1 — PRODUCT HERO ---- */}
      <section
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          // Height comes from the content now, not the viewport.
          alignItems: 'flex-start',
          background: tokens.warmWhite,
        }}
      >
        {/* The visualiser, not a photograph — the blind renders against the
            default window immediately on load. It sizes itself to that photo's
            aspect ratio rather than filling a box: the ratio is what keeps the
            rendered blind registered to the window in the shot, so forcing both
            dimensions would pull the blind off the frame it is drawn onto. The
            480px cap is what makes it read as a contained object. */}
        <div
          style={{
            width: isMobile ? '100%' : '52%',
            flexShrink: 0,
            boxSizing: 'border-box',
            background: tokens.warmWhite,
            padding: isMobile ? '32px 24px' : '64px 48px',
          }}
        >
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* position:relative + overflow:hidden so the motor controls, which
                are absolutely positioned against the canvas inside
                KlayConfigurator, clip to this box's rounded corners rather than
                spilling into the page layout. */}
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 8,
                background: tokens.charcoal,
              }}
            >
              <KlayConfigurator
                defaultBlindType={product.blindType}
                mediaMaxVh={isMobile ? 56 : 90}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            width: isMobile ? '100%' : '48%',
            boxSizing: 'border-box',
            padding: isMobile ? '32px 24px 48px' : '64px 48px',
            display: 'flex',
            flexDirection: 'column',
            background: tokens.warmWhite,
          }}
        >
          <Link
            to="/products"
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              textDecoration: 'none',
              alignSelf: 'flex-start',
            }}
          >
            ← Collection
          </Link>

          <div style={{ marginTop: 40 }}>
            <GoldLabel spacing="0.25em">{product.type}</GoldLabel>
          </div>
          <h1
            style={{
              fontFamily: tokens.display,
              // Clamped rather than a flat 72px: at 72px "Haze" is fine but
              // the 42% column gets narrow on a laptop, and this is the first
              // thing on the page.
              fontSize: isMobile ? 'clamp(44px, 14vw, 64px)' : 'clamp(52px, 5.2vw, 72px)',
              fontWeight: 300,
              lineHeight: 0.95,
              color: tokens.ink,
              margin: '8px 0 0',
            }}
          >
            {product.name}
          </h1>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 15,
              lineHeight: 1.7,
              color: INK_55,
              margin: '16px 0 0',
              maxWidth: 340,
            }}
          >
            {product.tagline}
          </p>

          <div style={{ height: 1, background: LINE, marginTop: 32, marginBottom: 32 }} />

          <ConfiguratorControls />

          <div style={{ marginTop: 32 }}>
            <GoldLabel>Estimated Price</GoldLabel>
            <div
              style={{
                fontFamily: tokens.display,
                fontSize: 52,
                fontWeight: 300,
                lineHeight: 1,
                color: tokens.ink,
                marginTop: 8,
              }}
            >
              ${price}
            </div>
            <div style={{ fontFamily: tokens.body, fontSize: 11, color: INK_40, marginTop: 8 }}>
              + professional installation across Victoria
            </div>
          </div>

          <button
            onClick={showToast}
            style={{
              width: '100%',
              marginTop: 24,
              padding: 18,
              background: tokens.gold,
              color: tokens.ink,
              fontFamily: tokens.body,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.25em',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
            }}
          >
            Book Installation
          </button>
        </div>
      </section>

      {/* ---- SECTION 2 — ROOM IMAGE ---- */}
      {/* A visual break between the configurator above and the specifications
          below. No overlay: the configurator already carries every word this
          page needs, and text here would compete with it. */}
      <section style={{ height: '70vh', overflow: 'hidden', background: tokens.charcoal }}>
        <img
          src={product.image}
          alt={`${product.name} — ${product.type}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
      </section>

      {/* ---- SECTION 3 — PRODUCT SPECS ---- */}
      <section style={{ background: tokens.warmWhite, padding: sectionPad }}>
        <GoldLabel spacing="0.3em">Product Details</GoldLabel>
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 'clamp(32px, 9vw, 40px)' : 'clamp(36px, 4vw, 48px)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: tokens.ink,
            margin: '14px 0 0',
          }}
        >
          Built to last.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.15fr) minmax(0, 1fr)',
            gap: isMobile ? 48 : 80,
            marginTop: isMobile ? 40 : 56,
            alignItems: 'start',
          }}
        >
          <SpecTable rows={specRows} />

          <div>
            {quality.map((para, i) => (
              <p
                key={para}
                style={{
                  fontFamily: tokens.body,
                  fontSize: 15,
                  lineHeight: 1.9,
                  color: INK_55,
                  margin: i === 0 ? 0 : '20px 0 0',
                }}
              >
                {para}
              </p>
            ))}
            <div
              style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: `1px solid ${LINE_FAINT}`,
              }}
            >
              <GoldLabel>Warranty</GoldLabel>
              <div
                style={{
                  fontFamily: tokens.display,
                  fontSize: 32,
                  fontWeight: 300,
                  color: tokens.ink,
                  marginTop: 6,
                }}
              >
                5 years
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- SECTION 4 — FAQs ---- */}
      <section
        style={{
          background: SHELL,
          padding: sectionPad,
        }}
      >
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 'clamp(32px, 9vw, 40px)' : 'clamp(36px, 4vw, 48px)',
            fontWeight: 300,
            lineHeight: 1.05,
            color: tokens.ink,
            margin: 0,
          }}
        >
          Common questions.
        </h2>
        <div style={{ marginTop: isMobile ? 32 : 48, maxWidth: 720 }}>
          {faqs.map((f, i) => (
            <FaqRow
              key={f.q}
              q={f.q}
              a={f.a}
              open={openFaq === i}
              onToggle={() => setOpenFaq(cur => (cur === i ? null : i))}
            />
          ))}
        </div>
      </section>

      <Footer />

      {/* The fixed bar overlays whatever is at the bottom of the document, so
          the page ends in a strip of the footer's own ink rather than letting
          the bar sit on top of footer content. */}
      <div style={{ height: BAR_CLEARANCE, background: tokens.ink }} />

      {/* ---- STICKY BOTTOM BAR ---- */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          boxSizing: 'border-box',
          zIndex: 100,
          background: 'rgba(245,242,237,0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderTop: `1px solid ${LINE_FAINT}`,
          padding: isMobile ? '12px 24px' : '16px 80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 24 : 32,
            fontWeight: 300,
            lineHeight: 1,
            color: tokens.ink,
          }}
        >
          from ${price}
        </div>
        <button
          onClick={showToast}
          style={{
            background: tokens.gold,
            color: tokens.ink,
            fontFamily: tokens.body,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            padding: isMobile ? '12px 20px' : '14px 40px',
            border: 'none',
            borderRadius: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Book Installation →
        </button>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: BAR_CLEARANCE + 16,
            right: 24,
            zIndex: 101,
            background: tokens.ink,
            color: tokens.warmWhite,
            fontFamily: tokens.body,
            fontSize: 13,
            padding: '14px 20px',
            boxShadow: '0 4px 24px rgba(28,24,16,0.28)',
          }}
        >
          {toast}
        </div>
      )}
      </div>
    </>
  );
}
