import { useEffect, useRef } from 'react';
import { RevealWords } from './RevealWords';
import { tokens, prefersReducedMotion } from '../theme';
import { splitWords } from '../utils/splitWords';
import { useIsMobile } from '../hooks/useIsMobile';

const DOOR_SLIDE = 60; // px each door travels apart at full scroll progress

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function WardrobesScene() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const leftDoor = leftDoorRef.current;
    const rightDoor = rightDoorRef.current;

    if (prefersReducedMotion()) {
      if (leftDoor) leftDoor.style.transform = `translateX(${-DOOR_SLIDE}px)`;
      if (rightDoor) rightDoor.style.transform = `translateX(${DOOR_SLIDE}px)`;
      return;
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const section = sectionRef.current;
        if (!section || !leftDoor || !rightDoor) return;
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height + vh;
        const scrolled = vh - rect.top;
        const progress = clamp(scrolled / total, 0, 1);
        leftDoor.style.transform = `translateX(${-DOOR_SLIDE * progress}px)`;
        rightDoor.style.transform = `translateX(${DOOR_SLIDE * progress}px)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      id="wardrobes"
      ref={sectionRef}
      style={{
        position: 'relative',
        background: '#141414',
        padding: isMobile ? '48px 24px 0' : '80px 80px 0',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto 56px' }}>
        <RevealWords
          as="h2"
          words={[
            ...splitWords('Storage that becomes'),
            { text: 'architecture.', italic: true, color: tokens.gold },
          ]}
          style={{ fontWeight: 300, fontSize: 'clamp(36px, 4.4vw, 64px)', color: tokens.warmWhite, lineHeight: 1.08, marginBottom: 18 }}
        />
        <p style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 17, lineHeight: 1.7, color: tokens.textMuted, maxWidth: 520 }}>
          Built-in wardrobes and shelving. Designed around how you live.
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          maxWidth: 900,
          height: isMobile ? 200 : 280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {/* Revealed as the doors slide apart */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            zIndex: 0,
          }}
        >
          <span style={{ fontFamily: tokens.display, fontWeight: 300, fontSize: isMobile ? 30 : 48, color: tokens.warmWhite }}>
            Wardrobes
          </span>
          <span
            style={{
              fontFamily: tokens.body,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: tokens.gold,
              border: `1px solid ${tokens.gold}`,
              padding: '8px 18px',
            }}
          >
            Coming Soon — 2026
          </span>
        </div>

        {/* Left door */}
        <div
          ref={leftDoorRef}
          style={{
            position: 'relative',
            width: '45%',
            height: '100%',
            border: '1px solid rgba(200,151,58,0.2)',
            background: 'linear-gradient(180deg, rgba(217,174,96,0.05), rgba(20,20,20,0.25))',
            zIndex: 1,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: 16,
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: tokens.gold,
            }}
          />
        </div>

        {/* Right door */}
        <div
          ref={rightDoorRef}
          style={{
            position: 'relative',
            width: '45%',
            height: '100%',
            border: '1px solid rgba(200,151,58,0.2)',
            background: 'linear-gradient(180deg, rgba(217,174,96,0.05), rgba(20,20,20,0.25))',
            zIndex: 1,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 16,
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: tokens.gold,
            }}
          />
        </div>
      </div>
    </section>
  );
}
