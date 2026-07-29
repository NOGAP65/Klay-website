import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { tokens } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  HARDWARE_HEX,
  HARDWARE_OPTIONS,
  MOTORISED_ADDON,
  RYNAMIC_COLOURS,
  productByBlindType,
  productBySlug,
} from '../data/products';
import KlayConfigurator from '../visualiser/KlayConfigurator';
import { useVisualiserStore } from '../visualiser/useVisualiserStore';

const RADIUS = 2;

const SIZE_OPTIONS: { id: 'small' | 'medium' | 'large'; label: string }[] = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const OPERATION_OPTIONS: { id: 'manual' | 'motorised'; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: `Motorised (+$${MOTORISED_ADDON})` },
];

/** Gold, uppercase, letterspaced — one per control group. */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: tokens.body,
        fontSize: 10,
        color: tokens.gold,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 18px',
        borderRadius: 999,
        fontFamily: tokens.body,
        fontSize: 11.5,
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        border: `1px solid ${active ? tokens.gold : tokens.lineStrong}`,
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.ink : tokens.inkSoft,
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}

/** Circle swatch. The selected ring sits outside the circle rather than
 * thickening its edge, so picking a colour doesn't visibly shrink it. */
function Swatch({
  hex,
  label,
  active,
  onClick,
}: {
  hex: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        padding: 0,
        cursor: 'pointer',
        background: hex,
        border: `1px solid ${tokens.line}`,
        boxShadow: active ? `0 0 0 2px ${tokens.gold}` : `inset 0 0 0 1px ${tokens.lineFaint}`,
        transition: 'box-shadow 0.2s ease',
      }}
    />
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const store = useVisualiserStore();
  const [toast, setToast] = useState<string | null>(null);

  const product = productBySlug(slug);
  // The section used to live at /products/:category using blind-type slugs
  // (blockout, sunscreen…). Those URLs are still in the wild, so send them to
  // the product they became instead of bouncing everyone to the index.
  const legacy = product ? undefined : productByBlindType(slug);

  useEffect(() => {
    if (product) return;
    navigate(legacy ? `/products/${legacy.slug}` : '/products', { replace: true });
  }, [product, legacy, navigate]);

  if (!product) return null;

  const selectedColour = RYNAMIC_COLOURS.find(c => c.name === store.fabricColour);

  const showToast = () => {
    setToast('Coming soon — booking flow in progress');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '100vh',
        alignItems: 'stretch',
      }}
    >
      {/* LEFT — the visualiser, full height. The configurator sizes itself to
          the photo's aspect ratio, so it is centred in the column rather than
          stretched: stretching it would violate the photo's proportions and
          misalign the blind from the window it is drawn onto. */}
      <div
        style={{
          width: isMobile ? '100%' : '55%',
          flexShrink: 0,
          background: tokens.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px 20px' : 40,
          boxSizing: 'border-box',
        }}
      >
        <KlayConfigurator defaultBlindType={product.blindType} mediaMaxVh={isMobile ? 60 : 84} />
      </div>

      {/* RIGHT — product identity, then the configurator controls */}
      <div
        style={{
          width: isMobile ? '100%' : '45%',
          background: tokens.warmWhite,
          padding: isMobile ? '48px 24px' : '64px 56px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <Link
          to="/products"
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.16em',
            textDecoration: 'none',
          }}
        >
          ← Collection
        </Link>

        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 10,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginTop: 32,
          }}
        >
          {product.type}
        </div>
        <h1
          style={{
            fontFamily: tokens.display,
            fontSize: isMobile ? 'clamp(44px, 13vw, 64px)' : 64,
            fontWeight: 300,
            lineHeight: 1.0,
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
            lineHeight: 1.6,
            color: tokens.ink,
            opacity: 0.55,
            margin: '12px 0 0',
          }}
        >
          {product.tagline}
        </p>

        <div
          style={{
            height: 1,
            background: 'rgba(28,24,16,0.1)',
            marginTop: 32,
            marginBottom: 32,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* 1 — Fabric colour */}
          <section>
            <GroupLabel>Fabric Colour</GroupLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {RYNAMIC_COLOURS.map(c => (
                <Swatch
                  key={c.name}
                  hex={c.hex}
                  label={c.name}
                  active={store.fabricColour === c.name}
                  onClick={() => store.setFabricColour(c.name)}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: tokens.ink,
                opacity: 0.55,
                marginTop: 12,
              }}
            >
              {selectedColour?.name ?? store.fabricColour}
            </div>
          </section>

          {/* 2 — Hardware colour */}
          <section>
            <GroupLabel>Hardware Colour</GroupLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {HARDWARE_OPTIONS.map(h => (
                <Swatch
                  key={h.id}
                  hex={HARDWARE_HEX[h.id]}
                  label={h.label}
                  active={store.hardwareColour === h.id}
                  onClick={() => store.setHardwareColour(h.id)}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: tokens.ink,
                opacity: 0.55,
                marginTop: 12,
              }}
            >
              {HARDWARE_OPTIONS.find(h => h.id === store.hardwareColour)?.label}
            </div>
          </section>

          {/* 3 — Window size */}
          <section>
            <GroupLabel>Window Size</GroupLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIZE_OPTIONS.map(s => (
                <Pill
                  key={s.id}
                  label={s.label}
                  active={store.windowSize === s.id}
                  onClick={() => store.setWindowSize(s.id)}
                />
              ))}
            </div>
          </section>

          {/* 4 — Operation */}
          <section>
            <GroupLabel>Operation</GroupLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {OPERATION_OPTIONS.map(o => (
                <Pill
                  key={o.id}
                  label={o.label}
                  active={store.operation === o.id}
                  onClick={() => store.setOperation(o.id)}
                />
              ))}
            </div>
          </section>

          {/* 5 — Price */}
          <section>
            <GroupLabel>Estimated Price</GroupLabel>
            <div
              style={{
                fontFamily: tokens.display,
                fontSize: 42,
                fontWeight: 300,
                lineHeight: 1.1,
                color: tokens.ink,
              }}
            >
              ${store.getCurrentPrice()}
            </div>
            <div
              style={{
                fontFamily: tokens.body,
                fontSize: 12,
                color: tokens.ink,
                opacity: 0.55,
                marginTop: 6,
              }}
            >
              + professional installation across Victoria
            </div>
          </section>

          {/* 6 — Book installation */}
          <button
            onClick={showToast}
            style={{
              width: '100%',
              padding: '17px 20px',
              background: tokens.gold,
              color: tokens.ink,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: RADIUS,
              cursor: 'pointer',
            }}
          >
            Book Installation →
          </button>
        </div>

        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 100,
              background: tokens.ink,
              color: tokens.warmWhite,
              fontFamily: tokens.body,
              fontSize: 13,
              padding: '14px 20px',
              borderRadius: RADIUS,
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
