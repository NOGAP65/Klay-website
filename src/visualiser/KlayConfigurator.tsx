import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tokens } from '../theme';
import { useVisualiserStore } from './useVisualiserStore';
import { usePhotoUpload } from './usePhotoUpload';
import CornerPinOverlay, { CornerPinOverlayHandle, Point } from './CornerPinOverlay';
import Canvas2DBlindRenderer, { RenderedArea } from './Canvas2DBlindRenderer';

interface KlayConfiguratorProps {
  lockedRange?: string; // if passed, hides range switcher — customer can only configure this range
}

const RANGE_OPTIONS = [
  { id: 'blockout', label: 'Blockout' },
  { id: 'sunscreen', label: 'Sunscreen' },
  { id: 'dual', label: 'Dual' },
];

const SIZE_OPTIONS: { id: 'small' | 'medium' | 'large'; label: string; sub: string }[] = [
  { id: 'small', label: 'Small', sub: 'up to 1m' },
  { id: 'medium', label: 'Medium', sub: 'up to 2m' },
  { id: 'large', label: 'Large', sub: 'up to 3m' },
];

const OPERATION_OPTIONS: { id: 'manual' | 'motorised'; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'motorised', label: 'Motorised (+$150)' },
];

// Hardware finish name -> actual render colour. Canvas2DBlindRenderer treats
// hardwareColor as a hex string it feeds into lighten()/darken() (hexToRgb),
// so the display label ('White'/'Black'/'Chrome') can't be passed directly.
const HARDWARE_HEX: Record<string, string> = {
  White: '#EFEFEF',
  Black: '#222222',
  Chrome: '#C0C0C0',
};

const HARDWARE_SWATCH_STYLE: Record<string, React.CSSProperties> = {
  White: { background: '#F0EDE8' },
  Black: { background: '#2A2A2A' },
  Chrome: { background: 'linear-gradient(135deg,#e8e8e8,#a0a0a0)' },
};

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
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '7px 12px',
        fontFamily: tokens.body,
        fontSize: 11,
        fontWeight: 500,
        textAlign: 'center',
        cursor: 'pointer',
        border: active ? `1px solid ${tokens.gold}` : '1px solid rgba(200,151,58,0.25)',
        background: active ? tokens.gold : 'transparent',
        color: active ? tokens.dark : 'rgba(248,246,242,0.6)',
      }}
    >
      <div>{label}</div>
      {sub && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>{sub}</div>}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: tokens.body,
        fontSize: 10,
        color: tokens.gold,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

const ghostButtonStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.45)',
  color: '#FFFFFF',
  fontFamily: tokens.body,
  fontWeight: 600,
  fontSize: 12,
  padding: '11px 20px',
  border: `1px solid ${tokens.gold}`,
  cursor: 'pointer',
};

const goldButtonStyle: React.CSSProperties = {
  background: tokens.gold,
  color: tokens.dark,
  fontFamily: tokens.body,
  fontWeight: 700,
  fontSize: 12,
  padding: '11px 24px',
  border: 'none',
  cursor: 'pointer',
};

const PRESET_ROOMS = ['/images/room-3.png', '/images/room-4.png', '/images/room-5.png'];

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function KlayConfigurator({ lockedRange: lockedRangeProp }: KlayConfiguratorProps) {
  const [searchParams] = useSearchParams();
  const store = useVisualiserStore();
  const { photoUrl: hookPhotoUrl, photoBitmap, handleUpload, handleTakePhoto, loadFromUrl, clear } = usePhotoUpload();

  const overlayRef = useRef<CornerPinOverlayHandle>(null);
  const rendererContainerRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  // Locks the range from either the `lockedRange` prop or a `?range=` URL
  // param (e.g. arriving from a product page) — runs once on mount only.
  useEffect(() => {
    const range = lockedRangeProp ?? searchParams.get('range');
    if (range) {
      store.setLockedRange(range);
      store.setRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The hook owns photo acquisition; only photoUrl needs to live in the
  // shared store (photoBitmap stays local — it's only needed here for
  // pixel dimensions). A new photo always invalidates any existing trace.
  useEffect(() => {
    store.setPhotoUrl(hookPhotoUrl);
    if (hookPhotoUrl) store.clearTracedAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookPhotoUrl]);

  const hasPhoto = !!(store.photoUrl && photoBitmap);
  const confirmedArea = store.tracedAreas.find(a => a.confirmed);

  const handleChangePhoto = () => {
    clear();
    store.setPhotoUrl(null);
    store.clearTracedAreas();
  };

  const handleConfirmTrace = (corners: Point[]) => {
    store.addTracedArea({
      id: crypto.randomUUID(),
      corners,
      blindType: store.selectedRange,
      fabricColor: store.getFabricColor(),
      hardwareColor: HARDWARE_HEX[store.selectedHardware] ?? '#EFEFEF',
      controlType: store.controlType,
      showChain: false,
      confirmed: true,
    });
  };

  const handleDownload = () => {
    const canvas = rendererContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const sku = store.getCurrentSku()?.slug ?? store.selectedSku;
    const link = document.createElement('a');
    link.download = `klay-blind-${sku}-${store.windowSize}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // --- Motorised auto (open -> close -> open, looping) ----------------------
  const animFrameRef = useRef<number | null>(null);
  const autoTimeoutRef = useRef<number | null>(null);
  const autoRunningRef = useRef(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const rollPositionRef = useRef(store.rollPosition);
  rollPositionRef.current = store.rollPosition;

  const cancelRollAnimation = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (autoTimeoutRef.current !== null) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
  };

  const animateRollTo = (target: number, duration: number, onDone?: () => void) => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    const from = rollPositionRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      store.setRollPosition(from + (target - from) * easeInOut(t));
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
        onDone?.();
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  const stopAuto = () => {
    autoRunningRef.current = false;
    setAutoRunning(false);
    cancelRollAnimation();
  };

  const startAuto = () => {
    autoRunningRef.current = true;
    setAutoRunning(true);
    const cycle = () => {
      if (!autoRunningRef.current) return;
      animateRollTo(0, 1500, () => {
        if (!autoRunningRef.current) return;
        autoTimeoutRef.current = window.setTimeout(() => {
          if (!autoRunningRef.current) return;
          animateRollTo(1, 1500, () => {
            if (!autoRunningRef.current) return;
            autoTimeoutRef.current = window.setTimeout(cycle, 600);
          });
        }, 600);
      });
    };
    cycle();
  };

  useEffect(() => {
    if (store.controlType !== 'motorised') stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.controlType]);

  useEffect(() => () => stopAuto(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasTracedAreas: RenderedArea[] = store.tracedAreas.map(a => ({
    ...a,
    blindType: store.selectedRange === 'blockout' ? 'blockout' : store.selectedRange === 'sunscreen' ? 'sunscreen' : 'dual',
    fabricColor: store.getFabricColor(),
    hardwareColor: HARDWARE_HEX[store.selectedHardware] ?? '#EFEFEF',
    controlType: store.controlType,
    showChain: false,
  }));

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* ---------------------------------------------------------- LEFT PANEL */}
      <aside
        style={{
          width: '280px',
          flexShrink: 0,
          background: '#1a1208',
          padding: '20px',
          overflowY: 'hidden',
        }}
      >
        <div style={{ padding: '24px 24px 0' }}>
          {!store.lockedRange && (
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Range</SectionLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {RANGE_OPTIONS.map(r => (
                  <Pill
                    key={r.id}
                    label={r.label}
                    active={store.selectedRange === r.id}
                    onClick={() => store.setRange(r.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Hardware finish</SectionLabel>
            <div style={{ display: 'flex', gap: 12 }}>
              {['White', 'Black', 'Chrome'].map(hw => (
                <button
                  key={hw}
                  aria-label={hw}
                  onClick={() => store.setHardware(hw)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: store.selectedHardware === hw ? `2px solid ${tokens.gold}` : '1px solid rgba(255,255,255,0.2)',
                    ...HARDWARE_SWATCH_STYLE[hw],
                  }}
                />
              ))}
            </div>
            <div style={{ fontFamily: tokens.display, fontSize: 18, color: '#FFFFFF', marginTop: 12 }}>
              {store.getCurrentSku()?.name ?? ''}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Window size</SectionLabel>
            <div style={{ display: 'flex', gap: 8 }}>
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

          <div style={{ marginBottom: 8 }}>
            <SectionLabel>Operation</SectionLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {OPERATION_OPTIONS.map(o => (
                <Pill
                  key={o.id}
                  label={o.label}
                  active={store.controlType === o.id}
                  onClick={() => store.setControlType(o.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 10,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            Estimated price
          </div>
          <div style={{ fontFamily: tokens.display, fontSize: 48, fontWeight: 300, color: '#FFFFFF' }}>
            ${store.getCurrentPrice()}
          </div>
          <div style={{ fontFamily: tokens.body, fontSize: 11, color: 'rgba(248,246,242,0.4)', marginTop: 4 }}>
            + professional installation across Victoria
          </div>
        </div>

        <button
          onClick={() => showToast('Coming soon — booking flow in progress')}
          style={{
            width: 'calc(100% - 48px)',
            margin: '0 24px 24px',
            padding: 16,
            background: tokens.gold,
            color: tokens.dark,
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Book Installation →
        </button>
      </aside>

      {/* --------------------------------------------------------- RIGHT PANEL */}
      <div style={{ flex: 1, position: 'relative', background: '#2C2824' }}>
        {!hasPhoto ? (
          /* STATE 1 — no photo yet */
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 24,
            }}
          >
            <h2 style={{ fontFamily: tokens.display, fontSize: 32, fontWeight: 300, color: '#F5F2ED', margin: 0 }}>
              Upload a photo of your window
            </h2>
            <p style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(245,242,237,0.5)', marginTop: 8 }}>
              or choose a preset room
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={handleUpload} style={goldButtonStyle}>
                Upload Photo
              </button>
              <button onClick={handleTakePhoto} style={ghostButtonStyle}>
                Take Photo
              </button>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 32 }}>
              {PRESET_ROOMS.map(url => (
                <img
                  key={url}
                  src={url}
                  onClick={() => {
                    store.setPhotoUrl(url);
                    loadFromUrl(url);
                    store.clearTracedAreas();
                  }}
                  style={{ width: 120, height: 80, objectFit: 'cover', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        ) : !confirmedArea ? (
          /* STATE 2 — photo loaded, not yet traced */
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div
              style={{
                position: 'relative',
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: `${photoBitmap!.width} / ${photoBitmap!.height}`,
              }}
            >
              <img
                src={store.photoUrl!}
                alt="Your room"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
              <CornerPinOverlay
                ref={overlayRef}
                imageWidth={photoBitmap!.width}
                imageHeight={photoBitmap!.height}
                onConfirm={handleConfirmTrace}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <button onClick={() => overlayRef.current?.confirm()} style={goldButtonStyle}>
                  Confirm window outline
                </button>
                <button onClick={handleChangePhoto} style={ghostButtonStyle}>
                  Change photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STATE 3 — area traced and confirmed */
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div ref={rendererContainerRef} style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
              <Canvas2DBlindRenderer
                photoUrl={store.photoUrl!}
                tracedAreas={canvasTracedAreas}
                activeAreaId={store.activeAreaId ?? undefined}
                rollPosition={store.rollPosition}
                compareMode={false}
                compareDivider={0.5}
                compareBlindType="blockout"
                compareFabricColor="#F0EDE8"
              />

              {/* Roll position control — right edge */}
              {store.controlType !== 'motorised' ? (
                <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', zIndex:20 }}>
                  <button
                    onClick={() => store.setRollPosition(Math.max(0, store.rollPosition - 0.1))}
                    style={{ width:'32px', height:'32px', border:'1px solid rgba(200,151,58,0.4)', background:'rgba(28,24,16,0.8)', color:'#C8973A', fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                  >▲</button>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={store.rollPosition}
                    onChange={e => store.setRollPosition(parseFloat(e.target.value))}
                    style={{ writingMode:'vertical-lr', direction:'rtl', height:'100px', accentColor:'#C8973A', cursor:'pointer' }}
                  />
                  <button
                    onClick={() => store.setRollPosition(Math.min(1, store.rollPosition + 0.1))}
                    style={{ width:'32px', height:'32px', border:'1px solid rgba(200,151,58,0.4)', background:'rgba(28,24,16,0.8)', color:'#C8973A', fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                  >▼</button>
                </div>
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <button
                    onClick={() => { stopAuto(); animateRollTo(1, 1200); }}
                    aria-label="Close blind"
                    style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.9)', border: 'none', color: tokens.dark, fontSize: 16, cursor: 'pointer' }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => { stopAuto(); animateRollTo(0, 1200); }}
                    aria-label="Open blind"
                    style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.9)', border: 'none', color: tokens.dark, fontSize: 16, cursor: 'pointer' }}
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => (autoRunning ? stopAuto() : startAuto())}
                    aria-label={autoRunning ? 'Stop automatic movement' : 'Start automatic movement'}
                    style={{
                      width: 40,
                      height: 40,
                      background: tokens.gold,
                      border: 'none',
                      color: tokens.dark,
                      fontFamily: tokens.body,
                      fontWeight: 700,
                      fontSize: 9,
                      cursor: 'pointer',
                    }}
                  >
                    AUTO
                  </button>
                </div>
              )}

              {/* Bottom action bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <button onClick={() => store.clearTracedAreas()} style={ghostButtonStyle}>
                  Retrace
                </button>
                <button onClick={handleChangePhoto} style={ghostButtonStyle}>
                  Change Photo
                </button>
                <button onClick={handleDownload} style={goldButtonStyle}>
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              background: tokens.dark,
              color: '#FFFFFF',
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 500,
              padding: '14px 20px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
