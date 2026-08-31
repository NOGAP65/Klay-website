import { useState, type CSSProperties, type ReactNode } from 'react';

import { tokens } from '@/ds/tokens/colour';
import { motion } from '@/ds/tokens/motion';
import { radius } from '@/ds/tokens/radius';
import { space } from '@/ds/tokens/space';
import { type as typeScale } from '@/ds/tokens/type';

// ---------------------------------------------------------------------------
// Button — three fills, and no fourth.
//
// WHY THIS TRACKS HOVER IN REACT STATE. Inline styles cannot express `:hover`
// or `:active`, and this site has no stylesheet, so every interactive element
// has to hold its own hover boolean. That is a consequence of ADR-003 and it
// is the single largest source of boolean-naming findings in the lint baseline
// — fourteen `*Hover` variables across the codebase, each one a component
// re-solving this. Solving it once here is most of why this primitive exists.
//
// THE THREE FILLS ARE THE WHOLE VOCABULARY:
//
//   accent   bronze ground, white label. The action. One per view.
//   solid    ink ground, paper label. Everything that is not the primary ask.
//   ghost    no fill, a visible edge. Over photography, or beside an accent.
//
// A fourth variant is a design decision, not a prop. `tokens.accent` is the
// only chroma in the interface; adding a second filled variant spends it.
// ---------------------------------------------------------------------------

type Variant = 'accent' | 'solid' | 'ghost';

interface Fill {
  background: string;
  hoverBackground: string;
  color: string;
  border: string;
}

const FILL: Record<Variant, Fill> = {
  accent: {
    background: tokens.accent,
    hoverBackground: tokens.accentHover,
    color: tokens.onAccent,
    border: 'none',
  },
  solid: {
    background: tokens.fillStrong,
    hoverBackground: tokens.fillStrongHover,
    color: tokens.onFillStrong,
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    hoverBackground: 'transparent',
    color: tokens.ink,
    border: `1px solid ${tokens.lineStrong}`,
  },
};

export interface ButtonProps {
  children?: ReactNode;
  variant?: Variant;
  onClick?: () => void;
  type?: 'button' | 'submit';
  isDisabled?: boolean;
  isFullWidth?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

export function Button({
  children,
  variant = 'solid',
  onClick,
  type = 'button',
  isDisabled = false,
  isFullWidth = false,
  ariaLabel,
  style,
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const fill = FILL[variant];

  const resolved: CSSProperties = {
    ...typeScale.label,
    padding: `${space.snug}px ${space.group}px`,
    background: isHovered && !isDisabled ? fill.hoverBackground : fill.background,
    color: fill.color,
    border: fill.border,
    borderRadius: radius.md,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    // Disabled reads as disabled without a second colour pair to maintain.
    opacity: isDisabled ? 0.5 : 1,
    transition: motion.button,
    ...(isFullWidth && { width: '100%' }),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      style={resolved}
    >
      {children}
    </button>
  );
}
