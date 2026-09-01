// ---------------------------------------------------------------------------
// CtaButton — the primary CTA as a button.
//
// Split out of src/components/home/primitives.tsx at P4-6, decision F. That
// file was 811 lines and eleven exports doing four unrelated jobs: design
// primitives with no product knowledge, two section patterns, a scroll helper,
// and a catalogue tile that knows about prices and swatch rows. Content is
// unchanged — this was a move, and the reasoning in the comments is the
// original's.
// ---------------------------------------------------------------------------

import { ctaBase, ctaFill, type CtaVariant } from './cta';
import { useHover } from './useHover';

export function CtaButton({
  onClick,
  variant = 'primary',
  children,
  style,
}: {
  onClick: () => void;
  variant?: CtaVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { hover, bind } = useHover();
  return (
    <button {...bind} onClick={onClick} style={{ ...ctaBase, ...ctaFill(variant, hover), ...style }}>
      {children}
    </button>
  );
}
