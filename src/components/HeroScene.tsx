import { useEffect, useRef, useState } from 'react';
import { tokens, prefersReducedMotion, lerp } from '../theme';

export function HeroScene() {
  const fabricRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const skewTarget = useRef(0);
  const skewCurrent = useRef(0);
  const railCurrent = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const pct = e.clientX / window.innerWidth;
      skewTarget.current = (pct - 0.5) * 4;
    };
    const loop = () => {
      skewCurrent.current = lerp(skewCurrent.current, skewTarget.current, 0.06);
      railCurrent.current = lerp(railCurrent.current, skewTarget.current, 0.06);
      if (fabricRef.current) fabricRef.current.style.transform = `skewX(${skewCurrent.current}deg)`;
      if (railRef.current) railRef.current.style.transform = `skewX(${railCurrent.current}deg)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const blindDown = mounted ? 66 : 0;

  return (
    <section
      id="top"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: tokens.dark,
        overflow: 'hidden',
      }}
    >
      {/* Dawn radial glow behind window */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60vw',
          height: '60vw',
          maxWidth: 800,
          maxHeight: 800,
          transform: 'translate(-50%, -55%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,151,58,0.15) 0%, rgba(200,151,58,0.04) 40%, transparent 70%)',
          animation: prefersReducedMotion() ? 'none' : 'klay-dawn 8s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}
      />

      {/* Orbiting gold glow blob */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,151,58,0.12) 0%, transparent 65%)',
          filter: 'blur(50px)',
          animation: prefersReducedMotion() ? 'none' : 'klay-orbit 22s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Floor line — warm gradient strip at 70% height */}
      <div
        style={{
          position: 'absolute',
          top: '70%',
          left: 0,
          right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(200,151,58,0.25) 20%, rgba(200,151,58,0.25) 80%, transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '70%',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, transparent, rgba(20,16,8,0.4))',
          pointerEvents: 'none',
        }}
      />

      {/* Window frame centered with roller blind */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(320px, 28vw)',
          height: 'min(480px, 56vh)',
          border: '1px solid rgba(200,151,58,0.3)',
          background: 'linear-gradient(180deg, rgba(217,174,96,0.06), rgba(20,20,20,0.3))',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Roller blind — two-thirds down */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${blindDown}%`,
            transition: 'height 2.5s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* cassette */}
          <div
            style={{
              height: 14,
              background: `linear-gradient(180deg, ${tokens.goldLight}, ${tokens.gold})`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          />
          {/* fabric */}
          <div
            ref={fabricRef}
            style={{
              height: 'calc(100% - 22px)',
              background: 'repeating-linear-gradient(180deg, rgba(200,151,58,0.55) 0px, rgba(200,151,58,0.55) 6px, rgba(217,174,96,0.42) 6px, rgba(217,174,96,0.42) 12px)',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.35)',
              transformOrigin: 'top center',
              willChange: 'transform',
            }}
          />
          {/* bottom rail */}
          <div
            ref={railRef}
            style={{
              height: 8,
              background: `linear-gradient(180deg, ${tokens.gold}, ${tokens.goldLight})`,
              boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
              transformOrigin: 'top center',
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      {/* Bottom-left content */}
      <div
        style={{
          position: 'absolute',
          left: '5vw',
          bottom: '9vh',
          maxWidth: 640,
        }}
      >
        <span
          style={{
            display: 'block',
            color: tokens.gold,
            fontFamily: tokens.body,
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Australian Made-to-Measure
        </span>
        <h1
          style={{
            fontFamily: tokens.display,
            fontWeight: 300,
            fontSize: 'clamp(60px, 9vw, 130px)',
            lineHeight: 1.02,
            margin: 0,
            color: tokens.warmWhite,
          }}
        >
          Light,{' '}
          <span style={{ fontStyle: 'italic', color: tokens.gold }}>curated</span>{' '}
          for you.
        </h1>
        <p
          style={{
            fontFamily: tokens.body,
            fontWeight: 300,
            fontSize: 18,
            lineHeight: 1.6,
            color: tokens.textMuted,
            marginTop: 26,
            maxWidth: 460,
          }}
        >
          Blinds, curtains and shutters made precisely for your windows — designed
          with you, and installed by hand across Victoria.
        </p>
        <div style={{ display: 'flex', gap: 18, marginTop: 38, flexWrap: 'wrap' }}>
          <HeroButton href="#collection" primary>
            Design Yours
          </HeroButton>
          <HeroButton href="#collection">Explore Collection</HeroButton>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: 'absolute',
          right: '4vw',
          bottom: '9vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span
          style={{
            writingMode: 'vertical-rl',
            fontFamily: tokens.body,
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: tokens.textMuted,
          }}
        >
          Scroll to explore
        </span>
        <span
          style={{
            width: 1,
            height: 70,
            background: tokens.gold,
            display: 'block',
            animation: prefersReducedMotion() ? 'none' : 'klay-scroll-hint 2.4s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  );
}

function HeroButton({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        fontFamily: tokens.body,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '16px 30px',
        background: primary ? tokens.gold : 'transparent',
        color: primary ? tokens.dark : tokens.warmWhite,
        border: `1px solid ${primary ? tokens.gold : 'rgba(248,246,242,0.3)'}`,
        transition: 'background 0.3s ease, color 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (primary) {
          e.currentTarget.style.background = tokens.goldLight;
        } else {
          e.currentTarget.style.borderColor = tokens.gold;
          e.currentTarget.style.color = tokens.gold;
        }
      }}
      onMouseLeave={(e) => {
        if (primary) {
          e.currentTarget.style.background = tokens.gold;
        } else {
          e.currentTarget.style.borderColor = 'rgba(248,246,242,0.3)';
          e.currentTarget.style.color = tokens.warmWhite;
        }
      }}
    >
      {children}
    </a>
  );
}
