import { space } from '@/ds/tokens/space';

import type { CSSProperties, ElementType, ReactNode } from 'react';


// ---------------------------------------------------------------------------
// Stack — flow in one direction, with a gap off the scale.
//
// The single most repeated inline style in this codebase is a flex container
// with a hand-picked gap. Stack is that, with the gap constrained to a token.
//
// ON `gap` BEING REQUIRED: it has no default. A default gap would be a scale
// step chosen by this file on behalf of every caller, and the whole argument
// for a closed scale is that the step is a decision somebody makes. Making it
// required costs one prop and means every gap on the site is deliberate.
// ---------------------------------------------------------------------------

type SpaceKey = keyof typeof space;

export interface StackProps {
  as?: ElementType;
  children?: ReactNode;
  /** Vertical is the default because a page is a column. */
  direction?: 'column' | 'row';
  gap: SpaceKey;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function Stack({
  as: Tag = 'div',
  children,
  direction = 'column',
  gap,
  align,
  justify,
  wrap = false,
  style,
  className,
}: StackProps) {
  const resolved: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap: space[gap],
    ...(align !== undefined && { alignItems: align }),
    ...(justify !== undefined && { justifyContent: justify }),
    ...(wrap && { flexWrap: 'wrap' }),
    ...style,
  };

  return (
    <Tag style={resolved} className={className}>
      {children}
    </Tag>
  );
}
