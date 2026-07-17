import { useRef, useState } from 'react';
import { ProductVisual, type ProductType } from './ProductVisual';
import { RevealWords } from './RevealWords';
import { useReveal } from '../hooks/useReveal';
import { tokens } from '../theme';

interface Product {
  type: ProductType;
  label: string;
  name: string;
  price: string;
}

const products: Product[] = [
  { type: 'blockout', label: 'Roller', name: 'Blockout Roller', price: 'from $220' },
  { type: 'sunscreen', label: 'Roller', name: 'Sunscreen Roller', price: 'from $220' },
  { type: 'dual', label: 'Roller', name: 'Dual Roller', price: 'from $320' },
  { type: 'sheer', label: 'Curtains', name: 'Sheer Curtains', price: 'from $360' },
  { type: 'shutter', label: 'Shutters', name: 'Plantation Shutters', price: 'from $410' },
  { type: 'outdoor', label: 'External', name: 'Outdoor Blind', price: 'from $310' },
];

export function CollectionScene() {
  const rowRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });
  const [grabbing, setGrabbing] = useState(false);
  const { ref: headRef, visible } = useReveal<HTMLDivElement>(0.2);

  const onDown = (e: React.MouseEvent) => {
    const row = rowRef.current;
    if (!row) return;
    drag.current = { down: true, startX: e.pageX - row.offsetLeft, scrollLeft: row.scrollLeft, moved: false };
    setGrabbing(true);
  };
  const onMove = (e: React.MouseEvent) => {
    const row = rowRef.current;
    if (!row || !drag.current.down) return;
    e.preventDefault();
    const x = e.pageX - row.offsetLeft;
    const walk = x - drag.current.startX;
    if (Math.abs(walk) > 4) drag.current.moved = true;
    row.scrollLeft = drag.current.scrollLeft - walk;
  };
  const end = () => {
    drag.current.down = false;
    setGrabbing(false);
  };

  return (
    <section
      id="collection"
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #141414 0%, #1a1208 60%, #1e1a0f 100%)',
        padding: '14vh 0 14vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center', maxWidth: 1400, margin: '0 auto', padding: '0 5vw' }}>
        {/* Left: headline + drag-scroll row */}
        <div ref={headRef}>
          <RevealWords
            as="h2"
            words={[{ text: 'The' }, { text: 'collection' }]}
            style={{ fontWeight: 300, fontSize: 'clamp(40px, 5vw, 76px)', color: tokens.warmWhite, lineHeight: 1.05, marginBottom: 14 }}
          />
          <p style={{ fontFamily: tokens.display, fontStyle: 'italic', fontSize: 18, color: tokens.gold, margin: '0 0 40px' }}>
            six ways to dress a window
          </p>
        </div>

        {/* Right: room motif — lighter window */}
        <div style={{ position: 'relative', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70%',
              height: '85%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,151,58,0.12) 0%, transparent 65%)',
              filter: 'blur(30px)',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '60%',
              height: '90%',
              border: '1px solid rgba(200,151,58,0.25)',
              background: 'linear-gradient(180deg, rgba(217,174,96,0.08), rgba(20,20,20,0.2))',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%' }}>
              <div style={{ height: 10, background: `linear-gradient(180deg, ${tokens.goldLight}, ${tokens.gold})` }} />
              <div
                style={{
                  height: 'calc(100% - 18px)',
                  background: 'repeating-linear-gradient(180deg, rgba(200,151,58,0.5) 0px, rgba(200,151,58,0.5) 5px, rgba(217,174,96,0.38) 5px, rgba(217,174,96,0.38) 10px)',
                }}
              />
              <div style={{ height: 8, background: `linear-gradient(180deg, ${tokens.gold}, ${tokens.goldLight})` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Drag-scroll row of product cards */}
      <div
        ref={rowRef}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={end}
        onMouseLeave={end}
        style={{
          display: 'flex',
          gap: 24,
          padding: '0 5vw',
          marginTop: 50,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          cursor: grabbing ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        {products.map((p) => (
          <div
            key={p.name}
            style={{ flex: '0 0 auto', width: 340, background: tokens.dark, border: '1px solid rgba(200,151,58,0.14)' }}
            onClickCapture={(e) => { if (drag.current.moved) e.preventDefault(); }}
          >
            <div style={{ pointerEvents: 'none' }}>
              <ProductVisual type={p.type} />
            </div>
            <div style={{ padding: '26px 26px 24px', position: 'relative' }}>
              <span style={{ color: tokens.gold, fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {p.label}
              </span>
              <h3 style={{ fontFamily: tokens.display, fontWeight: 400, fontSize: 30, color: tokens.warmWhite, margin: '10px 0 6px' }}>
                {p.name}
              </h3>
              <span style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 14, color: tokens.textMuted }}>
                {p.price}
              </span>
              <button
                aria-label={`View ${p.name}`}
                style={{
                  position: 'absolute', right: 22, bottom: 22, width: 46, height: 46, borderRadius: '50%',
                  border: `1px solid ${tokens.gold}`, background: 'transparent', color: tokens.gold, fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease, color 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = tokens.gold; e.currentTarget.style.color = tokens.dark; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = tokens.gold; }}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: tokens.body, fontWeight: 300, fontSize: 14, color: tokens.textMuted,
          opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease 0.4s', padding: '0 5vw', marginTop: 24,
        }}
      >
        Drag to explore →
      </p>
    </section>
  );
}
