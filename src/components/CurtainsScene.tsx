import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { tokens, prefersReducedMotion } from '../theme';
import { useIsMobile } from '../hooks/useIsMobile';

interface ManualState {
  active: boolean;
  value: number;
}

interface Curtain {
  label: string;
  name: string;
  price: string;
  fabric: string;
}

// Vertical pleat folds — soft, wide bands so it reads as draped fabric, not blind slats.
const curtainFabric =
  'repeating-linear-gradient(90deg, rgba(196,178,150,0.96) 0px, rgba(196,178,150,0.96) 20px, rgba(148,128,100,0.88) 20px, rgba(174,155,124,0.94) 28px, rgba(196,178,150,0.96) 38px)';

const sheerFabric =
  'repeating-linear-gradient(90deg, rgba(233,224,205,0.7) 0px, rgba(233,224,205,0.7) 14px, rgba(190,178,150,0.5) 14px, rgba(190,178,150,0.5) 16px, rgba(233,224,205,0.7) 30px)';

const RING_COUNT = 5;

const curtains: Curtain[] = [
  { label: 'Curtains', name: 'Sheer Curtains', price: 'from $360', fabric: sheerFabric },
  { label: 'Curtains', name: 'Blockout Curtains', price: 'from $340', fabric: curtainFabric },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCardStyle(offset: number, isMobile: boolean): React.CSSProperties {
  const abs = Math.abs(offset);
  const sign = offset > 0 ? 1 : -1;
  const width = isMobile ? '280px' : '380px';
  const height = isMobile ? '368px' : '500px';

  if (abs === 0) {
    return {
      transform: 'translateX(0) translateZ(0) scale(1)',
      opacity: 1,
      zIndex: 10,
      width,
      height,
      filter: 'none',
    };
  }
  if (abs === 1) {
    return {
      transform: `translateX(${sign * (isMobile ? 240 : 460)}px) translateZ(-150px) scale(0.82)`,
      opacity: isMobile ? 0.4 : 0.5,
      zIndex: 5,
      width,
      height,
      filter: 'brightness(0.6)',
    };
  }
  if (abs === 2) {
    return {
      transform: `translateX(${sign * 700}px) translateZ(-280px) scale(0.65)`,
      opacity: 0.25,
      zIndex: 1,
      width: isMobile ? '260px' : '340px',
      height: isMobile ? '335px' : '460px',
      filter: 'brightness(0.4)',
    };
  }
  return {
    transform: `translateX(${sign * 700}px) translateZ(-280px) scale(0.65)`,
    opacity: 0,
    zIndex: 0,
    width: isMobile ? '260px' : '340px',
    height: isMobile ? '335px' : '460px',
    filter: 'brightness(0.4)',
    pointerEvents: 'none',
  };
}

export function CurtainsScene() {
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const leftManual = useRef<ManualState>({ active: false, value: 0 });
  const rightManual = useRef<ManualState>({ active: false, value: 0 });

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (leftPanelRef.current) leftPanelRef.current.style.transform = 'translateX(0%)';
      if (rightPanelRef.current) rightPanelRef.current.style.transform = 'translateX(0%)';
      return;
    }

    let raf = 0;
    const animate = () => {
      const section = sectionRef.current;
      const left = leftPanelRef.current;
      const right = rightPanelRef.current;
      if (section && left && right) {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * 0.85;
        const end = vh * 0.35;
        const progress = clamp((start - rect.top) / (start - end), 0, 1);
        if (!leftManual.current.active) left.style.transform = `translateX(${-50 + progress * 50}%)`;
        if (!rightManual.current.active) right.style.transform = `translateX(${50 - progress * 50}%)`;
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="curtains"
      style={{
        position: 'relative',
        background: '#1a1208',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '40px 24px 32px' : '80px 80px 60px',
          gap: isMobile ? '40px' : '120px',
        }}
      >
        {/* Left column */}
        <div style={{ width: isMobile ? '100%' : '40%', paddingLeft: isMobile ? 0 : '40px' }}>
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              color: '#C8973A',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Our curtain range
          </div>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: isMobile ? 'clamp(48px, 16vw, 80px)' : 'clamp(80px, 10vw, 150px)',
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 0.85,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Indoor
            <br />
            curtains
          </h2>
          <div
            style={{
              fontFamily: tokens.display,
              fontStyle: 'italic',
              fontSize: 22,
              color: '#D9AE60',
              marginTop: 20,
            }}
          >
            sheer, blockout or layered
          </div>
          <p
            style={{
              fontFamily: tokens.body,
              fontSize: 16,
              color: 'rgba(248,246,242,0.72)',
              lineHeight: 1.8,
              maxWidth: 400,
              marginTop: 20,
            }}
          >
            Weighted, lined and finished by hand so they fall with intention — the fabric
            you choose shapes the room long after the sun has moved, cut and hung to
            measure across Victoria.
          </p>
          <div style={{ marginTop: 28 }}>
            {['✦ Cut to length', '✦ Hand finished', '✦ 5-Year warranty'].map((label) => (
              <span
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(200,151,58,0.2)',
                  padding: '8px 16px',
                  marginRight: '8px',
                  fontFamily: tokens.body,
                  fontSize: 12,
                  color: 'rgba(248,246,242,0.72)',
                  letterSpacing: '0.1em',
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: large curtain preview, flush right */}
        <div style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', height: isMobile ? '220px' : '430px', display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-end' }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '85%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)',
                filter: 'blur(30px)',
              }}
            />
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: isMobile ? '340px' : '800px',
                height: isMobile ? '200px' : '410px',
                overflow: 'hidden',
                border: '1px solid rgba(200,151,58,0.2)',
                boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
              }}
            >
              {/* outdoor view through the glass */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: "url('/images/outdoor-window-curtains.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />

              {/* cross mullion */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)', zIndex: 2 }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)', zIndex: 2 }} />

              {/* curtain rod */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '3%',
                  right: '3%',
                  height: 4,
                  background: 'linear-gradient(90deg, #666, #999, #666)',
                  borderRadius: 2,
                  zIndex: 4,
                }}
              />

              <CurtainPanel side="left" panelRef={leftPanelRef} manual={leftManual.current} />
              <CurtainPanel side="right" panelRef={rightPanelRef} manual={rightManual.current} />

              {/* window sill */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '12px',
                  background: 'linear-gradient(180deg, rgba(200,151,58,0.1), transparent)',
                  zIndex: 5,
                }}
              />
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: tokens.body,
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(248,246,242,0.75)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Sheer Curtains — Natural Weave
          </div>
        </div>
      </div>

      {/* Section divider */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(200,151,58,0.4) 15%, #D9AE60 50%, rgba(200,151,58,0.4) 85%, transparent)', boxShadow: '0 0 12px rgba(217,174,96,0.5)', margin: '60px 0 0' }} />
      <div style={{ padding: isMobile ? '28px 24px 20px' : '40px 80px 32px', display: 'flex', flexWrap: 'wrap', rowGap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: '#C8973A', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Our curtain range
        </div>
        {!isMobile && (
          <div style={{ fontFamily: tokens.body, fontSize: 11, color: 'rgba(248,246,242,0.3)', letterSpacing: '0.1em' }}>
            Drag or use arrows to explore
          </div>
        )}
      </div>

      {/* 3D perspective carousel of curtain cards */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? '400px' : '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1200px',
          padding: isMobile ? '0 12px' : '0 40px',
        }}
      >
        {curtains.map((c, index) => {
          const offset = index - activeIndex;
          return (
            <div
              key={c.name}
              onClick={() => offset !== 0 && setActiveIndex(index)}
              style={{
                position: 'absolute',
                transition: 'all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
                overflow: 'hidden',
                cursor: offset === 0 ? 'default' : 'pointer',
                ...getCardStyle(offset, isMobile),
              }}
            >
              <div style={{ position: 'relative', height: '70%', overflow: 'hidden', background: c.fabric }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #666, #999, #666)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: '#A8A49E' }} />
              </div>

              <div style={{ height: '30%', background: '#1a1208', padding: isMobile ? '14px 16px' : '18px 22px' }}>
                <div
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 10,
                    color: '#C8973A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                  }}
                >
                  {c.label}
                </div>
                <div style={{ fontFamily: tokens.display, fontSize: isMobile ? 21 : 26, color: tokens.warmWhite, marginTop: 6 }}>
                  {c.name}
                </div>
                <div style={{ fontFamily: tokens.body, fontSize: 12, color: 'rgba(248,246,242,0.4)', marginTop: 4 }}>
                  {c.price}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
        <button
          aria-label="Previous curtain"
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          style={{
            width: '52px', height: '52px', border: '1px solid rgba(200,151,58,0.35)', color: '#C8973A',
            fontSize: '20px', cursor: 'pointer', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,151,58,0.1)'; e.currentTarget.style.borderColor = '#C8973A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(200,151,58,0.35)'; }}
        >
          ←
        </button>
        <div style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: 18, color: '#D9AE60' }}>
          {curtains[activeIndex].name}
        </div>
        <button
          aria-label="Next curtain"
          onClick={() => setActiveIndex((i) => Math.min(curtains.length - 1, i + 1))}
          style={{
            width: '52px', height: '52px', border: '1px solid rgba(200,151,58,0.35)', color: '#C8973A',
            fontSize: '20px', cursor: 'pointer', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,151,58,0.1)'; e.currentTarget.style.borderColor = '#C8973A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(200,151,58,0.35)'; }}
        >
          →
        </button>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {curtains.map((c, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={c.name}
              aria-label={`Go to ${c.name}`}
              onClick={() => setActiveIndex(index)}
              style={{
                width: active ? '20px' : '6px',
                height: active ? '5px' : '6px',
                background: active ? '#C8973A' : 'rgba(200,151,58,0.25)',
                borderRadius: active ? '3px' : '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button
          onClick={() => { window.location.href = '/products'; }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: tokens.body, fontSize: 12, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '16px 32px', border: `1px solid ${tokens.gold}`, background: 'transparent', color: tokens.gold,
            cursor: 'pointer', transition: 'background 0.3s ease, color 0.3s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = tokens.gold; e.currentTarget.style.color = tokens.dark; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tokens.gold; }}
        >
          View All Curtains →
        </button>
      </div>

      {/* Section divider */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(200,151,58,0.4) 15%, #D9AE60 50%, rgba(200,151,58,0.4) 85%, transparent)', boxShadow: '0 0 12px rgba(217,174,96,0.5)', margin: '60px 0 0' }} />
    </section>
  );
}

function CurtainPanel({
  side,
  panelRef,
  manual,
}: {
  side: 'left' | 'right';
  panelRef: MutableRefObject<HTMLDivElement | null>;
  manual: ManualState;
}) {
  const [hover, setHover] = useState(false);
  // Before scroll drives it closed, the panel is parted, off to its side.
  const [closed, setClosed] = useState(false);

  const onClick = () => {
    const next = !closed;
    setClosed(next);
    manual.active = true;
    manual.value = next ? 1 : 0;
    if (panelRef.current) {
      const pct = side === 'left' ? -50 + manual.value * 50 : 50 - manual.value * 50;
      panelRef.current.style.transform = `translateX(${pct}%)`;
    }
  };

  return (
    <div
      ref={panelRef}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        top: 8,
        bottom: 0,
        [side]: '3%',
        width: '47%',
        background: curtainFabric,
        boxShadow: side === 'left' ? 'inset -8px 0 16px rgba(0,0,0,0.15)' : 'inset 8px 0 16px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        border: `1px solid ${hover ? 'rgba(200,151,58,0.5)' : 'transparent'}`,
        boxSizing: 'border-box',
        transition: 'border-color 0.3s ease',
        zIndex: 3,
        willChange: 'transform',
      }}
    >
      {/* Curtain rings */}
      <div
        style={{
          position: 'absolute',
          top: -4,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 8px',
        }}
      >
        {Array.from({ length: RING_COUNT }).map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#888' }} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontFamily: tokens.body, fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: tokens.gold }}>
          {closed ? 'Click to open' : 'Click to close'}
        </span>
      </div>
    </div>
  );
}
