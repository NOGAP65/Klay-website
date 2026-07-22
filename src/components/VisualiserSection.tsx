import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../theme';

const BREATHE_STYLE_ID = 'visualiser-breathe-keyframes';

const FEATURES = [
  'Real fabric textures rendered live',
  'Instant pricing as you configure',
  'Motorised blind animation',
  'Before/after comparison mode',
];

export function VisualiserSection() {
  const navigate = useNavigate();

  useEffect(() => {
    if (document.getElementById(BREATHE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = BREATHE_STYLE_ID;
    style.textContent = `
      @keyframes blindBreathe { 0%,100%{height:65%} 50%{height:68%} }
      @keyframes visualiserPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <section
      style={{
        background: '#F2EDE4',
        padding: '100px 80px',
        display: 'flex',
        gap: 80,
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 11,
            color: tokens.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 16,
          }}
        >
          The Klay Visualiser
        </div>
        <h2
          style={{
            fontFamily: tokens.display,
            fontSize: 'clamp(42px, 5vw, 72px)',
            fontWeight: 300,
            color: '#1E1A16',
            lineHeight: 0.92,
            margin: 0,
          }}
        >
          See your blind before you buy it.
        </h2>
        <p
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            color: 'rgba(30,26,22,0.55)',
            lineHeight: 1.8,
            maxWidth: 400,
            marginTop: 20,
          }}
        >
          Upload a photo of your window. Pick your blind, colour and size. See exactly how
          it looks before ordering.
        </p>
        <div style={{ marginTop: 28 }}>
          {FEATURES.map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <span style={{ width: '20px', height: '1px', background: '#C8973A' }} />
              <span style={{ fontFamily: tokens.body, fontSize: 13, color: 'rgba(30,26,22,0.65)' }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/visualiser')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: 32,
            background: '#C8973A',
            color: '#141414',
            padding: '14px 36px',
            fontFamily: "'Inter',sans-serif",
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Open the Visualiser →
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            background: '#1a1208',
            height: '420px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '2px',
          }}
        >
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#C8973A',
                animation: 'visualiserPulse 2s ease-in-out infinite',
              }}
            />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(200,151,58,0.25)' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(200,151,58,0.25)' }} />
          </div>

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-55%)',
              width: '200px',
              height: '280px',
              border: '1px solid rgba(200,151,58,0.25)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: 'linear-gradient(180deg,#C8C4BE,#A8A49E)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: 0,
                right: 0,
                height: '65%',
                background: '#EDEAE4',
                animation: 'blindBreathe 4s ease-in-out infinite',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(10,8,5,0.92)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontFamily: tokens.body,
                fontSize: 11,
                color: '#C8973A',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Dusk White · Medium
            </span>
            <span style={{ fontFamily: tokens.display, fontSize: 28, color: '#F8F6F2' }}>$260</span>
          </div>
        </div>
      </div>
    </section>
  );
}
