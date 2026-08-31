import type { CSSProperties, ElementType, ReactNode } from 'react';

import { space } from '../tokens/space';
import { radius } from '../tokens/radius';
import { tokens } from '../tokens/colour';

// ---------------------------------------------------------------------------
// Box — the one primitive that owns padding, background and edges.
//
// It exists because this site has no stylesheet: every visual property is an
// inline style object, so there is nowhere for a class to live and nowhere a
// literal can be caught except at the point it is typed. Box is the point.
//
// EVERY SPACING AND COLOUR PROP TAKES A TOKEN KEY, NOT A VALUE. `padding="md"`,
// not `padding={20}`. That is what makes the scale load-bearing rather than
// optional — you cannot pass 23px through this component, because the prop
// does not accept a number.
//
// `style` is still there as an escape hatch, and deliberately so: a primitive
// that cannot be escaped gets forked instead. But a literal that arrives that
// way is visible in review as a `style={{ … }}` on a Box, which is the shape
// klay/no-hardcoded-style-values is looking for.
// ---------------------------------------------------------------------------

type SpaceKey = keyof typeof space;
type RadiusKey = keyof typeof radius;
/** Grounds only. Text colour belongs to Text and Heading. */
type SurfaceKey = 'paper' | 'card' | 'band' | 'charcoal' | 'ink' | 'accent' | 'accentWash';

export interface BoxProps {
  as?: ElementType;
  children?: ReactNode;
  padding?: SpaceKey;
  paddingX?: SpaceKey;
  paddingY?: SpaceKey;
  background?: SurfaceKey;
  radius?: RadiusKey;
  /** Hairline edge in the token's own line colour. */
  border?: 'faint' | 'default' | 'strong';
  /** Escape hatch. See the note above on why it exists. */
  style?: CSSProperties;
  className?: string;
}

const BORDER_TOKEN = {
  faint: tokens.lineFaint,
  default: tokens.line,
  strong: tokens.lineStrong,
} as const;

export function Box({
  as: Tag = 'div',
  children,
  padding,
  paddingX,
  paddingY,
  background,
  radius: radiusKey,
  border,
  style,
  className,
}: BoxProps) {
  const resolved: CSSProperties = {
    ...(padding !== undefined && { padding: space[padding] }),
    ...(paddingX !== undefined && {
      paddingLeft: space[paddingX],
      paddingRight: space[paddingX],
    }),
    ...(paddingY !== undefined && {
      paddingTop: space[paddingY],
      paddingBottom: space[paddingY],
    }),
    ...(background !== undefined && { background: tokens[background] }),
    ...(radiusKey !== undefined && { borderRadius: radius[radiusKey] }),
    ...(border !== undefined && { border: `1px solid ${BORDER_TOKEN[border]}` }),
    ...style,
  };

  return (
    <Tag style={resolved} className={className}>
      {children}
    </Tag>
  );
}
