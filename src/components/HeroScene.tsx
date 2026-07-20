import { useEffect, useRef } from 'react';
import { tokens, prefersReducedMotion } from '../theme';
import { RevealWords } from './RevealWords';
import { splitWords } from '../utils/splitWords';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function HeroScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const img1Ref = useRef<HTMLImageElement>(null);
  const img2Ref = useRef<HTMLImageElement>(null);
  const img3Ref = useRef<HTMLImageElement>(null);
  const img4Ref = useRef<HTMLImageElement>(null);
  const img5Ref = useRef<HTMLImageElement>(null);

  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);
  const text4Ref = useRef<HTMLDivElement>(null);
  const text5Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (img5Ref.current) img5Ref.current.style.opacity = '1';
      if (text1Ref.current) text1Ref.current.style.opacity = '1';
      return;
    }

    const animate = () => {
      if (!wrapperRef.current) return;
      const p = clamp(window.scrollY / (wrapperRef.current.offsetHeight - window.innerHeight), 0, 1);

      const set = (ref: React.RefObject<HTMLImageElement | HTMLDivElement>, val: number) => {
        if (ref.current) ref.current.style.opacity = String(clamp(val, 0, 1));
      };
      const fi = (start: number, end: number) => (p - start) / (end - start);
      const fo = (start: number, end: number) => 1 - (p - start) / (end - start);

      set(img1Ref, clamp(fo(0.12, 0.20), 0, 1));
      set(img2Ref, clamp(Math.min(fi(0.15, 0.22), fo(0.28, 0.36)), 0, 1));
      set(img3Ref, clamp(Math.min(fi(0.32, 0.40), fo(0.48, 0.56)), 0, 1));
      set(img4Ref, clamp(Math.min(fi(0.52, 0.60), fo(0.68, 0.76)), 0, 1));
      set(img5Ref, clamp(fi(0.72, 0.82), 0, 1));

      const setDiv = (ref: React.RefObject<HTMLDivElement>, o: number, ty: number) => {
        if (ref.current) {
          ref.current.style.opacity = String(clamp(o, 0, 1));
          ref.current.style.transform =
            ref === text5Ref
              ? `translateX(-50%) translateY(calc(-50% + ${ty}px))`
              : `translateY(${ty}px)`;
        }
      };

      const t1 = clamp(fo(0.08, 0.16), 0, 1);
      const t2 = clamp(Math.min(fi(0.14, 0.22), fo(0.28, 0.34)), 0, 1);
      const t3 = clamp(Math.min(fi(0.32, 0.40), fo(0.46, 0.52)), 0, 1);
      const t4 = clamp(Math.min(fi(0.50, 0.58), fo(0.64, 0.70)), 0, 1);
      const t5 = clamp(fi(0.78, 0.88), 0, 1);

      setDiv(text1Ref, t1, 10 * (1 - t1));
      setDiv(text2Ref, t2, 10 * (1 - t2));
      setDiv(text3Ref, t3, 10 * (1 - t3));
      setDiv(text4Ref, t4, 10 * (1 - t4));
      setDiv(text5Ref, t5, 10 * (1 - t5));
    };

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    animate();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={wrapperRef} id="top" style={{ height: '280vh', position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#0a0806' }}>
        {/* Layer A — photo crossfade sequence */}
        <img
          ref={img1Ref}
          src="/images/room-1.png"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 1 }}
        />
        <img
          ref={img2Ref}
          src="/images/room-2.png"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0 }}
        />
        <img
          ref={img3Ref}
          src="/images/room-3.png"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0 }}
        />
        <img
          ref={img4Ref}
          src="/images/room-4.png"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0 }}
        />
        <img
          ref={img5Ref}
          src="/images/room-5.png"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0 }}
        />

        {/* Layer B — dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.1) 100%)',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        />

        {/* Layer C — text */}
        <div ref={text1Ref} style={{ position: 'absolute', bottom: '12%', left: '6%', zIndex: 10, pointerEvents: 'none', opacity: 1 }}>
          <div
            style={{
              color: tokens.gold,
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Australian Made-to-Measure
          </div>
          <RevealWords
            as="h1"
            words={[
              ...splitWords('Light,'),
              { text: 'curated', italic: true, color: '#D9AE60' },
              ...splitWords('for you.'),
            ]}
            style={{
              fontWeight: 300,
              fontSize: 'clamp(56px, 8vw, 110px)',
              lineHeight: 0.88,
              color: tokens.warmWhite,
            }}
          />
          <p
            style={{
              fontFamily: tokens.body,
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'rgba(248,246,242,0.65)',
              marginTop: 20,
              maxWidth: 380,
            }}
          >
            Blinds, curtains and shutters made precisely for your windows — designed
            with you, and installed by hand across Victoria.
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 32, flexWrap: 'wrap', pointerEvents: 'auto' }}>
            <HeroButton href="#collection" primary>
              Design Yours
            </HeroButton>
            <HeroButton href="#collection">Explore Collection</HeroButton>
          </div>
        </div>

        <div
          ref={text2Ref}
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '6%',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 0,
            maxWidth: 500,
            fontFamily: tokens.display,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(38px, 5vw, 68px)',
            color: tokens.warmWhite,
          }}
        >
          Your blind, lowered.
        </div>

        <div
          ref={text3Ref}
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '6%',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 0,
            maxWidth: 500,
            fontFamily: tokens.display,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(38px, 5vw, 68px)',
            color: tokens.warmWhite,
          }}
        >
          Your curtains, drawn.
        </div>

        <div
          ref={text4Ref}
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '6%',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 0,
            maxWidth: 500,
            fontFamily: tokens.display,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 'clamp(38px, 5vw, 68px)',
            color: tokens.warmWhite,
          }}
        >
          Your room, complete.
        </div>

        <div
          ref={text5Ref}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
            opacity: 0,
          }}
        >
          <div
            style={{
              fontFamily: tokens.display,
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(40px, 5vw, 64px)',
              lineHeight: 1.1,
              color: tokens.warmWhite,
              marginBottom: 24,
            }}
          >
            This is what Klay does to a room.
          </div>
          <div
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              color: tokens.gold,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
            }}
          >
            Scroll to explore the collection →
          </div>
        </div>
      </div>
    </div>
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
