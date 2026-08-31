import type { CSSProperties, ReactNode } from 'react';

import { type as typeScale } from '../tokens/type';
import { tokens } from '../tokens/colour';

// ---------------------------------------------------------------------------
// Heading — the display face, at one of four roles.
//
// LEVEL AND VARIANT ARE SEPARATE PROPS, and that is not an oversight. `level`
// is the heading element, which is a document-structure and screen-reader
// concern; `variant` is how big it looks. They agree most of the time and must
// be allowed to disagree: a page's second section can need `h2` at card size,
// and forcing the visual scale to follow the outline is how headings end up
// picked for their appearance and the document outline goes to pieces.
// ---------------------------------------------------------------------------

type Variant = 'hero' | 'section' | 'card' | 'numeric';
type Tone = 'default' | 'onDark';

const VARIANT = {
  hero: typeScale.hero,
  section: typeScale.section,
  card: typeScale.card,
  numeric: typeScale.numeric,
} as const;

const TONE = { default: tokens.ink, onDark: tokens.onDark } as const;

export interface HeadingProps {
  children?: ReactNode;
  /** The element. Defaults to h2 — h1 belongs to the page, not to a component. */
  level?: 1 | 2 | 3 | 4;
  variant?: Variant;
  tone?: Tone;
  align?: CSSProperties['textAlign'];
  style?: CSSProperties;
  className?: string;
}

export function Heading({
  children,
  level = 2,
  variant = 'section',
  tone = 'default',
  align,
  style,
  className,
}: HeadingProps) {
  const Tag = `h${level}` as const;
  const resolved: CSSProperties = {
    ...VARIANT[variant],
    color: TONE[tone],
    ...(align !== undefined && { textAlign: align }),
    ...style,
  };

  return (
    <Tag style={resolved} className={className}>
      {children}
    </Tag>
  );
}
