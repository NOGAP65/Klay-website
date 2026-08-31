import { tokens } from '@/ds/tokens/colour';
import { type as typeScale } from '@/ds/tokens/type';

import type { CSSProperties, ElementType, ReactNode } from 'react';


// ---------------------------------------------------------------------------
// Text — body copy, labels and micro type. Headings are Heading.
//
// `variant` selects a ROLE from the type scale, never a size. There is no
// `size` prop and there will not be one: a size prop is a scale step chosen at
// a call site, which is the thing §9 exists to stop.
//
// ON `tone` RATHER THAN `color`. The palette carries two families — inks for
// light grounds and paper-at-opacity for dark ones — and the failure mode this
// codebase has already had is a mechanical swap putting an ink tone on a
// charcoal band at 1.97:1. Naming the ground rather than the colour means a
// caller says which surface they are on, and the pairing is resolved here.
// ---------------------------------------------------------------------------

type Variant = 'lead' | 'body' | 'label' | 'micro';
type Tone = 'default' | 'muted' | 'faint' | 'onDark' | 'onDarkMuted';

const VARIANT = {
  lead: typeScale.lead,
  body: typeScale.body,
  label: typeScale.label,
  micro: typeScale.micro,
} as const;

const TONE = {
  default: tokens.ink,
  muted: tokens.inkSoft,
  /** NOT FOR BODY COPY — fails 4.5:1 on paper and on band. UI marks only. */
  faint: tokens.inkFaint,
  onDark: tokens.onDark,
  onDarkMuted: tokens.onDarkMuted,
} as const;

export interface TextProps {
  as?: ElementType;
  children?: ReactNode;
  variant?: Variant;
  tone?: Tone;
  align?: CSSProperties['textAlign'];
  style?: CSSProperties;
  className?: string;
}

export function Text({
  as: Tag = 'p',
  children,
  variant = 'body',
  tone = 'default',
  align,
  style,
  className,
}: TextProps) {
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
