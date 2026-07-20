import { useState } from 'react';
import type { CSSProperties } from 'react';
import { tokens } from '../theme';

export function LargeProductCard({
  fabricStyle,
  label,
  name,
  price,
  liftPx = 8,
  hoverBoxShadow,
  hoverBorderTopOnly = false,
  transitionMs = 300,
}: {
  fabricStyle: CSSProperties;
  label: string;
  name: string;
  price: string;
  liftPx?: number;
  hoverBoxShadow?: string;
  hoverBorderTopOnly?: boolean;
  transitionMs?: number;
}) {
  const [hover, setHover] = useState(false);
  const restBorder = 'rgba(200,151,58,0.14)';
  const hoverBorder = 'rgba(200,151,58,0.6)';
  const borderStyle: CSSProperties = hoverBorderTopOnly
    ? { border: `1px solid ${restBorder}`, borderTop: `1px solid ${hover ? hoverBorder : restBorder}` }
    : { border: `1px solid ${hover ? hoverBorder : restBorder}` };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        aspectRatio: '3 / 4',
        display: 'flex',
        flexDirection: 'column',
        background: tokens.dark,
        ...borderStyle,
        cursor: 'pointer',
        boxSizing: 'border-box',
        transform: hover ? `translateY(-${liftPx}px)` : 'translateY(0)',
        boxShadow: hover && hoverBoxShadow ? hoverBoxShadow : 'none',
        transition: `transform ${transitionMs}ms ease, border-color ${transitionMs}ms ease, box-shadow ${transitionMs}ms ease`,
      }}
    >
      <div style={{ flex: '7 1 0%', ...fabricStyle }} />
      <div style={{ flex: '3 1 0%', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ color: tokens.gold, fontFamily: tokens.body, fontSize: 11, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <h3 style={{ fontFamily: tokens.display, fontWeight: 400, fontSize: 22, color: tokens.warmWhite, margin: '6px 0 4px' }}>
          {name}
        </h3>
        <span style={{ fontFamily: tokens.body, fontWeight: 300, fontSize: 13, color: tokens.textMuted }}>
          {price}
        </span>
      </div>
    </div>
  );
}
