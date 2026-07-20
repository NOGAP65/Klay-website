import { useEffect, useRef, useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import { tokens, prefersReducedMotion } from '../theme';
import { RANGES } from '../data/products';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const products = RANGES;

function getCardStyle(offset: number): React.CSSProperties {
  const abs = Math.abs(offset);
  const sign = offset > 0 ? 1 : -1;

  if (abs === 0) {
    return {
      transform: 'translateX(0) translateZ(0) scale(1)',
      opacity: 1,
      zIndex: 10,
      width: '520px',
      height: '700px',
      filter: 'none',
    };
  }
  if (abs === 1) {
    return {
      transform: `translateX(${sign * 520}px) translateZ(-120px) scale(0.80)`,
      opacity: 0.65,
      zIndex: 5,
      width: '520px',
      height: '700px',
      filter: 'brightness(0.80)',
    };
  }
  if (abs === 2) {
    return {
      transform: `translateX(${sign * 950}px) translateZ(-240px) scale(0.62)`,
      opacity: 0.35,
      zIndex: 1,
      width: '520px',
      height: '700px',
      filter: 'brightness(0.55)',
    };
  }
  return {
    transform: `translateX(${sign * 950}px) translateZ(-240px) scale(0.62)`,
    opacity: 0,
    zIndex: 0,
    width: '520px',
    height: '700px',
    filter: 'brightness(0.55)',
    pointerEvents: 'none',
  };
}

export function CollectionScene() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { ref: headRef } = useReveal<HTMLDivElement>(0.2);
  const sectionRef = useRef<HTMLElement>(null);
  const fabricRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (fabricRef.current) fabricRef.current.style.height = '100%';
      return;
    }

    let raf = 0;
    const animate = () => {
      const section = sectionRef.current;
      const fabric = fabricRef.current;
      if (section && fabric) {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * 0.85;
        const end = vh * 0.35;
        const progress = clamp((start - rect.top) / (start - end), 0, 1);
        fabric.style.height = progress * 100 + '%';
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="collection"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #141414 0%, #1a1208 60%, #1e1a0f 100%)',
        padding: '4vh 0 0',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 80px 60px', gap: '120px' }}>
        {/* Left column */}
        <div ref={headRef} style={{ width: '40%', paddingLeft: '40px' }}>
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
            Our blind range
          </div>
          <h2
            style={{
              fontFamily: tokens.display,
              fontSize: 'clamp(80px, 10vw, 150px)',
              fontWeight: 300,
              color: tokens.warmWhite,
              lineHeight: 0.85,
              letterSpacing: '-0.03em',
              margin: 0,
            }}
          >
            Indoor
            <br />
            blinds
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
            five ways to dress a window
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
            Made to measure for every window in your home — cut, finished and installed by
            hand across Victoria.
          </p>
          <div style={{ marginTop: 28 }}>
            {['✦ Made to measure', '✦ Hand installed', '✦ 5-Year warranty'].map((label) => (
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

        {/* Right column: large blind preview, flush right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px', height: '560px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
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
              width: '480px',
              height: '580px',
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
                backgroundImage: "url('/images/outdoor-window.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />

            {/* cross mullion */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)', zIndex: 2 }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)', zIndex: 2 }} />

            {/* cassette rail */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '12px',
                background: 'linear-gradient(180deg, #C8C4BE 0%, #A8A49E 100%)',
                zIndex: 3,
              }}
            />

            {/* blind fabric — scroll-driven, unrolls down from the cassette, sits on top of the window photo */}
            <div
              ref={fabricRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '0%',
                background:
                  'repeating-linear-gradient(180deg, rgba(228,224,218,0.8) 0px, rgba(228,224,218,0.8) 1px, transparent 1px, transparent 3px), #EDEAE4',
                zIndex: 3,
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
              }}
            />

            {/* window sill */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '12px',
                background: 'linear-gradient(180deg, rgba(200,151,58,0.1), transparent)',
                zIndex: 4,
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
          Blockout Roller — White Linen
        </div>
        </div>
      </div>

      {/* Section divider */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(200,151,58,0.4) 15%, #D9AE60 50%, rgba(200,151,58,0.4) 85%, transparent)', boxShadow: '0 0 12px rgba(217,174,96,0.5)', margin: '60px 0 0' }} />
      <div style={{ padding: '40px 80px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: '#C8973A', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Our blind range
        </div>
        <div style={{ fontFamily: tokens.body, fontSize: 11, color: 'rgba(248,246,242,0.3)', letterSpacing: '0.1em' }}>
          Drag or use arrows to explore
        </div>
      </div>

      {/* 3D perspective carousel of product cards */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '760px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1200px',
          padding: '0 40px',
        }}
      >
        <button
          aria-label="Previous product"
          onClick={() => setActiveIndex((i) => (i - 1 + 3) % 3)}
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(calc(-50% - 780px), -50%)', zIndex: 20,
            width: '56px', height: '56px', border: '1px solid rgba(200,151,58,0.35)', color: '#C8973A',
            fontSize: '20px', cursor: 'pointer', background: 'rgba(20,16,10,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,151,58,0.15)'; e.currentTarget.style.borderColor = '#C8973A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,16,10,0.6)'; e.currentTarget.style.borderColor = 'rgba(200,151,58,0.35)'; }}
        >
          ←
        </button>
        <button
          aria-label="Next product"
          onClick={() => setActiveIndex((i) => (i + 1) % 3)}
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(calc(-50% + 780px), -50%)', zIndex: 20,
            width: '56px', height: '56px', border: '1px solid rgba(200,151,58,0.35)', color: '#C8973A',
            fontSize: '20px', cursor: 'pointer', background: 'rgba(20,16,10,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,151,58,0.15)'; e.currentTarget.style.borderColor = '#C8973A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20,16,10,0.6)'; e.currentTarget.style.borderColor = 'rgba(200,151,58,0.35)'; }}
        >
          →
        </button>
        {products.map((p, index) => {
          const offset = ((((index - activeIndex + 1) % 3) + 3) % 3) - 1;
          return (
            <div
              key={p.name}
              onClick={() => offset !== 0 && setActiveIndex(index)}
              style={{
                position: 'absolute',
                transition: 'all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
                overflow: 'hidden',
                cursor: offset === 0 ? 'default' : 'pointer',
                ...getCardStyle(offset),
              }}
            >
              <div style={{ position: 'relative', height: '70%', overflow: 'hidden' }}>
                <img
                  src={p.image}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10px', background: 'linear-gradient(180deg,#999,#666)', zIndex: 2 }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: '#A8A49E', zIndex: 2 }} />
              </div>

              <div style={{ position: 'relative', height: '30%', background: '#1a1208', padding: '18px 22px' }}>
                <div
                  style={{
                    fontFamily: tokens.body,
                    fontSize: 10,
                    color: '#C8973A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                  }}
                >
                  {p.range}
                </div>
                <div style={{ fontFamily: tokens.display, fontSize: 26, color: tokens.warmWhite, marginTop: 6 }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: tokens.body, fontSize: 12, fontStyle: 'italic', color: 'rgba(248,246,242,0.5)', marginTop: 4 }}>
                  {p.tagline}
                </div>
                <div style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(248,246,242,0.4)', marginTop: 4 }}>
                  {p.price}
                </div>
                <a
                  href={`/products/${p.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'inline-block', fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: tokens.gold, marginTop: 8 }}
                >
                  Explore range →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '32px' }}>
        <div style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: 18, color: '#D9AE60' }}>
          {products[activeIndex].name}
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {products.map((p, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={p.name}
              aria-label={`Go to ${p.name}`}
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
          View All Blinds →
        </button>
      </div>

      {/* Section divider */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(200,151,58,0.4) 15%, #D9AE60 50%, rgba(200,151,58,0.4) 85%, transparent)', boxShadow: '0 0 12px rgba(217,174,96,0.5)', margin: '60px 0 0' }} />
    </section>
  );
}
